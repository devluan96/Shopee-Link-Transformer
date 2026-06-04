import { useCallback } from "react";
import { useState } from "react";
import { toast } from "sonner";

type ResourceType = "image" | "video" | "auto";
export type MediaUploadProvider = "r2" | "cloudinary" | "supabase";

interface CloudinaryUploadPlan {
  provider: "cloudinary";
  resourceType: ResourceType;
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

interface R2UploadPlan {
  provider: "r2";
  resourceType: ResourceType;
  uploadUrl: string;
  bucket: string;
  publicBaseUrl: string;
  maxFileSizeBytes: number;
}

interface SupabaseUploadPlan {
  provider: "supabase";
  resourceType: ResourceType;
  uploadUrl: string;
  bucket: string;
  folder: string;
  maxFileSizeBytes: number;
}

type MediaUploadPlan =
  | R2UploadPlan
  | CloudinaryUploadPlan
  | SupabaseUploadPlan;

interface UploadPlanResponse {
  resourceType: ResourceType;
  providers: MediaUploadPlan[];
}

interface CloudinaryUploadResponse {
  reused?: boolean;
  deduped?: boolean;
  provider?: MediaUploadProvider;
  url?: string;
  secure_url?: string;
  public_id?: string;
  version?: number | string;
  error?: {
    message?: string;
  };
  message?: string;
}

interface SupabaseProxyUploadResponse {
  reused?: boolean;
  deduped?: boolean;
  provider?: MediaUploadProvider;
  url?: string;
  error?: string;
  message?: string;
}

interface R2ProxyUploadResponse {
  reused?: boolean;
  deduped?: boolean;
  provider?: MediaUploadProvider;
  url?: string;
  error?: string;
  message?: string;
}

interface UploadOutcome {
  url: string;
  reused: boolean;
  provider?: MediaUploadProvider;
}

interface UseCloudinaryProps {
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

const formatProviderError = (provider: MediaUploadPlan["provider"], message: string) =>
  `${provider}: ${message}`;

const appendUploadFile = (
  formData: FormData,
  file: Blob | File,
  fileName?: string,
) => {
  const normalizedFileName =
    fileName?.trim() || (file instanceof File ? file.name : "");

  if (normalizedFileName) {
    formData.append("file", file, normalizedFileName);
    return;
  }

  formData.append("file", file);
};

const getReuseToastMessage = (provider?: MediaUploadProvider) => {
  const lang =
    typeof document !== "undefined"
      ? (document.documentElement.lang || navigator.language || "").toLowerCase()
      : "";
  const isVi = lang.startsWith("vi");
  const providerLabel = provider
    ? provider === "r2"
      ? "R2"
      : provider === "cloudinary"
        ? "Cloudinary"
        : "Supabase"
    : null;

  if (isVi) {
    return providerLabel
      ? `Đã dùng lại file có sẵn từ ${providerLabel}.`
      : "Đã dùng lại file có sẵn.";
  }

  return providerLabel
    ? `Reused existing file from ${providerLabel}.`
    : "Reused existing file.";
};

export function useCloudinary({ fetchWithAuth }: UseCloudinaryProps) {
  const [lastVideoUploadProvider, setLastVideoUploadProvider] =
    useState<MediaUploadProvider | null>(null);
  const [lastImageUploadProvider, setLastImageUploadProvider] =
    useState<MediaUploadProvider | null>(null);

  const buildSafariSafeVideoUrl = useCallback(
    (signedUpload: CloudinaryUploadPlan, data: CloudinaryUploadResponse) => {
      if (!data.public_id || !data.version) {
        return data.secure_url || "";
      }

      return `https://res.cloudinary.com/${signedUpload.cloudName}/video/upload/f_mp4,vc_h264,ac_aac,q_auto:good/v${data.version}/${data.public_id}.mp4`;
    },
    [],
  );

  const getMediaUploadPlan = useCallback(
    async (
      resourceType: ResourceType,
      file?: Blob | File,
      fileName?: string,
    ): Promise<UploadPlanResponse> => {
      const response = await fetchWithAuth("/api/v1/media/upload-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          fileName: fileName || (file instanceof File ? file.name : undefined),
          fileSize:
            typeof file?.size === "number" && Number.isFinite(file.size)
              ? file.size
              : undefined,
          contentType: file?.type || undefined,
        }),
      });

      const payload = (await response.json()) as
        | UploadPlanResponse
        | { error?: string };
      if (!response.ok) {
        const errorPayload = payload as { error?: string };
        throw new Error(
          errorPayload.error || "Cannot prepare upload providers",
        );
      }

