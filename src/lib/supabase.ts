import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseProjectRef = (() => {
  try {
    return new URL(supabaseUrl || 'https://placeholder.supabase.co').hostname.split('.')[0];
  } catch {
    return 'placeholder';
  }
})();
export const supabaseStorageKey = `sb-${supabaseProjectRef}-auth-token`;
export const rememberLoginStorageKey = 'hotsnew.auth.remember';
export const rememberedEmailStorageKey = 'hotsnew.auth.email';

const canUseBrowserStorage = () =>
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined' &&
  typeof window.sessionStorage !== 'undefined';

export const getRememberLoginPreference = () => {
  if (!canUseBrowserStorage()) return true;
  return window.localStorage.getItem(rememberLoginStorageKey) !== '0';
};

export const setRememberLoginPreference = (remember: boolean) => {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(rememberLoginStorageKey, remember ? '1' : '0');
};

export const getRememberedEmail = () => {
  if (!canUseBrowserStorage()) return '';
  return window.localStorage.getItem(rememberedEmailStorageKey) ?? '';
};

export const setRememberedEmail = (email: string) => {
  if (!canUseBrowserStorage()) return;
  const normalizedEmail = email.trim();
  if (normalizedEmail) {
    window.localStorage.setItem(rememberedEmailStorageKey, normalizedEmail);
    return;
  }
  window.localStorage.removeItem(rememberedEmailStorageKey);
};

const authStorage = {
  getItem: (key: string) => {
    if (!canUseBrowserStorage()) return null;
    if (getRememberLoginPreference()) {
      return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
    }
    return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (!canUseBrowserStorage()) return;
    const targetStorage = getRememberLoginPreference()
      ? window.localStorage
      : window.sessionStorage;
    const secondaryStorage =
      targetStorage === window.localStorage
        ? window.sessionStorage
        : window.localStorage;
    targetStorage.setItem(key, value);
    secondaryStorage.removeItem(key);
  },
  removeItem: (key: string) => {
    if (!canUseBrowserStorage()) return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 CRITICAL: Supabase environment variables are missing! Authentication will NOT work.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: authStorage,
    storageKey: supabaseStorageKey,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const signInWithGoogle = async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Supabase OAuth request timeout')), 10000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      }),
      timeout
    ]) as any;

    if (error) {
      console.error('❌ [Supabase] OAuth error:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('💥 [Supabase] OAuth exception:', err);
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Supabase request timeout')), 12000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signUp({ email, password: pass }),
      timeout
    ]) as any;

    if (error) {
      console.error('❌ [Supabase] signUp error:', error);
      throw error;
    }
    return data.user;
  } catch (err) {
    console.error('💥 [Supabase] signUp exception:', err);
    throw err;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Supabase sign-in request timeout')), 10000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email,
        password: pass,
      }),
      timeout
    ]) as any;

    if (error) {
      console.error('❌ [Supabase] signInWithPassword error:', error);
      throw error;
    }
    return data.user;
  } catch (err) {
    console.error('💥 [Supabase] signInWithPassword exception:', err);
    throw err;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (
    error &&
    !String(error.message || "").toLowerCase().includes("session missing") &&
    !String(error.message || "").toLowerCase().includes("refresh token")
  ) {
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error('Vui lòng nhập email trước khi yêu cầu đặt lại mật khẩu.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: `${window.location.origin}/?reset_password=1`,
  });

  if (error) {
    throw error;
  }
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw error;
  }
};

export const clearStoredSession = () => {
  const authKeys = new Set([
    supabaseStorageKey,
    'supabase.auth.token',
  ]);

  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (authKeys.has(key) || key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  }

  for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    if (
      authKeys.has(key) ||
      key.startsWith('sb-') ||
      key.startsWith('hotsnew.2fa.verified.')
    ) {
      sessionStorage.removeItem(key);
    }
  }
};
