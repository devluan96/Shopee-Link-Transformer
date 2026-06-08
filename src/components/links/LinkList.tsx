import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  MousePointer2,
  BarChart3,
  Clock3,
  Trash2,
  Pencil,
  X,
  Save,
  QrCode,
  AlertTriangle,
  Link2,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles,
  Filter,
  Share2,
  UploadCloud,
  Check,
} from "lucide-react";
import { ConvertedLink, LinkStats, LinkUpdatePayload, Workspace } from "@/src/types";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi as viLocale } from "date-fns/locale";
import { QRCodeCanvas } from "qrcode.react";
import { normalizeUsageContext } from "@/src/lib/linkUsage";
import { useLocale } from "@/src/hooks/useLocale";
import { buildPrettyLinkUrl } from "@/src/lib/linkPaths";
import { toast } from "sonner";
import { normalizeVietnameseSlug } from "@/src/lib/utils";
import { DEFAULT_OUTPUT_DOMAIN, DEFAULT_SITE_URL } from "@/src/lib/appConfig";

const TIKTOK_HOST_REGEX =
  /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

type QuickFilter = "all" | "choice" | "video" | "tiktok" | "expiring" | "top";

interface LinkListProps {
  links: ConvertedLink[];
  listLoading: boolean;
  listLoadingMore?: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  workspaces?: Workspace[];
  currentWorkspaceId?: string;
  canShareToWorkspace?: boolean;
  showChoiceModeActions?: boolean;
  stats?: LinkStats;
  statsUpdatedAt?: string | null;
  hasMoreLinks?: boolean;
  onLoadMoreLinks?: () => Promise<void> | void;
  onQuickFilterChange?: (mode: "newest" | "top") => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
  onDeleteLink: (id: string) => Promise<void>;
  onUpdateLink: (id: string, data: LinkUpdatePayload) => Promise<void>;
  onShareLink?: (id: string, workspaceId: string) => Promise<void>;
  onDeleteManyLinks?: (ids: string[]) => Promise<void>;
  uploadAssetToCloudinary: (
    file: Blob | File,
    resourceType: "image" | "video" | "auto",
    fileName?: string,
    onProgress?: (progress: number) => void,
    options?: { skipLibraryRecord?: boolean },
  ) => Promise<string>;
}

