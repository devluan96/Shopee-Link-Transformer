import React from "react";
import {
  AlertTriangle,
  Copy,
  CheckSquare,
  FileImage,
  FileText,
  Music2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Square,
  Video,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, vi as dateFnsVi } from "date-fns/locale";
import { toast } from "sonner";
import { useLocale } from "@/src/hooks/useLocale";
import type { ConvertedLink } from "@/src/types";
import { VideoThumbnail } from "@/src/components/library/VideoThumbnail";
import { MediaConfirmDialog } from "@/src/components/library/MediaConfirmDialog";

type MediaResourceType = "all" | "image" | "video" | "audio";

interface MediaAsset {
  path: string;
  url: string;
  provider: "r2" | "cloudinary" | "supabase";
  resourceType: "image" | "video" | "audio";
  folderName: string;
  tags: string[];
  fileName: string;
  sizeBytes: number;
  modifiedAt: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

interface MediaLibraryResponse {
  resourceType: MediaResourceType;
  assets: MediaAsset[];
  error?: string;
}

interface MediaLibraryProps {
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  links: ConvertedLink[];
  currentWorkspaceId?: string | null;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const getTypeIcon = (type: MediaAsset["resourceType"]) => {
  switch (type) {
    case "video":
      return Video;
    case "audio":
      return Music2;
    default:
      return FileImage;
  }
};

const getAccentClass = (type: MediaAsset["resourceType"]) => {
  switch (type) {
    case "video":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200";
    case "audio":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200";
    default:
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200";
  }
};

const normalizeFolderName = (value: string) =>
  value
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .toLowerCase() || "root";

const normalizeMediaAsset = (asset: MediaAsset): MediaAsset => {
  const modifiedAt = new Date(asset.modifiedAt);
  return {
    ...asset,
    provider: asset.provider,
    folderName: normalizeFolderName(asset.folderName || "root"),
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    modifiedAt: Number.isNaN(modifiedAt.getTime())
      ? new Date().toISOString()
      : modifiedAt.toISOString(),
  };
};

const normalizeMediaUrlForGrouping = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.hostname.includes("cloudinary.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const uploadIndex = segments.findIndex((segment) => segment === "upload");
      if (uploadIndex >= 0) {
        const afterUpload = segments.slice(uploadIndex + 1);
        const versionIndex = afterUpload.findIndex((segment) =>
          /^v\d+$/.test(segment),
        );
        const canonicalSegments =
          versionIndex >= 0
            ? afterUpload.slice(versionIndex + 1)
            : afterUpload;
        if (canonicalSegments.length > 0) {
          return `cloudinary:${canonicalSegments.join("/")}`.toLowerCase();
        }
      }
    }

    return `${parsed.pathname.replace(/\/+/g, "/")}${parsed.search}${parsed.hash}`.toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/\/+/g, "/")
      .split("#")[0]
      .split("?")[0]
      .toLowerCase();
  }
};

const inferProviderFromUrl = (value: string): MediaAsset["provider"] => {
  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.hostname.includes("cloudinary.com")) {
      return "cloudinary";
    }
    if (parsed.pathname.includes("/storage/v1/object/public/")) {
      return "supabase";
    }
  } catch {}

  return value.includes("cloudinary.com") ? "cloudinary" : "supabase";
};

const inferResourceTypeFromField = (
  field:
    | "custom_image_url"
    | "video_url"
    | "ab_variant_b_image_url"
    | "ab_variant_b_video_url",
): MediaAsset["resourceType"] =>
  field.toLowerCase().includes("video") ? "video" : "image";

const getFileNameFromUrl = (value: string) => {
  try {
    const parsed = new URL(value, "http://localhost");
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop();
    if (lastSegment) {
      return decodeURIComponent(lastSegment);
    }
  } catch {}

  const fallback = value.split("?")[0].split("#")[0].split("/").pop();
  return fallback || "upload.bin";
};

