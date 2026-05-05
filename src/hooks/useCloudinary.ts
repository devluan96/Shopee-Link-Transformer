import { useCallback } from "react";

interface CloudinarySignedUpload {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  version?: number | string;
  resource_type?: string;
  error?: {
    message?: string;
  };
  message?: string;
}

interface UseCloudinaryProps {
  fetchWithAuth: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function useCloudinary({ fetchWithAuth }: UseCloudinaryProps) {
  const buildSafariSafeVideoUrl = useCallback(
    (signedUpload: CloudinarySignedUpload, data: CloudinaryUploadResponse) => {
      if (!data.public_id || !data.version) {
        return data.secure_url || "";
      }

      return `https://res.cloudinary.com/${signedUpload.cloudName}/video/upload/f_mp4,vc_h264,ac_aac,q_auto:good/v${data.version}/${data.public_id}.mp4`;
    },
    [],
  );

  const getCloudinarySignedUpload = useCallback(async (
    resourceType: "image" | "video" | "auto" = "auto",
  ): Promise<CloudinarySignedUpload> => {
    const response = await fetchWithAuth("/api/v1/cloudinary/sign-upload", {
      method: "POST",
      body: JSON.stringify({ resourceType }),
    });
    return response.json();
  }, [fetchWithAuth]);

  const uploadAssetToCloudinary = useCallback(async (
    file: Blob | File,
    resourceType: "image" | "video" | "auto" = "auto",
    fileName?: string,
    onProgress?: (progress: number) => void,
  ): Promise<string> => {
    const signedUpload = await getCloudinarySignedUpload(resourceType);
    const uploadFormData = new FormData();

    uploadFormData.append("file", file, fileName);
    uploadFormData.append("api_key", signedUpload.apiKey);
    uploadFormData.append("timestamp", String(signedUpload.timestamp));
    uploadFormData.append("signature", signedUpload.signature);
    uploadFormData.append("folder", signedUpload.folder);

    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/${resourceType}/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (!onProgress || !event.lengthComputable) return;
        onProgress(
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        );
      };

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText || "null") as CloudinaryUploadResponse;
        const uploadedUrl =
          resourceType === "video"
            ? buildSafariSafeVideoUrl(signedUpload, data)
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
  }, [buildSafariSafeVideoUrl, getCloudinarySignedUpload]);

  return {
    getCloudinarySignedUpload,
    uploadAssetToCloudinary,
  };
}
