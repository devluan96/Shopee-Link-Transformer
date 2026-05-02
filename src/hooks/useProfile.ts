import { useState, useEffect, useRef, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { UserProfile } from "@/src/types";
import { toast } from "sonner";

export interface ProfileState {
  profile: UserProfile | null;
  profileLoading: boolean;
  profileBootstrapLoading: boolean;
}

export interface ProfileActions {
  setProfile: (profile: UserProfile | null) => void;
  refreshCurrentProfile: () => Promise<UserProfile | null>;
  handleUpdateProfile: (data: { full_name: string; avatar_url: string }) => Promise<void>;
  handleAvatarUpload: (file: File) => Promise<string | null>;
}

interface UseProfileProps {
  user: User | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function useProfile({ user, fetchWithAuth }: UseProfileProps): ProfileState & ProfileActions {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileBootstrapLoading, setProfileBootstrapLoading] = useState(false);
  
  const profileChannelRef = useRef<any>(null);
  const bootstrappedUserIdRef = useRef<string | null>(null);

  const shouldRetryProfileFetch = useCallback((err: unknown) => {
    if (!navigator.onLine) return false;
    if (err instanceof TypeError) return true;
    const status =
      typeof err === "object" && err !== null
        ? (err as { status?: number }).status
        : undefined;
    return (
      status === 408 ||
      status === 425 ||
      status === 429 ||
      (typeof status === "number" && status >= 500)
    );
  }, []);

  const refreshCurrentProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user) return null;

    const response = await fetchWithAuth("/api/v1/user/profile");
    const data = await response.json();

    if (data && !data.is_new) {
      setProfile(data as UserProfile);
      return data as UserProfile;
    }

    return null;
  }, [user, fetchWithAuth]);

  const handleUpdateProfile = useCallback(async (data: { full_name: string; avatar_url: string }) => {
    if (!user) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetchWithAuth("/api/v1/user/profile/update", {
        method: "POST",
        body: JSON.stringify({
          full_name: data.full_name,
          avatar_url: data.avatar_url,
        }),
      });

      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || "Lỗi cập nhật hồ sơ");
      }

      setProfile(resultData as UserProfile);
      toast.success("Cập nhật thông tin thành công!");
    } catch (e: any) {
      toast.error(e.message || "Lỗi hệ thống");
    } finally {
      setProfileLoading(false);
    }
  }, [user, fetchWithAuth]);

  const handleAvatarUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      console.error("❌ Avatar upload failed: No authenticated user found");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithAuth("/api/v1/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("❌ Server returned non-JSON response:", text.slice(0, 500));
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server upload failed");
      }

      return data.secure_url;
    } catch (e: any) {
      console.error("❌ Proxy Avatar upload catch:", e);
      alert("Lỗi tải ảnh qua Server: " + (e.message || "Lỗi không xác định"));
      return null;
    }
  }, [user, fetchWithAuth]);

  useEffect(() => {
    bootstrappedUserIdRef.current = null;
    setProfile(null);
    setProfileLoading(false);
    setProfileBootstrapLoading(!!user?.id);
  }, [user?.id]);

  // Profile bootstrap and realtime sync
  useEffect(() => {
    let isActive = true;
    let profileChannel: any = null;

    const bootstrapProfile = async () => {
      if (!user || !isActive) {
        if (!user) {
          setProfile(null);
          setProfileBootstrapLoading(false);
        }
        return;
      }

      // Skip if already bootstrapped for this user
      if (bootstrappedUserIdRef.current === user.id) {
        return;
      }

      setProfileBootstrapLoading(true);
      setProfile(null);

      try {
        // Fetch existing profile with retries
        let existingProfile = null;
        
        const fetchWithRetry = async (
          url: string,
          retries = 3,
          delay = 1000,
        ): Promise<any> => {
          for (let i = 0; i < retries; i++) {
            if (!isActive) return null;
            try {
              const res = await fetchWithAuth(url);
              if (res.ok) return await res.json();
              if (res.status === 404) return null;
            } catch (err) {
              if (i === retries - 1 || !shouldRetryProfileFetch(err)) throw err;
              console.warn(`⏳ Fetch failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
        };

        try {
          const profileUrl = `${window.location.origin}/api/v1/user/profile`;
          existingProfile = await fetchWithRetry(profileUrl);
        } catch (fetchError: any) {
          console.error("❌ Error fetching profile via proxy:", fetchError);
          // Fallback to direct supabase
          if (isActive) {
            try {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
              if (data) existingProfile = data;
            } catch (fallbackError) {
              console.error("❌ Fallback profile fetch also failed");
            }
          }
        }

        if (!isActive) return;

        if (!existingProfile || existingProfile.is_new) {
          // Create new profile
          const defaultName =
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User";
          const defaultAvatar =
            user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

          const insertRes = await fetchWithAuth("/api/v1/user/profile/update", {
            method: "POST",
            body: JSON.stringify({
              full_name: defaultName,
              avatar_url: defaultAvatar,
            }),
          });
          const newProfile = await insertRes.json();
          setProfile(newProfile as UserProfile);
        } else {
          setProfile(existingProfile as UserProfile);
        }

        bootstrappedUserIdRef.current = user.id;
      } catch (e) {
        console.error("Profile sync error:", e);
      } finally {
        if (isActive) {
          setProfileBootstrapLoading(false);
        }
      }
    };

    bootstrapProfile();

    return () => {
      isActive = false;
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
        profileChannel = null;
      }
    };
  }, [user?.id, fetchWithAuth, shouldRetryProfileFetch]);

  // Separate effect for realtime subscription to avoid race conditions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    profile,
    profileLoading,
    profileBootstrapLoading,
    setProfile,
    refreshCurrentProfile,
    handleUpdateProfile,
    handleAvatarUpload,
  };
}

// Helper to set auth loading externally (passed from useAuth)
let setAuthLoading: ((v: boolean) => void) | null = null;
export const setProfileAuthLoadingSetter = (setter: (v: boolean) => void) => {
  setAuthLoading = setter;
};
