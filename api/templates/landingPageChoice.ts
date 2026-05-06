import { PublicLinkRecord } from "../types/index.js";

const SHOPEE_HOST_REGEX = /(^|\.)shopee\.[a-z.]+$/i;
const TIKTOK_HOST_REGEX =
  /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i;
const PRIMARY_RETURN_WINDOW_MS = 30 * 60 * 1000;

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

const getDestinationLabel = (url: string, fallback: string) => {
  if (!url) return fallback;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (SHOPEE_HOST_REGEX.test(hostname)) {
      return "Mo tren Shopee";
    }
    if (TIKTOK_HOST_REGEX.test(hostname)) {
      return "Mo tren TikTok";
    }
    return fallback;
  } catch {
    return fallback;
  }
};

export const renderChoiceLandingPage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
  clickTrackingUrl: string,
) => {
  const title = capitalizeFirstCharacter(
    link.custom_title?.trim() || "HotsNew Click",
  );
  const description = capitalizeFirstCharacter(
    link.custom_description?.trim() ||
      "Noi dung dang san sang. Bam vao man hinh de tiep tuc.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = link.video_url?.trim() || "";
  const originalUrl = link.original_url.trim();
  const secondaryUrl = link.secondary_url?.trim() || "";
  const hasVideo = Boolean(videoUrl);
  const hasSecondaryRedirect = hasVideo && Boolean(secondaryUrl);
  const defaultOgImage = `${canonicalUrl.replace(/\/s-choice\/[^/]+$/, "")}/og-image.png`;
  const fallbackFavicon = `${canonicalUrl.replace(/\/s-choice\/[^/]+$/, "")}/logo-app-192.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const primaryLabel = getDestinationLabel(originalUrl, "Mo link chinh");
  const secondaryLabel = getDestinationLabel(secondaryUrl, "Mo buoc 2");
  const overlayDescription = hasSecondaryRedirect
    ? "Video se dung lai sau 5 giay. Bam vao lop mo de mo buoc 1. Neu quay lai trang nay, bam play video de mo buoc 2."
    : "Video se dung lai sau 5 giay. Bam vao lop mo de mo link chinh.";
  const clickOnlyTrackingUrl =
    clickTrackingUrl.slice(-6) === "/track"
      ? `${clickTrackingUrl.slice(0, -6)}/track-preview-click`
      : `${clickTrackingUrl}/track-preview-click`;
  const secondaryStateKey = `hn.choice-state.${link.short_code}`;

  const previewMedia = `<div class="video-container"><video class="hero-media hero-video" src="${escapeHtml(videoUrl)}" controls muted autoplay loop playsinline webkit-playsinline x5-playsinline preload="auto" poster="${escapeHtml(imageUrl || socialImageUrl)}"></video></div>`;

  const metaVideo = `<meta property="og:video" content="${escapeHtml(videoUrl)}" /><meta property="og:video:type" content="video/mp4" /><meta property="og:video:secure_url" content="${escapeHtml(videoUrl)}" />`;
  const metaImage = `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" /><meta property="og:image:alt" content="${escapeHtml(title)}" /><meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`;
  const resumeHintMarkup = hasSecondaryRedirect
    ? `<div id="resumeHint" class="resume-hint hidden"><div class="resume-hint-badge">Buoc 2 san sang</div><div class="resume-hint-text">Neu da mo buoc 1 va quay lai trang nay, bam play video de mo ${escapeHtml(secondaryLabel)}.</div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="HotsNew Click Choice Mode" />
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
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.7));
      }
      .hero-media { width: 100%; height: 100%; display: block; object-fit: cover; }
      .hero-video { width: 100%; height: 100%; object-fit: cover; background: #000; -webkit-touch-callout: none; }
      .video-container { position: relative; width: 100%; height: 100%; }
      .content-panel { padding: 1rem; border-top: 1px solid var(--border); }
      .content-panel h1 { margin: 0 0 0.5rem; font-size: 1.25rem; line-height: 1.4; }
      .content-panel p { margin: 0; font-size: 0.92rem; line-height: 1.55; color: var(--muted); }
      .overlay {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem;
        background: rgba(2, 6, 23, 0.95);
        backdrop-filter: blur(4px);
        z-index: 9999;
        cursor: pointer;
        transition: opacity 220ms ease, visibility 220ms ease;
      }
      .overlay.hidden { opacity: 0; visibility: hidden; pointer-events: none; display: none !important; }
      .overlay.delayed-hidden { opacity: 0; visibility: hidden; pointer-events: none; animation: overlayRevealAfterDelay 0.01s step-end 5s forwards; }
      @keyframes overlayRevealAfterDelay {
        to {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
      }
      .overlay-card {
        width: min(92vw, 28rem);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 1.8rem;
        padding: 1.6rem;
        text-align: center;
        background: rgba(15, 23, 42, 0.92);
        box-shadow: 0 1.4rem 3rem rgba(0,0,0,0.34);
      }
      .overlay-kicker {
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(226,232,240,0.7);
      }
      .overlay-title {
        margin-top: 0.8rem;
        font-size: 1.25rem;
        font-weight: 900;
        line-height: 1.35;
      }
      .overlay-desc {
        margin-top: 0.65rem;
        font-size: 0.9rem;
        line-height: 1.55;
        color: rgba(226,232,240,0.82);
      }
      .overlay-cta {
        margin-top: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0.95rem 1.2rem;
        background: linear-gradient(135deg, rgba(251, 113, 133, 0.96), rgba(249, 115, 22, 0.98));
        color: #fff;
        font-size: 0.84rem;
        font-weight: 900;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        box-shadow: 0 1rem 2.4rem rgba(249, 115, 22, 0.32);
      }
      .resume-hint {
        position: fixed;
        left: 50%;
        bottom: 1rem;
        z-index: 9998;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: min(92vw, 28rem);
        transform: translateX(-50%);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 1.4rem;
        padding: 0.9rem 1rem;
        background: rgba(9, 18, 32, 0.9);
        backdrop-filter: blur(16px);
        box-shadow: 0 1rem 2.5rem rgba(0,0,0,0.3);
      }
      .resume-hint.hidden { display: none !important; }
      .resume-hint-badge {
        flex: none;
        border-radius: 999px;
        padding: 0.45rem 0.75rem;
        background: rgba(249, 115, 22, 0.16);
        color: #fdba74;
        font-size: 0.66rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .resume-hint-text {
        font-size: 0.8rem;
        line-height: 1.45;
        color: rgba(226, 232, 240, 0.84);
      }
      @media (max-width: 900px) {
        .content-panel { padding: 1.2rem 1rem 1.4rem; }
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
        <div class="variant-badge">Choice Mode</div>
        <div class="media-panel">
          ${previewMedia}
        </div>
        <div class="content-panel">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
      </section>
    </main>

    <div id="overlay" class="overlay delayed-hidden" role="button" tabindex="0" aria-label="Mo buoc tiep theo">
      <div class="overlay-card">
        <div class="overlay-kicker">Ban sao thu nghiem</div>
        <div class="overlay-title">${hasSecondaryRedirect ? "Cham de mo buoc 1" : "Cham de tiep tuc"}</div>
        <div class="overlay-desc">${escapeHtml(overlayDescription)}</div>
        <div class="overlay-cta">${escapeHtml(primaryLabel)}</div>
      </div>
    </div>

    ${resumeHintMarkup}

    <script>
      (() => {
        const overlay = document.getElementById("overlay");
        const heroVideo = document.querySelector(".hero-video");
        const resumeHint = document.getElementById("resumeHint");
        const primaryTargetUrl = "${escapeJsString(originalUrl)}";
        const secondaryTargetUrl = "${escapeJsString(secondaryUrl)}";
        const hasSecondaryRedirect = ${hasSecondaryRedirect ? "true" : "false"};
        const clickOnlyTrackingUrl = "${escapeJsString(clickOnlyTrackingUrl)}";
        const outboundTrackingUrl =
          "${escapeJsString(clickTrackingUrl)}".slice(-6) === "/track"
            ? "${escapeJsString(clickTrackingUrl)}".slice(0, -6) + "/track-outbound"
            : "${escapeJsString(clickTrackingUrl)}" + "/track-outbound";
        const secondaryStateKey = "${escapeJsString(secondaryStateKey)}";

        let previewTracked = false;
        let overlayHandled = false;
        let awaitingSecondaryPlay = false;

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

        const trackPreviewClick = () => {
          if (previewTracked) return;
          previewTracked = true;
          postJsonKeepalive(clickOnlyTrackingUrl, { ts: Date.now() });
        };

        const trackOutbound = (stage) => {
          postJsonKeepalive(outboundTrackingUrl, { stage, ts: Date.now() });
        };

        const showResumeHint = () => {
          if (!resumeHint) return;
          resumeHint.classList.remove("hidden");
        };

        const hideResumeHint = () => {
          if (!resumeHint) return;
          resumeHint.classList.add("hidden");
        };

        const hideOverlay = () => {
          if (!overlay) return;
          overlay.classList.add("hidden");
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
          overlay.style.pointerEvents = "none";
        };

        const showOverlay = () => {
          if (!overlay || overlayHandled || awaitingSecondaryPlay) return;
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

        const isAffiliateCommerceUrl = (url) => {
          if (!url) return false;
          try {
            const hostname = new URL(url).hostname.toLowerCase();
            return /(^|\\.)shopee\\.[a-z.]+$/i.test(hostname) || /(^|\\.)tiktok\\.com$|(^|\\.)vt\\.tiktok\\.com$|(^|\\.)vm\\.tiktok\\.com$/i.test(hostname);
          } catch (error) {
            return false;
          }
        };

        const openUrl = (url) => {
          if (!url) return;
          if (isAffiliateCommerceUrl(url)) {
            window.location.assign(url);
            return;
          }

          try {
            const popup = window.open(url, "_blank", "noopener,noreferrer");
            if (popup) return;
          } catch (error) {}

          window.location.href = url;
        };

        const persistPrimaryOpened = () => {
          if (!hasSecondaryRedirect) return;
          try {
            sessionStorage.setItem(
              secondaryStateKey,
              JSON.stringify({ primaryOpenedAt: Date.now() }),
            );
          } catch (error) {}
        };

        const clearSecondaryState = () => {
          awaitingSecondaryPlay = false;
          hideResumeHint();
          try {
            sessionStorage.removeItem(secondaryStateKey);
          } catch (error) {}
        };

        const syncSecondaryState = () => {
          if (!hasSecondaryRedirect) {
            awaitingSecondaryPlay = false;
            return;
          }

          try {
            const rawState = sessionStorage.getItem(secondaryStateKey);
            if (!rawState) {
              awaitingSecondaryPlay = false;
              hideResumeHint();
              return;
            }

            const parsedState = JSON.parse(rawState);
            const primaryOpenedAt = Number(parsedState?.primaryOpenedAt || 0);
            const ageMs = Date.now() - primaryOpenedAt;

            if (
              !Number.isFinite(primaryOpenedAt) ||
              primaryOpenedAt <= 0 ||
              ageMs < 0 ||
              ageMs > ${PRIMARY_RETURN_WINDOW_MS}
            ) {
              clearSecondaryState();
              return;
            }

            awaitingSecondaryPlay = true;
            overlayHandled = true;
            hideOverlay();
            showResumeHint();

            if (heroVideo instanceof HTMLVideoElement) {
              try {
                heroVideo.pause();
                heroVideo.autoplay = false;
              } catch (error) {}
            }
          } catch (error) {
            clearSecondaryState();
          }
        };

        const handleOverlayContinue = () => {
          overlayHandled = true;
          trackPreviewClick();
          persistPrimaryOpened();
          hideOverlay();
          trackOutbound("primary");
          openUrl(primaryTargetUrl);
        };

        const handleSecondaryPlayIntent = () => {
          if (!awaitingSecondaryPlay || !secondaryTargetUrl) return;
          clearSecondaryState();
          try {
            if (heroVideo instanceof HTMLVideoElement) {
              heroVideo.pause();
            }
          } catch (error) {}
          trackOutbound("secondary");
          openUrl(secondaryTargetUrl);
        };

        if (overlay) {
          overlay.addEventListener("click", handleOverlayContinue);
          overlay.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOverlayContinue();
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

          startVideoPreview();
          heroVideo.addEventListener("canplay", startVideoPreview, { once: true });
          heroVideo.addEventListener("timeupdate", () => {
            if (!awaitingSecondaryPlay && (heroVideo.currentTime || 0) >= 5) {
              showOverlay();
            }
          });
          heroVideo.addEventListener("play", handleSecondaryPlayIntent);

          window.setTimeout(() => {
            if (!awaitingSecondaryPlay) {
              showOverlay();
            }
          }, 5000);
        }

        window.addEventListener("pageshow", syncSecondaryState);
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            syncSecondaryState();
          }
        });
        syncSecondaryState();
      })();
    </script>
  </body>
</html>`;
};
