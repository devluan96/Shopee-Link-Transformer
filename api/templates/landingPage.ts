import { PublicLinkRecord } from "../types/index.js";
import { normalizeRedirectDelayMs } from "../utils/normalizers.js";

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

export const renderLinkLandingPage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
  clickTrackingUrl: string,
) => {
  const title = capitalizeFirstCharacter(
    link.custom_title?.trim() || "HotsNew Click",
  );
  const description = capitalizeFirstCharacter(
    link.custom_description?.trim() ||
      "Nội dung đang sẵn sàng. Bấm vào màn hình để tiếp tục.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = link.video_url?.trim() || "";
  const originalUrl = link.original_url.trim();
  const secondaryUrl = link.secondary_url?.trim() || "";
  const redirectDelayMs = normalizeRedirectDelayMs(link.redirect_delay_ms);
  const hasSecondaryRedirect = Boolean(secondaryUrl);
  const defaultOgImage = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/og-image.png`;
  const fallbackFavicon = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/logo-app-192.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const hasVideo = Boolean(videoUrl);

  // YouTube-like preview media sizing
  const previewMedia = hasVideo
    ? `<div class="video-container" style="position:relative;width:100%;height:100%;"><video class="hero-media hero-video" src="${escapeHtml(videoUrl)}" controls muted autoplay loop playsinline webkit-playsinline x5-playsinline preload="auto" poster="${escapeHtml(imageUrl || socialImageUrl)}" x-webkit-airplay="allow" x5-video-player-type="h5-page"></video></div>`
    : imageUrl
      ? `<img class="hero-media hero-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />`
      : `<div class="hero-placeholder"><div class="hero-placeholder-ring"></div><div class="hero-placeholder-core">HN</div></div>`;

  const metaVideo = hasVideo
    ? `<meta property="og:video" content="${escapeHtml(videoUrl)}" /><meta property="og:video:type" content="video/mp4" /><meta property="og:video:secure_url" content="${escapeHtml(videoUrl)}" />`
    : "";

  const metaImage = `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" /><meta property="og:image:alt" content="${escapeHtml(title)}" /><meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    image: socialImageUrl,
    inLanguage: "vi-VN",
    isPartOf: {
      "@type": "WebSite",
      name: "HotsNew Click",
      url: canonicalUrl.replace(/\/s\/[^/]+$/, "/"),
    },
  };

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="HotsNew Click" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${metaImage}
    ${metaVideo}
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(9, 18, 32, 0.58);
        --border: rgba(255, 255, 255, 0.14);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.78);
        --accent: #fb7185;
        --accent2: #22d3ee;
        --accent3: #f59e0b;
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
      .orb {
        position: fixed;
        border-radius: 999px;
        filter: blur(12px);
        opacity: 0.9;
        transform: translateZ(0);
        pointer-events: none;
      }
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
      .hero-media {
        width: 100%;
        height: 100%;
        border-radius: 0;
        display: block;
        object-fit: cover;
      }
      .hero-video { width: 100%; height: 100%; object-fit: cover; border-radius: 0; background: #000; -webkit-touch-callout: none; }
      .video-container { position: relative; width: 100%; height: 100%; }
      .secondary-gate { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: rgba(2, 6, 23, 0.88); backdrop-filter: blur(8px); z-index: 24; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 220ms ease, visibility 220ms ease; }
      .secondary-gate.is-visible { opacity: 1; visibility: visible; pointer-events: auto; }
      .secondary-gate-card { width: min(92vw, 28rem); border: 1px solid rgba(255,255,255,0.12); border-radius: 1.8rem; padding: 1.4rem; background: rgba(15, 23, 42, 0.92); box-shadow: 0 1.4rem 3rem rgba(0,0,0,0.34); text-align: center; }
      .secondary-gate-kicker { font-size: 0.72rem; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(226,232,240,0.7); }
      .secondary-gate-title { margin-top: 0.7rem; font-size: 1.2rem; font-weight: 900; line-height: 1.35; color: #fff; }
      .secondary-gate-desc { margin-top: 0.6rem; font-size: 0.88rem; line-height: 1.55; color: rgba(226,232,240,0.78); }
      .secondary-gate-button { margin-top: 1rem; width: 100%; appearance: none; border: 0; border-radius: 999px; padding: 1rem 1.2rem; background: linear-gradient(135deg, rgba(251, 113, 133, 0.96), rgba(249, 115, 22, 0.98)); color: #fff; font-size: 0.84rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; box-shadow: 0 1rem 2.4rem rgba(249, 115, 22, 0.32); }
      .hero-video.is-landscape,
      .hero-video.is-portrait,
      .hero-video.is-square { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
      .hero-image { width: 100%; height: 100%; object-fit: cover; }
      .hero-placeholder { width: 100%; aspect-ratio: 16 / 9; border-radius: 0; display: grid; place-items: center; background: radial-gradient(circle at 30% 24%, rgba(34, 211, 238, 0.2), transparent 18%), radial-gradient(circle at 72% 68%, rgba(251, 113, 133, 0.24), transparent 24%), linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.7)); }
      .hero-placeholder-ring { position: absolute; width: 10rem; height: 10rem; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 999px; }
      .hero-placeholder-core { position: relative; width: 6rem; height: 6rem; display: grid; place-items: center; border-radius: 1.5rem; background: linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(239, 68, 68, 1)); font-size: 1.6rem; font-weight: 900; letter-spacing: 0.06em; box-shadow: 0 1rem 2rem rgba(249, 115, 22, 0.26); }
      .content-panel { width: 100%; max-width: 100%; display: flex; flex-direction: column; align-items: stretch; text-align: left; padding: 1rem; background: var(--panel); border-top: 1px solid var(--border); border-radius: 0; box-sizing: border-box; }
      .headline { display: block; width: 100%; max-width: 100%; margin-bottom: 0.5rem; }
      .headline h1 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; color: #f1f1f1; margin: 0; font-family: "Roboto", "Arial", sans-serif; width: 100%; max-width: 100%; display: block; }
      .content-panel p { font-size: 0.9rem; line-height: 1.5; color: #aaaaaa; margin: 0; font-family: "Roboto", "Arial", sans-serif; width: 100%; max-width: 100%; display: block; }
      .overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(4px); z-index: 9999; cursor: pointer; transition: opacity 220ms ease, visibility 220ms ease; }
      .overlay.hidden { opacity: 0; visibility: hidden; pointer-events: none; display: none !important; }
      .overlay.delayed-hidden { opacity: 0; visibility: hidden; pointer-events: none; animation: overlayRevealAfterDelay 0.01s step-end 5s forwards; }
      .overlay.auto-reveal {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        animation: overlayRevealAfterDelay 0.01s step-end 5s forwards;
      }
      @keyframes overlayRevealAfterDelay {
        to {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
      }
      .action-dock { position: fixed; left: 50%; bottom: 1rem; z-index: 22; display: none; width: min(92vw, 32rem); transform: translateX(-50%); gap: 0.75rem; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.14); border-radius: 1.5rem; background: rgba(9, 18, 32, 0.82); backdrop-filter: blur(18px); box-shadow: 0 1rem 2.5rem rgba(0,0,0,0.32); }
      .action-dock.is-visible { display: flex; }
      .action-dock-button { flex: 1; appearance: none; border: 0; border-radius: 999px; padding: 0.95rem 1rem; color: #fff; font-size: 0.8rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; }
      .action-dock-primary { background: linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(251, 146, 60, 0.96)); box-shadow: 0 1rem 2.4rem rgba(249, 115, 22, 0.22); }
      .action-dock-secondary { background: rgba(30, 41, 59, 0.96); border: 1px solid rgba(255,255,255,0.12); }
      .debug-panel { position: fixed; inset: auto 0 0 0; z-index: 40; display: none; max-height: 42vh; overflow: auto; padding: 0.75rem; background: rgba(2, 6, 23, 0.92); border-top: 1px solid rgba(255,255,255,0.1); font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; color: #dbeafe; white-space: pre-wrap; }
      .debug-panel.is-visible { display: block; }
      .debug-entry { padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
      @media (max-width: 900px) {
        .content-panel { padding: 1.2rem 1rem 1.4rem; }
        .hero-media, .hero-placeholder, .video-container { width: 100%; max-height: min(64vh, 32rem); }
        .hero-video { max-width: 100%; max-height: min(72vh, 36rem); }
        .hero-video.is-landscape, .hero-video.is-portrait, .hero-video.is-square { width: 100%; max-width: 100%; }
        h1 { max-width: 100%; font-size: clamp(0.98rem, 4.6vw, 1.3rem); }
        .action-dock { width: calc(100vw - 1.25rem); bottom: 0.625rem; }
      }
    </style>
  </head>
  <body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <main class="shell">
      <section class="card">
        <div class="media-panel">
          ${previewMedia}
        </div>
        <div class="content-panel">
          <div class="headline">
            <h1>${escapeHtml(title)}</h1>
          </div>
          <p>${escapeHtml(description)}</p>
        </div>
      </section>
    </main>
    <div id="overlay" class="overlay ${hasVideo ? "delayed-hidden" : ""}" role="button" tabindex="0" aria-label="Mở link đích">
      <div class="overlay-content" style="color:#fff;font-size:1.1rem;text-align:center;padding:2rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">👆</div>
        <div>${hasVideo ? "Click vào đây để ủng hộ rồi trở về để xem tiếp" : "Click vào đây để tiếp tục"}</div>
      </div>
    </div>
    <div id="actionDock" class="action-dock">
      <button type="button" class="action-dock-button action-dock-primary" id="primaryActionButton">Mở link gốc</button>
      ${
        hasSecondaryRedirect
          ? `<button type="button" class="action-dock-button action-dock-secondary" id="secondaryActionButton">Mở bước 2</button>`
          : ""
      }
    </div>
    <div id="debugPanel" class="debug-panel"></div>
    ${
      hasSecondaryRedirect
        ? `<div class="secondary-gate" id="secondaryGate"><div class="secondary-gate-card"><div class="secondary-gate-kicker">Tiếp tục xem</div><div class="secondary-gate-title">Bấm để xem tiếp nội dung</div><div class="secondary-gate-desc">Để tiếp tục phát video và xem phần còn lại, hãy mở bước tiếp theo.</div><button type="button" class="secondary-gate-button" id="secondaryGateButton">Tiếp tục xem ngay</button></div></div>`
        : ""
    }
    <script>
      (() => {
        const overlay = document.getElementById("overlay");
        const heroVideo = document.querySelector(".hero-video");
        const primaryActionButton = document.getElementById("primaryActionButton");
        const secondaryActionButton = document.getElementById("secondaryActionButton");
        const secondaryGate = document.getElementById("secondaryGate");
        const secondaryGateButton = document.getElementById("secondaryGateButton");
        const primaryTargetUrl = "${escapeJsString(originalUrl)}";
        const secondaryTargetUrl = "${escapeJsString(secondaryUrl)}";
        const hasVideo = ${hasVideo ? "true" : "false"};
        const hasSecondaryRedirect = ${hasSecondaryRedirect ? "true" : "false"};
        const clickTrackingUrl = "${escapeJsString(clickTrackingUrl)}";
        const outboundTrackingUrl =
          clickTrackingUrl.slice(-6) === "/track"
            ? clickTrackingUrl.slice(0, -6) + "/track-outbound"
            : clickTrackingUrl + "/track-outbound";
        let primaryOpened = false;
        let secondaryOpened = false;

        const hideOverlay = () => {
          if (!overlay) return;
          overlay.classList.add("hidden");
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
          overlay.style.pointerEvents = "none";
        };

        const showOverlay = () => {
          if (!overlay || primaryOpened) return;
          overlay.classList.remove("hidden", "delayed-hidden");
          overlay.style.display = "flex";
          overlay.style.opacity = "1";
          overlay.style.visibility = "visible";
          overlay.style.pointerEvents = "auto";
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

        const trackRealClick = () => postJsonKeepalive(clickTrackingUrl, { ts: Date.now() });
        const trackOutbound = (stage) => postJsonKeepalive(outboundTrackingUrl, { stage, ts: Date.now() });

        const isAffiliateCommerceUrl = (url) => {
          if (!url) return false;
          try {
            const hostname = new URL(url).hostname.toLowerCase();
            return /(^|\.)shopee\.[a-z.]+$/i.test(hostname) || /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i.test(hostname);
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

        const openPrimaryStep = () => {
          if (primaryOpened) return;
          primaryOpened = true;
          trackRealClick();
          trackOutbound("primary");
          hideOverlay();

          if (hasSecondaryRedirect && secondaryGate) {
            secondaryGate.classList.add("is-visible");
            return;
          }

          openUrl(primaryTargetUrl);
        };

        const openSecondaryStep = () => {
          if (!hasSecondaryRedirect || secondaryOpened) return;
          secondaryOpened = true;
          if (secondaryGate) {
            secondaryGate.classList.remove("is-visible");
          }
          openUrl(secondaryTargetUrl);
        };

        if (overlay) {
          overlay.addEventListener("click", openPrimaryStep);
          overlay.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPrimaryStep();
            }
          });
        }

        if (primaryActionButton) {
          primaryActionButton.addEventListener("click", (event) => {
            event.preventDefault();
            openPrimaryStep();
          });
        }

        if (secondaryActionButton) {
          secondaryActionButton.addEventListener("click", (event) => {
            event.preventDefault();
            openSecondaryStep();
          });
        }

        if (secondaryGateButton) {
          secondaryGateButton.addEventListener("click", (event) => {
            event.preventDefault();
            openSecondaryStep();
          });
        }

        if (heroVideo instanceof HTMLVideoElement) {
          const startVideoPreview = () => {
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
            if ((heroVideo.currentTime || 0) >= 5) {
              showOverlay();
            }
          });

          window.setTimeout(showOverlay, 5000);
        } else if (!hasVideo) {
          showOverlay();
        }
      })();
    </script>
  </body>
</html>`;
};
