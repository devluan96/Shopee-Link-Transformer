import React from "react";

interface VideoThumbnailProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

const captureFrame = async (video: HTMLVideoElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1;
  canvas.height = video.videoHeight || 1;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
};

export function VideoThumbnail({
  src,
  alt,
  className,
  onError,
}: VideoThumbnailProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    setThumbnailUrl(null);
  }, [src]);

  const handleLoadedMetadata = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const targetTime =
        duration > 0 ? Math.min(Math.max(duration * 0.12, 0.2), 2) : 0.2;
      video.currentTime = targetTime;
    } catch {
      // ignore seek failures and keep the native preview
    }
  };

  const handleSeeked = async () => {
    const video = videoRef.current;
    if (!video || thumbnailUrl) return;

    try {
      const frame = await captureFrame(video);
      if (frame) {
        setThumbnailUrl(frame);
      }
    } catch {
      // Keep the fallback video preview
    }
  };

  return thumbnailUrl ? (
    <img
      src={thumbnailUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  ) : (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted
      playsInline
      preload="metadata"
      onError={onError}
      onLoadedMetadata={handleLoadedMetadata}
      onSeeked={handleSeeked}
    />
  );
}
