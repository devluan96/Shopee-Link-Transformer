import React from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

type CropPoint = {
  x: number;
  y: number;
};

interface AvatarCropDialogProps {
  open: boolean;
  imageUrl: string;
  fileName: string;
  title: string;
  subtitle: string;
  zoomLabel: string;
  previewLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  helpText: string;
  outputName: string;
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
}

const FINAL_SIZE = 512;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = url;
  });

export function AvatarCropDialog({
  open,
  imageUrl,
  fileName,
  title,
  subtitle,
  zoomLabel,
  previewLabel,
  cancelLabel,
  confirmLabel,
  helpText,
  outputName,
  onCancel,
  onConfirm,
}: AvatarCropDialogProps) {
  const cropBoxRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const dragStateRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: CropPoint;
  } | null>(null);

  const [naturalSize, setNaturalSize] = React.useState({ width: 0, height: 0 });
  const [cropBoxSize, setCropBoxSize] = React.useState(320);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState<CropPoint>({ x: 0, y: 0 });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSaving(false);
    setError(null);
  }, [open, imageUrl]);

  React.useEffect(() => {
    if (!open || !cropBoxRef.current) return;

    const updateSize = () => {
      const nextSize = cropBoxRef.current?.clientWidth || 320;
      setCropBoxSize(nextSize);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(cropBoxRef.current);

    return () => observer.disconnect();
  }, [open]);

  const baseScale = React.useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !cropBoxSize) return 1;
    return Math.max(
      cropBoxSize / naturalSize.width,
      cropBoxSize / naturalSize.height,
    );
  }, [cropBoxSize, naturalSize.height, naturalSize.width]);

  const displayWidth = naturalSize.width * baseScale * zoom;
  const displayHeight = naturalSize.height * baseScale * zoom;
  const maxOffsetX = Math.max(0, (displayWidth - cropBoxSize) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - cropBoxSize) / 2);
  const clampedOffset = {
    x: clamp(offset.x, -maxOffsetX, maxOffsetX),
    y: clamp(offset.y, -maxOffsetY, maxOffsetY),
  };
  const imageLeft = (cropBoxSize - displayWidth) / 2 + clampedOffset.x;
  const imageTop = (cropBoxSize - displayHeight) / 2 + clampedOffset.y;

  const handleImageLoad = (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!naturalSize.width || !naturalSize.height) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...offset },
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setOffset({
      x: clamp(
        dragState.origin.x + deltaX,
        -maxOffsetX,
        maxOffsetX,
      ),
      y: clamp(
        dragState.origin.y + deltaY,
        -maxOffsetY,
        maxOffsetY,
      ),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  const handleCancel = () => {
    if (saving) return;
    dragStateRef.current = null;
    setError(null);
    onCancel();
  };

  const buildCroppedFile = async () => {
    const image = imageRef.current ? imageRef.current : await loadImage(imageUrl);
    const scale = baseScale * zoom;
    const sourceX = clamp(
      Math.max(0, (0 - imageLeft) / scale),
      0,
      image.naturalWidth,
    );
    const sourceY = clamp(
      Math.max(0, (0 - imageTop) / scale),
      0,
      image.naturalHeight,
    );
    const sourceWidth = Math.min(
      image.naturalWidth - sourceX,
      cropBoxSize / scale,
    );
    const sourceHeight = Math.min(
      image.naturalHeight - sourceY,
      cropBoxSize / scale,
    );

    const canvas = document.createElement("canvas");
    canvas.width = FINAL_SIZE;
    canvas.height = FINAL_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to initialize crop canvas");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, FINAL_SIZE, FINAL_SIZE);
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      FINAL_SIZE,
      FINAL_SIZE,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Unable to encode avatar"));
        },
        "image/webp",
        0.9,
      );
    });

    return new File([blob], outputName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      setError(null);
      const file = await buildCroppedFile();
      await onConfirm(file);
    } catch (cropError) {
      setError(
        cropError instanceof Error ? cropError.message : "Unable to crop image",
      );
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={handleCancel}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.28)] dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
              <Camera size={12} />
              {previewLabel}
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-2xl bg-gray-100 p-3 text-gray-500 transition-all hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div
              ref={cropBoxRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={cn(
                "relative mx-auto aspect-square w-full max-w-[28rem] overflow-hidden rounded-[1.75rem] border border-gray-100 bg-gray-900 shadow-[0_22px_60px_rgba(15,23,42,0.18)]",
                "cursor-grab active:cursor-grabbing",
              )}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt={fileName}
                onLoad={handleImageLoad}
                className="absolute select-none object-cover"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  left: `${imageLeft}px`,
                  top: `${imageTop}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 border border-white/15" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.08)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.08)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-5" />
            </div>
            <p className="mt-3 text-center text-xs text-gray-500 dark:text-slate-400">
              {helpText}
            </p>
          </div>

          <div className="space-y-5 rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                <span>{zoomLabel}</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-3 w-full accent-orange-500"
                aria-label={zoomLabel}
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
                {previewLabel}
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <div className="aspect-square bg-gray-900">
                  <img
                    src={imageUrl}
                    alt={fileName}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: "center center",
                      transform: `translate(${clampedOffset.x / 4}px, ${clampedOffset.y / 4}px) scale(${Math.min(1.3, zoom)})`,
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-500/25 transition-all hover:brightness-105 disabled:opacity-60"
              >
                {saving ? "..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
