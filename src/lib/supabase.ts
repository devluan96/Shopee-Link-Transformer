import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🛠️ [Supabase Config] URL:', supabaseUrl ? 'Defined' : 'MISSING');
console.log('🛠️ [Supabase Config] Key:', supabaseAnonKey ? 'Defined' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 CRITICAL: Supabase environment variables are missing! Authentication will NOT work.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export const signInWithGoogle = async () => {
  console.log('📡 [Supabase] signInWithGoogle start');
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Supabase OAuth request timeout')), 10000)
  );

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      }),
      timeout
    ]) as any;

    if (error) {
      console.error('❌ [Supabase] OAuth error:', error);
      throw error;
    }
    console.log('✅ [Supabase] signInWithOAuth success');
    return data;
  } catch (err) {
    console.error('💥 [Supabase] OAuth exception:', err);
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  console.log('📡 [Supabase] signUp start');
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
    console.log('✅ [Supabase] signUp success');
    return data.user;
  } catch (err) {
    console.error('💥 [Supabase] signUp exception:', err);
    throw err;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  console.log('📡 [Supabase] signInWithPassword start for:', email);
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
    console.log('✅ [Supabase] signInWithPassword success');
    return data.user;
  } catch (err) {
    console.error('💥 [Supabase] signInWithPassword exception:', err);
    throw err;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
