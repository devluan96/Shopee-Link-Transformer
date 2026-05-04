import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { normalizeVietnameseSlug } from "@/src/lib/utils";
import { toast } from "sonner";

const MAX_SHORT_CODE_LENGTH = 50;

interface UseLinkCreatorProps {
  user: User | null;
  profile: UserProfile | null;
  currentWorkspaceId?: string;
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  canAccessCreate: boolean;
  onSuccess: () => void;
}

export interface LinkCreatorState {
  url: string;
  customTitle: string;
  customDescription: string;
  customShortCode: string;
  usageContext: string;
  folderName: string;
  tagsText: string;
  customImageUrl: string;
  customDomain: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  shopeeAffiliateParams: string;
  tiktokAffiliateParams: string;
  secondaryUrl: string;
  secondaryTargetType: "shopee" | "tiktok";
  redirectDelayMs: number;
  expiresAt: string;
  videoUrl: string;
  abTestEnabled: boolean;
  abVariantBTitle: string;
  abVariantBDescription: string;
  abVariantBImageUrl: string;
  abVariantBVideoUrl: string;
  abVariantBOriginalUrl: string;
  abVariantBSecondaryUrl: string;
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
  setFolderName: (v: string) => void;
  setTagsText: (v: string) => void;
  setCustomImageUrl: (v: string) => void;
  setCustomDomain: (v: string) => void;
  setUtmSource: (v: string) => void;
  setUtmMedium: (v: string) => void;
  setUtmCampaign: (v: string) => void;
  setUtmContent: (v: string) => void;
  setUtmTerm: (v: string) => void;
  setShopeeAffiliateParams: (v: string) => void;
  setTiktokAffiliateParams: (v: string) => void;
  setSecondaryUrl: (v: string) => void;
  setSecondaryTargetType: (v: "shopee" | "tiktok") => void;
  setRedirectDelayMs: (v: number) => void;
  setExpiresAt: (v: string) => void;
  setVideoUrl: (v: string) => void;
  setAbTestEnabled: (v: boolean) => void;
  setAbVariantBTitle: (v: string) => void;
  setAbVariantBDescription: (v: string) => void;
  setAbVariantBImageUrl: (v: string) => void;
  setAbVariantBVideoUrl: (v: string) => void;
  setAbVariantBOriginalUrl: (v: string) => void;
  setAbVariantBSecondaryUrl: (v: string) => void;
  setError: (v: string | null) => void;
  setResult: (v: any) => void;
  handleConvert: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useLinkCreator({
  user,
  currentWorkspaceId,
  fetchWithAuth,
  canAccessCreate,
  onSuccess,
}: UseLinkCreatorProps): LinkCreatorState & LinkCreatorActions {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [usageContext, setUsageContext] = useState("Bài viết Facebook");
  const [folderName, setFolderName] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [shopeeAffiliateParams, setShopeeAffiliateParams] = useState("");
  const [tiktokAffiliateParams, setTiktokAffiliateParams] = useState("");
  const [secondaryUrl, setSecondaryUrl] = useState("");
  const [secondaryTargetType, setSecondaryTargetType] = useState<
    "shopee" | "tiktok"
  >("shopee");
  const [redirectDelayMs, setRedirectDelayMs] = useState(3000);
  const [expiresAt, setExpiresAt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abVariantBTitle, setAbVariantBTitle] = useState("");
  const [abVariantBDescription, setAbVariantBDescription] = useState("");
  const [abVariantBImageUrl, setAbVariantBImageUrl] = useState("");
  const [abVariantBVideoUrl, setAbVariantBVideoUrl] = useState("");
  const [abVariantBOriginalUrl, setAbVariantBOriginalUrl] = useState("");
  const [abVariantBSecondaryUrl, setAbVariantBSecondaryUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleConvert = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || !user) return;

      if (!canAccessCreate) {
        toast.error(
          "Vui long nang cap tai khoan de su dung tinh nang tao link!",
        );
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
          throw new Error(
            `Ma rut gon khong duoc vuot qua ${MAX_SHORT_CODE_LENGTH} ky tu.`,
          );
        }

        const response = await fetchWithAuth("/api/v1/convert", {
          method: "POST",
          body: JSON.stringify({
            url: url.trim(),
            customShortCode,
            customTitle,
            customDescription,
            customDomain,
            usageContext,
            workspaceId: currentWorkspaceId || undefined,
            folderName,
            tags: tagsText
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            customImageUrl,
            utmSource,
            utmMedium,
            utmCampaign,
            utmContent,
            utmTerm,
            shopeeAffiliateParams,
            tiktokAffiliateParams,
            secondaryUrl: secondaryUrl.trim(),
            secondaryTargetType,
            redirectDelayMs,
            expiresAt: expiresAt || undefined,
            videoUrl,
            abTestEnabled,
            abVariantBTitle,
            abVariantBDescription,
            abVariantBImageUrl,
            abVariantBVideoUrl,
            abVariantBOriginalUrl,
            abVariantBSecondaryUrl,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Conversion failed");

        const nextResult = {
          ...data,
          short_code: data.short_code ?? data.shortCode,
        };

        setResult(nextResult);
        toast.success(
          `Rut gon link thanh cong: ${
            nextResult.converted_url ||
            `https://hotsnew.click/s/${nextResult.short_code}`
          }`,
        );
        onSuccess();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [
      url,
      user,
      canAccessCreate,
      customShortCode,
      customTitle,
      customDescription,
      customDomain,
      usageContext,
      currentWorkspaceId,
      folderName,
      tagsText,
      customImageUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      shopeeAffiliateParams,
      tiktokAffiliateParams,
      secondaryUrl,
      secondaryTargetType,
      redirectDelayMs,
      expiresAt,
      videoUrl,
      abTestEnabled,
      abVariantBTitle,
      abVariantBDescription,
      abVariantBImageUrl,
      abVariantBVideoUrl,
      abVariantBOriginalUrl,
      abVariantBSecondaryUrl,
      fetchWithAuth,
      onSuccess,
    ],
  );

  const resetForm = useCallback(() => {
    setUrl("");
    setCustomTitle("");
    setCustomDescription("");
    setCustomShortCode("");
    setUsageContext("Bài viết Facebook");
    setFolderName("");
    setTagsText("");
    setCustomImageUrl("");
    setCustomDomain("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmContent("");
    setUtmTerm("");
    setShopeeAffiliateParams("");
    setTiktokAffiliateParams("");
    setSecondaryUrl("");
    setSecondaryTargetType("shopee");
    setRedirectDelayMs(3000);
    setExpiresAt("");
    setVideoUrl("");
    setAbTestEnabled(false);
    setAbVariantBTitle("");
    setAbVariantBDescription("");
    setAbVariantBImageUrl("");
    setAbVariantBVideoUrl("");
    setAbVariantBOriginalUrl("");
    setAbVariantBSecondaryUrl("");
    setError(null);
    setResult(null);
  }, []);

  return {
    url,
    customTitle,
    customDescription,
    customShortCode,
    usageContext,
    folderName,
    tagsText,
    customImageUrl,
    customDomain,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    shopeeAffiliateParams,
    tiktokAffiliateParams,
    secondaryUrl,
    secondaryTargetType,
    redirectDelayMs,
    expiresAt,
    videoUrl,
    abTestEnabled,
    abVariantBTitle,
    abVariantBDescription,
    abVariantBImageUrl,
    abVariantBVideoUrl,
    abVariantBOriginalUrl,
    abVariantBSecondaryUrl,
    loading,
    error,
    result,
    setUrl,
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setFolderName,
    setTagsText,
    setCustomImageUrl,
    setCustomDomain,
    setUtmSource,
    setUtmMedium,
    setUtmCampaign,
    setUtmContent,
    setUtmTerm,
    setShopeeAffiliateParams,
    setTiktokAffiliateParams,
    setSecondaryUrl,
    setSecondaryTargetType,
    setRedirectDelayMs,
    setExpiresAt,
    setVideoUrl,
    setAbTestEnabled,
    setAbVariantBTitle,
    setAbVariantBDescription,
    setAbVariantBImageUrl,
    setAbVariantBVideoUrl,
    setAbVariantBOriginalUrl,
    setAbVariantBSecondaryUrl,
    setError,
    setResult,
    handleConvert,
    resetForm,
  };
}