const buildDerivedAssetsFromLinks = (
  sourceLinks: ConvertedLink[],
): MediaAsset[] => {
  const derived: MediaAsset[] = [];

  for (const link of sourceLinks) {
    const linkIdentity = getLinkIdentityKey(link) || link.short_code || link.slug || "";
    const baseMetadata = {
      link_id: link.id || undefined,
      link_short_code: link.short_code || undefined,
      link_slug: link.slug || undefined,
      source: "link-fallback",
    } as Record<string, unknown>;

    const mediaEntries: Array<
      [
        | "custom_image_url"
        | "video_url"
        | "ab_variant_b_image_url"
        | "ab_variant_b_video_url",
        string | undefined,
      ]
    > = [
      ["custom_image_url", link.custom_image_url],
      ["video_url", link.video_url],
      ["ab_variant_b_image_url", link.ab_variant_b_image_url],
      ["ab_variant_b_video_url", link.ab_variant_b_video_url],
    ];

    for (const [field, value] of mediaEntries) {
      const url = value?.trim();
      if (!url) continue;

      const resourceType = inferResourceTypeFromField(field);
      derived.push({
        path: normalizeMediaUrlForGrouping(url) || `${linkIdentity}:${field}`,
        url,
        provider: inferProviderFromUrl(url),
        resourceType,
        folderName: normalizeFolderName(link.folder_name || "root"),
        tags: Array.isArray(link.tags) ? [...link.tags] : [],
        fileName: getFileNameFromUrl(url),
        sizeBytes: 0,
        modifiedAt: link.created_at,
        mimeType: resourceType === "video" ? "video/mp4" : "image/jpeg",
        metadata: baseMetadata,
      });
    }
  }

  return derived;
};

const formatMediaUpdatedAt = (value: string, isVi: boolean) => {
  const modifiedAt = new Date(value);
  if (Number.isNaN(modifiedAt.getTime())) {
    return isVi ? "Vừa cập nhật" : "Recently updated";
  }

  return formatDistanceToNow(modifiedAt, {
    addSuffix: true,
    locale: isVi ? dateFnsVi : enUS,
  });
};

type LinkedMediaGroup = {
  key: string;
  title: string;
  subtitle: string;
  count: number;
  links: ConvertedLink[];
  assets: MediaAsset[];
};

const RECENT_LINK_WINDOW_DAYS = 7;
const RECENT_LINK_WINDOW_MS =
  RECENT_LINK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const LINK_GROUP_BATCH_SIZE = 4;

const getLinkIdentityKey = (link: ConvertedLink) =>
  (link.id || link.short_code || link.slug || "").trim().toLowerCase();

const isWithinRecentLinkWindow = (value: string) => {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  return Date.now() - createdAt.getTime() <= RECENT_LINK_WINDOW_MS;
};

