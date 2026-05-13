import React, { type ChangeEvent, type FormEvent, type RefObject } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  Type,
  UploadCloud,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { buildPrettyLinkUrl } from "@/src/lib/linkPaths";
import { cn, normalizeVietnameseSlug } from "@/src/lib/utils";
import { LINK_USAGE_OPTIONS } from "@/src/lib/linkUsage";
import { ConvertedLink, Tab, UserLimits } from "@/src/types";
import { QRCodeCanvas } from "qrcode.react";
import { useLocale } from "@/src/hooks/useLocale";
import { WorkflowGuide } from "@/src/components/WorkflowGuide";

const MAX_SHORT_CODE_LENGTH = 50;
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const SHOPEE_HOST_REGEX = /(^|\.)shopee\.[a-z.]+$/i;
const TIKTOK_HOST_REGEX =
  /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i;

type FormField =
  | "url"
  | "customTitle"
  | "customDescription"
  | "customShortCode"
  | "usageContext"
  | "folderName"
  | "tagsText"
  | "customImageUrl"
  | "videoUrl"
  | "secondaryUrl"
  | "redirectDelayMs"
  | "expiresAt";

interface CreateLinkProps {
  url: string;
  setUrl: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customDescription: string;
  setCustomDescription: (v: string) => void;
  customShortCode: string;
  setCustomShortCode: (v: string) => void;
  usageContext: string;
  setUsageContext: (v: string) => void;
  folderName: string;
  setFolderName: (v: string) => void;
  tagsText: string;
  setTagsText: (v: string) => void;
  customImageUrl: string;
  setCustomImageUrl: (v: string) => void;
  customDomain: string;
  setCustomDomain: (v: string) => void;
  availableOutputDomains: string[];
  canUseCustomDomains: boolean;
  linkQuota: {
    plan: "free" | "monthly" | "yearly" | "admin";
    dailyLimit: number | null;
    usedToday: number;
    remainingToday: number | null;
    canCreate: boolean;
  } | null;
  userLimits?: UserLimits | null;
  utmSource: string;
  setUtmSource: (v: string) => void;
  utmMedium: string;
  setUtmMedium: (v: string) => void;
  utmCampaign: string;
  setUtmCampaign: (v: string) => void;
  utmContent: string;
  setUtmContent: (v: string) => void;
  utmTerm: string;
  setUtmTerm: (v: string) => void;
  shopeeAffiliateParams: string;
  setShopeeAffiliateParams: (v: string) => void;
  tiktokAffiliateParams: string;
  setTiktokAffiliateParams: (v: string) => void;
  secondaryUrl: string;
  setSecondaryUrl: (v: string) => void;
  abTestEnabled: boolean;
  setAbTestEnabled: (v: boolean) => void;
  abVariantBTitle: string;
  setAbVariantBTitle: (v: string) => void;
  abVariantBDescription: string;
  setAbVariantBDescription: (v: string) => void;
  abVariantBImageUrl: string;
  setAbVariantBImageUrl: (v: string) => void;
  abVariantBVideoUrl: string;
  setAbVariantBVideoUrl: (v: string) => void;
  abVariantBOriginalUrl: string;
  setAbVariantBOriginalUrl: (v: string) => void;
  abVariantBSecondaryUrl: string;
  setAbVariantBSecondaryUrl: (v: string) => void;
  secondaryTargetType: "shopee" | "tiktok";
  setSecondaryTargetType: (v: "shopee" | "tiktok") => void;
  redirectDelayMs: number;
  setRedirectDelayMs: (v: number) => void;
  expiresAt: string;
  setExpiresAt: (v: string) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  uploadingVideo: boolean;
  videoUploadProgress: number;
  videoUploadSuccess: boolean;
  videoUploadProvider?: "cloudinary" | "imagekit" | "supabase" | null;
  videoInputRef: RefObject<HTMLInputElement | null>;
  handleVideoUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleVideoFileUpload: (file: File) => Promise<void>;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  uploadingThumbnail: boolean;
  thumbnailUploadProgress: number;
  thumbnailUploadSuccess: boolean;
  thumbnailUploadProvider?: "cloudinary" | "imagekit" | "supabase" | null;
  handleThumbnailUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleThumbnailFileUpload: (file: File) => Promise<void>;
  handleConvert: (e: FormEvent) => void;
  loading: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  result: Pick<ConvertedLink, "short_code" | "slug" | "converted_url"> | null;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
  setActiveTab: (tab: Tab) => void;
  guideDialogOpen: boolean;
  onOpenGuide: () => void;
  onCloseGuide: () => void;
}

