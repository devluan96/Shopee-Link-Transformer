import { PublicLinkRecord } from "../types/index.js";

import { buildPublicVideoUrl } from "../utils/mediaUrl.js";

const PRIMARY_RETURN_WINDOW_MS = 5 * 60 * 1000;

const capitalizeFirstCharacter = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const firstCharacter = trimmed.charAt(0).toLocaleUpperCase("vi-VN");
  return `${firstCharacter}${trimmed.slice(1)}`;
};

const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const escapeJsString = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
};

export const renderChoiceLandingPage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
  clickTrackingUrl: string,
  options?: {
    experimental?: boolean;
    preferImageCard?: boolean;
    primaryRedirectUrl?: string;
    secondaryRedirectUrl?: string;
  },
) => {
  const isExperimental = options?.experimental ?? true;
  const preferImageCard = options?.preferImageCard ?? false;
  const title = capitalizeFirstCharacter(
    link.custom_title?.trim() || "HotsNew Click",
  );
  const description = capitalizeFirstCharacter(
    link.custom_description?.trim() ||
      "Nội dung đang sẵn sàng. Bấm vào màn hình để tiếp tục.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = buildPublicVideoUrl(link.video_url);
  const secondaryUrl = link.secondary_url?.trim() || "";
  const hasVideo = Boolean(videoUrl);
  const hasSecondaryRedirect = hasVideo && Boolean(secondaryUrl);
  const originBase = new URL(canonicalUrl).origin;
  const defaultOgImage = `${originBase}/og-image.png`;
  const fallbackFavicon = `${originBase}/logo-app-192.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const primaryRedirectUrl = options?.primaryRedirectUrl?.trim() || link.original_url.trim();
  const secondaryRedirectUrl = options?.secondaryRedirectUrl?.trim() || secondaryUrl;
  const outboundTrackingUrl =
    clickTrackingUrl.slice(-6) === "/track"
      ? `${clickTrackingUrl.slice(0, -6)}/track-outbound`
      : `${clickTrackingUrl}/track-outbound`;
  const secondaryStateKey = `hn.choice-state.${link.short_code}`;
  const robotsContent = isExperimental
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large";
  const siteName = isExperimental
    ? "HotsNew Click Choice Mode"
    : "HotsNew Click";
  const variantBadgeMarkup = isExperimental
    ? `<div class="variant-badge">Choice Mode</div>`
    : "";

  const overlayHintMarkup = `<div class="overlay-hint" aria-hidden="true"><div class="overlay-hint-icon">&#128070;</div><div class="overlay-hint-text">Click vào đây để ủng hộ rồi trở về để xem tiếp</div></div>`;
  const overlayAriaLabel = "Mở tiếp tục";

  const previewMedia = hasVideo
    ? `<div class="video-container"><video class="hero-media hero-video" src="${escapeHtml(videoUrl)}" controls muted autoplay loop playsinline webkit-playsinline x5-playsinline preload="auto" poster="${escapeHtml(imageUrl || socialImageUrl)}"></video></div>`
    : `<img class="hero-media hero-image" src="${escapeHtml(socialImageUrl)}" alt="${escapeHtml(title)}" />`;

  const shouldExposeVideoMeta = hasVideo && !preferImageCard;
  const ogType = shouldExposeVideoMeta ? "video.other" : "website";
  const metaVideo = shouldExposeVideoMeta
    ? `<meta property="og:video" content="${escapeHtml(videoUrl)}" /><meta property="og:video:type" content="video/mp4" /><meta property="og:video:secure_url" content="${escapeHtml(videoUrl)}" />`
    : "";
  const metaImage = `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" /><meta property="og:image:secure_url" content="${escapeHtml(socialImageUrl)}" /><meta property="og:image:alt" content="${escapeHtml(title)}" /><meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`;
  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${robotsContent}" />
    <link rel="icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="${siteName}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${metaImage}
    ${metaVideo}
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(9, 18, 32, 0.58);
        --border: rgba(255, 255, 255, 0.14);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.78);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--text);
        background: radial-gradient(circle at 14% 18%, rgba(34, 211, 238, 0.28), transparent 22%),
          radial-gradient(circle at 82% 20%, rgba(251, 113, 133, 0.22), transparent 24%),
          radial-gradient(circle at 76% 72%, rgba(245, 158, 11, 0.18), transparent 20%),
          linear-gradient(135deg, #030712 0%, #07111f 42%, #111827 100%);
        overflow-x: hidden;
      }
      .orb { position: fixed; border-radius: 999px; filter: blur(12px); opacity: 0.9; pointer-events: none; }
      .orb-1 { inset: 6% auto auto 8%; width: 17rem; height: 17rem; background: linear-gradient(135deg, rgba(34, 211, 238, 0.95), rgba(59, 130, 246, 0.25)); box-shadow: 1.6rem 1.8rem 0 rgba(8, 47, 73, 0.34); }
      .orb-2 { inset: auto 12% 10% auto; width: 15rem; height: 15rem; background: linear-gradient(135deg, rgba(251, 113, 133, 0.96), rgba(168, 85, 247, 0.24)); box-shadow: -1.4rem 1.3rem 0 rgba(76, 29, 149, 0.24); }
      .orb-3 { inset: 34% auto auto 68%; width: 8rem; height: 8rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(251, 191, 36, 0.26)); box-shadow: 0.8rem 1rem 0 rgba(120, 53, 15, 0.25); }
      .shell { min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 1rem; position: relative; }
      .card {
        position: relative;
        width: min(1040px, 95vw);
        display: flex;
        flex-direction: column;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 1rem;
        overflow: hidden;
        backdrop-filter: blur(24px) saturate(130%);
        box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }
      .variant-badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        z-index: 10;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(7, 17, 31, 0.88);
        padding: 0.45rem 0.8rem;
        font-size: 0.66rem;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(226, 232, 240, 0.92);
      }
      .media-panel {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.7));
      }
      .hero-media { width: 100%; height: 100%; display: block; object-fit: cover; }
      .hero-video { width: 100%; height: 100%; object-fit: contain; border-radius: 1rem; background: #000; -webkit-touch-callout: none; }
      .video-container { position: relative; width: 100%; height: 100%; max-width: 100%; }
      .media-panel[data-video-orientation="landscape"] .video-container { aspect-ratio: 16 / 9; }
      .media-panel[data-video-orientation="portrait"] { aspect-ratio: auto; }
      .media-panel[data-video-orientation="portrait"] .video-container { aspect-ratio: 9 / 16; width: min(100%, 26rem); }
      .media-panel[data-video-orientation="square"] { aspect-ratio: auto; }
      .media-panel[data-video-orientation="square"] .video-container { aspect-ratio: 1 / 1; width: min(100%, 32rem); }
      .content-panel { padding: 1rem; border-top: 1px solid var(--border); }
      .content-panel h1 { margin: 0 0 0.5rem; font-size: 1.25rem; line-height: 1.4; }
      .content-panel p { margin: 0; font-size: 0.92rem; line-height: 1.55; color: var(--muted); }
      .overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(2, 6, 23, 0.95);
        backdrop-filter: blur(5px);
        z-index: 9999;
        cursor: pointer;
        color: inherit;
        text-decoration: none;
        transition: opacity 220ms ease, visibility 220ms ease;
      }
      .overlay.hidden { opacity: 0; visibility: hidden; pointer-events: none; display: none !important; }
      .overlay.delayed-hidden { opacity: 0; visibility: hidden; pointer-events: none; display: none !important; }
      .overlay-hint {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.95rem;
        width: min(92vw, 34rem);
        padding: 1.5rem;
        text-align: center;
      }
      .overlay-hint-icon {
        font-size: clamp(2.5rem, 5vw, 3.5rem);
        line-height: 1;
        filter: drop-shadow(0 0.5rem 1rem rgba(0, 0, 0, 0.25));
      }
      .overlay-hint-text {
        color: rgba(255, 255, 255, 0.96);
        font-size: clamp(1rem, 2vw, 1.15rem);
        line-height: 1.45;
        text-shadow: 0 0.2rem 1rem rgba(0, 0, 0, 0.34);
      }
      .hero-video.is-landscape,
      .hero-video.is-portrait,
      .hero-video.is-square { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
      @media (max-width: 900px) {
        .content-panel { padding: 1.2rem 1rem 1.4rem; }
        .media-panel { padding: 0.75rem; }
        .hero-media, .video-container { width: 100%; max-height: min(72vh, 42rem); }
        .hero-video { max-width: 100%; max-height: min(72vh, 42rem); }
        .hero-video.is-landscape, .hero-video.is-portrait, .hero-video.is-square { width: 100%; max-width: 100%; }
        .content-panel h1 { font-size: clamp(0.98rem, 4.6vw, 1.3rem); }
      }
    </style>
  </head>
  <body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <main class="shell">
      <section class="card">
        ${variantBadgeMarkup}
        <div class="media-panel">
          ${previewMedia}
        </div>
        <div class="content-panel">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
      </section>
    </main>

    <a id="overlay" class="overlay delayed-hidden" href="${escapeHtml(primaryRedirectUrl)}" aria-label="${overlayAriaLabel}">${overlayHintMarkup}</a>

    <script>
      (() => {
        const overlay = document.getElementById("overlay");
        const mediaPanel = document.querySelector(".media-panel");
        const heroVideo = document.querySelector(".hero-video");
        const primaryRedirectUrl = "${escapeJsString(primaryRedirectUrl)}";
        const secondaryRedirectUrl = "${escapeJsString(secondaryRedirectUrl)}";
        const secondaryTargetUrl = "${escapeJsString(secondaryUrl)}";
        const hasSecondaryRedirect = ${hasSecondaryRedirect ? "true" : "false"};
        const clickTrackingUrl = "${escapeJsString(clickTrackingUrl)}";
        const outboundTrackingUrl = "${escapeJsString(outboundTrackingUrl)}";
        const secondaryStateKey = "${escapeJsString(secondaryStateKey)}";
        const secondaryStateCookieName =
          "${escapeJsString(`hn_choice_state_${link.short_code}`)}";

        let overlayHandled = false;
        let overlayVisible = false;
        let awaitingSecondaryPlay = false;
        let previewPlaybackMs = 0;
        let previewPlaybackStartedAt = 0;
        let previewPlaybackIntervalId = null;

        const getPreviewPlaybackMs = () =>
          previewPlaybackMs +
          (previewPlaybackStartedAt ? Date.now() - previewPlaybackStartedAt : 0);

        const clearPreviewPlaybackInterval = () => {
          if (previewPlaybackIntervalId === null) return;
          window.clearInterval(previewPlaybackIntervalId);
          previewPlaybackIntervalId = null;
        };

        const stopPreviewPlaybackTracking = () => {
          if (previewPlaybackStartedAt) {
            previewPlaybackMs += Date.now() - previewPlaybackStartedAt;
            previewPlaybackStartedAt = 0;
          }
          clearPreviewPlaybackInterval();
        };

        const hideOverlay = () => {
          if (!overlay) return;
          overlayVisible = false;
          overlay.classList.add("hidden");
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
          overlay.style.pointerEvents = "none";
        };

        const showOverlay = () => {
          if (!overlay || overlayHandled || overlayVisible || awaitingSecondaryPlay) return;
          stopPreviewPlaybackTracking();
          overlayVisible = true;
          if (heroVideo instanceof HTMLVideoElement) {
            try {
              heroVideo.pause();
            } catch (error) {}
          }
          overlay.classList.remove("hidden", "delayed-hidden");
          overlay.style.display = "flex";
          overlay.style.opacity = "1";
          overlay.style.visibility = "visible";
          overlay.style.pointerEvents = "auto";
        };

        const setSecondaryStateCookie = (value) => {
          try {
            document.cookie =
              secondaryStateCookieName +
              "=" +
              encodeURIComponent(JSON.stringify(value)) +
              "; Max-Age=${PRIMARY_RETURN_WINDOW_MS / 1000}; Path=/; SameSite=Lax";
          } catch (error) {}
        };

        const readSecondaryStateCookie = () => {
          try {
            const allCookies = document.cookie ? document.cookie.split("; ") : [];
            for (const entry of allCookies) {
              if (!entry.startsWith(secondaryStateCookieName + "=")) continue;
              return decodeURIComponent(
                entry.slice(secondaryStateCookieName.length + 1),
              );
            }
          } catch (error) {}
          return null;
        };

        const clearSecondaryStateCookie = () => {
          try {
            document.cookie =
              secondaryStateCookieName +
              "=; Max-Age=0; Path=/; SameSite=Lax";
          } catch (error) {}
        };

        const writeSecondaryState = (value) => {
          const serialized = JSON.stringify(value);
          try {
            sessionStorage.setItem(secondaryStateKey, serialized);
          } catch (error) {}
          try {
            localStorage.setItem(secondaryStateKey, serialized);
          } catch (error) {}
          setSecondaryStateCookie(value);
        };

        const readSecondaryState = () => {
          let rawState = null;
          try {
            rawState = sessionStorage.getItem(secondaryStateKey);
          } catch (error) {}
          if (rawState) return rawState;
          try {
            rawState = localStorage.getItem(secondaryStateKey);
          } catch (error) {}
          if (rawState) return rawState;
          rawState = readSecondaryStateCookie();
          return rawState;
        };

        const removeSecondaryState = () => {
          try {
            sessionStorage.removeItem(secondaryStateKey);
          } catch (error) {}
          try {
            localStorage.removeItem(secondaryStateKey);
          } catch (error) {}
          clearSecondaryStateCookie();
        };

        const persistPrimaryOpened = () => {
          writeSecondaryState({ primaryOpenedAt: Date.now() });
        };

        const persistSecondaryOpened = () => {
          if (!hasSecondaryRedirect) return;
          writeSecondaryState({ secondaryOpenedAt: Date.now() });
        };

        const clearLandingState = () => {
          stopPreviewPlaybackTracking();
          awaitingSecondaryPlay = false;
          removeSecondaryState();
        };

        const postJsonKeepalive = (url, payload) => {
          if (!url) return;
          const body = JSON.stringify(payload);
          try {
            if (navigator.sendBeacon) {
              navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
              return;
            }
          } catch (error) {}

          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        };

        const trackPrimaryClick = () => {
          postJsonKeepalive(clickTrackingUrl, { ts: Date.now() });
        };

        const trackSecondaryOutbound = () => {
          postJsonKeepalive(outboundTrackingUrl, {
            stage: "secondary",
            destination_url: secondaryTargetUrl,
            ts: Date.now(),
          });
        };

        const syncLandingState = () => {
          try {
            const rawState = readSecondaryState();
            if (!rawState || rawState === "undefined" || rawState === "null") {
              awaitingSecondaryPlay = false;
              return;
            }

            let parsedState;
            try {
              const parsed = JSON.parse(rawState);
              if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                clearLandingState();
                return;
              }
              parsedState = parsed;
            } catch {
              clearLandingState();
              return;
            }

            const secondaryOpenedAt = Number(parsedState?.secondaryOpenedAt || 0);
            const secondaryAgeMs = Date.now() - secondaryOpenedAt;

            if (
              Number.isFinite(secondaryOpenedAt) &&
              secondaryOpenedAt > 0 &&
              secondaryAgeMs >= 0 &&
              secondaryAgeMs <= ${PRIMARY_RETURN_WINDOW_MS}
            ) {
              stopPreviewPlaybackTracking();
              awaitingSecondaryPlay = false;
              overlayHandled = true;
              hideOverlay();
              return;
            }

            const primaryOpenedAt = Number(parsedState?.primaryOpenedAt || 0);
            const ageMs = Date.now() - primaryOpenedAt;

            if (
              !Number.isFinite(primaryOpenedAt) ||
              primaryOpenedAt <= 0 ||
              ageMs < 0 ||
              ageMs > ${PRIMARY_RETURN_WINDOW_MS}
            ) {
              clearLandingState();
              return;
            }

            overlayHandled = true;
            stopPreviewPlaybackTracking();
            hideOverlay();

            if (!hasSecondaryRedirect) {
              awaitingSecondaryPlay = false;
              return;
            }

            awaitingSecondaryPlay = true;

            if (heroVideo instanceof HTMLVideoElement) {
              try {
                heroVideo.pause();
                heroVideo.autoplay = false;
              } catch (error) {}
            }
          } catch (error) {
            clearLandingState();
          }
        };

        const handleOverlayContinue = () => {
          if (overlayHandled) return;
          overlayHandled = true;
          persistPrimaryOpened();
          trackPrimaryClick();
          hideOverlay();
        };

        const handleSecondaryPlayIntent = () => {
          if (!awaitingSecondaryPlay || !secondaryTargetUrl) return;
          awaitingSecondaryPlay = false;
          overlayHandled = true;
          persistSecondaryOpened();
          trackSecondaryOutbound();
          try {
            if (heroVideo instanceof HTMLVideoElement) {
              heroVideo.pause();
            }
          } catch (error) {}
          window.location.replace(secondaryRedirectUrl);
        };

        const maybeShowOverlayAfterPlayback = () => {
          if (!overlayHandled && !awaitingSecondaryPlay && getPreviewPlaybackMs() >= 5000) {
            showOverlay();
          }
        };

        const startPreviewPlaybackTracking = () => {
          if (
            !(heroVideo instanceof HTMLVideoElement) ||
            overlayHandled ||
            overlayVisible ||
            awaitingSecondaryPlay ||
            heroVideo.paused ||
            heroVideo.ended ||
            heroVideo.seeking ||
            heroVideo.readyState < 2
          ) {
            return;
          }

          if (!previewPlaybackStartedAt) {
            previewPlaybackStartedAt = Date.now();
          }

          if (previewPlaybackIntervalId === null) {
            previewPlaybackIntervalId = window.setInterval(
              maybeShowOverlayAfterPlayback,
              200,
            );
          }

          maybeShowOverlayAfterPlayback();
        };

        const syncHeroVideoOrientation = () => {
          if (
            !(heroVideo instanceof HTMLVideoElement) ||
            !(mediaPanel instanceof HTMLElement)
          ) {
            return;
          }

          const videoWidth = heroVideo.videoWidth;
          const videoHeight = heroVideo.videoHeight;
          if (!videoWidth || !videoHeight) return;

          const orientation =
            videoWidth > videoHeight
              ? "landscape"
              : videoHeight > videoWidth
                ? "portrait"
                : "square";

          heroVideo.classList.remove(
            "is-landscape",
            "is-portrait",
            "is-square",
          );
          heroVideo.classList.add("is-" + orientation);
          mediaPanel.dataset.videoOrientation = orientation;
        };

        if (overlay) {
          overlay.addEventListener("click", handleOverlayContinue);
          overlay.addEventListener("keydown", (event) => {
            if (event.key === " ") {
              event.preventDefault();
              handleOverlayContinue();
              if (overlay instanceof HTMLAnchorElement) {
                overlay.click();
              }
            }
          });
        }

        if (heroVideo instanceof HTMLVideoElement) {
          const startVideoPreview = () => {
            if (awaitingSecondaryPlay) return;
            heroVideo.muted = true;
            heroVideo.defaultMuted = true;
            heroVideo.playsInline = true;
            heroVideo.autoplay = true;
            heroVideo.loop = true;
            heroVideo.controls = true;
            const playAttempt = heroVideo.play();
            if (playAttempt && typeof playAttempt.catch === "function") {
              playAttempt.catch(() => {});
            }
          };

          syncLandingState();
          heroVideo.addEventListener("playing", startPreviewPlaybackTracking);
          heroVideo.addEventListener("timeupdate", maybeShowOverlayAfterPlayback);
          heroVideo.addEventListener("pause", stopPreviewPlaybackTracking);
          heroVideo.addEventListener("waiting", stopPreviewPlaybackTracking);
          heroVideo.addEventListener("seeking", stopPreviewPlaybackTracking);
          heroVideo.addEventListener("stalled", stopPreviewPlaybackTracking);
          heroVideo.addEventListener("ended", stopPreviewPlaybackTracking);
          heroVideo.addEventListener("play", handleSecondaryPlayIntent);
          heroVideo.addEventListener("canplay", startVideoPreview, { once: true });
          heroVideo.addEventListener("loadedmetadata", syncHeroVideoOrientation);
          heroVideo.addEventListener("resize", syncHeroVideoOrientation);
          startVideoPreview();
          syncHeroVideoOrientation();
          startPreviewPlaybackTracking();
          maybeShowOverlayAfterPlayback();
        } else {
          syncLandingState();
          if (!overlayHandled && !awaitingSecondaryPlay) {
            showOverlay();
          }
        }

        window.addEventListener("pageshow", syncLandingState);
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            syncLandingState();
          }
        });
        window.addEventListener("focus", syncLandingState);
        syncLandingState();
      })();
    </script>
  </body>
</html>`;
};
