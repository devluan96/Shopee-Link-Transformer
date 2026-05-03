import { useState, useEffect, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  logout,
  registerWithEmail,
  loginWithEmail,
  clearStoredSession,
} from "@/src/lib/supabase";

export interface AuthState {
  user: User | null;
  authLoading: boolean;
  authError: string | null;
  authNotice: string | null;
  isRegistering: boolean;
  email: string;
  password: string;
}

export interface AuthActions {
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setIsRegistering: (v: boolean) => void;
  setAuthError: (v: string | null) => void;
  setAuthNotice: (v: string | null) => void;
  handleEmailAuth: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  
  const sessionRef = useRef<Session | null>(null);
  const isLoggingOutRef = useRef(false);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isLoggingOutRef.current || !userRef.current) {
      return null;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const cachedSession = sessionRef.current;

    if (cachedSession?.access_token) {
      const expiresAt = cachedSession.expires_at ?? 0;
      if (expiresAt - nowInSeconds > 60) {
        return cachedSession.access_token;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    sessionRef.current = session ?? null;
    if (!session?.user || session.user.id !== userRef.current?.id) {
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

    if (!refreshed.session?.user || refreshed.session.user.id !== userRef.current?.id) {
      sessionRef.current = null;
      return null;
    }

    sessionRef.current = refreshed.session ?? null;
    return refreshed.session?.access_token ?? null;
  }, []);

  const fetchWithAuth = useCallback(async (
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
  }, [getAccessToken]);

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

  const handleEmailAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Persist event for async handling
    if ('persist' in e) {
      e.persist();
    }
    if (authLoading) return;

    setAuthError(null);
    setAuthNotice(null);
    setAuthLoading(true);

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
        const newUser = await registerWithEmail(email, password);
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
        setPassword("");
      } else {
        await loginWithEmail(email, password);
        setAuthNotice(null);
      }
    } catch (err: any) {
      console.error("❌ [Auth] Email auth error:", err);
      const rawMessage = String(err?.message || "");
      // Translate common error messages to Vietnamese
      if (rawMessage.toLowerCase().includes("invalid login credentials")) {
        setAuthError("Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.");
      } else if (rawMessage.toLowerCase().includes("email rate limit exceeded")) {
        setAuthError(
          "Supabase đang chạm giới hạn gửi email xác nhận. Email này chưa chắc đã tồn tại. Hãy đợi vài phút rồi thử đăng ký lại.",
        );
      } else if (rawMessage.toLowerCase().includes("user not found")) {
        setAuthError("Không tìm thấy tài khoản với email này.");
      } else if (rawMessage.toLowerCase().includes("invalid email")) {
        setAuthError("Email không hợp lệ. Vui lòng kiểm tra lại.");
      } else {
        setAuthError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
  }, [email, password, isRegistering, authLoading]);

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      sessionRef.current = session ?? null;
      
      if (event === "SIGNED_OUT") {
        isLoggingOutRef.current = false;
        sessionRef.current = null;
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
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session ?? null;
      if (session?.user) {
        setUser(session.user);
      } else {
        setAuthLoading(false);
      }
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
  }, []);

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
      console.error("🟠 [Unhandled Rejection]:", event.reason);
    };
  }, []);

  return {
    user,
    authLoading,
    authError,
    authNotice,
    isRegistering,
    email,
    password,
    setEmail,
    setPassword,
    setIsRegistering,
    setAuthError,
    setAuthNotice,
    handleEmailAuth,
    handleLogout,
    getAccessToken,
    fetchWithAuth,
  };
}