      return payload as UploadPlanResponse;
    },
    [fetchWithAuth],
  );

  const markUploadComplete = useCallback(
    async (resourceType: ResourceType, provider: MediaUploadPlan["provider"]) => {
      if (resourceType !== "video") return;

      const response = await fetchWithAuth("/api/v1/media/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, provider }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Cannot finalize video upload");
      }
    },
    [fetchWithAuth],
  );

  const uploadViaCloudinary = useCallback(
    async (
      plan: CloudinaryUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<UploadOutcome> => {
      const uploadFormData = new FormData();
      appendUploadFile(uploadFormData, file, fileName);
      uploadFormData.append("resourceType", plan.resourceType);
      uploadFormData.append("cloudName", plan.cloudName);
      uploadFormData.append(
        "fileName",
        fileName || (file instanceof File ? file.name : "upload.bin"),
      );
      uploadFormData.append("apiKey", plan.apiKey);
      uploadFormData.append("timestamp", String(plan.timestamp));
      uploadFormData.append("signature", plan.signature);
      uploadFormData.append("folder", plan.folder);

      if (onProgress) onProgress(15);
      const response = await fetchWithAuth(plan.uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });
      const data = (await response.json().catch(() => null)) as
        | CloudinaryUploadResponse
        | null;

      const uploadedUrl =
        data?.url ||
        (plan.resourceType === "video"
          ? buildSafariSafeVideoUrl(
              plan,
              data || { secure_url: "", public_id: "", version: 0 },
            )
          : data?.secure_url || "");

      if (response.ok && uploadedUrl) {
        if (onProgress) onProgress(100);
        return {
          url: uploadedUrl,
          reused: Boolean(data?.reused || data?.deduped),
          provider: data?.provider || "cloudinary",
        };
      }

      throw new Error(
        data?.error?.message ||
          data?.message ||
          `Cloudinary upload failed (${response.status})`,
      );
    },
    [buildSafariSafeVideoUrl, fetchWithAuth],
  );

  const uploadViaSupabaseProxy = useCallback(
    async (
      plan: SupabaseUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<UploadOutcome> => {
      const uploadFormData = new FormData();
      appendUploadFile(uploadFormData, file, fileName);
      uploadFormData.append("resourceType", plan.resourceType);
      uploadFormData.append(
        "fileName",
        fileName || (file instanceof File ? file.name : "upload.bin"),
      );

      if (onProgress) onProgress(15);
      const response = await fetchWithAuth(plan.uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });
      const data = (await response.json()) as SupabaseProxyUploadResponse;
      if (data?.url) {
        if (onProgress) onProgress(100);
        return {
          url: data.url,
          reused: Boolean(data.reused || data.deduped),
          provider: data.provider || "supabase",
        };
      }

      throw new Error(
        data?.error || data?.message || "Supabase upload failed",
      );
    },
    [fetchWithAuth],
  );

  const uploadViaR2Storage = useCallback(
    async (
      plan: R2UploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<UploadOutcome> => {
      const uploadFormData = new FormData();
      appendUploadFile(uploadFormData, file, fileName);
      uploadFormData.append("resourceType", plan.resourceType);
      uploadFormData.append(
        "fileName",
        fileName || (file instanceof File ? file.name : "upload.bin"),
      );
      if (onProgress) onProgress(15);
      const response = await fetchWithAuth(plan.uploadUrl, {
        method: "POST",
        body: uploadFormData,
      });
      const data = (await response.json().catch(() => null)) as
        | R2ProxyUploadResponse
        | null;

      if (response.ok && data?.url) {
        if (onProgress) onProgress(100);
        return {
          url: data.url,
          reused: Boolean(data.reused || data.deduped),
          provider: data.provider || "r2",
        };
      }

      throw new Error(
        data?.error ||
          data?.message ||
          `R2 upload failed (${response.status})`,
      );
    },
    [fetchWithAuth],
  );

  const uploadAssetToCloudinary = useCallback(
    async (
      file: Blob | File,
      resourceType: ResourceType = "auto",
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<string> => {
      const plan = await getMediaUploadPlan(resourceType, file, fileName);
      const errors: string[] = [];
      const failedProviders = new Set<MediaUploadProvider>();
      let fallbackWarningShown = false;

      for (const provider of plan.providers) {
        try {
          let uploaded: UploadOutcome | null = null;
          switch (provider.provider) {
            case "r2":
              uploaded = await uploadViaR2Storage(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "cloudinary":
              uploaded = await uploadViaCloudinary(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "supabase":
              uploaded = await uploadViaSupabaseProxy(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
          }

          if (uploaded?.url) {
            if (
              !fallbackWarningShown &&
              provider.provider === "cloudinary" &&
              failedProviders.has("r2")
            ) {
              toast.warning("R2 failed, falling back to Cloudinary backup.");
              fallbackWarningShown = true;
            }

            if (uploaded.reused) {
              toast.success(getReuseToastMessage(uploaded.provider || provider.provider));
            }

            if (provider.resourceType === "video") {
              setLastVideoUploadProvider(uploaded.provider || provider.provider);
            } else if (provider.resourceType === "image") {
              setLastImageUploadProvider(uploaded.provider || provider.provider);
            }

            if (!uploaded.reused) {
              try {
                await markUploadComplete(
                  provider.resourceType,
                  provider.provider,
                );
              } catch (completeError) {
                console.error(
                  "Upload completed but quota finalization failed",
                  completeError,
                );
              }
            }
            return uploaded.url;
          }
        } catch (error) {
          failedProviders.add(provider.provider);
          errors.push(
            formatProviderError(
              provider.provider,
              error instanceof Error ? error.message : "Upload failed",
            ),
          );
        }
      }

      throw new Error(
        errors.length
          ? errors.join(" | ")
          : "No upload providers are available.",
      );
    },
    [
      getMediaUploadPlan,
      markUploadComplete,
      uploadViaR2Storage,
      uploadViaCloudinary,
      uploadViaSupabaseProxy,
    ],
  );

  return {
    uploadAssetToCloudinary,
    lastVideoUploadProvider,
    lastImageUploadProvider,
  };
}
