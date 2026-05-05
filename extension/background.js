const APP_URL = "https://hotsnew.click/";
const MENU_PAGE = "hotsnew-create-from-page";
const MENU_LINK = "hotsnew-create-from-link";
const MENU_OPEN_LIST = "hotsnew-open-list";

async function getAppTab() {
  const tabs = await chrome.tabs.query({});
  return (
    tabs.find(
      (tab) => typeof tab.url === "string" && tab.url.startsWith(APP_URL),
    ) || null
  );
}

function buildAppUrl(action, rawUrl) {
  const targetUrl = new URL(APP_URL);

  if (action === "create") {
    targetUrl.searchParams.set("tab", "create");
    targetUrl.searchParams.set("create", "1");
    if (rawUrl) {
      targetUrl.searchParams.set("url", rawUrl);
    }
    return targetUrl.toString();
  }

  if (action === "list" || action === "pricing" || action === "install") {
    targetUrl.searchParams.set("tab", action);
    return targetUrl.toString();
  }

  return targetUrl.toString();
}

async function openOrFocusApp(action, rawUrl) {
  const targetUrl = buildAppUrl(action, rawUrl);
  const existingTab = await getAppTab();

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, { url: targetUrl, active: true });

    if (typeof existingTab.windowId === "number") {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({ url: targetUrl });
}

async function readQuotaFromAppTab() {
  const appTab = await getAppTab();
  if (!appTab?.id) {
    throw new Error("Mo HotsNew truoc de dong bo quota");
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: appTab.id },
    func: async () => {
      const authKey = Object.keys(window.localStorage).find(
        (key) => key === "supabase.auth.token" || key.startsWith("sb-"),
      );

      if (!authKey) {
        return { ok: false, error: "Chua co phien dang nhap tren tab HotsNew" };
      }

      let accessToken = null;
      try {
        const raw = window.localStorage.getItem(authKey);
        const parsed = raw ? JSON.parse(raw) : null;

        if (Array.isArray(parsed)) {
          accessToken = parsed[0]?.access_token || null;
        } else {
          accessToken =
            parsed?.currentSession?.access_token ||
            parsed?.access_token ||
            parsed?.session?.access_token ||
            null;
        }
      } catch {
        accessToken = null;
      }

      if (!accessToken) {
        return { ok: false, error: "Khong doc duoc token tren HotsNew" };
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const [linkQuotaRes, userLimitsRes] = await Promise.all([
        fetch("/api/v1/user/link-quota", { headers }),
        fetch("/api/v1/user/limits", { headers }),
      ]);

      const linkQuota = await linkQuotaRes.json().catch(() => null);
      const userLimits = await userLimitsRes.json().catch(() => null);

      if (!linkQuotaRes.ok) {
        return {
          ok: false,
          error: linkQuota?.error || "Khong lay duoc quota link",
        };
      }

      return {
        ok: true,
        data: {
          linkQuota,
          userLimits: userLimitsRes.ok ? userLimits : null,
        },
      };
    },
  });

  return result?.result || { ok: false, error: "Khong doc duoc du lieu quota" };
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

  chrome.contextMenus.create({
    id: MENU_OPEN_LIST,
    title: "Mo danh sach link HotsNew",
    contexts: ["action"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === MENU_OPEN_LIST) {
    await openOrFocusApp("list");
    return;
  }

  const rawUrl = info.menuItemId === MENU_LINK ? info.linkUrl : info.pageUrl;
  if (!isSupportedUrl(rawUrl)) {
    return;
  }

  await openOrFocusApp("create", rawUrl);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "getQuotaSnapshot") {
    readQuotaFromAppTab()
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ ok: false, error: String(error?.message || error) }),
      );

    return true;
  }

  if (message?.type !== "openHotsNew") {
    return false;
  }

  const action = message.payload?.action || "dashboard";
  openOrFocusApp(action, message.payload?.url)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