export const CreateLink = ({
  url,
  setUrl,
  customTitle,
  setCustomTitle,
  customDescription,
  setCustomDescription,
  customShortCode,
  setCustomShortCode,
  usageContext,
  setUsageContext,
  folderName,
  setFolderName,
  tagsText,
  setTagsText,
  customImageUrl,
  setCustomImageUrl,
  customDomain,
  setCustomDomain,
  availableOutputDomains,
  canUseCustomDomains,
  linkQuota,
  userLimits,
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign,
  utmContent,
  setUtmContent,
  utmTerm,
  setUtmTerm,
  shopeeAffiliateParams,
  setShopeeAffiliateParams,
  tiktokAffiliateParams,
  setTiktokAffiliateParams,
  secondaryUrl,
  setSecondaryUrl,
  abTestEnabled,
  setAbTestEnabled,
  abVariantBTitle,
  setAbVariantBTitle,
  abVariantBDescription,
  setAbVariantBDescription,
  abVariantBImageUrl,
  setAbVariantBImageUrl,
  abVariantBVideoUrl,
  setAbVariantBVideoUrl,
  abVariantBOriginalUrl,
  setAbVariantBOriginalUrl,
  abVariantBSecondaryUrl,
  setAbVariantBSecondaryUrl,
  secondaryTargetType,
  setSecondaryTargetType,
  redirectDelayMs,
  expiresAt,
  setExpiresAt,
  videoUrl,
  setVideoUrl,
  uploadingVideo,
  videoUploadProgress,
  videoUploadSuccess,
  videoUploadProvider,
  videoInputRef,
  handleVideoUpload,
  handleVideoFileUpload,
  thumbnailInputRef,
  uploadingThumbnail,
  thumbnailUploadProgress,
  thumbnailUploadSuccess,
  thumbnailUploadProvider,
  handleThumbnailUpload,
  handleThumbnailFileUpload,
  handleConvert,
  loading,
  error,
  setError,
  result,
  copyToClipboard,
  copiedId,
  setActiveTab,
  guideDialogOpen,
  onOpenGuide,
  onCloseGuide,
}: CreateLinkProps) => {
  const { messages, t } = useLocale();
  const content = messages.createLink;
  const page = content.page;
  const zaloContactUrl = "https://zalo.me/0969361607";
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<FormField, string>>
  >({});
  const [videoPreviewOrientation, setVideoPreviewOrientation] = React.useState<
    "landscape" | "portrait" | "square"
  >("landscape");
  const [thumbnailPreviewOrientation, setThumbnailPreviewOrientation] =
    React.useState<"landscape" | "portrait" | "square">("landscape");
  const [isDraggingVideo, setIsDraggingVideo] = React.useState(false);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = React.useState(false);
  const [selectedExpirePresetDays, setSelectedExpirePresetDays] =
    React.useState<number | null>(null);
  const [campaignTrackingEnabled, setCampaignTrackingEnabled] = React.useState(
    Boolean(
      utmSource.trim() ||
      utmMedium.trim() ||
      utmCampaign.trim() ||
      utmContent.trim() ||
      utmTerm.trim(),
    ),
  );
  const normalizedShortCodePreview = customShortCode
    ? normalizeVietnameseSlug(customShortCode)
    : "";
  const convertedResultUrl = result?.converted_url
    ? result.converted_url
    : result?.short_code
      ? buildPrettyLinkUrl("https://hotsnew.click", {
          slug: result.slug,
          shortCode: result.short_code,
          title: customTitle,
          fallbackToLegacy: false,
        })
      : buildPrettyLinkUrl("https://hotsnew.click", {
          title: customTitle || "link",
          fallbackToLegacy: false,
        });
  const uploadProgressOffset = 87.96 - (87.96 * videoUploadProgress) / 100;
  const getProviderLabel = (
    provider?: "cloudinary" | "imagekit" | "supabase" | null,
  ) => {
    switch (provider) {
      case "cloudinary":
        return "Cloudinary";
      case "imagekit":
        return "ImageKit";
      case "supabase":
        return "Supabase";
      default:
        return content.page.cloudStorage;
    }
  };
  const videoProviderLabel = getProviderLabel(videoUploadProvider);
  const thumbnailProviderLabel = getProviderLabel(thumbnailUploadProvider);
  const canUseAbTesting = userLimits?.canUseAbTesting ?? true;
  const videoUploadsRemainingToday =
    userLimits?.videoUploadsRemainingToday ?? null;
  const videoUploadBlocked =
    userLimits?.dailyVideoUploads === 0 || videoUploadsRemainingToday === 0;
  const canUseSecondaryFlow = Boolean(videoUrl.trim());
  const localizedUsageOptions = LINK_USAGE_OPTIONS.map((option) => {
    switch (option.value) {
      case "Bai viet Facebook":
        return { ...option, label: page.usageFacebookPost };
      case "Reel Facebook":
        return { ...option, label: page.usageFacebookReel };
      case "Bio TikTok":
        return { ...option, label: page.usageTikTokBio };
      case "Video TikTok":
        return { ...option, label: page.usageTikTokVideo };
      case "Zalo OA":
        return { ...option, label: page.usageZalo };
      case "Nhom seeding":
        return { ...option, label: page.usageSeeding };
      case "Livestream":
        return { ...option, label: page.usageLivestream };
      default:
        return option;
    }
  });
  const expiryPresets = [
    { days: 1, label: page.expiry1d },
    { days: 3, label: page.expiry3d },
    { days: 7, label: page.expiry7d },
    { days: 15, label: page.expiry15d },
    { days: 30, label: page.expiry30d },
  ];

  const clearFieldError = React.useCallback((field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (customImageUrl.trim() || videoUrl.trim()) {
      clearFieldError("customImageUrl");
      clearFieldError("videoUrl");
    }
  }, [clearFieldError, customImageUrl, videoUrl]);

  React.useEffect(() => {
    if (canUseSecondaryFlow) return;

    if (secondaryUrl.trim()) {
      setSecondaryUrl("");
    }
    if (secondaryTargetType !== "shopee") {
      setSecondaryTargetType("shopee");
    }
    clearFieldError("secondaryUrl");
  }, [
    canUseSecondaryFlow,
    clearFieldError,
    secondaryTargetType,
    secondaryUrl,
    setSecondaryTargetType,
    setSecondaryUrl,
  ]);

  React.useEffect(() => {
    if (!expiresAt) {
      setSelectedExpirePresetDays(null);
      return;
    }

    const expiresMs = new Date(expiresAt).getTime();
    const diffMs = expiresMs - Date.now();
    if (!Number.isFinite(expiresMs) || diffMs <= 0) {
      setSelectedExpirePresetDays(null);
      return;
    }

    setSelectedExpirePresetDays(Math.round(diffMs / DAY_IN_MS));
  }, [expiresAt]);

  const inferTrackingSource = React.useCallback(() => {
    const normalizedUsage = usageContext.trim().toLowerCase();

    if (normalizedUsage.includes("facebook")) return "facebook";
    if (normalizedUsage.includes("tiktok")) return "tiktok";
    if (normalizedUsage.includes("zalo")) return "zalo";
    if (normalizedUsage.includes("live")) return "livestream";

    return "social";
  }, [usageContext]);

  React.useEffect(() => {
    if (!campaignTrackingEnabled) {
      if (utmSource) setUtmSource("");
      if (utmMedium) setUtmMedium("");
      if (utmCampaign) setUtmCampaign("");
      if (utmContent) setUtmContent("");
      if (utmTerm) setUtmTerm("");
      return;
    }

    if (!utmSource.trim()) {
      setUtmSource(inferTrackingSource());
    }

    if (utmMedium !== "social") {
      setUtmMedium("social");
    }

    if (!utmContent.trim() && normalizedShortCodePreview) {
      setUtmContent(normalizedShortCodePreview);
    }

    if (utmTerm) {
      setUtmTerm("");
    }
  }, [
    campaignTrackingEnabled,
    inferTrackingSource,
    normalizedShortCodePreview,
    setUtmCampaign,
    setUtmContent,
    setUtmMedium,
    setUtmSource,
    setUtmTerm,
    utmCampaign,
    utmContent,
    utmMedium,
    utmSource,
    utmTerm,
  ]);

  const isValidShopeeUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
      }
      return SHOPEE_HOST_REGEX.test(parsed.hostname.trim().toLowerCase());
    } catch {
      return false;
    }
  };

  const isValidTikTokUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
      }
      return TIKTOK_HOST_REGEX.test(parsed.hostname.trim().toLowerCase());
    } catch {
      return false;
    }
  };

  const isValidPrimaryUrl = (value: string) =>
    isValidShopeeUrl(value) || isValidTikTokUrl(value);

  const getShopeeHostname = (value: string) => {
    try {
      return new URL(value.trim()).hostname.trim().toLowerCase();
    } catch {
      return null;
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<FormField, string>> = {};

    if (!url.trim()) {
      nextErrors.url = content.validation.primaryRequired;
    } else if (!isValidPrimaryUrl(url)) {
      nextErrors.url = content.validation.primaryInvalid;
    }

    if (!customTitle.trim()) {
      nextErrors.customTitle = content.validation.titleRequired;
    }

    if (!customDescription.trim()) {
      nextErrors.customDescription = content.validation.descriptionRequired;
    }

    if (!customImageUrl.trim() && !videoUrl.trim()) {
      nextErrors.customImageUrl = content.validation.imageOrVideoRequired;
      nextErrors.videoUrl = content.validation.videoOrImageRequired;
    }

    if (customShortCode.trim()) {
      const normalizedShortCode = normalizeVietnameseSlug(customShortCode);
      if (normalizedShortCode.length < 3) {
        nextErrors.customShortCode = content.validation.shortCodeMin;
      } else if (normalizedShortCode.length > MAX_SHORT_CODE_LENGTH) {
        nextErrors.customShortCode = t("createLink.validation.shortCodeMax", {
          max: MAX_SHORT_CODE_LENGTH,
        });
      }
    }

    if (secondaryUrl.trim() && !videoUrl.trim()) {
      nextErrors.secondaryUrl = content.validation.secondaryNeedsVideo;
    } else if (
      secondaryUrl.trim() &&
      secondaryTargetType === "shopee" &&
      !isValidShopeeUrl(secondaryUrl)
    ) {
      nextErrors.secondaryUrl = content.validation.secondaryShopeeInvalid;
    } else if (
      secondaryUrl.trim() &&
      secondaryTargetType === "tiktok" &&
      !isValidTikTokUrl(secondaryUrl)
    ) {
      nextErrors.secondaryUrl = content.validation.secondaryTiktokInvalid;
    } else if (
      secondaryUrl.trim() &&
      url.trim() &&
      secondaryTargetType === "shopee" &&
      isValidShopeeUrl(url) &&
      getShopeeHostname(url) !== getShopeeHostname(secondaryUrl)
    ) {
      nextErrors.secondaryUrl = content.validation.secondarySameShopee;
    }

    if (
      !Number.isFinite(redirectDelayMs) ||
      redirectDelayMs < 1000 ||
      redirectDelayMs > 10000
    ) {
      nextErrors.redirectDelayMs = content.validation.redirectDelayRange;
    }

    return nextErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
      const firstErrorField = Object.keys(nextErrors)[0];
      if (
        [
          "folderName",
          "tagsText",
          "secondaryUrl",
          "redirectDelayMs",
          "expiresAt",
        ].includes(firstErrorField)
      ) {
        setShowAdvancedSettings(true);
      }
      const element = document.querySelector<HTMLElement>(
        `[data-field="${firstErrorField}"]`,
      );
      element?.focus();
      return;
    }

    handleConvert(e);
  };

  const inputClass = (field?: FormField, base = "") =>
    cn(
      base,
      "border-2 outline-none transition-all",
      field && fieldErrors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-transparent focus:border-orange-500/20",
    );

  const renderFieldError = (field: FormField) =>
    fieldErrors[field] ? (
      <p className="mt-2 px-1 text-[11px] font-bold text-red-500">
        {fieldErrors[field]}
      </p>
    ) : null;

  const handleVideoPreviewMetadata = (
    event: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (!videoWidth || !videoHeight) return;

    setVideoPreviewOrientation(
      videoWidth > videoHeight
        ? "landscape"
        : videoHeight > videoWidth
          ? "portrait"
          : "square",
    );
  };

  const handleThumbnailPreviewLoad = (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    setThumbnailPreviewOrientation(
      naturalWidth > naturalHeight
        ? "landscape"
        : naturalHeight > naturalWidth
          ? "portrait"
          : "square",
    );
  };

  const handleVideoDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingVideo(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError(content.validation.dropVideo);
      return;
    }

    clearFieldError("videoUrl");
    await handleVideoFileUpload(file);
  };

  const handleThumbnailDrop = async (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(content.validation.dropImage);
      return;
    }

    clearFieldError("customImageUrl");
    clearFieldError("videoUrl");
    await handleThumbnailFileUpload(file);
  };

  return (
    <div key="create">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100 md:text-4xl">
              {page.title}
            </h2>
            <p className="font-medium italic text-gray-500 dark:text-slate-400">
              {page.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-orange-700 transition-all hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20"
          >
            <BookOpen size={16} />
            {page.guideButton}
          </button>
        </div>
        {linkQuota && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl border border-sky-100 bg-sky-50/80 px-5 py-4 text-sm font-bold text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700 dark:bg-slate-800 dark:text-sky-200">
              {linkQuota.plan === "admin"
                ? page.adminPlan
                : linkQuota.plan === "yearly"
                  ? page.yearlyPlan
                  : linkQuota.plan === "monthly"
                    ? page.monthlyPlan
                    : page.freePlan}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700 dark:bg-slate-800 dark:text-sky-200">
              {linkQuota.dailyLimit === null
                ? page.unlimitedLinks
                : t("createLink.page.linksQuota", {
                    used: linkQuota.usedToday,
                    limit: linkQuota.dailyLimit,
                  })}
            </span>
            {userLimits && (
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-700 dark:bg-slate-800 dark:text-violet-200">
                {userLimits.dailyVideoUploads === null
                  ? page.unlimitedVideos
                  : t("createLink.page.videosQuota", {
                      used: userLimits.videoUploadsUsedToday,
                      limit: userLimits.dailyVideoUploads,
                    })}
              </span>
            )}
            {(!linkQuota.canCreate || linkQuota.plan === "free") && (
              <a
                href={zaloContactUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-sky-700"
              >
                {page.contactUpgrade}
              </a>
            )}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-8">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-red-600">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div className="text-sm font-bold">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="mt-1 block text-[10px] uppercase underline"
                >
                  {page.closeError}
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="relative space-y-6 overflow-hidden rounded-4xl border border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 p-5 shadow-2xl backdrop-blur-xl sm:space-y-8 sm:rounded-[3rem] sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-orange-600/5 blur-3xl" />

            <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  {page.sectionEyebrow}
                </p>
                <h3 className="max-w-48 text-3xl font-black leading-none tracking-tight text-gray-900 dark:text-slate-100 sm:max-w-none sm:text-2xl sm:leading-tight">
                  {page.formTitle}
                </h3>
              </div>
              <button
                type="submit"
                disabled={
                  loading ||
                  uploadingVideo ||
                  (linkQuota ? !linkQuota.canCreate : false)
                }
                className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-linear-to-r from-orange-600 to-amber-500 px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-600/40 active:scale-[0.98] disabled:grayscale disabled:opacity-50 sm:w-auto sm:shrink-0 sm:px-7 sm:text-xs"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : linkQuota && !linkQuota.canCreate ? (
                  <>{page.quotaExhausted}</>
                ) : (
                  <>
                    {page.submit} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <Globe size={14} className="text-orange-500" />{" "}
                {page.originalLabel}
              </label>
              <div className="group relative">
                <input
                  data-field="url"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    clearFieldError("url");
                  }}
                  placeholder={page.originalPlaceholder}
                  className={inputClass(
                    "url",
                    "w-full rounded-3xl bg-gray-50 dark:bg-slate-700 px-6 py-5 font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-300 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-orange-500/10",
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100">
                  <ArrowRight size={18} className="text-orange-600" />
                </div>
              </div>
              {renderFieldError("url")}
              <p className="mt-2 px-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                {page.originalHelp}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} className="text-orange-500" />{" "}
                    {page.titleLabel}
                  </label>
                  <input
                    data-field="customTitle"
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      setCustomTitle(e.target.value);
                      clearFieldError("customTitle");
                    }}
                    placeholder={page.titlePlaceholder}
                    className={inputClass(
                      "customTitle",
                      "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                    )}
                  />
                  {renderFieldError("customTitle")}
                </div>
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} className="text-orange-500" />{" "}
                    {page.descriptionLabel}
                  </label>
                  <input
                    data-field="customDescription"
                    type="text"
                    value={customDescription}
                    onChange={(e) => {
                      setCustomDescription(e.target.value);
                      clearFieldError("customDescription");
                    }}
                    placeholder={page.descriptionPlaceholder}
                    className={inputClass(
                      "customDescription",
                      "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                    )}
                  />
                  {renderFieldError("customDescription")}
                </div>
              </div>
              <div>
                <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  <Type size={14} className="text-orange-500" />{" "}
                  {page.shortCodeLabel}
                </label>
                <input
                  data-field="customShortCode"
                  type="text"
                  value={customShortCode}
                  onChange={(e) => {
                    setCustomShortCode(e.target.value);
                    clearFieldError("customShortCode");
                  }}
                  maxLength={MAX_SHORT_CODE_LENGTH}
                  placeholder={page.shortCodePlaceholder}
                  className={inputClass(
                    "customShortCode",
                    "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                  )}
                />
                {renderFieldError("customShortCode")}
                <p className="mt-2 px-1 text-[11px] font-medium text-gray-400">
                  {page.previewPrefix}{" "}
                  <span className="font-black text-orange-600">
                    {buildPrettyLinkUrl(
                      `https://${customDomain || "hotsnew.click"}`,
                      {
                        title:
                          customTitle ||
                          normalizedShortCodePreview ||
                          page.previewFallback,
                        fallbackToLegacy: false,
                      },
                    )}
                  </span>
                </p>
                <p className="mt-1 px-1 text-[11px] font-medium text-gray-400">
                  {t("createLink.page.shortCodeMax", {
                    max: MAX_SHORT_CODE_LENGTH,
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedSettings((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-3xl border border-gray-100 bg-gray-50/80 px-5 py-4 text-left transition-all hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900"
              >
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                    {page.advancedTitle}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-400">
                    {page.advancedDescription}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={cn(
                    "shrink-0 text-gray-400 transition-transform",
                    showAdvancedSettings && "rotate-180",
                  )}
                />
              </button>

              {showAdvancedSettings && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] border border-sky-100 bg-sky-50/60 p-4 sm:p-5">
                    <div>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-sky-700">
                        {page.marketingTitle}
                      </p>
                      <p className="text-xs font-medium leading-relaxed text-sky-900/70">
                        {page.marketingDescription}
                      </p>
                      {!canUseCustomDomains && (
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                          {page.customDomainLocked}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <select
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        disabled={!canUseCustomDomains}
                        className={cn(
                          "w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100",
                          !canUseCustomDomains &&
                            "cursor-not-allowed opacity-60",
                        )}
                      >
                        <option value="">{page.defaultDomain}</option>
                        {availableOutputDomains
                          .filter((domain) => domain !== "hotsnew.click")
                          .map((domain) => (
                            <option key={domain} value={domain}>
                              {domain}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setCampaignTrackingEnabled((current) => !current)
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition",
                          campaignTrackingEnabled
                            ? "border-sky-300 bg-white text-slate-900 shadow-sm dark:border-sky-500 dark:bg-slate-700 dark:text-slate-100"
                            : "border-sky-100 bg-white/70 text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300",
                        )}
                      >
                        <div>
                          <p className="text-sm font-black">
                            {page.campaignToggleTitle}
                          </p>
                          <p className="mt-1 text-xs font-medium opacity-70">
                            {page.campaignToggleDescription}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider",
                            campaignTrackingEnabled
                              ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-600/40 dark:text-slate-300",
                          )}
                        >
                          {campaignTrackingEnabled
                            ? page.campaignEnabled
                            : page.campaignDisabled}
                        </span>
                      </button>
                    </div>
                    {campaignTrackingEnabled && (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="px-1 text-[11px] font-black uppercase tracking-widest text-sky-700">
                            {page.utmSourceLabel}
                          </label>
                          <input
                            type="text"
                            value={utmSource}
                            onChange={(e) => setUtmSource(e.target.value)}
                            placeholder={page.utmSourcePlaceholder}
                            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                          />
                          <p className="px-1 text-[11px] font-medium text-sky-900/60">
                            {page.utmSourceHelp}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="px-1 text-[11px] font-black uppercase tracking-widest text-sky-700">
                            {page.utmCampaignLabel}
                          </label>
                          <input
                            type="text"
                            value={utmCampaign}
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            placeholder={page.utmCampaignPlaceholder}
                            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                          />
                          <p className="px-1 text-[11px] font-medium text-sky-900/60">
                            {page.utmCampaignHelp}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] border border-violet-100 bg-violet-50/60 p-4 sm:p-5">
                    <div>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-violet-700">
                        {page.affiliateTitle}
                      </p>
                      <p className="text-xs font-medium leading-relaxed text-violet-900/70">
                        {page.affiliateDescription}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <input
                        type="text"
                        value={shopeeAffiliateParams}
                        onChange={(e) =>
                          setShopeeAffiliateParams(e.target.value)
                        }
                        placeholder={page.shopeeAffiliatePlaceholder}
                        className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={tiktokAffiliateParams}
                        onChange={(e) =>
                          setTiktokAffiliateParams(e.target.value)
                        }
                        placeholder={page.tiktokAffiliatePlaceholder}
                        className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                      <Type size={14} className="text-orange-500" />{" "}
                      {page.usageLabel}
                    </label>
                    <select
                      data-field="usageContext"
                      value={usageContext}
                      onChange={(e) => {
                        setUsageContext(e.target.value);
                        clearFieldError("usageContext");
                      }}
                      className={inputClass(
                        "usageContext",
                        "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                      )}
                    >
                      {localizedUsageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {renderFieldError("usageContext")}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                        <Type size={14} className="text-orange-500" />{" "}
                        {page.folderLabel}
                      </label>
                      <input
                        data-field="folderName"
                        type="text"
                        value={folderName}
                        onChange={(e) => {
                          setFolderName(e.target.value);
                          clearFieldError("folderName");
                        }}
                        placeholder={page.folderPlaceholder}
                        className={inputClass(
                          "folderName",
                          "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                        )}
                      />
                      {renderFieldError("folderName")}
                      <p className="mt-2 px-1 text-[11px] font-medium text-gray-400">
                        {page.folderHelp}
                      </p>
                    </div>

                    <div>
                      <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                        <Type size={14} className="text-orange-500" />{" "}
                        {page.tagsLabel}
                      </label>
                      <input
                        data-field="tagsText"
                        type="text"
                        value={tagsText}
                        onChange={(e) => {
                          setTagsText(e.target.value);
                          clearFieldError("tagsText");
                        }}
                        placeholder={page.tagsPlaceholder}
                        className={inputClass(
                          "tagsText",
                          "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                        )}
                      />
                      {renderFieldError("tagsText")}
                      <p className="mt-2 px-1 text-[11px] font-medium text-gray-400">
                        {page.tagsHelp}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                      <Type size={14} className="text-orange-500" />{" "}
                      {page.expiryLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      <button
                        type="button"
                        onClick={() => {
                          setExpiresAt("");
                          clearFieldError("expiresAt");
                        }}
                        className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                          expiresAt === ""
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        {page.expiryNever}
                      </button>
                      {expiryPresets.map(({ days, label }) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => {
                            const future = new Date();
                            future.setDate(future.getDate() + days);
                            setExpiresAt(future.toISOString());
                            clearFieldError("expiresAt");
                          }}
                          className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                            selectedExpirePresetDays === days
                              ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {renderFieldError("expiresAt")}
                    <p className="mt-2 px-1 text-[11px] font-medium text-gray-400">
                      {page.expiryHelp}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                    <div>
                      <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-amber-700">
                        {page.secondaryTitle}
                      </p>
                      <p className="text-xs font-medium leading-relaxed text-amber-900/70">
                        {page.secondaryDescription}
                      </p>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-amber-800">
                        {page.secondaryWarning}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-500">
                          <Type size={14} className="text-orange-500" />{" "}
                          {page.secondaryTargetLabel}
                        </label>
                        <select
                          value={secondaryTargetType}
                          disabled={!canUseSecondaryFlow}
                          onChange={(e) =>
                            setSecondaryTargetType(
                              e.target.value === "tiktok" ? "tiktok" : "shopee",
                            )
                          }
                          className={`w-full rounded-2xl px-6 py-4 font-medium outline-none transition-all focus:ring-4 focus:ring-orange-500/10 ${
                            canUseSecondaryFlow
                              ? "bg-white text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                              : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                          }`}
                        >
                          <option value="shopee">
                            {page.secondaryTargetShopee}
                          </option>
                          <option value="tiktok">
                            {page.secondaryTargetTikTok}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-500">
                          <Globe size={14} className="text-orange-500" />{" "}
                          {page.secondaryUrlLabel}
                        </label>
                        <input
                          data-field="secondaryUrl"
                          type="url"
                          disabled={!canUseSecondaryFlow}
                          value={secondaryUrl}
                          onChange={(e) => {
                            setSecondaryUrl(e.target.value);
                            clearFieldError("secondaryUrl");
                          }}
                          placeholder={
                            secondaryTargetType === "tiktok"
                              ? page.secondaryUrlPlaceholderTikTok
                              : page.secondaryUrlPlaceholderShopee
                          }
                          className={inputClass(
                            "secondaryUrl",
                            canUseSecondaryFlow
                              ? "w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                              : "w-full cursor-not-allowed rounded-2xl bg-gray-100 px-6 py-4 font-medium text-gray-400 dark:bg-slate-800 dark:text-slate-500",
                          )}
                        />
                        {renderFieldError("secondaryUrl")}
                        {!canUseSecondaryFlow && (
                          <p className="mt-2 px-1 text-[11px] font-medium text-gray-500">
                            {page.secondaryUrlHelpDisabled}
                          </p>
                        )}
                        {canUseSecondaryFlow && (
                          <p className="mt-2 px-1 text-[11px] font-medium text-gray-500">
                            {page.secondaryUrlHelpEmpty}{" "}
                            {secondaryTargetType === "tiktok"
                              ? page.secondaryUrlHelpTikTokOnly
                              : page.secondaryUrlHelpShopeeOnly}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                          {page.abTitle}
                        </p>
                        <p className="text-xs font-medium leading-relaxed text-emerald-900/70">
                          {page.abDescription}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canUseAbTesting}
                        onClick={() => {
                          if (!canUseAbTesting) return;
                          setAbTestEnabled(!abTestEnabled);
                        }}
                        className={cn(
                          "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                          !canUseAbTesting &&
                            "cursor-not-allowed opacity-50 grayscale",
                          abTestEnabled
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-emerald-700",
                        )}
                      >
                        {abTestEnabled ? page.abToggleOn : page.abToggleOff}
                      </button>
                    </div>

                    {!canUseAbTesting && (
                      <p className="text-xs font-bold text-emerald-800/80">
                        {page.abLocked}
                      </p>
                    )}

                    {abTestEnabled && (
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <input
                          type="text"
                          value={abVariantBTitle}
                          onChange={(e) => setAbVariantBTitle(e.target.value)}
                          placeholder={page.abVariantBTitlePlaceholder}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                        />
                        <input
                          type="url"
                          value={abVariantBOriginalUrl}
                          onChange={(e) =>
                            setAbVariantBOriginalUrl(e.target.value)
                          }
                          placeholder={page.abVariantBUrlPlaceholder}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                        />
                        <textarea
                          value={abVariantBDescription}
                          onChange={(e) =>
                            setAbVariantBDescription(e.target.value)
                          }
                          placeholder={page.abVariantBDescriptionPlaceholder}
                          rows={4}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 md:col-span-2"
                        />
                        <input
                          type="url"
                          value={abVariantBImageUrl}
                          onChange={(e) =>
                            setAbVariantBImageUrl(e.target.value)
                          }
                          placeholder={page.abVariantBImagePlaceholder}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                        />
                        <input
                          type="url"
                          value={abVariantBVideoUrl}
                          onChange={(e) =>
                            setAbVariantBVideoUrl(e.target.value)
                          }
                          placeholder={page.abVariantBVideoPlaceholder}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100"
                        />
                        <input
                          type="url"
                          value={abVariantBSecondaryUrl}
                          onChange={(e) =>
                            setAbVariantBSecondaryUrl(e.target.value)
                          }
                          placeholder={page.abVariantBSecondaryPlaceholder}
                          className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 md:col-span-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
                <div className="flex flex-col space-y-4">
                  <label className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <VideoIcon size={14} className="text-orange-500" />{" "}
                    {page.videoLabel}
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={videoUploadBlocked}
                    onClick={() => videoInputRef?.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingVideo(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (!isDraggingVideo) {
                        setIsDraggingVideo(true);
                      }
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      const nextTarget = event.relatedTarget as Node | null;
                      if (!event.currentTarget.contains(nextTarget)) {
                        setIsDraggingVideo(false);
                      }
                    }}
                    onDrop={handleVideoDrop}
                    data-field="videoUrl"
                    className={cn(
                      "group flex min-h-21 w-full flex-col items-start gap-4 rounded-2xl border-2 border-dashed px-5 py-5 text-left transition-all sm:flex-row sm:items-center sm:justify-between sm:px-6",
                      videoUploadBlocked &&
                        "cursor-not-allowed opacity-60 saturate-0",
                      isDraggingVideo
                        ? "border-orange-400 bg-orange-100/80 shadow-lg shadow-orange-100"
                        : "border-orange-100 bg-orange-50/30 hover:border-orange-300 hover:bg-orange-50/50",
                    )}
                  >
                    <div className="flex items-center gap-3 font-bold text-orange-400 group-hover:text-orange-600">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                        {uploadingVideo ? (
                          <svg
                            className="h-10 w-10 -rotate-90"
                            viewBox="0 0 36 36"
                            aria-hidden="true"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity="0.15"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray="87.96"
                              strokeDashoffset={uploadProgressOffset}
                            />
                          </svg>
                        ) : (
                          <UploadCloud size={20} />
                        )}
                        {uploadingVideo && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-orange-600">
                            {videoUploadProgress > 0
                              ? `${videoUploadProgress}%`
                              : "..."}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] uppercase tracking-wider sm:text-xs">
                        {uploadingVideo
                          ? videoUploadProgress > 0
                            ? page.videoUploading
                            : page.videoPreparing
                          : videoUrl
                            ? t("createLink.page.videoReplaceWithProvider", {
                                provider: videoProviderLabel,
                              })
                            : t("createLink.page.videoUploadWithProvider", {
                                provider: videoProviderLabel,
                              })}
                      </span>
                    </div>
                    {videoUrl && (
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="text-green-600" size={14} />
                      </div>
                    )}
                  </button>
                  <p className="px-1 text-[11px] font-medium text-gray-500">
                    {page.videoDropHelp}
                  </p>
                  {userLimits && (
                    <p className="px-1 text-[11px] font-bold text-violet-600 dark:text-violet-300">
                      {userLimits.dailyVideoUploads === null
                        ? page.videoQuotaUnlimited
                        : t("createLink.page.videoQuotaRemaining", {
                            remaining: videoUploadsRemainingToday ?? 0,
                            limit: userLimits.dailyVideoUploads,
                          })}
                    </p>
                  )}
                  {videoUploadBlocked && (
                    <p className="px-1 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                      {userLimits?.dailyVideoUploads === 0
                        ? page.videoQuotaUnsupported
                        : page.videoQuotaExhausted}
                    </p>
                  )}
                  {renderFieldError("videoUrl")}

                  {videoUploadSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                      <ShieldCheck size={14} />
                      {t("createLink.page.videoUploadSuccessWithProvider", {
                        provider: videoProviderLabel,
                      })}
                    </div>
                  )}

                  {videoUrl && (
                    <div
                      className={cn(
                        "relative mt-auto overflow-hidden rounded-3xl bg-black shadow-2xl ring-4 ring-white",
                        videoPreviewOrientation === "portrait"
                          ? "mx-auto aspect-9/16 w-full max-w-[18rem]"
                          : videoPreviewOrientation === "square"
                            ? "mx-auto aspect-square w-full max-w-[24rem]"
                            : "aspect-video w-full",
                      )}
                    >
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={handleVideoPreviewMetadata}
                        className="h-full w-full bg-black object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl("");
                          setVideoPreviewOrientation("landscape");
                        }}
                        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-4">
                  <label className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <ImageIcon size={14} className="text-orange-500" />
                    {page.thumbnailLabel}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleThumbnailDrop}
                    className="group flex min-h-18 w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-sky-100 bg-sky-50/40 px-5 py-4 text-left transition-all hover:border-sky-300 hover:bg-sky-50/70 dark:border-sky-900/50 dark:bg-sky-950/20 dark:hover:border-sky-700 dark:hover:bg-sky-950/30 sm:px-6"
                  >
                    <div className="flex items-center gap-3 font-bold text-sky-500 group-hover:text-sky-700 dark:text-sky-300 dark:group-hover:text-sky-200">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                        {uploadingThumbnail ? (
                          <svg
                            className="h-10 w-10 -rotate-90"
                            viewBox="0 0 36 36"
                            aria-hidden="true"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeOpacity="0.15"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray="87.96"
                              strokeDashoffset={
                                87.96 - (87.96 * thumbnailUploadProgress) / 100
                              }
                            />
                          </svg>
                        ) : (
                          <UploadCloud size={20} />
                        )}
                        {uploadingThumbnail && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-sky-600 dark:text-sky-200">
                            {thumbnailUploadProgress > 0
                              ? `${thumbnailUploadProgress}%`
                              : "..."}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] uppercase tracking-wider sm:text-xs">
                        {uploadingThumbnail
                          ? page.thumbnailUploading
                          : t("createLink.page.thumbnailSelectWithProvider", {
                              provider: thumbnailProviderLabel,
                            })}
                      </span>
                    </div>
                    {customImageUrl && (
                      <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/40">
                        <Check
                          className="text-green-600 dark:text-green-300"
                          size={14}
                        />
                      </div>
                    )}
                  </button>
                  <p className="px-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                    {page.thumbnailDropHelp}
                  </p>
                  {thumbnailUploadSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                      <ShieldCheck size={14} />
                      {t("createLink.page.thumbnailUploadSuccessWithProvider", {
                        provider: thumbnailProviderLabel,
                      })}
                    </div>
                  )}
                  <input
                    data-field="customImageUrl"
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      clearFieldError("customImageUrl");
                      clearFieldError("videoUrl");
                    }}
                    placeholder={page.thumbnailUrlPlaceholder}
                    className={inputClass(
                      "customImageUrl",
                      "min-h-21 w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 dark:bg-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700",
                    )}
                  />
                  {renderFieldError("customImageUrl")}

                  {customImageUrl && (
                    <div
                      className={cn(
                        "relative mt-auto overflow-hidden rounded-3xl bg-gray-100 shadow-xl ring-4 ring-white dark:bg-slate-700 dark:ring-slate-700",
                        thumbnailPreviewOrientation === "portrait"
                          ? "mx-auto aspect-9/16 w-full max-w-[18rem]"
                          : thumbnailPreviewOrientation === "square"
                            ? "mx-auto aspect-square w-full max-w-[24rem]"
                            : "aspect-video w-full",
                      )}
                    >
                      <img
                        src={customImageUrl}
                        alt={page.thumbnailPreviewAlt}
                        onLoad={handleThumbnailPreviewLoad}
                        className={cn(
                          "h-full w-full bg-black",
                          thumbnailPreviewOrientation === "portrait"
                            ? "object-contain"
                            : "object-cover",
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="max-w-xl space-y-5">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:rounded-[2.25rem]">
            {!result && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 p-6 text-center backdrop-blur-[2px] dark:bg-slate-900/50">
                <p className="rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold uppercase text-white">
                  {content.result.review}
                </p>
              </div>
            )}
            <div className="relative flex aspect-[12/5.4] items-center justify-center bg-gray-100 dark:bg-slate-700">
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  onLoad={handleThumbnailPreviewLoad}
                  className={cn(
                    "h-full w-full bg-black",
                    thumbnailPreviewOrientation === "portrait"
                      ? "object-contain"
                      : "object-cover",
                  )}
                  alt={content.result.previewImageAlt}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <ImageIcon size={40} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {content.result.previewEmpty}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-[#F2F3F5] p-5 dark:bg-slate-900 sm:p-6">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400">
                <Globe size={10} />{" "}
                {(customDomain || "hotsnew.click").toUpperCase()}
              </p>
              <h4 className="mb-2 line-clamp-2 text-lg font-black leading-tight text-gray-900 dark:text-slate-100">
                {customTitle || content.result.previewTitleFallback}
              </h4>
              <p className="line-clamp-2 text-[13px] font-medium leading-relaxed text-gray-600 opacity-70 dark:text-slate-400">
                {customDescription || content.result.previewDescriptionFallback}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-[1.75rem] border-2 p-5 transition-all duration-500 sm:rounded-[2.25rem] sm:p-8",
              result
                ? "scale-100 border-orange-100 bg-white shadow-2xl dark:border-orange-500/20 dark:bg-slate-800"
                : "pointer-events-none scale-[0.98] border-gray-100 bg-gray-50 opacity-50 grayscale dark:border-slate-700 dark:bg-slate-800/60",
            )}
          >
            {result && (
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-green-500/5 blur-2xl" />
            )}

            <div className="relative z-10 mb-6 flex items-center justify-between gap-3 sm:mb-8">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                {t("createLink.result.codeLabel", {
                  code: result?.short_code || "########",
                })}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(result ? convertedResultUrl : "", "res")
                }
                className="rounded-2xl border border-gray-100 bg-white p-3 text-orange-600 shadow-sm transition-all hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                {copiedId === "res" ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <div className="relative z-10 mb-6 truncate rounded-2xl border border-gray-100 bg-gray-50/50 p-4 font-mono text-[11px] font-black text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:mb-10 sm:p-6 sm:text-xs">
              {result
                ? convertedResultUrl
                : buildPrettyLinkUrl("https://hotsnew.click", {
                    title: customTitle || "link",
                    fallbackToLegacy: false,
                  })}
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() =>
                  copyToClipboard(result ? convertedResultUrl : "", "res")
                }
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600 sm:py-5"
              >
                <Copy size={16} /> {content.result.copyLink}
              </button>
              <button
                onClick={() => result && setShowQrModal(true)}
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:py-5"
              >
                <QrCode size={16} /> {content.result.qr}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && result && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            onClick={() => setShowQrModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-2 text-center">
              {content.qrModal.title}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm text-center mb-6">
              {content.qrModal.description}
            </p>

            <div className="flex justify-center mb-6">
              <div className="rounded-2xl bg-white p-3 shadow-lg">
                <QRCodeCanvas
                  value={convertedResultUrl}
                  size={192}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {content.qrModal.close}
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(convertedResultUrl)}&download=1`}
                download={`qr-${result.short_code}.png`}
                className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all text-center dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {content.qrModal.download}
              </a>
            </div>
          </div>
        </div>
      )}

      {guideDialogOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            onClick={onCloseGuide}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[2.5rem] border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={onCloseGuide}
              aria-label={page.guideDialogClose}
              className="absolute right-4 top-4 z-10 rounded-2xl bg-white/90 p-2 text-slate-500 shadow-sm transition-all hover:bg-white hover:text-slate-900 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X size={18} />
            </button>
            <div className="p-3 md:p-4">
              <WorkflowGuide
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  onCloseGuide();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
