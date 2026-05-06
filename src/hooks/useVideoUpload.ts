import { useState, useCallback, useRef, type ChangeEvent, type RefObject } from "react";
import { toast } from "sonner";

interface UseVideoUploadProps {
  canAccessCreate: boolean;
  uploadAssetToCloudinary: (
    file: Blob | File,
    resourceType: "image" | "video" | "auto",
    fileName?: string,
    onProgress?: (progress: number) => void,
  ) => Promise<string>;
}

export interface VideoUploadState {
  videoUrl: string;
  uploadingVideo: boolean;
  videoUploadProgress: number;
  videoUploadSuccess: boolean;
  videoInputRef: RefObject<HTMLInputElement | null>;
}

export interface VideoUploadActions {
  setVideoUrl: (v: string) => void;
  handleVideoUpload: (
    e: ChangeEvent<HTMLInputElement>,
  ) => Promise<{ videoUrl: string | null; thumbnailUrl: string | null } | void>;
  handleVideoFileUpload: (
    file: File,
  ) => Promise<{ videoUrl: string | null; thumbnailUrl: string | null } | void>;
  captureVideoThumbnail: (file: File) => Promise<string>;
  clearVideo: () => void;
}

export function useVideoUpload({
  canAccessCreate,
  uploadAssetToCloudinary,
}: UseVideoUploadProps): VideoUploadState & VideoUploadActions {
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const captureVideoThumbnail = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
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
            return reject("No context");
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                cleanup();
                return reject("Blob failed");
              }
              try {
                const data = await uploadAssetToCloudinary(
                  blob,
                  "image",
                  "thumb.jpg",
                );
                cleanup();
                resolve(data);
              } catch (e) {
                cleanup();
                reject(e);
              }
            },
            "image/jpeg",
            0.85,
          );
        };

        video.onerror = (e) => {
          cleanup();
          reject(e);
        };
        video.load();
      });
    },
    [uploadAssetToCloudinary],
  );

  const handleVideoFileUpload = useCallback(
    async (file: File) => {
      if (!canAccessCreate) {
        toast.error("Please upgrade your account to upload videos.");
        return;
      }

      setUploadingVideo(true);
      setVideoUploadProgress(0);
      setVideoUploadSuccess(false);

      try {
        let pendingThumbUrl: string | null = null;
        try {
          pendingThumbUrl = await captureVideoThumbnail(file);
        } catch (thumbError) {
          console.error("Local thumbnail capture failed", thumbError);
        }

        const secureUrl = await uploadAssetToCloudinary(
          file,
          "video",
          file.name,
          setVideoUploadProgress,
        );

        if (secureUrl) {
          setVideoUrl(secureUrl);
          setVideoUploadSuccess(true);
          setTimeout(() => setVideoUploadSuccess(false), 5000);

          if (pendingThumbUrl) {
            return { videoUrl: secureUrl, thumbnailUrl: pendingThumbUrl };
          }

          return { videoUrl: secureUrl, thumbnailUrl: null };
        }
      } catch (err: unknown) {
        console.error("Video upload failed", err);
        toast.error(
          `Lỗi tải video: ${err instanceof Error ? err.message : "Không xác định"}`,
        );
      } finally {
        setUploadingVideo(false);
        setTimeout(() => setVideoUploadProgress(0), 600);
      }

      return { videoUrl: null, thumbnailUrl: null };
    },
    [canAccessCreate, captureVideoThumbnail, uploadAssetToCloudinary],
  );

  const handleVideoUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await handleVideoFileUpload(file);
      e.target.value = "";
      return result;
    },
    [handleVideoFileUpload],
  );

  const clearVideo = useCallback(() => {
    setVideoUrl("");
    setVideoUploadProgress(0);
    setVideoUploadSuccess(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }, []);

  return {
    videoUrl,
    uploadingVideo,
    videoUploadProgress,
    videoUploadSuccess,
    videoInputRef,
    setVideoUrl,
    handleVideoUpload,
    handleVideoFileUpload,
    captureVideoThumbnail,
    clearVideo,
  };
}
