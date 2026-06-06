import { useCallback } from "react";
import { useState } from "react";
import { toast } from "sonner";

type ResourceType = "image" | "video" | "auto";
export type MediaUploadProvider = "cloudinary" | "r2" | "supabase";

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
  folder: string;
  publicBaseUrl: string;
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
  | R2UploadPlan
  | SupabaseUploadPlan;

interface UploadPlanResponse {
  resourceType: ResourceType;
  providers: MediaUploadPlan[];
}

interface ReuseCheckAsset {
  path?: string;
  url?: string;
  provider?: "cloudinary" | "r2" | "supabase";
  resourceType?: "image" | "video" | "audio";
  folderName?: string;
  fileName?: string;
  sizeBytes?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

interface ReuseCheckResponse {
  reused?: boolean;
  asset?: ReuseCheckAsset;
  error?: string;
  message?: string;
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

interface SupabaseProxyUploadResponse {
  url?: string;
  path?: string;
  bucket?: string;
  provider?: "supabase";
  error?: string;
  message?: string;
}

interface R2ProxyUploadResponse {
  url?: string;
  path?: string;
  bucket?: string;
  provider?: "r2";
  error?: string;
  message?: string;
}

interface UploadCompletionPayload {
  resourceType: ResourceType;
  provider: MediaUploadPlan["provider"];
  publicUrl: string;
  objectPath: string;
  fileName?: string;
  sizeBytes?: number;
  mimeType?: string;
  folderName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
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

const parseUploadResponse = <T>(responseText: string): T | null => {
  try {
    return JSON.parse(responseText || "null") as T;
  } catch {
    return null;
  }
};

const inferReuseResourceType = (
  resourceType: ResourceType,
  file?: Blob | File,
  fileName?: string,
): Exclude<ResourceType, "auto"> => {
  if (resourceType !== "auto") {
    return resourceType;
  }

  const haystack = `${file?.type || ""} ${fileName || (file instanceof File ? file.name : "")}`
    .toLowerCase()
    .trim();

  if (
    haystack.includes("video/") ||
    /\.(mp4|mov|m4v|webm|avi|mkv|gifv)$/i.test(fileName || "")
  ) {
    return "video";
  }

  return "image";
};

const computeFileSha256 = async (file: Blob | File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
    async (payload: UploadCompletionPayload) => {
      const { resourceType, provider, ...metadata } = payload;
      const response = await fetchWithAuth("/api/v1/media/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          provider,
          ...metadata,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Cannot finalize upload");
      }

      if (resourceType !== "video") return;
    },
    [fetchWithAuth],
  );

  const findReusableMediaAsset = useCallback(
    async (input: {
      resourceType: ResourceType;
      fingerprint: string;
      fileName?: string;
      contentType?: string;
    }): Promise<ReuseCheckAsset | null> => {
      if (!input.fingerprint.trim()) return null;

      const response = await fetchWithAuth("/api/v1/media/reuse-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: inferReuseResourceType(
            input.resourceType,
            { type: input.contentType || "" } as Blob,
            input.fileName,
          ),
          fingerprint: input.fingerprint,
          fileName: input.fileName,
          contentType: input.contentType || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ReuseCheckResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const errorPayload = payload as { error?: string } | null;
        throw new Error(
          errorPayload?.error || "Cannot check reusable media assets",
        );
      }

      const data = payload as ReuseCheckResponse | null;
      if (data?.reused && data.asset?.url) {
        return data.asset;
      }

      return null;
    },
    [fetchWithAuth],
  );

