import { PublicLinkRecord } from "../types/index.js";

const SHOPEE_HOST_REGEX = /(^|\.)shopee\.[a-z.]+$/i;
const TIKTOK_HOST_REGEX =
  /(^|\.)tiktok\.com$|(^|\.)vt\.tiktok\.com$|(^|\.)vm\.tiktok\.com$/i;

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
      return "Mua trên Shopee";
    }
    if (TIKTOK_HOST_REGEX.test(hostname)) {
      return "Xem trên TikTok";
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const getDestinationHint = (url: string) => {
  if (!url) return "";
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (SHOPEE_HOST_REGEX.test(hostname)) {
      return "Ưu tiên mở app hoặc web Shopee";
    }
    if (TIKTOK_HOST_REGEX.test(hostname)) {
      return "Ưu tiên mở app hoặc web TikTok";
    }
    return hostname.replace(/^www\./, "");
  } catch {
    return "Liên kết ngoài";
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
      "Nội dung đang sẵn sàng. Bấm vào màn hình để tiếp tục.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = link.video_url?.trim() || "";
  const originalUrl = link.original_url.trim();
  const secondaryUrl = link.secondary_url?.trim() || "";
  const hasSecondaryRedirect = Boolean(secondaryUrl);
  const defaultOgImage = `${canonicalUrl.replace(/\/s-choice\/[^/]+$/, "")}/og-image.png`;
  const fallbackFavicon = `${canonicalUrl.replace(/\/s-choice\/[^/]+$/, "")}/logo-app-192.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const hasVideo = Boolean(videoUrl);
  const primaryLabel = getDestinationLabel(originalUrl, "Mở link chính");
  const secondaryLabel = getDestinationLabel(secondaryUrl, "Mở link phụ");
  const primaryHint = getDestinationHint(originalUrl);
  const secondaryHint = getDestinationHint(secondaryUrl);
  const overlayDescription = hasVideo
    ? hasSecondaryRedirect
      ? "Video sẽ tiếp tục phát ở nền. Sau khi chạm, bạn sẽ thấy hai lựa chọn Shopee hoặc TikTok."
      : "Video sẽ tiếp tục phát ở nền. Sau khi chạm, bạn sẽ được chuyển đến đích chính."
    : "Mở bước tiếp theo khi bạn đã sẵn sàng.";
  const clickOnlyTrackingUrl =
    clickTrackingUrl.slice(-6) === "/track"
      ? `${clickTrackingUrl.slice(0, -6)}/track-preview-click`
      : `${clickTrackingUrl}/track-preview-click`;

  const previewMedia = hasVideo
    ? `<div class="video-container"><video class="hero-media hero-video" src="${escapeHtml(videoUrl)}" controls muted autoplay loop playsinline webkit-playsinline x5-playsinline preload="auto" poster="${escapeHtml(imageUrl || socialImageUrl)}"></video></div>`
    : imageUrl
      ? `<img class="hero-media hero-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />`
      : `<div class="hero-placeholder"><div class="hero-placeholder-ring"></div><div class="hero-placeholder-core">HN</div></div>`;

  const metaVideo = hasVideo
    ? `<meta property="og:video" content="${escapeHtml(videoUrl)}" /><meta property="og:video:type" content="video/mp4" /><meta property="og:video:secure_url" content="${escapeHtml(videoUrl)}" />`
    : "";

  const metaImage = `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" /><meta property="og:image:alt" content="${escapeHtml(title)}" /><meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`;
  const choiceGateMarkup = hasSecondaryRedirect
    ? `<div id="choiceGate" class="choice-gate"><div class="choice-card"><div class="choice-kicker">Chọn đích đến</div><div class="choice-title">Bạn muốn đi tới đâu?</div><div class="choice-desc">Bản sao này không tự nhảy link đầu tiên. Người xem sẽ chủ động chọn Shopee hoặc TikTok để tránh bị đẩy link ngoài ý muốn.</div><div class="choice-grid"><button type="button" class="choice-button choice-button-primary" id="primaryChoiceButton"><span class="choice-button-label">${escapeHtml(primaryLabel)}</span><span class="choice-button-hint">${escapeHtml(primaryHint)}</span></button><button type="button" class="choice-button" id="secondaryChoiceButton"><span class="choice-button-label">${escapeHtml(secondaryLabel)}</span><span class="choice-button-hint">${escapeHtml(secondaryHint)}</span></button></div><div class="choice-footer">Link live hiện tại không bị ảnh hưởng. Đây là route thử nghiệm riêng.</div></div></div>`
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
      .hero-image { width: 100%; height: 100%; object-fit: cover; }
      .hero-placeholder { width: 100%; aspect-ratio: 16 / 9; display: grid; place-items: center; background: radial-gradient(circle at 30% 24%, rgba(34, 211, 238, 0.2), transparent 18%), radial-gradient(circle at 72% 68%, rgba(251, 113, 133, 0.24), transparent 24%), linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(17, 24, 39, 0.7)); }
      .hero-placeholder-ring { position: absolute; width: 10rem; height: 10rem; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 999px; }
      .hero-placeholder-core { position: relative; width: 6rem; height: 6rem; display: grid; place-items: center; border-radius: 1.5rem; background: linear-gradient(135deg, rgba(249, 115, 22, 1), rgba(239, 68, 68, 1)); font-size: 1.6rem; font-weight: 900; letter-spacing: 0.06em; box-shadow: 0 1rem 2rem rgba(249, 115, 22, 0.26); }
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
      .overlay-kicker, .choice-kicker {
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(226,232,240,0.7);
      }
      .overlay-title, .choice-title {
        margin-top: 0.8rem;
        font-size: 1.25rem;
        font-weight: 900;
        line-height: 1.35;
      }
      .overlay-desc, .choice-desc {
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
      .choice-gate {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        background: rgba(2, 6, 23, 0.88);
        backdrop-filter: blur(8px);
        z-index: 9998;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 220ms ease, visibility 220ms ease;
      }
      .choice-gate.is-visible { opacity: 1; visibility: visible; pointer-events: auto; }
      .choice-card {
        width: min(92vw, 34rem);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 1.8rem;
        padding: 1.4rem;
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 1.4rem 3rem rgba(0,0,0,0.34);
      }
      .choice-grid { margin-top: 1rem; display: grid; gap: 0.85rem; }
      .choice-button {
        width: 100%;
        appearance: none;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 1.3rem;
        padding: 1rem;
        background: rgba(30, 41, 59, 0.92);
        color: #fff;
        text-align: left;
        cursor: pointer;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
      }
      .choice-button:hover { transform: translateY(-1px); border-color: rgba(251, 146, 60, 0.55); background: rgba(51, 65, 85, 0.96); }
      .choice-button-primary { background: linear-gradient(135deg, rgba(249, 115, 22, 0.22), rgba(251, 146, 60, 0.16)), rgba(30, 41, 59, 0.96); }
      .choice-button-label { display: block; font-size: 0.92rem; font-weight: 900; }
      .choice-button-hint { display: block; margin-top: 0.3rem; font-size: 0.76rem; color: rgba(226, 232, 240, 0.74); }
      .choice-footer { margin-top: 0.9rem; font-size: 0.76rem; color: rgba(226, 232, 240, 0.62); text-align: center; }
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

    <div id="overlay" class="overlay ${hasVideo ? "delayed-hidden" : ""}" role="button" tabindex="0" aria-label="Mở bước tiếp theo">
      <div class="overlay-card">
        <div class="overlay-kicker">Bản sao thử nghiệm</div>
        <div class="overlay-title">${hasSecondaryRedirect ? "Chạm để chọn nơi muốn đi tiếp" : "Chạm để tiếp tục"}</div>
        <div class="overlay-desc">${escapeHtml(overlayDescription)}</div>
        <div class="overlay-cta">${hasSecondaryRedirect ? "Mở lựa chọn" : primaryLabel}</div>
      </div>
    </div>

    ${choiceGateMarkup}

    <script>
      (() => {
        const overlay = document.getElementById("overlay");
        const heroVideo = document.querySelector(".hero-video");
        const choiceGate = document.getElementById("choiceGate");
        const primaryChoiceButton = document.getElementById("primaryChoiceButton");
        const secondaryChoiceButton = document.getElementById("secondaryChoiceButton");
        const primaryTargetUrl = "${escapeJsString(originalUrl)}";
        const secondaryTargetUrl = "${escapeJsString(secondaryUrl)}";
        const hasVideo = ${hasVideo ? "true" : "false"};
        const hasSecondaryRedirect = ${hasSecondaryRedirect ? "true" : "false"};
        const clickOnlyTrackingUrl = "${escapeJsString(clickOnlyTrackingUrl)}";
        const outboundTrackingUrl =
          "${escapeJsString(clickTrackingUrl)}".slice(-6) === "/track"
            ? "${escapeJsString(clickTrackingUrl)}".slice(0, -6) + "/track-outbound"
            : "${escapeJsString(clickTrackingUrl)}" + "/track-outbound";

        let previewTracked = false;
        let overlayHandled = false;

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

        const hideOverlay = () => {
          if (!overlay) return;
          overlayHandled = true;
          overlay.classList.add("hidden");
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
          overlay.style.pointerEvents = "none";
        };

        const showOverlay = () => {
          if (!overlay || overlayHandled) return;
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

        const showChoiceGate = () => {
          if (!choiceGate) return;
          choiceGate.classList.add("is-visible");
        };

        const hideChoiceGate = () => {
          if (!choiceGate) return;
          choiceGate.classList.remove("is-visible");
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

        const handleOverlayContinue = () => {
          overlayHandled = true;
          trackPreviewClick();
          hideOverlay();

          if (hasSecondaryRedirect) {
            showChoiceGate();
            return;
          }

          trackOutbound("primary");
          openUrl(primaryTargetUrl);
        };

        const openChoice = (stage) => {
          overlayHandled = true;
          trackPreviewClick();
          hideChoiceGate();

          if (stage === "secondary") {
            trackOutbound("secondary");
            openUrl(secondaryTargetUrl);
            return;
          }

          trackOutbound("primary");
          openUrl(primaryTargetUrl);
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

        if (primaryChoiceButton) {
          primaryChoiceButton.addEventListener("click", (event) => {
            event.preventDefault();
            openChoice("primary");
          });
        }

        if (secondaryChoiceButton) {
          secondaryChoiceButton.addEventListener("click", (event) => {
            event.preventDefault();
            openChoice("secondary");
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