export const LinkList = ({
  links,
  listLoading,
  listLoadingMore = false,
  searchTerm,
  setSearchTerm,
  workspaces = [],
  currentWorkspaceId,
  canShareToWorkspace = false,
  showChoiceModeActions = false,
  stats,
  statsUpdatedAt,
  hasMoreLinks = false,
  onLoadMoreLinks,
  onQuickFilterChange,
  copyToClipboard,
  copiedId,
  onDeleteLink,
  onUpdateLink,
  onShareLink,
  onDeleteManyLinks,
  uploadAssetToCloudinary,
}: LinkListProps) => {
  const { locale, messages, t } = useLocale();
  const content = messages.linkList;
  const shareContent = messages.linkListShare;
  const dateFnsLocale = locale === "vi" ? viLocale : enUS;
  const [editingLink, setEditingLink] = useState<ConvertedLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<ConvertedLink | null>(null);
  const [qrLink, setQrLink] = useState<ConvertedLink | null>(null);
  const [sharingLink, setSharingLink] = useState<ConvertedLink | null>(null);
  const [shareWorkspaceId, setShareWorkspaceId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [editForm, setEditForm] = useState({
    shortCode: "",
    title: "",
    desc: "",
    img: "",
    original: "",
    secondary: "",
    secondaryTargetType: "shopee" as "shopee" | "tiktok",
    redirectDelayMs: 3000,
    video: "",
    mobileDirectMode: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditVideoUploading, setIsEditVideoUploading] = useState(false);
  const [editVideoUploadProgress, setEditVideoUploadProgress] = useState(0);
  const [editVideoUploadSuccess, setEditVideoUploadSuccess] = useState(false);
  const editVideoInputRef = useRef<HTMLInputElement | null>(null);
  const qrCanvasRef = useRef<React.ElementRef<"canvas"> | null>(null);
  const writableTargetWorkspaces = workspaces.filter(
    (workspace) =>
      workspace.id !== currentWorkspaceId &&
      (workspace.role === "owner" || workspace.role === "editor"),
  );
  const canShareLinks =
    !!onShareLink && canShareToWorkspace && writableTargetWorkspaces.length > 0;

  const localizedQuickFilterOptions: Array<{
    value: QuickFilter;
    label: string;
  }> = [
    { value: "all", label: content.filters.all },
    { value: "choice", label: content.filters.choice },
    { value: "video", label: content.filters.video },
    { value: "tiktok", label: content.filters.tiktok },
    { value: "expiring", label: content.filters.expiring },
    { value: "top", label: content.filters.top },
  ];

  const localizedUsageOptions: Array<{
    value: string;
    label: string;
  }> = [];

  const getLocalizedUsageLabel = (value?: string | null) => {
    if (!value) return null;

    switch (normalizeUsageContext(value)) {
      case "Bai viet Facebook":
        return content.filters.usageFacebookPost;
      case "Reel Facebook":
        return content.filters.usageFacebookReel;
      case "Bio TikTok":
        return content.filters.usageTikTokBio;
      case "Video TikTok":
        return content.filters.usageTikTokVideo;
      case "Zalo OA":
        return content.filters.usageZalo;
      case "Nhom seeding":
        return content.filters.usageSeeding;
      case "Livestream":
        return content.filters.usageLivestream;
      default:
        return value;
    }
  };

  const toggleSelect = (id: string) => {
    const nextSet = new Set(selectedIds);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setSelectedIds(nextSet);
  };

  const buildChoiceModeLink = (shortCode: string) =>
    `${DEFAULT_SITE_URL}/s-choice/${shortCode}`;

  const getSecondaryTargetLabel = (value?: string) => {
    if (!value) return null;
    try {
      const hostname = new URL(value).hostname.trim().toLowerCase();
      return TIKTOK_HOST_REGEX.test(hostname) ? "TikTok" : "Shopee";
    } catch {
      return content.card.stepTwo;
    }
  };

  const getSecondaryTargetType = (
    value?: string,
  ): "shopee" | "tiktok" => {
    if (!value) return "shopee";
    try {
      const hostname = new URL(value).hostname.trim().toLowerCase();
      return TIKTOK_HOST_REGEX.test(hostname) ? "tiktok" : "shopee";
    } catch {
      return "shopee";
    }
  };

  const getSecondaryFlowBadge = (
    originalValue?: string,
    secondaryValue?: string,
  ) => {
    const sourceLabel = getSecondaryTargetLabel(originalValue);
    const targetLabel = getSecondaryTargetLabel(secondaryValue);
    if (!targetLabel) return null;

    const label =
      sourceLabel === "TikTok"
        ? targetLabel === "TikTok"
          ? locale === "vi"
            ? "TikTok sang TikTok"
            : "TikTok to TikTok"
          : locale === "vi"
            ? "TikTok sang Shopee"
            : "TikTok to Shopee"
        : targetLabel === "TikTok"
          ? content.card.secondaryTikTok
          : content.card.secondaryShopee;

    if (targetLabel === "TikTok") {
      return {
        label,
        className:
          "rounded-full border border-cyan-200/70 bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200",
      };
    }

    return {
      label,
      className:
        "rounded-full border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    };
  };

  const startEdit = (link: ConvertedLink) => {
    setEditingLink(link);

    setEditForm({
      shortCode: link.short_code || "",
      title: link.custom_title || "",
      desc: link.custom_description || "",
      img: link.custom_image_url || "",
      video: link.video_url || "",
      original: link.original_url || "",
      secondary: link.secondary_url || "",
      secondaryTargetType: getSecondaryTargetType(link.secondary_url),
      redirectDelayMs: link.redirect_delay_ms || 3000,
      mobileDirectMode:
        (!link.video_url && !!link.custom_image_url && !link.secondary_url) ||
        false,
    });
    setIsEditVideoUploading(false);
    setEditVideoUploadProgress(0);
    setEditVideoUploadSuccess(false);
    if (editVideoInputRef.current) {
      editVideoInputRef.current.value = "";
    }
  };

  const startShare = (link: ConvertedLink) => {
    if (!canShareToWorkspace) {
      toast.error(shareContent.ownerOnly);
      return;
    }

    if (!writableTargetWorkspaces.length) {
      toast.error(shareContent.noTargets);
      return;
    }

    setSharingLink(link);
    setShareWorkspaceId(writableTargetWorkspaces[0]?.id || "");
  };

  const handleUpdate = async () => {
    if (!editingLink?.id) return;
    setIsUpdating(true);
    try {
      const updates: LinkUpdatePayload = {
        short_code:
          normalizeVietnameseSlug(editForm.shortCode) || editingLink.short_code,
        custom_title: editForm.title,
        custom_description: editForm.desc,
        custom_image_url: editForm.img,
        video_url: editForm.mobileDirectMode
          ? null
          : editForm.video || editingLink.video_url || null,
        original_url: editForm.original,
        secondary_url: editForm.mobileDirectMode ? null : editForm.secondary,
        secondaryTargetType: editForm.secondaryTargetType,
        redirect_delay_ms: editForm.redirectDelayMs,
        mobileDirectMode: editForm.mobileDirectMode,
      };

      await onUpdateLink(editingLink.id, updates);
      setEditingLink(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const captureVideoThumbnailBlob = useCallback(
    async (file: File): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

        const cleanup = () => {
          URL.revokeObjectURL(objectUrl);
          video.removeAttribute("src");
          video.load();
        };

        video.onloadedmetadata = () => {
          const duration = Number.isFinite(video.duration) ? video.duration : 0;
          const targetTime =
            duration > 0 ? Math.min(Math.max(duration * 0.2, 0.2), 2) : 0.2;
          video.currentTime = targetTime;
        };

        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              resolve(blob);
            },
            "image/jpeg",
            0.85,
          );
        };

        video.onerror = () => {
          cleanup();
          resolve(null);
        };

        video.load();
      });
    },
    [],
  );

  const handleEditVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn file video hợp lệ.");
      e.target.value = "";
      return;
    }

    setIsEditVideoUploading(true);
    setEditVideoUploadProgress(0);
    setEditVideoUploadSuccess(false);

    try {
      const thumbnailBlob = await captureVideoThumbnailBlob(file);
      const videoUploadPromise = uploadAssetToCloudinary(
        file,
        "video",
        file.name,
        setEditVideoUploadProgress,
        { skipLibraryRecord: false },
      );
      const thumbnailUploadPromise = thumbnailBlob
        ? uploadAssetToCloudinary(
            thumbnailBlob,
            "image",
            "thumb.jpg",
            undefined,
            { skipLibraryRecord: true },
          )
        : Promise.resolve<string | null>(null);

      const [videoResult, thumbnailResult] = await Promise.allSettled([
        videoUploadPromise,
        thumbnailUploadPromise,
      ]);

      if (videoResult.status === "rejected") {
        throw videoResult.reason;
      }

      const uploadedUrl = videoResult.value;
      setEditForm((current) => ({
        ...current,
        video: uploadedUrl,
        img:
          thumbnailResult.status === "fulfilled" && thumbnailResult.value
            ? thumbnailResult.value
            : current.img,
      }));

      if (thumbnailResult.status === "rejected") {
        toast.error(
          "Video đã tải lên, nhưng không cắt được ảnh đại diện mới từ video.",
        );
      }
      setEditVideoUploadSuccess(true);
      setTimeout(() => setEditVideoUploadSuccess(false), 5000);
    } catch (error: unknown) {
      toast.error(
        `Lỗi tải video: ${
          error instanceof Error ? error.message : "Không xác định"
        }`,
      );
    } finally {
      setIsEditVideoUploading(false);
      e.target.value = "";
      setTimeout(() => setEditVideoUploadProgress(0), 600);
    }
  };

  const handleShare = async () => {
    if (!sharingLink?.id || !shareWorkspaceId || !onShareLink) return;

    setIsSharing(true);
    try {
      await onShareLink(sharingLink.id, shareWorkspaceId);
      setSharingLink(null);
      setShareWorkspaceId("");
    } finally {
      setIsSharing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!onDeleteManyLinks || selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await onDeleteManyLinks(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const isLinkExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isLinkExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt || isLinkExpired(expiresAt)) return false;
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffHours = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const getHostLabel = (value?: string) => {
    if (!value) return content.card.unknown;
    try {
      return new URL(value).hostname.replace(/^www\./i, "");
    } catch {
      return content.card.unknown;
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredLinks = links.filter((link) => {
    const searchableText = [
      link.custom_title,
      link.custom_description,
      link.short_code,
      link.usage_context,
      link.folder_name,
      link.original_url,
      link.secondary_url,
      ...(link.tags || []),
      ...(link.tracked_sources || []).map((source) => source.label),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      normalizedSearchTerm &&
      !searchableText.includes(normalizedSearchTerm)
    ) {
      return false;
    }

    switch (quickFilter) {
      case "choice":
        return !!link.secondary_url;
      case "video":
        return !!link.video_url;
      case "tiktok":
        return (
          (link.tiktok_clicks || 0) > 0 ||
          getSecondaryTargetLabel(link.secondary_url) === "TikTok"
        );
      case "expiring":
        return isLinkExpiringSoon(link.expires_at);
      case "top":
        return (link.clicks || 0) + (link.tiktok_clicks || 0) >= 10;
      default:
        return true;
    }
  });

  const displayedLinks = (() => {
    const nextLinks = [...filteredLinks];
    if (quickFilter === "top") {
      return nextLinks.sort((a, b) => {
        const aClicks = (a.clicks || 0) + (a.tiktok_clicks || 0);
        const bClicks = (b.clicks || 0) + (b.tiktok_clicks || 0);
        if (bClicks !== aClicks) return bClicks - aClicks;
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
      });
    }
    return nextLinks;
  })();

  const visibleLinkIds = displayedLinks
    .map((link) => link.id ?? link.short_code)
    .filter((id): id is string => !!id);
  const visibleSelectedCount = visibleLinkIds.filter((id) =>
    selectedIds.has(id),
  ).length;
  const allVisibleSelected =
    visibleLinkIds.length > 0 && visibleSelectedCount === visibleLinkIds.length;

  const toggleSelectAll = () => {
    const nextSet = new Set(selectedIds);
    if (allVisibleSelected) visibleLinkIds.forEach((id) => nextSet.delete(id));
    else visibleLinkIds.forEach((id) => nextSet.add(id));
    setSelectedIds(nextSet);
  };

  const hasLoadedStats = !!statsUpdatedAt;
  const totalLinks = hasLoadedStats ? stats?.totalLinks ?? 0 : 0;
  const totalShopeeClicks =
    hasLoadedStats && stats?.totalShopeeClicks !== undefined
      ? stats.totalShopeeClicks
      :
    links.reduce((sum, link) => sum + (link.clicks || 0), 0);
  const totalTiktokClicks =
    hasLoadedStats && stats?.totalTiktokClicks !== undefined
      ? stats.totalTiktokClicks
      :
    links.reduce((sum, link) => sum + (link.tiktok_clicks || 0), 0);
  const totalOutboundClicks =
    hasLoadedStats && stats?.totalClicks !== undefined
      ? stats.totalClicks
      : totalShopeeClicks + totalTiktokClicks;
  const choiceModeCount =
    hasLoadedStats && stats?.choiceModeCount !== undefined
      ? stats.choiceModeCount
      : links.filter((link) => !!link.secondary_url).length;
  const expiringSoonCount =
    hasLoadedStats && stats?.expiringSoonCount !== undefined
      ? stats.expiringSoonCount
      :
    links.filter((link) => isLinkExpiringSoon(link.expires_at)).length;
  const averageClicks =
    hasLoadedStats && stats?.averageClicks !== undefined
      ? stats.averageClicks
      : totalLinks
        ? Math.round(totalOutboundClicks / totalLinks)
        : 0;
  useEffect(() => {
    if (!onLoadMoreLinks || !hasMoreLinks) return;

    const isNearBottom = () => {
      if (listLoading || listLoadingMore) return false;

      const doc = document.documentElement;
      const body = document.body;
      const scrollTop = window.scrollY ?? doc.scrollTop ?? body.scrollTop ?? 0;
      const viewportBottom = scrollTop + window.innerHeight;
      const pageHeight = Math.max(
        doc.scrollHeight,
        body?.scrollHeight ?? 0,
        doc.offsetHeight,
        body?.offsetHeight ?? 0,
      );

      return pageHeight - viewportBottom <= 8;
    };

    const maybeLoadMore = () => {
      if (!isNearBottom()) return;
      void onLoadMoreLinks();
    };

    window.addEventListener("scroll", maybeLoadMore, { passive: true });
    window.addEventListener("resize", maybeLoadMore);

    return () => {
      window.removeEventListener("scroll", maybeLoadMore);
      window.removeEventListener("resize", maybeLoadMore);
    };
  }, [hasMoreLinks, listLoading, listLoadingMore, onLoadMoreLinks]);

  const confirmDelete = async () => {
    if (!deletingLink?.id) return;
    setIsDeleting(true);
    try {
      await onDeleteLink(deletingLink.id);
      setDeletingLink(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStats = [
    {
      label: content.stats.total,
      value: hasLoadedStats ? totalLinks : "…",
      note: t("linkList.stats.totalNote", { shown: displayedLinks.length }),
      icon: <Sparkles size={15} />,
      tone: "border-orange-200/70 bg-orange-50/80 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200",
    },
    {
      label: content.stats.shopee,
      value: hasLoadedStats ? totalShopeeClicks : "…",
      note: content.stats.shopeeNote,
      icon: <MousePointer2 size={15} />,
      tone: "border-blue-200/70 bg-blue-50/80 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
    },
    {
      label: content.stats.tiktok,
      value: hasLoadedStats ? totalTiktokClicks : "…",
      note: content.stats.tiktokNote,
      icon: <BarChart3 size={15} />,
      tone: "border-cyan-200/70 bg-cyan-50/80 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200",
    },
    {
      label: content.stats.choice,
      value: hasLoadedStats ? choiceModeCount : "…",
      note: content.stats.choiceNote,
      icon: <ShieldCheck size={15} />,
      tone: "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    },
    {
      label: content.stats.expiring,
      value: hasLoadedStats ? expiringSoonCount : "…",
      note: t("linkList.stats.expiringNote", { count: averageClicks }),
      icon: <Clock3 size={15} />,
      tone: "border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
    },
  ];

  return (
    <div key="list" className="space-y-5">
      <section className="relative overflow-hidden rounded-4xl border border-slate-200/70 bg-white/90 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-r from-orange-500/12 via-cyan-400/8 to-transparent" />
        <div className="relative flex flex-col gap-5 p-5 lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                <Sparkles size={12} />
                {content.hero.badge}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                {content.hero.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                {t("linkList.hero.description", {
                  shown: displayedLinks.length,
                  total: totalLinks,
                })}
              </p>
            </div>

            <div className="w-full xl:max-w-md">
              <div className="group relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={content.hero.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-5 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {renderStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.35rem] border border-slate-200/70 bg-white/80 p-3.5 shadow-sm dark:border-slate-700/70 dark:bg-slate-800/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {stat.note}
                    </p>
                  </div>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${stat.tone}`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              <Filter size={14} />
              {content.filters.quick}
            </div>
            <div className="flex flex-wrap gap-2">
              {localizedQuickFilterOptions.map((option) => {
                const isActive = quickFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setQuickFilter(option.value);
                      onQuickFilterChange?.(
                        option.value === "top" ? "top" : "newest",
                      );
                    }}
                    className={`rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-white dark:text-slate-900"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-500/40 dark:hover:text-orange-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {links.length > 0 && onDeleteManyLinks && (
        <div className="sticky top-4 z-10 rounded-3xl border border-slate-200/70 bg-white/85 p-3.5 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/85">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10 dark:hover:text-orange-200"
              >
                {allVisibleSelected ? (
                  <CheckSquare size={16} className="text-orange-500" />
                ) : (
                  <Square size={16} />
                )}
                {allVisibleSelected
                  ? content.bulk.deselectVisible
                  : content.bulk.selectVisible}
              </button>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t("linkList.bulk.selected", { count: selectedIds.size })}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t("linkList.bulk.current", {
                  selected: visibleSelectedCount,
                  total: displayedLinks.length,
                })}
              </div>
            </div>

            {selectedIds.size > 0 ? (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-red-700"
              >
                <Trash2 size={14} />
                {t("linkList.bulk.delete", { count: selectedIds.size })}
              </button>
            ) : (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {content.bulk.hint}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {listLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-[1.75rem] border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-800/60"
            />
          ))
        ) : displayedLinks.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              {links.length === 0 ? content.empty.noLinks : content.empty.noResults}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              {content.empty.hint}
            </p>
          </div>
        ) : (
          <>
            {displayedLinks.map((link) => {
            const linkId = link.id ?? link.short_code;
            const flowBadge = getSecondaryFlowBadge(
              link.original_url,
              link.secondary_url,
            );
            const topSource = link.tracked_sources?.[0];
            const shopeeClicks = link.clicks || 0;
            const tiktokClicks = link.tiktok_clicks || 0;
            const totalClicksForLink = shopeeClicks + tiktokClicks;

            return (
              <div
                key={linkId}
                className={`group relative overflow-hidden rounded-[1.75rem] border shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(15,23,42,0.52)] ${
                  selectedIds.has(linkId)
                    ? "border-orange-300 bg-orange-50/45 dark:border-orange-500/40 dark:bg-orange-500/10"
                    : "border-slate-200/70 bg-white/92 dark:border-slate-700/80 dark:bg-slate-900/88"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-r from-orange-500/8 via-transparent to-cyan-400/8" />
                <div className="relative flex flex-col gap-3 p-3 xl:grid xl:grid-cols-[minmax(0,1fr),460px] xl:items-center xl:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      {onDeleteManyLinks && (
                        <button
                          onClick={() => toggleSelect(linkId)}
                          className="mt-0.5 rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-400 transition-all hover:border-orange-200 hover:text-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-orange-500/30 dark:hover:text-orange-300"
                        >
                          {selectedIds.has(linkId) ? (
                            <CheckSquare
                              size={18}
                              className="text-orange-500"
                            />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      )}

                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        {link.custom_image_url ? (
                          <img
                            src={link.custom_image_url}
                            alt={link.custom_title || link.short_code}
                            className="h-full w-full object-cover"
                          />
                        ) : link.video_url ? (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                            <VideoIcon size={22} />
                          </div>
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}

                        {link.video_url && link.custom_image_url && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/25">
                            <VideoIcon
                              size={14}
                              className="text-white drop-shadow-md"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <h4 className="line-clamp-2 text-base font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                          {link.custom_title || content.card.untitled}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {getHostLabel(link.original_url)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            {link.created_at
                              ? t("linkList.card.createdAgo", {
                                  time: formatDistanceToNow(
                                    new Date(link.created_at),
                                    { locale: dateFnsLocale },
                                  ),
                                })
                              : ""}
                          </span>
                          <span className="max-w-full truncate rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            {link.short_code}
                          </span>
                          {link.usage_context && (
                            <span className="rounded-full border border-orange-200/70 bg-orange-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                              {getLocalizedUsageLabel(link.usage_context)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                            <MousePointer2 size={11} />S {shopeeClicks}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/70 bg-cyan-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
                            <BarChart3 size={11} />T {tiktokClicks}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Sparkles size={11} className="text-orange-500" />
                            {t("linkList.card.totalClicks", {
                              count: totalClicksForLink,
                            })}
                          </span>
                          <span className="rounded-full border border-orange-200/70 bg-orange-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                            {content.card.protected}
                          </span>
                          {flowBadge && (
                            <span className={flowBadge.className}>
                              {flowBadge.label}
                            </span>
                          )}
                          {topSource && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                              {topSource.label} {topSource.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button
                      onClick={() => startEdit(link)}
                      className="inline-flex min-w-24 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                      title={content.card.edit}
                    >
                      <Pencil size={14} />
                      {content.card.editShort}
                    </button>
                    <button
                      onClick={() => setDeletingLink(link)}
                      className="inline-flex min-w-24 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                      title={content.card.delete}
                    >
                      <Trash2 size={14} />
                      {content.card.deleteShort}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          buildPrettyLinkUrl(
                            `https://${link.custom_domain || DEFAULT_OUTPUT_DOMAIN}`,
                            {
                              slug: link.slug,
                              shortCode: link.short_code,
                              title: link.custom_title,
                            },
                          ),
                          linkId,
                        )
                      }
                      className="inline-flex min-w-30 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      {copiedId === linkId ? content.card.copied : content.card.copy}
                    </button>
                    <button
                      onClick={() => setQrLink(link)}
                      className="inline-flex min-w-20 items-center justify-center gap-2 rounded-2xl border border-fuchsia-200/70 bg-fuchsia-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-700 transition-all hover:bg-fuchsia-100 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-200 dark:hover:bg-fuchsia-500/20"
                      title={content.card.qr}
                    >
                      <QrCode size={15} />
                      QR
                    </button>
                    {canShareLinks && (
                      <button
                        onClick={() => startShare(link)}
                        className="inline-flex min-w-24 items-center justify-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                        title={shareContent.action}
                      >
                        <Share2 size={14} />
                        {shareContent.action}
                      </button>
                    )}
                    {showChoiceModeActions && link.secondary_url && (
                      <button
                        onClick={() =>
                          window.open(
                            buildChoiceModeLink(link.short_code),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        className="inline-flex min-w-24 items-center justify-center rounded-2xl border border-amber-200/70 bg-amber-50 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                        title={content.card.choiceLanding}
                      >
                        Choice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
            {listLoadingMore && (
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/70 px-6 py-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Đang tải thêm liên kết...
              </div>
            )}
          </>
        )}
      </div>

      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8 dark:border-slate-700 dark:bg-slate-700/50">
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                {content.editModal.title}
              </h3>
              <button
                onClick={() => setEditingLink(null)}
                className="rounded-full p-2 transition-colors hover:bg-white dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:p-8 lg:grid-cols-2 lg:gap-8">
              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.originalUrl}
                </label>
                <input
                  type="url"
                  value={editForm.original}
                  onChange={(e) =>
                    setEditForm({ ...editForm, original: e.target.value })
                  }
                  placeholder="https://shopee.vn/..."
                  className="w-full rounded-2xl border-2 border-orange-100 bg-orange-50/50 px-6 py-4 text-sm font-bold text-orange-900 outline-none transition-all focus:border-orange-500 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200"
                />
                <p className="px-1 text-[9px] font-medium text-gray-400 dark:text-slate-500">
                  {content.editModal.originalHelp}
                </p>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.thumbnailField}
                </label>
                <input
                  type="text"
                  value={editForm.img}
                  onChange={(e) =>
                    setEditForm({ ...editForm, img: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditForm((current) => {
                    const nextMobileDirectMode = !current.mobileDirectMode;
                    return {
                      ...current,
                      mobileDirectMode: nextMobileDirectMode,
                      video: nextMobileDirectMode ? "" : current.video,
                      secondary: nextMobileDirectMode ? "" : current.secondary,
                      secondaryTargetType: nextMobileDirectMode
                        ? "shopee"
                        : current.secondaryTargetType,
                    };
                  })
                }
                className={`lg:col-span-2 flex w-full items-center justify-between rounded-3xl border px-5 py-4 text-left transition-all ${
                  editForm.mobileDirectMode
                    ? "border-fuchsia-300 bg-fuchsia-50/80 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10"
                    : "border-gray-100 bg-gray-50/80 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-black uppercase tracking-widest ${
                      editForm.mobileDirectMode
                        ? "text-fuchsia-700 dark:text-fuchsia-200"
                        : "text-gray-500 dark:text-slate-300"
                    }`}
                  >
                    {t("createLink.page.mobileDirectModeTitle")}
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium ${
                      editForm.mobileDirectMode
                        ? "text-fuchsia-900/75 dark:text-fuchsia-100/80"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {t("createLink.page.mobileDirectModeDescription")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                    editForm.mobileDirectMode
                      ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-100"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {editForm.mobileDirectMode
                    ? t("createLink.page.mobileDirectModeEnabled")
                    : t("createLink.page.mobileDirectModeDisabled")}
                </span>
              </button>

              {editForm.mobileDirectMode && (
                <div className="lg:col-span-2 rounded-[1.35rem] border border-fuchsia-100 bg-fuchsia-50/70 p-4 text-sm font-medium text-fuchsia-900 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-100">
                  {t("createLink.page.mobileDirectModeNote")}
                </div>
              )}

              {!editForm.mobileDirectMode && (
                <div className="space-y-2 lg:col-span-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.videoField}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  ref={editVideoInputRef}
                  onChange={handleEditVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editVideoInputRef.current?.click()}
                  className="flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-orange-100 bg-orange-50/40 px-5 py-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50/70 dark:border-orange-500/20 dark:bg-orange-500/10 dark:hover:border-orange-400/40"
                >
                  <div className="flex items-center gap-3 font-bold text-orange-500">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                      {isEditVideoUploading ? (
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
                            strokeDashoffset={87.96 - (87.96 * editVideoUploadProgress) / 100}
                          />
                        </svg>
                      ) : (
                        <UploadCloud size={20} />
                      )}
                      {isEditVideoUploading && (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-orange-600">
                          {editVideoUploadProgress > 0
                            ? `${editVideoUploadProgress}%`
                            : "..."}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] uppercase tracking-wider sm:text-xs">
                      {isEditVideoUploading
                        ? editVideoUploadProgress > 0
                          ? "Đang tải video lên..."
                          : "Đang chuẩn bị video..."
                        : editForm.video
                          ? "Thay video khác"
                          : "Tải video mới lên"}
                    </span>
                  </div>
                  {editForm.video && (
                    <div className="rounded-full bg-green-100 p-1">
                      <Check className="text-green-600" size={14} />
                    </div>
                  )}
                </button>
                <p className="px-1 text-[9px] font-medium text-gray-400 dark:text-slate-500">
                  {content.editModal.videoHelp}
                </p>
                {editVideoUploadSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                    <ShieldCheck size={14} />
                    Video đã tải lên thành công!
                  </div>
                )}
                {editForm.video && (
                  <div className="space-y-3 rounded-3xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <video
                      src={editForm.video}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-56 w-full rounded-2xl bg-black object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((current) => ({ ...current, video: "" }))
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 transition-all hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                    >
                      <Trash2 size={14} />
                      {locale === "vi" ? "Xóa video" : "Remove video"}
                    </button>
                  </div>
                )}
              </div>
              )}

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.titleField}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder={content.editModal.titlePlaceholder}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-bold text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {t("createLink.page.shortCodeLabel")}
                </label>
                <input
                  type="text"
                  value={editForm.shortCode}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shortCode: e.target.value })
                  }
                  placeholder={t("createLink.page.shortCodePlaceholder")}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {t("createLink.page.secondaryTargetLabel")}
                </label>
                <select
                  value={editForm.secondaryTargetType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      secondaryTargetType: e.target.value as
                        | "shopee"
                        | "tiktok",
                    })
                  }
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="shopee">
                    {t("createLink.page.secondaryTargetShopee")}
                  </option>
                  <option value="tiktok">
                    {t("createLink.page.secondaryTargetTikTok")}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.secondaryField}
                </label>
                <input
                  type="url"
                  value={editForm.secondary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, secondary: e.target.value })
                  }
                  placeholder={
                    editForm.secondaryTargetType === "tiktok"
                      ? t("createLink.page.secondaryUrlPlaceholderTikTok")
                      : t("createLink.page.secondaryUrlPlaceholderShopee")
                  }
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                />
                <p className="px-1 text-[9px] font-medium text-gray-400 dark:text-slate-500">
                  {editForm.secondaryTargetType === "tiktok"
                    ? t("createLink.page.secondaryUrlHelpTikTokOnly")
                    : t("createLink.page.secondaryUrlHelpShopeeOnly")}
                </p>
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {content.editModal.descriptionField}
                </label>
                <textarea
                  value={editForm.desc}
                  onChange={(e) =>
                    setEditForm({ ...editForm, desc: e.target.value })
                  }
                  placeholder={content.editModal.descriptionPlaceholder}
                  rows={5}
                  className="min-h-32 w-full resize-none rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

            </div>

            <div className="flex gap-4 border-t border-gray-100 bg-gray-50 p-6 md:p-8 dark:border-slate-700 dark:bg-slate-700">
              <button
                onClick={() => setEditingLink(null)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
              >
                {content.editModal.cancel}
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Save size={14} />
                )}
                {content.editModal.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-800">
            <div className="p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm shadow-red-100 dark:bg-red-500/10 dark:shadow-red-900/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="mb-4 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                {content.deleteModal.title}
              </h3>
              <p className="mb-10 px-4 font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                {t("linkList.deleteModal.description", {
                  code: deletingLink.short_code,
                })}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  {content.deleteModal.confirm}
                </button>
                <button
                  onClick={() => setDeletingLink(null)}
                  disabled={isDeleting}
                  className="w-full rounded-2xl bg-gray-100 py-5 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-200 active:scale-95 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  {content.deleteModal.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8 dark:border-slate-700 dark:bg-slate-700/50">
              <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                {content.qrModal.title}
              </h3>
              <button
                onClick={() => setQrLink(null)}
                className="rounded-full p-2 transition-colors hover:bg-white dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center p-10">
              <div className="mb-8 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-xl ring-4 ring-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:ring-slate-700">
                <QRCodeCanvas
                  value={buildPrettyLinkUrl(
                    `https://${qrLink.custom_domain || DEFAULT_OUTPUT_DOMAIN}`,
                    {
                      slug: qrLink.slug,
                      shortCode: qrLink.short_code,
                      title: qrLink.custom_title,
                    },
                  )}
                  size={200}
                  level="H"
                  includeMargin={false}
                  ref={qrCanvasRef}
                />
              </div>
              <div className="mb-10 text-center">
                <p className="mb-1 text-lg font-black tracking-tight text-gray-900 dark:text-slate-100">
                  {qrLink.short_code}
                </p>
                <p className="inline-block rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-purple-600 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-200">
                  {content.qrModal.hint}
                </p>
              </div>
              <button
                onClick={() => {
                  const canvas = qrCanvasRef.current;
                  if (canvas) {
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `qrcode-${qrLink.short_code}.png`;
                    link.href = url;
                    link.click();
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-purple-600 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-100 transition-all hover:bg-purple-700 active:scale-95"
              >
                <Save size={18} /> {content.qrModal.download}
              </button>
            </div>
          </div>
        </div>
      )}

      {sharingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-8 dark:border-slate-700 dark:bg-slate-700/50">
              <div>
                <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                  {shareContent.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-500 dark:text-slate-400">
                  {shareContent.description}
                </p>
              </div>
              <button
                onClick={() => {
                  if (isSharing) return;
                  setSharingLink(null);
                  setShareWorkspaceId("");
                }}
                className="rounded-full p-2 transition-colors hover:bg-white dark:text-slate-300 dark:hover:bg-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  {shareContent.linkLabel}
                </p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {sharingLink.custom_title || content.card.untitled}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {sharingLink.short_code}
                </p>
              </div>

              <div className="space-y-2">
                <label className="pl-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {shareContent.workspaceLabel}
                </label>
                <select
                  value={shareWorkspaceId}
                  onChange={(e) => setShareWorkspaceId(e.target.value)}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-500 dark:bg-slate-700 dark:text-slate-100"
                >
                  {writableTargetWorkspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 border-t border-gray-100 bg-gray-50 p-6 md:p-8 dark:border-slate-700 dark:bg-slate-700">
              <button
                onClick={() => {
                  if (isSharing) return;
                  setSharingLink(null);
                  setShareWorkspaceId("");
                }}
                className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
              >
                {shareContent.cancel}
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !shareWorkspaceId}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSharing ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Share2 size={14} />
                )}
                {isSharing ? shareContent.submitting : shareContent.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[3rem] bg-white shadow-2xl dark:bg-slate-800">
            <div className="p-10 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm shadow-red-100 dark:bg-red-500/10 dark:shadow-red-900/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="mb-4 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">
                {t("linkList.bulk.confirmTitle", { count: selectedIds.size })}
              </h3>
              <p className="mb-10 px-4 font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                {t("linkList.bulk.confirmDescription", {
                  count: selectedIds.size,
                })}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  {t("linkList.bulk.confirmAction", { count: selectedIds.size })}
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={bulkDeleting}
                  className="w-full rounded-2xl bg-gray-100 py-5 text-[11px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-gray-200 active:scale-95 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  {content.bulk.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