  const uploadViaCloudinary = useCallback(
    async (
      plan: CloudinaryUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<{
      uploadedUrl: string;
      publicId?: string;
      version?: number | string;
    }> => {
      const uploadFormData = new FormData();
      appendUploadFile(uploadFormData, file, fileName);
      uploadFormData.append("api_key", plan.apiKey);
      uploadFormData.append("timestamp", String(plan.timestamp));
      uploadFormData.append("signature", plan.signature);
      uploadFormData.append("folder", plan.folder);

      return await new Promise<{
        uploadedUrl: string;
        publicId?: string;
        version?: number | string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", plan.uploadUrl);

        xhr.upload.onprogress = (event) => {
          if (!onProgress || !event.lengthComputable) return;
          onProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        };

        xhr.onload = () => {
          const data =
            parseUploadResponse<CloudinaryUploadResponse>(xhr.responseText) ||
            {};
          const uploadedUrl =
            plan.resourceType === "video"
              ? buildSafariSafeVideoUrl(plan, data)
              : data?.secure_url || "";

          if (xhr.status >= 200 && xhr.status < 300 && uploadedUrl) {
            if (onProgress) onProgress(100);
            resolve({
              uploadedUrl,
              publicId: data.public_id,
              version: data.version,
            });
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

  const uploadViaSupabaseProxy = useCallback(
    async (
      plan: SupabaseUploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<{
      uploadedUrl: string;
      path?: string;
      bucket?: string;
      provider?: "supabase";
    }> => {
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
          uploadedUrl: data.url,
          path: data.path,
          bucket: data.bucket,
          provider: data.provider || "supabase",
        };
      }

      throw new Error(
        data?.error || data?.message || "Supabase upload failed",
      );
    },
    [fetchWithAuth],
  );

  const uploadViaR2Proxy = useCallback(
    async (
      plan: R2UploadPlan,
      file: Blob | File,
      fileName?: string,
      onProgress?: (progress: number) => void,
    ): Promise<{
      uploadedUrl: string;
      path?: string;
      bucket?: string;
      provider?: "r2";
    }> => {
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
      const data = (await response.json()) as R2ProxyUploadResponse;
      if (data?.url) {
        if (onProgress) onProgress(100);
        return {
          uploadedUrl: data.url,
          path: data.path,
          bucket: data.bucket,
          provider: data.provider || "r2",
        };
      }

      throw new Error(data?.error || data?.message || "R2 upload failed");
    },
    [fetchWithAuth],
  );

  const uploadAssetToCloudinary = useCallback(
    async (
      file: Blob | File,
      resourceType: ResourceType = "auto",
      fileName?: string,
      onProgress?: (progress: number) => void,
      options?: { skipLibraryRecord?: boolean },
    ): Promise<string> => {
      const errors: string[] = [];
      const resolvedFileName =
        fileName || (file instanceof File ? file.name : "upload.bin");
      const resolvedSizeBytes =
        typeof file?.size === "number" && Number.isFinite(file.size)
          ? file.size
          : undefined;
      const resolvedMimeType = file?.type || undefined;
      const resolvedResourceType = inferReuseResourceType(
        resourceType,
        file,
        resolvedFileName,
      );
      const fileFingerprint = await computeFileSha256(file);
      const reusableAsset = await findReusableMediaAsset({
        resourceType: resolvedResourceType,
        fingerprint: fileFingerprint,
        fileName: resolvedFileName,
        contentType: resolvedMimeType,
      });

      if (reusableAsset?.url) {
        const reusableProvider =
          reusableAsset.provider === "cloudinary" ||
          reusableAsset.provider === "r2" ||
          reusableAsset.provider === "supabase"
            ? reusableAsset.provider
            : null;

        if (reusableAsset.resourceType === "video") {
          if (reusableProvider) {
            setLastVideoUploadProvider(reusableProvider);
          }
        } else if (reusableAsset.resourceType === "image") {
          if (reusableProvider) {
            setLastImageUploadProvider(reusableProvider);
          }
        }

        toast.success("Đã dùng lại file có sẵn.");
        return reusableAsset.url;
      }

      const plan = await getMediaUploadPlan(resourceType, file, fileName);

      for (const provider of plan.providers) {
        try {
          let uploadResult:
            | {
                uploadedUrl: string;
                publicId?: string;
                version?: number | string;
                path?: string;
                bucket?: string;
                provider?: "supabase" | "r2";
              }
            | null = null;
          switch (provider.provider) {
            case "cloudinary":
              uploadResult = await uploadViaCloudinary(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "r2":
              uploadResult = await uploadViaR2Proxy(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
            case "supabase":
              uploadResult = await uploadViaSupabaseProxy(
                provider,
                file,
                fileName,
                onProgress,
              );
              break;
          }

          if (uploadResult?.uploadedUrl) {
            if (provider.resourceType === "video") {
              setLastVideoUploadProvider(provider.provider);
            } else if (provider.resourceType === "image") {
              setLastImageUploadProvider(provider.provider);
            }
            if (!options?.skipLibraryRecord) {
              try {
                await markUploadComplete({
                  resourceType: provider.resourceType,
                  provider: provider.provider,
                  publicUrl: uploadResult.uploadedUrl,
                  objectPath:
                uploadResult.publicId ||
                    uploadResult.path ||
                    resolvedFileName,
                  fileName: resolvedFileName,
                  sizeBytes: resolvedSizeBytes,
                  mimeType: resolvedMimeType,
                  folderName:
                    provider.provider === "supabase" ||
                    provider.provider === "r2"
                      ? provider.folder
                      : undefined,
                  metadata: {
                    ...(uploadResult.publicId
                      ? { public_id: uploadResult.publicId }
                      : {}),
                    ...(uploadResult.version
                      ? { version: uploadResult.version }
                      : {}),
                    ...(uploadResult.bucket
                      ? { bucket: uploadResult.bucket }
                      : {}),
                    sha256: fileFingerprint,
                    provider: provider.provider,
                    resourceType: provider.resourceType,
                  },
                });
              } catch (completeError) {
                console.error(
                  "Upload completed but quota finalization failed",
                  completeError,
                );
              }
            }
            return uploadResult.uploadedUrl;
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
      findReusableMediaAsset,
      markUploadComplete,
      uploadViaCloudinary,
      uploadViaR2Proxy,
      uploadViaSupabaseProxy,
    ],
  );

  return {
    uploadAssetToCloudinary,
    lastVideoUploadProvider,
    lastImageUploadProvider,
  };
}
