const APP_URL = "https://hotsnew.click/";

const statusEl = document.getElementById("status");
const currentUrlEl = document.getElementById("currentUrl");
const copyButton = document.getElementById("copyUrl");
const openAppButton = document.getElementById("openApp");
const openRootButton = document.getElementById("openRoot");

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToApp(url) {
  return chrome.runtime.sendMessage({
    type: "openCreateLink",
    payload: { url },
  });
}

function setStatus(message, tone = "default") {
  statusEl.textContent = message;
  statusEl.dataset.tone = tone;
}

async function init() {
  const tab = await getCurrentTab();
  const url = tab?.url || "";

  currentUrlEl.textContent = url || "Khong lay duoc URL cua tab hien tai.";
  copyButton.disabled = !url;
  openAppButton.disabled = !url;

  copyButton.addEventListener("click", async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setStatus("Da copy link hien tai.", "success");
  });

  openAppButton.addEventListener("click", async () => {
    if (!url) return;
    await sendToApp(url);
    window.close();
  });

  openRootButton.addEventListener("click", async () => {
    await chrome.tabs.create({ url: APP_URL });
    window.close();
  });
}

void init();
