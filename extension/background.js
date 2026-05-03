const APP_URL = "https://hotsnew.click/";
const MENU_PAGE = "hotsnew-create-from-page";
const MENU_LINK = "hotsnew-create-from-link";

function buildCreateUrl(rawUrl) {
  const targetUrl = new URL(APP_URL);
  targetUrl.searchParams.set("create", "1");

  if (rawUrl) {
    targetUrl.searchParams.set("url", rawUrl);
  }

  return targetUrl.toString();
}

async function openOrFocusApp(rawUrl) {
  const targetUrl = buildCreateUrl(rawUrl);
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find(
    (tab) => typeof tab.url === "string" && tab.url.startsWith(APP_URL),
  );

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, { url: targetUrl, active: true });

    if (typeof existingTab.windowId === "number") {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({ url: targetUrl });
}

function isSupportedUrl(rawUrl) {
  if (!rawUrl) return false;

  try {
    const parsed = new URL(rawUrl);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_PAGE,
    title: "Gui trang nay sang HotsNew",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: MENU_LINK,
    title: "Tao link HotsNew tu lien ket nay",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const rawUrl = info.menuItemId === MENU_LINK ? info.linkUrl : info.pageUrl;

  if (!isSupportedUrl(rawUrl)) {
    return;
  }

  await openOrFocusApp(rawUrl);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "openCreateLink") {
    return false;
  }

  openOrFocusApp(message.payload?.url)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
