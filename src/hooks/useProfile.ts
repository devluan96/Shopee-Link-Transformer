import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { UserProfile } from "@/src/types";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_MAX_FILE_SIZE = 2 * 1024 * 1024;
const AVATAR_OUTPUT_TYPE = "image/webp";
const AVATAR_OUTPUT_QUALITY = 0.82;

export type AvatarUploadProvider = "r2" | "cloudinary" | "supabase";

export interface AvatarUploadResult {
  url: string;
  provider: AvatarUploadProvider;
}

type ProfileFetchResponse = UserProfile | { is_new: true } | null;

const getProfileCopy = (locale: "vi" | "en") => ({
  avatar: {
    notImage:
      locale === "vi"
        ? "File avatar phải là ảnh."
        : "The avatar file must be an image.",
    noGif:
      locale === "vi"
        ? "Avatar không hỗ trợ GIF. Hãy dùng JPG, PNG hoặc WebP."
        : "GIF avatars are not supported. Please use JPG, PNG, or WebP.",
    unreadable:
      locale === "vi"
        ? "Không đọc được ảnh avatar."
        : "Unable to read the avatar image.",
    contextFailed:
      locale === "vi"
        ? "Không khởi tạo được bộ nén avatar."
        : "Unable to initialize avatar compression.",
    compressFailed:
      locale === "vi"
        ? "Không nén được avatar."
        : "Unable to compress the avatar.",
    tooLarge:
      locale === "vi"
        ? "Ảnh sau khi nén vẫn quá lớn. Hãy chọn ảnh nhỏ hơn."
        : "The compressed image is still too large. Please choose a smaller image.",
    uploadFailedPrefix:
      locale === "vi"
        ? "Lỗi tải ảnh qua server: "
        : "Avatar upload failed through the server: ",
    unknownError: locale === "vi" ? "Lỗi không xác định." : "Unknown error.",
  },
  profile: {
    notSignedIn:
      locale === "vi" ? "Bạn chưa đăng nhập." : "You are not signed in.",
    updateError:
      locale === "vi"
        ? "Lỗi cập nhật hồ sơ."
        : "Failed to update the profile.",
    updateSuccess:
      locale === "vi"
        ? "Cập nhật thông tin thành công."
        : "Profile updated successfully.",
    systemError: locale === "vi" ? "Lỗi hệ thống." : "System error.",
    userFallback: locale === "vi" ? "Người dùng" : "User",
  },
});

const resizeAvatarFile = async (file: File, locale: "vi" | "en"): Promise<File> => {
  const copy = getProfileCopy(locale);

  if (!file.type.startsWith("image/")) {
    throw new Error(copy.avatar.notImage);
  }

  if (file.type === "image/gif") {
    throw new Error(copy.avatar.noGif);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(copy.avatar.unreadable));
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
      throw new Error(copy.avatar.contextFailed);
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error(copy.avatar.compressFailed));
        },
        AVATAR_OUTPUT_TYPE,
        AVATAR_OUTPUT_QUALITY,
      );
    });

    if (blob.size > AVATAR_MAX_FILE_SIZE) {
      throw new Error(copy.avatar.tooLarge);
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
  handleUpdateProfile: (data: {
    full_name: string;
    avatar_url: string;
  }) => Promise<void>;
  handleAvatarUpload: (file: File) => Promise<AvatarUploadResult | null>;
}

interface UseProfileProps {
  user: User | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function useProfile({
  user,
  fetchWithAuth,
}: UseProfileProps): ProfileState & ProfileActions {
  const { locale } = useLocale();
  const copy = getProfileCopy(locale);
  const userId = user?.id || "";
  const userEmail = user?.email || "";
  const userMetadataFullName = user?.user_metadata?.full_name || "";
  const userMetadataAvatarUrl = user?.user_metadata?.avatar_url || "";
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
    if (!userId) return null;

    const response = await fetchWithAuth("/api/v1/user/profile");
    const data = await response.json();

    if (data && !data.is_new) {
      setProfile(data as UserProfile);
      return data as UserProfile;
    }

    return null;
  }, [fetchWithAuth, userId]);

  const handleUpdateProfile = useCallback(
    async (data: { full_name: string; avatar_url: string }) => {
      if (!userId) {
        toast.error(copy.profile.notSignedIn);
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
          throw new Error(resultData.error || copy.profile.updateError);
        }

        setProfile(resultData as UserProfile);
        toast.success(copy.profile.updateSuccess);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : copy.profile.systemError);
      } finally {
        setProfileLoading(false);
      }
    },
    [copy.profile.notSignedIn, copy.profile.systemError, copy.profile.updateError, copy.profile.updateSuccess, fetchWithAuth, userId],
  );

  const handleAvatarUpload = useCallback(
    async (file: File): Promise<AvatarUploadResult | null> => {
      if (!userId) {
        console.error("Avatar upload failed: no authenticated user found");
        return null;
      }

      try {
        const optimizedFile = await resizeAvatarFile(file, locale);
        const formData = new FormData();
        formData.append("file", optimizedFile);

        const res = await fetchWithAuth("/api/v1/upload-avatar", {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error(
            "Avatar upload returned a non-JSON response:",
            text.slice(0, 500),
          );
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Server upload failed");
        }

        return {
          url: data.secure_url,
          provider: data.provider || "supabase",
        };
      } catch (e: unknown) {
        console.error("Avatar upload proxy error:", e);
        toast.error(
          copy.avatar.uploadFailedPrefix +
            (e instanceof Error ? e.message : copy.avatar.unknownError),
        );
        return null;
      }
    },
    [copy.avatar.unknownError, copy.avatar.uploadFailedPrefix, fetchWithAuth, locale, userId],
  );

  useEffect(() => {
    bootstrappedUserIdRef.current = null;
    setProfile(null);
    setProfileLoading(false);
    setProfileBootstrapLoading(!!user?.id);
  }, [user?.id, userId]);

  useEffect(() => {
    let isActive = true;

    const bootstrapProfile = async () => {
      if (!userId || !isActive) {
        if (!userId) {
          setProfile(null);
          setProfileBootstrapLoading(false);
        }
        return;
      }

      if (bootstrappedUserIdRef.current === userId) {
        return;
      }

      setProfileBootstrapLoading(true);
      setProfile(null);

      try {
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
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
          return null;
        };

        try {
          const profileUrl = `${window.location.origin}/api/v1/user/profile`;
          existingProfile = await fetchWithRetry(profileUrl);
        } catch (fetchError: unknown) {
          console.error("Error fetching profile via proxy:", fetchError);
          if (isActive) {
            try {
              const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();
              if (data) existingProfile = data;
            } catch {
              console.error("Fallback profile fetch also failed");
            }
          }
        }

        if (!isActive) return;

        const needsProfileBootstrap =
          !existingProfile ||
          ("is_new" in existingProfile && existingProfile.is_new);

        if (needsProfileBootstrap) {
          const defaultName =
            userMetadataFullName ||
            userEmail.split("@")[0] ||
            copy.profile.userFallback;
          const defaultAvatar =
            userMetadataAvatarUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;

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

        bootstrappedUserIdRef.current = userId;
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
  }, [
    copy.profile.userFallback,
    fetchWithAuth,
    shouldRetryProfileFetch,
    userEmail,
    userId,
    userMetadataAvatarUrl,
    userMetadataFullName,
  ]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
