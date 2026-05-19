import { useCallback } from "react";
import { useState } from "react";

type ResourceType = "image" | "video" | "auto";
export type MediaUploadProvider = "cloudinary" | "imagekit" | "supabase";

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

interface ImageKitUploadPlan {
  provider: "imagekit";
  resourceType: ResourceType;
  uploadUrl: string;
  publicKey: string;
  urlEndpoint: string;
  folder: string;
  token: string;
  expire: number;
  signature: string;
  useUniqueFileName: boolean;
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
  | CloudinaryUploadPlan
  | ImageKitUploadPlan
  | SupabaseUploadPlan;

interface UploadPlanResponse {
  resourceType: ResourceType;
  providers: MediaUploadPlan[];
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  version?: number | string;
  error?: {
    message?: string;
  };
  message?: string;
}

interface ImageKitUploadResponse {
  url?: string;
  error?: {
    message?: string;
  };
  message?: string;
}

interface SupabaseProxyUploadResponse {
  url?: string;
  error?: string;
  message?: string;
}

interface UseCloudinaryProps {
  fetchWithAuth: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
}

const formatProviderError = (provider: MediaUploadPlan["provider"], message: string) =>
  `${provider}: ${message}`;

const buildImageKitOptimizedVideoUrl = (
  _plan: ImageKitUploadPlan,
  rawUrl: string,
) => {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return "";
  return trimmedUrl;
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
    ) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, fileName);
      uploadFormData.append("api_key", plan.apiKey);
      uploadFormData.append("timestamp", String(plan.timestamp));
      uploadFormData.append("signature", plan.signature);
      uploadFormData.append("folder", plan.folder);

      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", plan.uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (!onProgress || !event.lengthComputable) return;
          onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        };

        xhr.onload = () => {
          const data = JSON.parse(
            xhr.responseText || "null",
          ) as CloudinaryUploadResponse;
          const uploadedUrl =
            plan.resourceType === "video"
              ? buildSafariSafeVideoUrl(plan, data)
              : data?.secure_url || "";

          if (xhr.status >= 200 && xhr.status < 300 && uploadedUrl) {
            if (onProgress) onProgress(100);
            resolve(uploadedUrl);
            return;
          }

          reject(
            new Error(
              data?.error?.message ||
                data?.message ||
                `Cloudinary upload failed (${xhr.status})`,
            ),
          );
        };

        xhr.onerror = () => reject(new Error("Cloudinary upload failed"));
        xhr.send(uploadFormData);
      });
    },
    [buildSafariSafeVideoUrl],
  );

  const uploadViaImageKit = useCallback(
    async (
      plan: ImageKitUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, fileName);
      uploadFormData.append(
        "fileName",
        fileName || (file instanceof File ? file.name : "upload.bin"),
      );
      uploadFormData.append("publicKey", plan.publicKey);
      uploadFormData.append("signature", plan.signature);
      uploadFormData.append("token", plan.token);
      uploadFormData.append("expire", String(plan.expire));
      uploadFormData.append("folder", plan.folder);
      uploadFormData.append(
        "useUniqueFileName",
        plan.useUniqueFileName ? "true" : "false",
      );

      return await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", plan.uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (!onProgress || !event.lengthComputable) return;
          onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        };

        xhr.onload = () => {
          const data = JSON.parse(
            xhr.responseText || "null",
          ) as ImageKitUploadResponse;
          const uploadedUrl =
            plan.resourceType === "video"
              ? buildImageKitOptimizedVideoUrl(plan, data?.url || "")
              : data?.url || "";

          if (xhr.status >= 200 && xhr.status < 300 && uploadedUrl) {
            if (onProgress) onProgress(100);
            resolve(uploadedUrl);
            return;
          }

          reject(
            new Error(
              data?.error?.message ||
                data?.message ||
                `ImageKit upload failed (${xhr.status})`,
            ),
          );
        };

        xhr.onerror = () => reject(new Error("ImageKit upload failed"));
        xhr.send(uploadFormData);
      });
    },
    [],
  );

  const uploadViaSupabaseProxy = useCallback(
    async (
      plan: SupabaseUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, fileName);
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
        return data.url;
      }

      throw new Error(
        data?.error || data?.message || "Supabase upload failed",
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

      for (const provider of plan.providers) {
        try {
          let uploadedUrl = "";
          switch (provider.provider) {
            case "cloudinary":
              uploadedUrl = await uploadViaCloudinary(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "imagekit":
              uploadedUrl = await uploadViaImageKit(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "supabase":
              uploadedUrl = await uploadViaSupabaseProxy(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
          }

          if (uploadedUrl) {
            if (provider.resourceType === "video") {
              setLastVideoUploadProvider(provider.provider);
            } else if (provider.resourceType === "image") {
              setLastImageUploadProvider(provider.provider);
            }
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
            return uploadedUrl;
          }
        } catch (error) {
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
      uploadViaCloudinary,
      uploadViaImageKit,
      uploadViaSupabaseProxy,
    ],
  );

  return {
    uploadAssetToCloudinary,
    lastVideoUploadProvider,
    lastImageUploadProvider,
  };
}
