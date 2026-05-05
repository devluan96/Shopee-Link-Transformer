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
const sourceHostEl = document.getElementById("sourceHost");
const sourceHintEl = document.getElementById("sourceHint");
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

function getHostLabel(rawUrl) {
  if (!rawUrl) return "Không có URL";

  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "URL không hợp lệ";
  }
}

function formatCurrentUrl(rawUrl) {
  if (!rawUrl) return "Không lấy được URL của tab hiện tại.";
  if (rawUrl.length <= 170) return rawUrl;
  return `${rawUrl.slice(0, 167)}...`;
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
    ? "Nguồn hợp lệ để tạo link"
    : "Tab này không phải Shopee/TikTok";
  supportBadgeEl.dataset.tone = isSupported ? "success" : "warning";
}

function setQuotaState(message, tone = "info") {
  quotaBadgeEl.textContent = message;
  quotaBadgeEl.dataset.tone = tone;
}

async function init() {
  const tab = await getCurrentTab();
  const url = tab?.url || "";
  const supported = isSupportedUrl(url);

  currentUrlEl.textContent = formatCurrentUrl(url);
  sourceHostEl.textContent = getHostLabel(url);
  setSupportState(supported);

  copyButton.disabled = !url;
  openCreateButton.disabled = !supported;
  openCreateButton.textContent = supported
    ? "Tạo link từ tab hiện tại"
    : "Chỉ tạo được từ Shopee/TikTok";

  sourceHintEl.textContent = supported
    ? "Tab hiện tại hợp lệ. Bấm nút cam để mở thẳng màn tạo link với URL đã điền sẵn."
    : "Nếu không đứng ở Shopee hoặc TikTok, hãy dùng nút dán từ clipboard hoặc tự mở app.";

  try {
    const quota = await chrome.runtime.sendMessage({
      type: "getQuotaSnapshot",
    });

    if (!quota?.ok) {
      setQuotaState(quota?.error || "Mở HotsNew để đồng bộ quota", "muted");
    } else if (quota.data?.linkQuota) {
      const quotaText =
        quota.data.linkQuota.dailyLimit === null
          ? "Link hôm nay: không giới hạn"
          : `Link hôm nay: ${quota.data.linkQuota.usedToday}/${quota.data.linkQuota.dailyLimit}`;
      const videoText =
        quota.data.userLimits?.dailyVideoUploads === null
          ? " | Video: không giới hạn"
          : quota.data.userLimits?.dailyVideoUploads
            ? ` | Video: ${quota.data.userLimits.videoUploadsUsedToday}/${quota.data.userLimits.dailyVideoUploads}`
            : "";
      setQuotaState(`${quotaText}${videoText}`, "muted");
    } else {
      setQuotaState("Mở HotsNew để đồng bộ quota", "muted");
    }
  } catch {
    setQuotaState("Không đọc được quota", "muted");
  }

  if (!supported && url) {
    setStatus("Chỉ có thể tạo link trực tiếp từ tab Shopee hoặc TikTok.", "warning");
  }

  copyButton.addEventListener("click", async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setStatus("Đã copy link hiện tại.", "success");
  });

  pasteClipboardButton.addEventListener("click", async () => {
    try {
      const clipboardText = (await navigator.clipboard.readText()).trim();
      if (!clipboardText) {
        setStatus("Clipboard đang trống.", "warning");
        return;
      }

      if (!isSupportedUrl(clipboardText)) {
        setStatus("Clipboard không phải link Shopee/TikTok hợp lệ.", "warning");
        return;
      }

      await sendToApp("create", { url: clipboardText });
      window.close();
    } catch {
      setStatus("Không đọc được clipboard. Hãy copy link trước.", "warning");
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
