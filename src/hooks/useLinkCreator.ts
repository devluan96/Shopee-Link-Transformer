import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { normalizeVietnameseSlug } from "@/src/lib/utils";
import { toast } from "sonner";

const MAX_SHORT_CODE_LENGTH = 50;

interface UseLinkCreatorProps {
  user: User | null;
  profile: UserProfile | null;
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  canAccessCreate: boolean;
  onSuccess: () => void;
}

export interface LinkCreatorState {
  url: string;
  customTitle: string;
  customDescription: string;
  customShortCode: string;
  usageContext: string;
  customImageUrl: string;
  secondaryUrl: string;
  secondaryTargetType: "shopee" | "tiktok";
  redirectDelayMs: number;
  videoUrl: string;
  loading: boolean;
  error: string | null;
  result: any;
}

export interface LinkCreatorActions {
  setUrl: (v: string) => void;
  setCustomTitle: (v: string) => void;
  setCustomDescription: (v: string) => void;
  setCustomShortCode: (v: string) => void;
  setUsageContext: (v: string) => void;
  setCustomImageUrl: (v: string) => void;
  setSecondaryUrl: (v: string) => void;
  setSecondaryTargetType: (v: "shopee" | "tiktok") => void;
  setRedirectDelayMs: (v: number) => void;
  setVideoUrl: (v: string) => void;
  setError: (v: string | null) => void;
  setResult: (v: any) => void;
  handleConvert: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useLinkCreator({
  user,
  profile,
  fetchWithAuth,
  canAccessCreate,
  onSuccess,
}: UseLinkCreatorProps): LinkCreatorState & LinkCreatorActions {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [usageContext, setUsageContext] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [secondaryTargetType, setSecondaryTargetType] = useState<"shopee" | "tiktok">("shopee");
  const [redirectDelayMs, setRedirectDelayMs] = useState(3000);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleConvert = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    if (!canAccessCreate) {
      toast.error("Vui lòng nâng cấp tài khoản để sử dụng tính năng tạo link!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const normalizedShortCode = customShortCode
        ? normalizeVietnameseSlug(customShortCode)
        : "";

      if (normalizedShortCode.length > MAX_SHORT_CODE_LENGTH) {
        throw new Error(`Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`);
      }

      const response = await fetchWithAuth("/api/v1/convert", {
        method: "POST",
        body: JSON.stringify({
          url: url.trim(),
          customShortCode,
          customTitle,
          customDescription,
          usageContext,
          customImageUrl,
          secondaryUrl: secondaryUrl.trim(),
          secondaryTargetType,
          redirectDelayMs,
          videoUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversion failed");

      const nextResult = {
        ...data,
        short_code: data.short_code ?? data.shortCode,
      };

      setResult(nextResult);
      toast.success(`Rút gọn link thành công: https://hotsnew.click/s/${nextResult.short_code}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    url, user, canAccessCreate, customShortCode, customTitle, customDescription,
    usageContext, customImageUrl, secondaryUrl, secondaryTargetType,
    redirectDelayMs, videoUrl, fetchWithAuth, onSuccess
  ]);

  const resetForm = useCallback(() => {
    setUrl("");
    setCustomTitle("");
    setCustomDescription("");
    setCustomShortCode("");
    setUsageContext("");
    setCustomImageUrl("");
    setSecondaryUrl("");
    setSecondaryTargetType("shopee");
    setRedirectDelayMs(3000);
    setVideoUrl("");
    setError(null);
    setResult(null);
  }, []);

  return {
    url,
    customTitle,
    customDescription,
    customShortCode,
    usageContext,
    customImageUrl,
    secondaryUrl,
    secondaryTargetType,
    redirectDelayMs,
    videoUrl,
    loading,
    error,
    result,
    setUrl,
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setCustomImageUrl,
    setSecondaryUrl,
    setSecondaryTargetType,
    setRedirectDelayMs,
    setVideoUrl,
    setError,
    setResult,
    handleConvert,
    resetForm,
  };
}
