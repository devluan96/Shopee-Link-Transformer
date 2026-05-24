import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/src/types";
import { LINK_USAGE_DEFAULT } from "@/src/lib/linkUsage";
import { buildPrettyLinkUrl } from "@/src/lib/linkPaths";
import { useLocale } from "@/src/hooks/useLocale";
import { normalizeVietnameseSlug } from "@/src/lib/utils";
import { toast } from "sonner";
import { DEFAULT_SITE_URL } from "@/src/lib/appConfig";

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
  onSuccess: (link: any) => void | Promise<void>;
}

export interface LinkCreatorState {
  url: string;
  mobileDirectMode: boolean;
  customTitle: string;
  customDescription: string;
  customShortCode: string;
  usageContext: string;
  folderName: string;
  tagsText: string;
  customImageUrl: string;
  customDomain: string;
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
  setMobileDirectMode: (v: boolean) => void;
  setCustomTitle: (v: string) => void;
  setCustomDescription: (v: string) => void;
  setCustomShortCode: (v: string) => void;
  setUsageContext: (v: string) => void;
  setFolderName: (v: string) => void;
  setTagsText: (v: string) => void;
  setCustomImageUrl: (v: string) => void;
  setCustomDomain: (v: string) => void;
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
  const { t } = useLocale();
  const [url, setUrl] = useState("");
  const [mobileDirectMode, setMobileDirectMode] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [usageContext, setUsageContext] = useState(LINK_USAGE_DEFAULT);
  const [folderName, setFolderName] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
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
        toast.error(t("createLink.feedback.upgradeRequired"));
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
            t("createLink.feedback.shortCodeMax", {
              max: MAX_SHORT_CODE_LENGTH,
            }),
          );
        }

        const response = await fetchWithAuth("/api/v1/convert", {
          method: "POST",
          body: JSON.stringify({
            url: url.trim(),
            mobileDirectMode,
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
        if (!response.ok) {
          throw new Error(data.error || t("createLink.feedback.conversionFailed"));
        }

        const nextResult = {
          ...data,
          short_code: data.short_code ?? data.shortCode,
        };

        setResult(nextResult);
        toast.success(
          t("createLink.feedback.success", {
            url:
              nextResult.converted_url ||
              buildPrettyLinkUrl(DEFAULT_SITE_URL, {
                slug: nextResult.slug,
                shortCode: nextResult.short_code,
                title: customTitle,
                fallbackToLegacy: false,
              }),
          }),
        );
        await onSuccess(nextResult);
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
      mobileDirectMode,
      customShortCode,
      customTitle,
      customDescription,
      customDomain,
      usageContext,
      currentWorkspaceId,
      folderName,
      tagsText,
      customImageUrl,
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
      t,
    ],
  );

  const resetForm = useCallback(() => {
    setUrl("");
    setMobileDirectMode(false);
    setCustomTitle("");
    setCustomDescription("");
    setCustomShortCode("");
    setUsageContext(LINK_USAGE_DEFAULT);
    setFolderName("");
    setTagsText("");
    setCustomImageUrl("");
    setCustomDomain("");
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
    mobileDirectMode,
    customTitle,
    customDescription,
    customShortCode,
    usageContext,
    folderName,
    tagsText,
    customImageUrl,
    customDomain,
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
    setMobileDirectMode,
    setCustomTitle,
    setCustomDescription,
    setCustomShortCode,
    setUsageContext,
    setFolderName,
    setTagsText,
    setCustomImageUrl,
    setCustomDomain,
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
