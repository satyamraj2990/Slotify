import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type Role = "admin" | "teacher" | "student";

interface AuthContextProps {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  signUp: (email: string, password: string, userData: { first_name: string; last_name: string; role: Role; department?: string }) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Failsafe: Always reset loading after 3 seconds max
    const failsafeTimeout = setTimeout(() => {
      console.log('Failsafe: Setting loading to false after timeout');
      setLoading(false);
    }, 3000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
      clearTimeout(failsafeTimeout); // Clear timeout if we get a response
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false); // Ensure loading is reset even on error
      clearTimeout(failsafeTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(failsafeTimeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist (PGRST116), that's okay for new users
        if (error.code === 'PGRST116') {
          console.log('No profile found - user may need to complete registration');
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login: AuthContextProps["login"] = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔄 Starting login process for:', email);
      setLoading(true);
      
      // Add timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );
      
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      console.log('🔍 Login response:', { data: data?.user?.email, error: error?.message });

      if (error) {
        console.error('❌ Login failed:', error.message);
        setLoading(false);
        return { ok: false, error: error.message };
      }

      console.log('✅ Login successful, waiting for auth state change...');
      // Don't rely on auth state change listener - set loading false after short delay
      // This ensures the button doesn't get stuck even if profile fetch fails
      setTimeout(() => {
        console.log('⏰ Timeout: Setting loading to false');
        setLoading(false);
      }, 1000);
      
      return { ok: true };
    } catch (error: any) {
      console.error('💥 Login exception:', error);
      setLoading(false);
      return { ok: false, error: error.message || "Login failed" };
    }
  }, []);

  const signUp: AuthContextProps["signUp"] = useCallback(async (email: string, password: string, userData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            department: userData.department || ''
          }
        }
      });

      if (error) {
        setLoading(false);
        return { ok: false, error: error.message };
      }

      setLoading(false);
      return { ok: true };
    } catch (error: any) {
      setLoading(false);
      return { ok: false, error: error.message || "Sign up failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ 
    user, 
    profile, 
    loading, 
    login, 
    logout, 
    signUp 
  }), [user, profile, loading, login, logout, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
