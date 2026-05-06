import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { UserProfile } from "@/src/types";
import { toast } from "sonner";

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;
const AVATAR_OUTPUT_TYPE = "image/webp";
const AVATAR_OUTPUT_QUALITY = 0.82;

type ProfileFetchResponse = UserProfile | { is_new: true } | null;

const resizeAvatarFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("File avatar pháº£i lÃ  áº£nh");
  }

  if (file.type === "image/gif") {
    throw new Error("Avatar khÃ´ng há»— trá»£ GIF. HÃ£y dÃ¹ng JPG, PNG hoáº·c WebP.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("KhÃ´ng Ä‘á»c Ä‘Æ°á»£c áº£nh avatar"));
      img.src = objectUrl;
    });

    const scale = Math.min(
      1,
      AVATAR_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("KhÃ´ng khá»Ÿi táº¡o Ä‘Æ°á»£c bá»™ nÃ©n avatar");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("KhÃ´ng nÃ©n Ä‘Æ°á»£c avatar"));
        },
        AVATAR_OUTPUT_TYPE,
        AVATAR_OUTPUT_QUALITY,
      );
    });

    if (blob.size > AVATAR_MAX_FILE_SIZE) {
      throw new Error("áº¢nh sau khi nÃ©n váº«n quÃ¡ lá»›n. HÃ£y chá»n áº£nh nhá» hÆ¡n.");
    }

    const outputName = file.name.replace(/\.[^.]+$/, "") || "avatar";
    return new File([blob], `${outputName}.webp`, {
      type: AVATAR_OUTPUT_TYPE,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

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
      toast.error("Báº¡n chÆ°a Ä‘Äƒng nháº­p!");
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
        throw new Error(resultData.error || "Lá»—i cáº­p nháº­t há»“ sÆ¡");
      }

      setProfile(resultData as UserProfile);
      toast.success("Cáº­p nháº­t thÃ´ng tin thÃ nh cÃ´ng!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Loi he thong");
    } finally {
      setProfileLoading(false);
    }
  }, [user, fetchWithAuth]);

  const handleAvatarUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!user) {
      console.error("âŒ Avatar upload failed: No authenticated user found");
      return null;
    }

    try {
      const optimizedFile = await resizeAvatarFile(file);
      const formData = new FormData();
      formData.append("file", optimizedFile);

      const res = await fetchWithAuth("/api/v1/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("âŒ Server returned non-JSON response:", text.slice(0, 500));
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server upload failed");
      }

      return data.secure_url;
    } catch (e: unknown) {
      console.error("âŒ Proxy Avatar upload catch:", e);
      toast.error(
        "Loi tai anh qua server: " +
          (e instanceof Error ? e.message : "Loi khong xac dinh"),
      );
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
        let existingProfile: ProfileFetchResponse = null;
        
        const fetchWithRetry = async (
          url: string,
          retries = 3,
          delay = 1000,
        ): Promise<ProfileFetchResponse> => {
          for (let i = 0; i < retries; i++) {
            if (!isActive) return null;
            try {
              const res = await fetchWithAuth(url);
              if (res.ok) {
                return (await res.json()) as ProfileFetchResponse;
              }
              if (res.status === 404) return null;
            } catch (err) {
              if (i === retries - 1 || !shouldRetryProfileFetch(err)) throw err;
              console.warn(`â³ Fetch failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
          return null;
        };

        try {
          const profileUrl = `${window.location.origin}/api/v1/user/profile`;
          existingProfile = await fetchWithRetry(profileUrl);
        } catch (fetchError: unknown) {
          console.error("âŒ Error fetching profile via proxy:", fetchError);
          // Fallback to direct supabase
          if (isActive) {
            try {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
              if (data) existingProfile = data;
            } catch {
              console.error("âŒ Fallback profile fetch also failed");
            }
          }
        }

        if (!isActive) return;

        const needsProfileBootstrap =
          !existingProfile ||
          ("is_new" in existingProfile && existingProfile.is_new);

        if (needsProfileBootstrap) {
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
    };
  }, [user, fetchWithAuth, shouldRetryProfileFetch]);

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
  }, [user]);

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

