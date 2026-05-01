import { PublicLinkRecord } from "../types/index.js";
import { normalizeRedirectDelayMs } from "../utils/normalizers.js";
import { escapeHtml } from "../utils/helpers.js";

const capitalizeFirstCharacter = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const firstCharacter = trimmed.charAt(0).toLocaleUpperCase("vi-VN");
  return `${firstCharacter}${trimmed.slice(1)}`;
};

export const renderLinkLandingPage = (
  link: PublicLinkRecord,
  canonicalUrl: string,
  clickTrackingUrl: string,
) => {
  const title = capitalizeFirstCharacter(link.custom_title?.trim() || "HotsNew Click");
  const description = capitalizeFirstCharacter(
    link.custom_description?.trim() || "Nội dung đang sẵn sàng. Bấm vào màn hình để tiếp tục.",
  );
  const imageUrl = link.custom_image_url?.trim() || "";
  const videoUrl = link.video_url?.trim() || "";
  const originalUrl = link.original_url.trim();
  const secondaryUrl = link.secondary_url?.trim() || "";
  const redirectDelayMs = normalizeRedirectDelayMs(link.redirect_delay_ms);
  const hasSecondaryRedirect = Boolean(secondaryUrl);
  const defaultOgImage = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/og-image.png`;
  const fallbackFavicon = `${canonicalUrl.replace(/\/s\/[^/]+$/, "")}/logo-app.png`;
  const faviconUrl = imageUrl || fallbackFavicon;
  const socialImageUrl = imageUrl || defaultOgImage;
  const hasVideo = Boolean(videoUrl);

  const previewMedia = hasVideo
    ? `<video class="hero-media hero-video" src="${escapeHtml(videoUrl)}" muted loop playsinline controls preload="metadata"></video>`
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
      .content-panel {
        background: linear-gradient(135deg, rgba(9, 18, 32, 0.65), rgba(15, 23, 42, 0.45));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 2rem;
        backdrop-filter: blur(20px) saturate(140%);
        box-shadow: 0 25px 80px rgba(2, 6, 23, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        padding: 1.6rem;
        max-width: 960px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        position: relative;
        z-index: 1;
      }
      .hero-media, .hero-placeholder { width: min(100%, 28rem); max-height: min(56vh, 36rem); border-radius: 1.2rem; border: 1px solid rgba(255, 255, 255, 0.12); object-fit: cover; display: block; }
      .hero-video { background: #000; }
      .hero-placeholder { aspect-ratio: 4/3; display: grid; place-items: center; position: relative; overflow: hidden; }
      .hero-placeholder-ring { position: absolute; inset: 0; border-radius: 1.2rem; padding: 2px; background: linear-gradient(135deg, rgba(251, 113, 133, 0.6), rgba(34, 211, 238, 0.5), rgba(245, 158, 11, 0.5)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
      .hero-placeholder-core { width: 6rem; height: 6rem; border-radius: 999px; background: linear-gradient(135deg, rgba(251, 113, 133, 0.9), rgba(34, 211, 238, 0.8)); display: grid; place-items: center; font-weight: 900; font-size: 2rem; color: #fff; text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3); box-shadow: 0 20px 60px rgba(251, 113, 133, 0.35); }
      .info { text-align: center; max-width: 34rem; }
      h1 { margin: 0; font-size: clamp(1.05rem, 2vw, 1.5rem); line-height: 1.22; letter-spacing: -0.04em; }
      p { margin: 0; color: var(--muted); font-size: 0.84rem; line-height: 1.6; }
      .flow-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.7rem; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.14); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.6rem; }
      .flow-shopee { border-color: rgba(255, 99, 71, 0.35); background: rgba(255, 99, 71, 0.12); color: #ff9e8a; }
      .flow-shopee-tiktok { border-color: rgba(34, 211, 238, 0.28); background: rgba(8, 145, 178, 0.12); color: #a5f3fc; }
      .overlay { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(4px); z-index: 20; cursor: pointer; transition: opacity 220ms ease, visibility 220ms ease; }
      .overlay.hidden { opacity: 0; visibility: hidden; pointer-events: none; display: none !important; }
      .overlay-close { position: fixed; top: 1.25rem; right: 1.25rem; width: 3.1rem; height: 3.1rem; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.22); background: rgba(15, 23, 42, 0.34); color: var(--text); font-size: 1.35rem; font-weight: 900; cursor: pointer; backdrop-filter: blur(16px); }
      .pulse { animation: pulse 2s infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      .ripple { position: relative; overflow: hidden; }
      .ripple::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%); transform: scale(0); opacity: 0; transition: transform 0.5s, opacity 0.5s; }
      .ripple:active::after { transform: scale(2); opacity: 1; transition: 0s; }
      @media (max-width: 900px) {
        .content-panel { padding: 1.2rem 1rem 1.4rem; }
        .hero-media, .hero-placeholder { width: min(100%, 24rem); max-height: min(64vh, 32rem); }
      }
    </style>
  </head>
  <body>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="shell">
      <div class="content-panel">
        <div class="flow-badge ${hasSecondaryRedirect ? "flow-shopee-tiktok" : "flow-shopee"}">
          <span>${hasSecondaryRedirect ? "2 bước: Shopee → TikTok" : "Mở Shopee ngay"}</span>
        </div>
        ${previewMedia}
        <div class="info">
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(description)}</p>
        </div>
      </div>
    </div>
    <div id="overlay" class="overlay ripple${redirectDelayMs <= 1000 ? "" : " hidden"}">
      <button id="overlayClose" class="overlay-close" aria-label="Đóng">×</button>
      <div style="text-align:center;">
        <div class="pulse" style="font-size:3rem;margin-bottom:0.5rem;">👆</div>
        <div style="font-weight:700;font-size:1.1rem;">Chạm để mở Shopee</div>
        <div style="color:var(--muted);font-size:0.85rem;">Bấm vào màn hình để tiếp tục</div>
      </div>
    </div>
    <script>
      (function() {
        const redirectDelay = ${redirectDelayMs};
        const primaryUrl = "${escapeHtml(originalUrl)}";
        const secondaryUrl = "${escapeHtml(secondaryUrl)}";
        const hasSecondary = ${hasSecondaryRedirect};
        const clickTrackingUrl = "${escapeHtml(clickTrackingUrl)}";
        
        let primaryOpened = false;
        let secondaryOpened = false;
        
        const overlay = document.getElementById("overlay");
        const overlayClose = document.getElementById("overlayClose");
        
        function openUrl(url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        
        function trackClick() {
          if (clickTrackingUrl) {
            navigator.sendBeacon?.(clickTrackingUrl, JSON.stringify({ source: "landing_page", ts: Date.now() }));
          }
        }
        
        function openPrimaryStep() {
          if (primaryOpened) return;
          primaryOpened = true;
          trackClick();
          openUrl(primaryUrl);
          if (hasSecondary && !secondaryOpened) {
            setTimeout(() => overlay?.classList.remove("hidden"), 500);
          }
        }
        
        function openSecondaryStep() {
          if (secondaryOpened || !hasSecondary) return;
          secondaryOpened = true;
          openUrl(secondaryUrl);
        }
        
        if (redirectDelay > 1000) {
          setTimeout(() => overlay?.classList.remove("hidden"), redirectDelay);
        }
        
        overlay?.addEventListener("click", (e) => {
          if (e.target !== overlay) return;
          if (!primaryOpened) { openPrimaryStep(); return; }
          if (hasSecondary && !secondaryOpened) openSecondaryStep();
        });
        
        overlayClose?.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!primaryOpened) { openPrimaryStep(); return; }
          if (hasSecondary && !secondaryOpened) openSecondaryStep();
        });
        
        document.body.addEventListener("click", () => {
          if (!primaryOpened) openPrimaryStep();
          else if (hasSecondary && !secondaryOpened) openSecondaryStep();
        });
      })();
    </script>
  </body>
</html>`;
};
