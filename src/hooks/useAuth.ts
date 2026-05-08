import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  logout,
  registerWithEmail,
  loginWithEmail,
  clearStoredSession,
  getRememberedEmail,
  getRememberLoginPreference,
  sendPasswordResetEmail,
  setRememberedEmail,
  setRememberLoginPreference,
  updatePassword,
} from "@/src/lib/supabase";

export interface AuthState {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  authNotice: string | null;
  isRegistering: boolean;
  loginEmail: string;
  loginPassword: string;
  registerEmail: string;
  registerPassword: string;
  registerConfirmPassword: string;
  rememberMe: boolean;
  passwordRecoveryMode: boolean;
  recoveryPassword: string;
  recoveryConfirmPassword: string;
}

export interface AuthActions {
  setLoginEmail: (v: string) => void;
  setLoginPassword: (v: string) => void;
  setRegisterEmail: (v: string) => void;
  setRegisterPassword: (v: string) => void;
  setRegisterConfirmPassword: (v: string) => void;
  setIsRegistering: (v: boolean) => void;
  setRememberMe: (v: boolean) => void;
  setAuthError: (v: string | null) => void;
  setAuthNotice: (v: string | null) => void;
  setRecoveryPassword: (v: string) => void;
  setRecoveryConfirmPassword: (v: string) => void;
  handleEmailAuth: (e: FormEvent) => Promise<void>;
  handleForgotPassword: () => Promise<void>;
  handlePasswordRecovery: (e: FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState(() => getRememberedEmail());
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() =>
    getRememberLoginPreference(),
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");

  const sessionRef = useRef<Session | null>(null);
  const isLoggingOutRef = useRef(false);
  const userRef = useRef<User | null>(null);

  const clearRecoveryUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }, []);

  const isRecoveryLinkOpen = useCallback(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash.includes("type=recovery") || search.includes("reset_password=1");
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    setRememberLoginPreference(rememberMe);
    if (!rememberMe) {
      setRememberedEmail("");
    }
  }, [rememberMe]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isLoggingOutRef.current || !userRef.current) {
      return null;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const cachedSession = sessionRef.current;
    const currentUserId = userRef.current.id;

    if (cachedSession?.access_token) {
      if (cachedSession.user?.id !== currentUserId) {
        sessionRef.current = null;
      } else {
        const expiresAt = cachedSession.expires_at ?? 0;
        if (expiresAt - nowInSeconds > 60) {
          return cachedSession.access_token;
        }
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    sessionRef.current = session ?? null;
    if (!session?.user || session.user.id !== currentUserId) {
      return null;
    }
    if (session?.access_token) {
      const expiresAt = session.expires_at ?? 0;
      if (expiresAt - nowInSeconds > 60) {
        return session.access_token;
      }
    }

    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("[Auth] refreshSession failed:", error);
      clearStoredSession();
      sessionRef.current = null;
      setUser(null);
      return null;
    }

    if (
      !refreshed.session?.user ||
      refreshed.session.user.id !== userRef.current?.id
    ) {
      sessionRef.current = null;
      return null;
    }

    sessionRef.current = refreshed.session ?? null;
    return refreshed.session?.access_token ?? null;
  }, []);

  const fetchWithAuth = useCallback(
    async (
      input: RequestInfo | URL,
      init: RequestInit = {},
    ): Promise<Response> => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const headers = new Headers(init.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);

      if (
        !(init.body instanceof FormData) &&
        init.body &&
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
      }

      let response = await fetch(input, {
        ...init,
        headers,
      });

      if (response.status === 401) {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();
        const refreshedToken = refreshed.session?.access_token;

        if (!refreshError && refreshedToken) {
          headers.set("Authorization", `Bearer ${refreshedToken}`);
          response = await fetch(input, {
            ...init,
            headers,
          });
        }
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => null);
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } else {
          const text = await response.text().catch(() => "");
          if (text) errorMessage = text;
        }

        if (response.status === 401) {
          clearStoredSession();
          sessionRef.current = null;
          setUser(null);
        }

        const error = new Error(errorMessage) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      return response;
    },
    [getAccessToken],
  );

  const handleLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;
    setUser(null);
    userRef.current = null;
    sessionRef.current = null;
    clearStoredSession();

    try {
      setAuthLoading(false);
      await logout();
      clearStoredSession();
    } catch (e) {
      console.error("Logout error:", e);
      clearStoredSession();
    } finally {
      setAuthLoading(false);
      isLoggingOutRef.current = false;
    }
  }, []);

  const handleEmailAuth = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (authLoading) return;

      setAuthError(null);
      setAuthNotice(null);
      setAuthLoading(true);
      sessionRef.current = null;
      clearStoredSession();

      const safetyTimer = setTimeout(() => {
        setAuthLoading((prev) => {
          if (prev) {
            console.warn("⚠️ [Auth] Login taking too long, resetting spinner");
            return false;
          }
          return prev;
        });
      }, 15000);

      try {
        if (isRegistering) {
          if (registerPassword !== registerConfirmPassword) {
            setAuthError("Mật khẩu nhập lại không khớp.");
            return;
          }

          const newUser = await registerWithEmail(registerEmail, registerPassword);
          const existingAccount = newUser?.identities?.length === 0;
          if (existingAccount) {
            setAuthError(
              "Email này đã được sử dụng. Hãy đăng nhập hoặc đổi email khác.",
            );
            return;
          }

          const notice =
            "Đăng ký thành công. Supabase đã gửi email xác nhận. Vui lòng mở hộp thư và bấm vào liên kết xác nhận trước khi đăng nhập.";
          setAuthNotice(notice);
          setIsRegistering(false);
          setLoginEmail(registerEmail);
          setLoginPassword("");
          if (rememberMe) {
            setRememberedEmail(registerEmail);
          }
          setRegisterPassword("");
          setRegisterConfirmPassword("");
        } else {
          await loginWithEmail(loginEmail, loginPassword);
          setRememberedEmail(rememberMe ? loginEmail : "");
          setAuthNotice(null);
        }
      } catch (err: unknown) {
        console.error("❌ [Auth] Email auth error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Đăng nhập thất bại. Vui lòng thử lại.";
        const rawMessage = String(errorMessage || "");
        // Translate common error messages to Vietnamese
        if (rawMessage.toLowerCase().includes("invalid login credentials")) {
          setAuthError(
            "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
          );
        } else if (
          rawMessage.toLowerCase().includes("email rate limit exceeded")
        ) {
          setAuthError(
            "Supabase đang chậm giới hạn gửi email xác nhận. Email này chưa chắc đã tồn tại. Hãy đổi trong vài phút rồi thử đăng ký lại.",
          );
        } else if (rawMessage.toLowerCase().includes("user not found")) {
          setAuthError("Không tìm thấy tài khoản với email này.");
        } else if (rawMessage.toLowerCase().includes("invalid email")) {
          setAuthError("Email không hợp lệ. Vui lòng kiểm tra lại.");
        } else {
          setAuthError(errorMessage);
        }
        // Reset loading state immediately when error occurs
        setAuthLoading(false);
        // Ensure we don't continue execution after error
        return;
      } finally {
        clearTimeout(safetyTimer);
        // Also reset in finally as backup
        setAuthLoading(false);
      }
    },
    [
      loginEmail,
      loginPassword,
      registerEmail,
      registerPassword,
      registerConfirmPassword,
      isRegistering,
      authLoading,
      rememberMe,
    ],
  );

  const handleForgotPassword = useCallback(async () => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

    try {
      await sendPasswordResetEmail(loginEmail);
      if (rememberMe) {
        setRememberedEmail(loginEmail);
      }
      setAuthNotice(
        "Đã gửi email đặt lại mật khẩu. Hãy mở hộp thư và bấm vào liên kết để nhập mật khẩu mới.",
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không gửi được email đặt lại mật khẩu.";
      const rawMessage = errorMessage.toLowerCase();

      if (rawMessage.includes("invalid email")) {
        setAuthError("Email không hợp lệ. Vui lòng kiểm tra lại.");
      } else if (rawMessage.includes("for security purposes")) {
        setAuthError(
          "Bạn vừa yêu cầu quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.",
        );
      } else {
        setAuthError(errorMessage);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [loginEmail, rememberMe]);

  const handlePasswordRecovery = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (authLoading) return;

      setAuthError(null);
      setAuthNotice(null);

      if (recoveryPassword.length < 6) {
        setAuthError("Mật khẩu mới cần tối thiểu 6 ký tự.");
        return;
      }

      if (recoveryPassword !== recoveryConfirmPassword) {
        setAuthError("Mật khẩu xác nhận không khớp.");
        return;
      }

      setAuthLoading(true);

      try {
        await updatePassword(recoveryPassword);
        setLoginPassword("");
        setRecoveryPassword("");
        setRecoveryConfirmPassword("");
        setPasswordRecoveryMode(false);
        clearRecoveryUrl();
        setAuthNotice(
          "Mật khẩu đã được cập nhật thành công. Bạn có thể tiếp tục sử dụng tài khoản.",
        );
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Không thể cập nhật mật khẩu mới.";
        setAuthError(errorMessage);
      } finally {
        setAuthLoading(false);
      }
    },
    [
      authLoading,
      clearRecoveryUrl,
      recoveryConfirmPassword,
      recoveryPassword,
    ],
  );

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      sessionRef.current = session ?? null;

      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryMode(true);
        setLoginEmail(session?.user?.email ?? "");
        setLoginPassword("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setRecoveryPassword("");
        setRecoveryConfirmPassword("");
        setAuthError(null);
        setAuthNotice("Liên kết hợp lệ. Hãy nhập mật khẩu mới cho tài khoản.");
      }

      if (event === "SIGNED_OUT") {
        isLoggingOutRef.current = false;
        sessionRef.current = null;
        setPasswordRecoveryMode(false);
        setUser(null);
        setAuthLoading(false);
        return;
      }

      if (event === "INITIAL_SESSION" && !session) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setAuthLoading(false);
      } else {
        setAuthLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session ?? null;
      if (session?.user) {
        setUser(session.user);
        if (session.user.email) {
          setLoginEmail(session.user.email);
        }
        if (isRecoveryLinkOpen()) {
          setPasswordRecoveryMode(true);
          setAuthNotice(
            "Liên kết hợp lệ. Hãy nhập mật khẩu mới cho tài khoản.",
          );
        }
      }
      setAuthLoading(false);
    });

    // Safety timeout
    const timer = setTimeout(() => {
      setAuthLoading((prev) => {
        if (prev) console.warn("⚠️ Auth loading safety timeout triggered");
        return false;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [isRecoveryLinkOpen]);

  // Global error handlers
  useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error(
        "🔴 [Global Error]:",
        message,
        "at",
        source,
        ":",
        lineno,
        ":",
        colno,
        error,
      );
    };
    window.onunhandledrejection = (event) => {
      console.error("🔴 [Unhandled Rejection]:", event.reason);
    };
  }, []);

  return {
    user,
    authLoading,
    authError,
    authNotice,
    isRegistering,
    loginEmail,
    loginPassword,
    registerEmail,
    registerPassword,
    registerConfirmPassword,
    rememberMe,
    passwordRecoveryMode,
    recoveryPassword,
    recoveryConfirmPassword,
    setLoginEmail,
    setLoginPassword,
    setRegisterEmail,
    setRegisterPassword,
    setRegisterConfirmPassword,
    setIsRegistering,
    setRememberMe,
    setAuthError,
    setAuthNotice,
    setRecoveryPassword,
    setRecoveryConfirmPassword,
    handleEmailAuth,
    handleForgotPassword,
    handlePasswordRecovery,
    handleLogout,
    getAccessToken,
    fetchWithAuth,
  };
}