export function MediaLibrary({
  fetchWithAuth,
  links,
  currentWorkspaceId,
}: MediaLibraryProps) {
  const { locale, t } = useLocale();
  const isVi = locale === "vi";
  const libraryText = React.useMemo(
    () =>
      isVi
        ? {
            title: "Thư viện media",
            searchPlaceholder: "Tìm theo tên file, đường dẫn, loại file hoặc MIME type...",
            refresh: "Làm mới",
            errorTitle: "Không thể tải thư viện media",
            emptyTitle: "Chưa có file media nào",
            emptyBody:
              "Hãy tải lên ảnh, video hoặc audio trước. File từ R2, Cloudinary hoặc Supabase sẽ tự động hiển thị tại đây.",
            copy: "Sao chép URL",
            deleting: "Đang xóa...",
            delete: "Xóa",
            filters: {
              all: "Tất cả",
              images: "Ảnh",
              videos: "Video",
              audio: "Audio",
            },
            stats: {
              files: "File",
              images: "Ảnh",
              videos: "Video",
              size: "Tổng dung lượng",
            },
          }
        : {
            title: "Media library",
            searchPlaceholder:
              "Search by file name, path, file type or MIME type...",
            refresh: "Refresh",
            errorTitle: "Unable to load media library",
            emptyTitle: "No media files yet",
            emptyBody:
              "Upload an image, video, or audio file first. Files from R2, Cloudinary, or Supabase will appear here automatically.",
            copy: "Copy URL",
            deleting: "Deleting...",
            delete: "Delete",
            filters: {
              all: "All",
              images: "Images",
              videos: "Videos",
              audio: "Audio",
            },
            stats: {
              files: "Files",
              images: "Images",
              videos: "Videos",
              size: "Total size",
            },
          },
    [isVi],
  );
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [libraryLinks, setLibraryLinks] = React.useState<ConvertedLink[]>(links);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [resourceType, setResourceType] =
    React.useState<MediaResourceType>("all");
  const [selectedPaths, setSelectedPaths] = React.useState<string[]>([]);
  const [brokenAssetPaths, setBrokenAssetPaths] = React.useState<string[]>([]);
  const [deletingPath, setDeletingPath] = React.useState<string | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] =
    React.useState<MediaAsset | null>(null);
  const [deleteSelectionConfirmOpen, setDeleteSelectionConfirmOpen] =
    React.useState(false);
  const [confirmBusy, setConfirmBusy] = React.useState(false);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [linksLoading, setLinksLoading] = React.useState(true);
  const [visibleAssetCount, setVisibleAssetCount] = React.useState(
    LINK_GROUP_BATCH_SIZE,
  );
  const [hasUserScrolled, setHasUserScrolled] = React.useState(false);
  const loadMoreTriggerRef = React.useRef<HTMLDivElement | null>(null);

  const loadLibrary = React.useCallback(
    async (nextResourceType: MediaResourceType = resourceType) => {
      setError(null);
      setRefreshing(true);
      setBrokenAssetPaths([]);
      const fallbackAssets = buildDerivedAssetsFromLinks(libraryLinks);

      try {
        const response = await fetchWithAuth(
          `/api/v1/media/library?resourceType=${encodeURIComponent(nextResourceType)}`,
        );
        const responseText = await response.text();
        let payload: MediaLibraryResponse | null = null;

        if (responseText) {
          try {
            payload = JSON.parse(responseText) as MediaLibraryResponse;
          } catch {
            payload = null;
          }
        }

        if (!response.ok) {
          if (response.status === 404) {
            setAssets(fallbackAssets);
            setError(null);
            return;
          }

          const fallbackMessage = "Unable to load media library";
          throw new Error(payload?.error || fallbackMessage);
        }

        const nextAssets = (payload?.assets || []).map((asset) =>
          normalizeMediaAsset(asset),
        );
        if (!nextAssets.length) {
          if (fallbackAssets.length > 0) {
            setAssets(fallbackAssets);
          } else {
            setAssets(nextAssets);
          }
        } else {
          setAssets(nextAssets);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unknown error";
        setError(message);
        setAssets([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchWithAuth, libraryLinks, resourceType],
  );

  React.useEffect(() => {
    void loadLibrary(resourceType);
  }, [loadLibrary, resourceType]);

  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, []);

  React.useEffect(() => {
    setLibraryLinks(links);
  }, [links]);

  React.useEffect(() => {
    let cancelled = false;

    const loadAllLinks = async () => {
      setLinksLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("sort", "newest");

        const response = await fetchWithAuth(
          `/api/v1/user/links?${params.toString()}`,
        );
        const payload = (await response.json().catch(() => null)) as
          | ConvertedLink[]
          | { items?: ConvertedLink[] }
          | null;

        if (!response.ok) {
          throw new Error("Unable to load link references");
        }

        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        if (!cancelled && items.length > 0) {
          setLibraryLinks(items);
        } else if (!cancelled) {
          setLibraryLinks(links);
        }
      } catch {
        if (!cancelled) {
          setLibraryLinks(links);
        }
      } finally {
        if (!cancelled) {
          setLinksLoading(false);
        }
      }
    };

    void loadAllLinks();

    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, links]);

  const filteredAssets = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return assets.filter((asset) => {
      if (resourceType !== "all" && asset.resourceType !== resourceType) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [
        asset.fileName,
        asset.path,
        asset.mimeType,
        asset.url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [assets, query, resourceType]);

  const handleRefreshLibrary = React.useCallback(() => {
    void loadLibrary(resourceType);
  }, [loadLibrary, resourceType]);

  const clearSelection = React.useCallback(() => {
    setSelectedPaths([]);
  }, []);

  React.useEffect(() => {
    clearSelection();
  }, [clearSelection, resourceType]);

  const markBrokenAsset = React.useCallback((path: string) => {
    setBrokenAssetPaths((current) =>
      current.includes(path) ? current : [...current, path],
    );
  }, []);

  const selectedAssets = React.useMemo(
    () => assets.filter((asset) => selectedPaths.includes(asset.path)),
    [assets, selectedPaths],
  );

  const selectedCount = selectedAssets.length;

  const toggleSelection = (path: string) => {
    setSelectedPaths((current) =>
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path],
    );
  };

  const toggleGroupSelection = (groupAssets: MediaAsset[]) => {
    setSelectedPaths((current) => {
      const groupPaths = groupAssets.map((asset) => asset.path);
      const allSelected = groupPaths.every((path) => current.includes(path));
      if (allSelected) {
        return current.filter((path) => !groupPaths.includes(path));
      }

      return Array.from(new Set([...current, ...groupPaths]));
    });
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        isVi ? "Đã sao chép URL media." : "Media URL copied to clipboard.",
      );
    } catch {
      toast.error(isVi ? "Không thể sao chép URL." : "Unable to copy URL.");
    }
  };

  const handleDelete = (asset: MediaAsset) => {
    setDeleteConfirmAsset(asset);
  };

  const handleDeleteSelected = () => {
    if (!selectedAssets.length) return;
    setDeleteSelectionConfirmOpen(true);
  };

  const executeDeleteAsset = async () => {
    if (!deleteConfirmAsset) return;

    const asset = deleteConfirmAsset;
    setConfirmBusy(true);
    setDeletingPath(asset.path);
    try {
      const response = await fetchWithAuth("/api/v1/media/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: asset.path,
          provider: asset.provider,
          url: asset.url,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete media file");
      }

      toast.success(
        isVi ? "Đã xóa media khỏi thư viện." : "Media deleted from library.",
      );
      setAssets((current) =>
        current.filter((item) => item.path !== asset.path),
      );
      setDeleteConfirmAsset(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
    } finally {
      setDeletingPath(null);
      setConfirmBusy(false);
    }
  };

  const executeDeleteSelectedAssets = async () => {
    if (!selectedAssets.length) return;

    setBulkDeleting(true);
    setConfirmBusy(true);
    try {
      for (const asset of selectedAssets) {
        const response = await fetchWithAuth("/api/v1/media/library", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: asset.path,
            provider: asset.provider,
            url: asset.url,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || `Unable to delete ${asset.fileName}`);
        }
      }

      toast.success(
        isVi
          ? `Đã xóa ${selectedAssets.length} file khỏi thư viện.`
          : `Deleted ${selectedAssets.length} files from the library.`,
      );
      setAssets((current) =>
        current.filter((item) => !selectedPaths.includes(item.path)),
      );
      clearSelection();
      setDeleteSelectionConfirmOpen(false);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Delete failed",
      );
    } finally {
      setBulkDeleting(false);
      setConfirmBusy(false);
    }
  };

  const filterTabs: Array<{ value: MediaResourceType; label: string }> = [
    { value: "all", label: libraryText.filters.all },
    { value: "image", label: libraryText.filters.images },
    { value: "video", label: libraryText.filters.videos },
    { value: "audio", label: libraryText.filters.audio },
  ];
  const recentLibraryLinks = React.useMemo(
    () => libraryLinks.filter((link) => isWithinRecentLinkWindow(link.created_at)),
    [libraryLinks],
  );
  const recentLibraryLinkKeys = React.useMemo(
    () => new Set(recentLibraryLinks.map(getLinkIdentityKey).filter(Boolean)),
    [recentLibraryLinks],
  );
  const derivedAssetsFromLinks = React.useMemo(
    () => buildDerivedAssetsFromLinks(recentLibraryLinks),
    [recentLibraryLinks],
  );
  const brokenAssetPathSet = React.useMemo(
    () => new Set(brokenAssetPaths),
    [brokenAssetPaths],
  );

  const isRenderableMediaAsset = React.useCallback(
    (asset: MediaAsset) =>
      Boolean(asset.url.trim()) && !brokenAssetPathSet.has(asset.path),
    [brokenAssetPathSet],
  );

  React.useEffect(() => {
    if (!brokenAssetPaths.length) return;

    setSelectedPaths((current) =>
      current.filter((path) => !brokenAssetPathSet.has(path)),
    );
  }, [brokenAssetPathSet, brokenAssetPaths.length]);

  const renderedAssets = React.useMemo(
    () => filteredAssets.filter(isRenderableMediaAsset),
    [filteredAssets, isRenderableMediaAsset],
  );

  const linkedGroups = React.useMemo(() => {
    const mediaUrlToLinks = new Map<string, ConvertedLink[]>();
    const linkById = new Map(
      libraryLinks
        .filter((link): link is ConvertedLink & { id: string } => Boolean(link.id))
        .map((link) => [link.id, link] as const),
    );

    const collectLinkUrls = (link: ConvertedLink) =>
      [
        link.custom_image_url,
        link.video_url,
        link.ab_variant_b_image_url,
        link.ab_variant_b_video_url,
      ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    const appendLinkForUrl = (url: string, link: ConvertedLink) => {
      const key = normalizeMediaUrlForGrouping(url);
      if (!key) return;
      const current = mediaUrlToLinks.get(key) || [];
      if (current.some((item) => item.id === link.id)) {
        return;
      }
      mediaUrlToLinks.set(key, [...current, link]);
    };

    const readAssetLinkedLink = (asset: MediaAsset) => {
      const metadata =
        asset.metadata && typeof asset.metadata === "object"
          ? asset.metadata
          : null;

      const linkId =
        typeof metadata?.link_id === "string"
          ? metadata.link_id.trim()
          : "";
      if (linkId && linkById.has(linkId)) {
        return [linkById.get(linkId)!];
      }

      const linkShortCode =
        typeof metadata?.link_short_code === "string"
          ? metadata.link_short_code.trim()
          : "";
      if (linkShortCode) {
        const matchedByShortCode = libraryLinks.filter((link) =>
          [link.short_code, link.slug]
            .filter(Boolean)
            .some((value) => value?.toLowerCase() === linkShortCode.toLowerCase()),
        );
        if (matchedByShortCode.length > 0) {
          return matchedByShortCode;
        }
      }

      return mediaUrlToLinks.get(normalizeMediaUrlForGrouping(asset.url)) || [];
    };

    for (const link of libraryLinks) {
      if (!link.id) continue;
      for (const url of collectLinkUrls(link)) {
        appendLinkForUrl(url, link);
      }
    }

    const groupsByKey = new Map<string, LinkedMediaGroup>();
    const ungrouped: MediaAsset[] = [];

    for (const asset of filteredAssets) {
      const matchedLinks = readAssetLinkedLink(asset);
      if (!matchedLinks.length) {
        ungrouped.push(asset);
        continue;
      }

      const recentMatchedLinks = matchedLinks.filter((link) =>
        recentLibraryLinkKeys.has(getLinkIdentityKey(link)),
      );
      if (!recentMatchedLinks.length) {
        continue;
      }

      const primaryLink = recentMatchedLinks[0];
      const key = primaryLink.id || primaryLink.short_code || asset.path;
      const existingGroup = groupsByKey.get(key);
      const nextLinks = existingGroup
        ? existingGroup.links
        : recentMatchedLinks;

      groupsByKey.set(key, {
        key,
        title:
          primaryLink.custom_title?.trim() ||
          primaryLink.short_code ||
          (isVi ? "Liên kết" : "Link"),
        subtitle:
          primaryLink.short_code ||
          primaryLink.original_url ||
          (primaryLink.id || key),
        count: (existingGroup?.count || 0) + 1,
        links: nextLinks,
        assets: [...(existingGroup?.assets || []), asset],
      });
    }

    const groups = Array.from(groupsByKey.values()).sort(
      (a, b) => b.count - a.count || a.title.localeCompare(b.title),
    );

    return { groups, ungrouped };
  }, [filteredAssets, isVi, libraryLinks, recentLibraryLinkKeys]);
  React.useEffect(() => {
    setVisibleAssetCount(
      Math.min(LINK_GROUP_BATCH_SIZE, renderedAssets.length || LINK_GROUP_BATCH_SIZE),
    );
  }, [query, renderedAssets.length, resourceType]);

  React.useEffect(() => {
    if (loading || refreshing || error) return;
    if (assets.length > 0) return;
    if (!derivedAssetsFromLinks.length) return;

    setAssets(derivedAssetsFromLinks);
  }, [assets.length, derivedAssetsFromLinks, error, loading, refreshing]);

  const visibleAssets = React.useMemo(
    () => renderedAssets.slice(0, visibleAssetCount),
    [renderedAssets, visibleAssetCount],
  );
  const isInitialLibraryLoading =
    loading ||
    linksLoading ||
    (!error && assets.length === 0 && derivedAssetsFromLinks.length > 0);
  const loadMoreAssets = React.useCallback(() => {
    setVisibleAssetCount((current) =>
      Math.min(current + LINK_GROUP_BATCH_SIZE, renderedAssets.length),
    );
  }, [renderedAssets.length]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasUserScrolled(true);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;
      if (window.scrollY > 0) {
        setHasUserScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  React.useEffect(() => {
    if (!hasUserScrolled) return;
    if (visibleAssetCount >= renderedAssets.length) return;

    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || cancelled) return;
        loadMoreAssets();
      },
      {
        root: null,
        rootMargin: "0px 0px 768px 0px",
        threshold: 0,
      },
    );

    observer.observe(trigger);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [hasUserScrolled, loadMoreAssets, renderedAssets.length, visibleAssetCount]);

  const totalBytes = React.useMemo(
    () => renderedAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0),
    [renderedAssets],
  );

  const counts = React.useMemo(
    () => ({
      image: renderedAssets.filter((asset) => asset.resourceType === "image").length,
      video: renderedAssets.filter((asset) => asset.resourceType === "video").length,
      audio: renderedAssets.filter((asset) => asset.resourceType === "audio").length,
    }),
    [renderedAssets],
  );

  const renderCheckbox = (asset: MediaAsset) => {
    const isSelected = selectedPaths.includes(asset.path);
    return (
      <button
        type="button"
        aria-label={isSelected ? "Bỏ chọn media" : "Chọn media"}
        aria-pressed={isSelected}
        onClick={() => toggleSelection(asset.path)}
        className={[
          "absolute left-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition",
          isSelected
            ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/25"
            : "border-gray-300/80 bg-slate-900/60 text-white hover:border-orange-400 hover:bg-slate-900/80",
        ].join(" ")}
      >
        {isSelected ? <CheckSquare size={18} className="text-white" /> : <Square size={18} />}
      </button>
    );
  };

  const renderMediaCard = (asset: MediaAsset) => {
    const Icon = getTypeIcon(asset.resourceType);
    const accentClass = getAccentClass(asset.resourceType);
    return (
      <article
        key={asset.path}
        className={[
          "group overflow-hidden rounded-[1.35rem] border border-gray-100 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900",
          "w-full",
        ].join(" ")}
      >
        {renderCheckbox(asset)}
        <div className="relative aspect-[16/9] bg-gray-100 dark:bg-slate-800">
          {asset.resourceType === "image" ? (
            <img
              src={asset.url}
              alt={asset.fileName}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => markBrokenAsset(asset.path)}
            />
          ) : asset.resourceType === "video" ? (
            <div className="relative h-full w-full">
              <VideoThumbnail
                src={asset.url}
                alt={asset.fileName}
                className="h-full w-full object-cover"
                onError={() => markBrokenAsset(asset.path)}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_60%)]">
              <Music2 size={48} className="text-gray-300" />
            </div>
          )}

          <div className="absolute left-14 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] backdrop-blur-md">
            <Icon size={12} />
            {asset.resourceType}
          </div>

        </div>

        <div className="space-y-2 p-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                title={asset.fileName}
                className="truncate text-[11px] font-black leading-4 tracking-tight text-gray-900 dark:text-white"
              >
                {asset.fileName}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${accentClass}`}
            >
              {asset.sizeBytes > 0 ? formatBytes(asset.sizeBytes) : "—"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => void copyUrl(asset.url)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Copy size={13} />
                {libraryText.copy}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(asset)}
              disabled={deletingPath === asset.path}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
            >
              <Trash2 size={13} />
              {deletingPath === asset.path
                ? libraryText.deleting
                : libraryText.delete}
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(6,182,212,0.08),_transparent_32%)]" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
                <UploadCloud size={12} />
                {isVi ? "Thư viện media" : "Media library"}
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {libraryText.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-slate-400">
                {isVi
                  ? "Xem lại tất cả file đã tải lên từ tài khoản của bạn, sao chép URL công khai và xóa những file không còn cần thiết."
                  : "Browse the files uploaded from your account, copy public URLs, and delete files you no longer need."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {libraryText.stats.files}
                </div>
                <div className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                  {filteredAssets.length}
                </div>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {libraryText.stats.images}
                </div>
                <div className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                  {counts.image}
                </div>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {libraryText.stats.videos}
                </div>
                <div className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                  {counts.video}
                </div>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {libraryText.stats.size}
                </div>
                <div className="mt-1 text-xl font-black text-gray-900 dark:text-white">
                  {formatBytes(totalBytes)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={libraryText.searchPlaceholder}
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-11 pr-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => {
                const active = resourceType === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setResourceType(tab.value)}
                    className={[
                      "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
                      active
                        ? "bg-gray-900 text-white shadow-lg shadow-gray-200 dark:bg-white dark:text-gray-900 dark:shadow-black/30"
                        : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleRefreshLibrary}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-orange-100 transition-all hover:bg-orange-700 disabled:opacity-60"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {libraryText.refresh}
            </button>
          </div>

          {selectedCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <div className="font-semibold">
                {isVi
                  ? `Đã chọn ${selectedCount} file`
                  : `${selectedCount} files selected`}
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {isVi ? "Bỏ chọn" : "Clear"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={!selectedCount}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                >
                  {isVi ? "Xóa đã chọn" : "Delete selected"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            {isInitialLibraryLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-72 animate-pulse rounded-[2rem] border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/80"
                    />
                  ))}
              </div>
            ) : error ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                <div className="flex items-center gap-2 font-black">
                  <AlertTriangle size={18} />
                  {libraryText.errorTitle}
                </div>
                <p className="mt-2 text-sm font-medium leading-6">{error}</p>
              </div>
            ) : renderedAssets.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-gray-400 shadow-sm dark:bg-slate-800">
                  <FileText size={28} />
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight text-gray-900 dark:text-white">
                  {libraryText.emptyTitle}
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 dark:text-slate-400">
                  {libraryText.emptyBody}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleAssets.map((asset) => renderMediaCard(asset))}
                </div>

                {visibleAssetCount < renderedAssets.length ? (
                  <div ref={loadMoreTriggerRef} className="h-1 w-full" />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaConfirmDialog
        open={Boolean(deleteConfirmAsset)}
        title={
          isVi ? "Xác nhận xóa media" : "Confirm media deletion"
        }
        description={
          deleteConfirmAsset
            ? isVi
              ? `Bạn có chắc muốn xóa "${deleteConfirmAsset.fileName}" khỏi thư viện không? Hành động này không thể hoàn tác.`
              : `Delete "${deleteConfirmAsset.fileName}" from the library? This cannot be undone.`
            : ""
        }
        confirmLabel={isVi ? "Xóa media" : "Delete media"}
        cancelLabel={isVi ? "Hủy" : "Cancel"}
        busy={confirmBusy}
        onCancel={() => setDeleteConfirmAsset(null)}
        onConfirm={executeDeleteAsset}
      />
      <MediaConfirmDialog
        open={deleteSelectionConfirmOpen}
        title={
          isVi ? "Xác nhận xóa nhiều file" : "Confirm bulk deletion"
        }
        description={
          isVi
            ? `Bạn có chắc muốn xóa ${selectedCount} file đã chọn khỏi thư viện không? Hành động này không thể hoàn tác.`
            : `Delete ${selectedCount} selected files from the library? This cannot be undone.`
        }
        confirmLabel={isVi ? "Xóa đã chọn" : "Delete selected"}
        cancelLabel={isVi ? "Hủy" : "Cancel"}
        busy={confirmBusy || bulkDeleting}
        onCancel={() => setDeleteSelectionConfirmOpen(false)}
        onConfirm={executeDeleteSelectedAssets}
      />
    </div>
  );
}
