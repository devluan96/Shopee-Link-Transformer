import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
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
import { cn, normalizeVietnameseSlug } from "@/src/lib/utils";

const MAX_SHORT_CODE_LENGTH = 50;
const SHOPEE_HOST_REGEX = /(^|\.)shopee\.[a-z.]+$/i;

type FormField =
  | "url"
  | "customTitle"
  | "customDescription"
  | "customShortCode"
  | "usageContext"
  | "customImageUrl"
  | "videoUrl"
  | "secondaryUrl"
  | "redirectDelayMs";

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
  customImageUrl: string;
  setCustomImageUrl: (v: string) => void;
  secondaryUrl: string;
  setSecondaryUrl: (v: string) => void;
  redirectDelayMs: number;
  setRedirectDelayMs: (v: number) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  uploadingVideo: boolean;
  videoUploadProgress: number;
  videoUploadSuccess: boolean;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConvert: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  setError: (v: string | null) => void;
  result: any;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string;
}

const usageOptions = [
  { value: "", label: "Chọn vị trí sử dụng" },
  { value: "Bài viết Facebook", label: "Bài viết Facebook" },
  { value: "Reel Facebook", label: "Reel Facebook" },
  { value: "Bio TikTok", label: "Bio TikTok" },
  { value: "Video TikTok", label: "Video TikTok" },
  { value: "Zalo OA", label: "Zalo OA" },
  { value: "Nhóm seeding", label: "Nhóm seeding" },
  { value: "Livestream", label: "Livestream" },
];

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
  customImageUrl,
  setCustomImageUrl,
  secondaryUrl,
  setSecondaryUrl,
  redirectDelayMs,
  setRedirectDelayMs,
  videoUrl,
  setVideoUrl,
  uploadingVideo,
  videoUploadProgress,
  videoUploadSuccess,
  videoInputRef,
  handleVideoUpload,
  handleConvert,
  loading,
  error,
  setError,
  result,
  copyToClipboard,
  copiedId,
}: CreateLinkProps) => {
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<FormField, string>>
  >({});
  const [videoPreviewOrientation, setVideoPreviewOrientation] = React.useState<
    "landscape" | "portrait" | "square"
  >("landscape");
  const redirectDelaySeconds = Math.max(
    1,
    Math.min(10, Math.round(redirectDelayMs / 1000)),
  );

  const normalizedShortCodePreview = customShortCode
    ? normalizeVietnameseSlug(customShortCode)
    : "";
  const uploadProgressOffset = 87.96 - (87.96 * videoUploadProgress) / 100;

  React.useEffect(() => {
    if (customImageUrl.trim() || videoUrl.trim()) {
      clearFieldError("customImageUrl");
      clearFieldError("videoUrl");
    }
  }, [customImageUrl, videoUrl]);

  const clearFieldError = (field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

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
      nextErrors.url = "Vui lòng nhập link Shopee gốc.";
    } else if (!isValidShopeeUrl(url)) {
      nextErrors.url = "Link Shopee gốc phải là domain Shopee hợp lệ.";
    }

    if (!customTitle.trim()) {
      nextErrors.customTitle = "Vui lòng nhập tiêu đề hiển thị.";
    }

    if (!customDescription.trim()) {
      nextErrors.customDescription = "Vui lòng nhập mô tả bài viết.";
    }

    if (!usageContext.trim()) {
      nextErrors.usageContext = "Vui lòng chọn vị trí sử dụng.";
    }

    if (!customImageUrl.trim() && !videoUrl.trim()) {
      nextErrors.customImageUrl =
        "Vui lòng nhập Thumbnail URL hoặc tải lên video.";
      nextErrors.videoUrl = "Vui lòng tải lên video hoặc nhập Thumbnail URL.";
    }

    if (customShortCode.trim()) {
      const normalizedShortCode = normalizeVietnameseSlug(customShortCode);
      if (normalizedShortCode.length < 3) {
        nextErrors.customShortCode = "Mã rút gọn phải có ít nhất 3 ký tự.";
      } else if (normalizedShortCode.length > MAX_SHORT_CODE_LENGTH) {
        nextErrors.customShortCode = `Mã rút gọn không được vượt quá ${MAX_SHORT_CODE_LENGTH} ký tự.`;
      }
    }

    if (secondaryUrl.trim() && !isValidShopeeUrl(secondaryUrl)) {
      nextErrors.secondaryUrl = "Link Shopee phụ phải là domain Shopee hợp lệ.";
    } else if (
      secondaryUrl.trim() &&
      url.trim() &&
      isValidShopeeUrl(url) &&
      getShopeeHostname(url) !== getShopeeHostname(secondaryUrl)
    ) {
      nextErrors.secondaryUrl =
        "Link Shopee phụ phải cùng domain Shopee với link Shopee gốc để bật flow 2 bước.";
    }

    if (
      !Number.isFinite(redirectDelayMs) ||
      redirectDelayMs < 1000 ||
      redirectDelayMs > 10000
    ) {
      nextErrors.redirectDelayMs = "Delay phải nằm trong khoảng 1 đến 10 giây.";
    }

    return nextErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    const nextErrors = validateForm();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      e.preventDefault();
      const firstErrorField = Object.keys(nextErrors)[0];
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

  return (
    <div key="create">
      <header className="mb-8 md:mb-12">
        <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
          Tạo Landing Page Mới
        </h2>
        <p className="font-medium italic text-gray-500">
          Chúng tôi sẽ tự động lấy dữ liệu và tối ưu hóa hiển thị trên Facebook.
        </p>
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
                  Đóng thông báo
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="relative space-y-6 overflow-hidden rounded-[2rem] border border-gray-100 bg-white/95 p-5 shadow-2xl backdrop-blur-xl sm:space-y-8 sm:rounded-[3rem] sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-orange-600/5 blur-3xl" />

            <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  Thiết lập link
                </p>
                <h3 className="max-w-[12rem] text-3xl font-black leading-none tracking-tight text-gray-900 sm:max-w-none sm:text-2xl sm:leading-tight">
                  Rút gọn link Shopee
                </h3>
              </div>
              <button
                type="submit"
                disabled={loading || uploadingVideo}
                className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-linear-to-r from-orange-600 to-amber-500 px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-orange-600/40 active:scale-[0.98] disabled:grayscale disabled:opacity-50 sm:w-auto sm:shrink-0 sm:px-7 sm:text-xs"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Rút gọn link <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <Globe size={14} className="text-orange-500" /> Link Shopee gốc
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
                  placeholder="Dán link sản phẩm Shopee..."
                  className={inputClass(
                    "url",
                    "w-full rounded-3xl bg-gray-50 px-6 py-5 font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10",
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100">
                  <ArrowRight size={18} className="text-orange-600" />
                </div>
              </div>
              {renderFieldError("url")}
              <p className="mt-2 px-1 text-[11px] font-medium text-gray-500">
                Chỉ nhận link domain Shopee để giữ flow bọc bảo vệ ổn định.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} className="text-orange-500" /> Tiêu đề tùy
                    chỉnh
                  </label>
                  <input
                    data-field="customTitle"
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      setCustomTitle(e.target.value);
                      clearFieldError("customTitle");
                    }}
                    placeholder="Tiêu đề hiển thị..."
                    className={inputClass(
                      "customTitle",
                      "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium focus:bg-white",
                    )}
                  />
                  {renderFieldError("customTitle")}
                </div>
                <div>
                  <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <Type size={14} className="text-orange-500" /> Mô tả bài
                    viết
                  </label>
                  <input
                    data-field="customDescription"
                    type="text"
                    value={customDescription}
                    onChange={(e) => {
                      setCustomDescription(e.target.value);
                      clearFieldError("customDescription");
                    }}
                    placeholder="Mô tả thu hút lượt click..."
                    className={inputClass(
                      "customDescription",
                      "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium focus:bg-white",
                    )}
                  />
                  {renderFieldError("customDescription")}
                </div>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  <Type size={14} className="text-orange-500" /> Mã rút gọn tùy
                  chỉnh
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
                  placeholder="Ví dụ: toi-yeu-em"
                  className={inputClass(
                    "customShortCode",
                    "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium focus:bg-white",
                  )}
                />
                {renderFieldError("customShortCode")}
                <p className="mt-2 px-1 text-[11px] font-medium text-gray-400">
                  Link sẽ thành:{" "}
                  <span className="font-black text-orange-600">
                    {normalizedShortCodePreview
                      ? `https://hotsnew.click/s/${normalizedShortCodePreview}`
                      : "https://hotsnew.click/s/ma-rut-gon-cua-ban"}
                  </span>
                </p>
                <p className="mt-1 px-1 text-[11px] font-medium text-gray-400">
                  Tối đa {MAX_SHORT_CODE_LENGTH} ký tự.
                </p>
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  <Type size={14} className="text-orange-500" /> Dùng ở đâu
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
                    "w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium text-gray-900 focus:bg-white",
                  )}
                >
                  {usageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {renderFieldError("usageContext")}
              </div>

              <div className="grid grid-cols-1 gap-6 rounded-[1.75rem] border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                <div>
                  <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-amber-700">
                    Bọc bảo vệ 2 bước
                  </p>
                  <p className="text-xs font-medium leading-relaxed text-amber-900/70">
                    Mở link Shopee chính trước, sau đó chuyển tiếp sang link
                    Shopee phụ sau vài giây trên cùng flow bảo vệ.
                  </p>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-amber-800">
                    Chỉ nên dùng khi link gốc và link phụ cùng một nguồn
                    affiliate, và link phụ phải cùng domain Shopee với link gốc.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_11rem]">
                  <div>
                    <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-500">
                      <Globe size={14} className="text-orange-500" /> Link
                      Shopee phụ
                    </label>
                    <input
                      data-field="secondaryUrl"
                      type="url"
                      value={secondaryUrl}
                      onChange={(e) => {
                        setSecondaryUrl(e.target.value);
                        clearFieldError("secondaryUrl");
                      }}
                      placeholder="https://shopee.vn/...."
                      className={inputClass(
                        "secondaryUrl",
                        "w-full rounded-2xl bg-white px-6 py-4 font-medium",
                      )}
                    />
                    {renderFieldError("secondaryUrl")}
                    <p className="mt-2 px-1 text-[11px] font-medium text-gray-500">
                      Bỏ trống nếu chỉ muốn đi 1 link như bình thường. Chỉ hỗ
                      trợ domain Shopee.
                    </p>
                  </div>

                  <div>
                    <label className="mb-3 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-500">
                      <Type size={14} className="text-orange-500" /> Delay
                      (giây)
                    </label>
                    <input
                      data-field="redirectDelayMs"
                      type="number"
                      min={1}
                      max={10}
                      step={1}
                      value={redirectDelaySeconds}
                      onChange={(e) => {
                        setRedirectDelayMs(
                          Number.isFinite(e.target.valueAsNumber)
                            ? e.target.valueAsNumber * 1000
                            : 3000,
                        );
                        clearFieldError("redirectDelayMs");
                      }}
                      className={inputClass(
                        "redirectDelayMs",
                        "w-full rounded-2xl bg-white px-6 py-4 font-medium",
                      )}
                    />
                    {renderFieldError("redirectDelayMs")}
                    <p className="mt-2 px-1 text-[11px] font-medium text-gray-500">
                      Khuyên dùng 3 giây.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
                <div className="flex flex-col space-y-4">
                  <label className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                    <VideoIcon size={14} className="text-orange-500" /> Đính kèm
                    video (tùy chọn)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    ref={(el) => {
                      if (videoInputRef) (videoInputRef as any).current = el;
                    }}
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef?.current?.click()}
                    data-field="videoUrl"
                    className="group flex min-h-21 w-full flex-col items-start gap-4 rounded-2xl border-2 border-dashed border-orange-100 bg-orange-50/30 px-5 py-5 text-left transition-all hover:border-orange-300 hover:bg-orange-50/50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex items-center gap-3 font-bold text-orange-400 group-hover:text-orange-600">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
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
                            ? "Đang tải video lên..."
                            : "Đang chuẩn bị video..."
                          : videoUrl
                            ? "Thay đổi video"
                            : "Tải video lên Cloudinary"}
                      </span>
                    </div>
                    {videoUrl && (
                      <div className="rounded-full bg-green-100 p-1">
                        <Check className="text-green-600" size={14} />
                      </div>
                    )}
                  </button>
                  {renderFieldError("videoUrl")}

                  {videoUploadSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                      <ShieldCheck size={14} /> Tải dữ liệu lên đám mây thành
                      công!
                    </div>
                  )}

                  {videoUrl && (
                    <div
                      className={cn(
                        "relative mt-auto overflow-hidden rounded-3xl bg-black shadow-2xl ring-4 ring-white",
                        videoPreviewOrientation === "portrait"
                          ? "mx-auto aspect-[9/16] w-full max-w-[18rem]"
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
                    Thumbnail URL
                  </label>
                  <input
                    data-field="customImageUrl"
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      clearFieldError("customImageUrl");
                      clearFieldError("videoUrl");
                    }}
                    placeholder="Link ảnh cover..."
                    className={inputClass(
                      "customImageUrl",
                      "min-h-21 w-full rounded-2xl bg-gray-50 px-6 py-4 font-medium focus:bg-white",
                    )}
                  />
                  {renderFieldError("customImageUrl")}

                  {customImageUrl && (
                    <div className="relative mt-auto aspect-video overflow-hidden rounded-3xl bg-gray-100 shadow-xl ring-4 ring-white">
                      <img
                        src={customImageUrl}
                        alt="Thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="max-w-xl space-y-5">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-xl sm:rounded-[2.25rem]">
            {!result && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 p-6 text-center backdrop-blur-[2px]">
                <p className="rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold uppercase text-white">
                  Review Mode
                </p>
              </div>
            )}
            <div className="relative flex aspect-[12/5.4] items-center justify-center bg-gray-100">
              {customImageUrl ? (
                <img
                  src={customImageUrl}
                  className="h-full w-full object-cover"
                  alt="Preview cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <ImageIcon size={40} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    No Preview Available
                  </span>
                </div>
              )}
            </div>
            <div className="bg-[#F2F3F5] p-5 sm:p-6">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-400">
                <Globe size={10} /> HOTSNEW.CLICK
              </p>
              <h4 className="mb-2 line-clamp-2 text-lg font-black leading-tight text-gray-900">
                {customTitle || "Tiêu đề của bạn sẽ xuất hiện tại đây..."}
              </h4>
              <p className="line-clamp-2 text-[13px] font-medium leading-relaxed text-gray-600 opacity-70">
                {customDescription ||
                  "Hệ thống sẽ tự động tạo landing page chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ."}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-[1.75rem] border-2 p-5 transition-all duration-500 sm:rounded-[2.25rem] sm:p-8",
              result
                ? "scale-100 border-orange-100 bg-white shadow-2xl"
                : "pointer-events-none scale-[0.98] border-gray-100 bg-gray-50 opacity-50 grayscale",
            )}
          >
            {result && (
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-green-500/5 blur-2xl" />
            )}

            <div className="relative z-10 mb-6 flex items-center justify-between gap-3 sm:mb-8">
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                Link ID: {result?.short_code || "########"}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    result
                      ? `https://hotsnew.click/s/${result.short_code}`
                      : "",
                    "res",
                  )
                }
                className="rounded-2xl border border-gray-100 bg-white p-3 text-orange-600 shadow-sm transition-all hover:bg-orange-50"
              >
                {copiedId === "res" ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <div className="relative z-10 mb-6 truncate rounded-2xl border border-gray-100 bg-gray-50/50 p-4 font-mono text-[11px] font-black text-gray-400 sm:mb-10 sm:p-6 sm:text-xs">
              {result
                ? `https://hotsnew.click/s/${result.short_code}`
                : "https://hotsnew.click/s/########"}
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() =>
                  copyToClipboard(
                    result
                      ? `https://hotsnew.click/s/${result.short_code}`
                      : "",
                    "res",
                  )
                }
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black active:scale-95 sm:py-5"
              >
                <Copy size={16} /> Sao chép Link
              </button>
              <button
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-white py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95 sm:py-5"
              >
                <QrCode size={16} /> QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
