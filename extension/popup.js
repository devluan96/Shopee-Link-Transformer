const APP_URL = "https://hotsnew.click/";
const ZALO_ADMIN_URL = "https://zalo.me/0969361607";
const SUPPORTED_HOSTS = [
  /(^|\.)shopee\.[a-z.]+$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)vt\.tiktok\.com$/i,
  /(^|\.)vm\.tiktok\.com$/i,
];

const statusEl = document.getElementById("status");
const currentUrlEl = document.getElementById("currentUrl");
const supportBadgeEl = document.getElementById("supportBadge");
const quotaBadgeEl = document.getElementById("quotaBadge");
const copyButton = document.getElementById("copyUrl");
const pasteClipboardButton = document.getElementById("pasteClipboard");
const openCreateButton = document.getElementById("openCreate");
const openListButton = document.getElementById("openList");
const openPricingButton = document.getElementById("openPricing");
const openInstallButton = document.getElementById("openInstall");
const openRootButton = document.getElementById("openRoot");
const openZaloButton = document.getElementById("openZalo");

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isSupportedUrl(rawUrl) {
  if (!rawUrl) return false;

  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return SUPPORTED_HOSTS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

async function sendToApp(action, payload = {}) {
  return chrome.runtime.sendMessage({
    type: "openHotsNew",
    payload: {
      action,
      ...payload,
    },
  });
}

function setStatus(message, tone = "default") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

function setSupportState(isSupported) {
  supportBadgeEl.textContent = isSupported
    ? "Tab nay hop le de tao link"
    : "Tab nay khong phai Shopee/TikTok";
  supportBadgeEl.dataset.tone = isSupported ? "success" : "muted";
}

function setQuotaState(message, tone = "info") {
  quotaBadgeEl.textContent = message;
  quotaBadgeEl.dataset.tone = tone;
}

async function init() {
  const tab = await getCurrentTab();
  const url = tab?.url || "";
  const supported = isSupportedUrl(url);

  currentUrlEl.textContent = url || "Khong lay duoc URL cua tab hien tai.";
  setSupportState(supported);

  copyButton.disabled = !url;
  openCreateButton.disabled = !supported;

  try {
    const quota = await chrome.runtime.sendMessage({ type: "getQuotaSnapshot" });
    if (!quota?.ok) {
      setQuotaState(quota?.error || "Mo HotsNew de dong bo quota", "muted");
    } else if (quota.data?.linkQuota) {
      const quotaText =
        quota.data.linkQuota.dailyLimit === null
          ? "Link hom nay: khong gioi han"
          : `Link hom nay: ${quota.data.linkQuota.usedToday}/${quota.data.linkQuota.dailyLimit}`;
      const videoText = quota.data.userLimits?.dailyVideoUploads === null
        ? " | Video: khong gioi han"
        : quota.data.userLimits?.dailyVideoUploads
          ? ` | Video: ${quota.data.userLimits.videoUploadsUsedToday}/${quota.data.userLimits.dailyVideoUploads}`
          : "";
      setQuotaState(`${quotaText}${videoText}`, "info");
    } else {
      setQuotaState("Mo HotsNew de dong bo quota", "muted");
    }
  } catch {
    setQuotaState("Khong doc duoc quota", "muted");
  }

  if (!supported && url) {
    setStatus("Chi nen tao link tu tab Shopee hoac TikTok.", "warning");
  }

  copyButton.addEventListener("click", async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setStatus("Da copy link hien tai.", "success");
  });

  pasteClipboardButton.addEventListener("click", async () => {
    try {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (!clipboardText) {
        setStatus("Clipboard dang trong.", "warning");
        return;
      }

      if (!isSupportedUrl(clipboardText)) {
        setStatus("Clipboard khong phai link Shopee/TikTok hop le.", "warning");
        return;
      }

      await sendToApp("create", { url: clipboardText });
      window.close();
    } catch {
      setStatus("Khong doc duoc clipboard. Hay copy link truoc.", "warning");
    }
  });

  openCreateButton.addEventListener("click", async () => {
    if (!supported) return;
    await sendToApp("create", { url });
    window.close();
  });

  openListButton.addEventListener("click", async () => {
    await sendToApp("list");
    window.close();
  });

  openPricingButton.addEventListener("click", async () => {
    await sendToApp("pricing");
    window.close();
  });

  openInstallButton.addEventListener("click", async () => {
    await sendToApp("install");
    window.close();
  });

  openRootButton.addEventListener("click", async () => {
    await chrome.tabs.create({ url: APP_URL });
    window.close();
  });

  openZaloButton.addEventListener("click", async () => {
    await chrome.tabs.create({ url: ZALO_ADMIN_URL });
    window.close();
  });
}

void init();
