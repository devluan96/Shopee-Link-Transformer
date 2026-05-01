import { useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Tab } from "@/src/types";

const SITE_URL = "https://hotsnew.click";
const DEFAULT_APP_TITLE =
  "HotsNew Click - Tạo Landing Page Rút Gọn Link Shopee, Tiktok với Thống Kê Click và Phân Tích Hiệu Quả Chiến Dịch";
const DEFAULT_APP_DESCRIPTION =
  "HotsNew Click giúp tạo landing page trung gian cho link Shopee, Tiktok với tiêu đề, mô tả, ảnh, video và thống kê click tối ưu cho chia sẻ mạng xã hội.";

const upsertMetaTag = (
  selector: string,
  attributeName: "name" | "property",
  attributeValue: string,
  content: string,
) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attributeName, attributeValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertCanonicalLink = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

interface UseMetaProps {
  user: User | null;
  authLoading: boolean;
  activeTab: Tab;
}

export function useMeta({ user, authLoading, activeTab }: UseMetaProps) {
  const updateMetaTags = useCallback(() => {
    if (authLoading) return;

    const isAuthenticatedArea = Boolean(user);
    const titleMap: Record<Tab, string> = {
      dashboard: "Bảng điều khiển - HotsNew Click",
      pricing: "Bảng giá - HotsNew Click",
      create: "Tạo link Shopee - HotsNew Click",
      list: "Danh sách link - HotsNew Click",
      analytics: "Phân tích dữ liệu - HotsNew Click",
      admin: "Quản lý user - HotsNew Click",
      profile: "Hồ sơ cá nhân - HotsNew Click",
    };
    const descriptionMap: Record<Tab, string> = {
      dashboard:
        "Theo dõi nhanh hiệu suất link, lượt click và tăng trưởng chiến dịch trên HotsNew Click.",
      pricing:
        "Xem bảng giá và nâng cấp gói dịch vụ để tạo landing page Shopee chuyên nghiệp hơn.",
      create:
        "Tạo landing page rút gọn cho link Shopee với tiêu đề, mô tả, ảnh và video tùy chỉnh.",
      list: "Quản lý toàn bộ link Shopee đã tạo, chỉnh sửa nội dung và theo dõi hiệu quả.",
      analytics:
        "Phân tích lượt click, tăng trưởng và nguồn lưu lượng cho các link Shopee của bạn.",
      admin: "Trang quản trị người dùng và gói dịch vụ trên HotsNew Click.",
      profile:
        "Cập nhật thông tin hồ sơ và trạng thái tài khoản HotsNew Click.",
    };

    const nextTitle = isAuthenticatedArea
      ? titleMap[activeTab]
      : DEFAULT_APP_TITLE;
    const nextDescription = isAuthenticatedArea
      ? descriptionMap[activeTab]
      : DEFAULT_APP_DESCRIPTION;
    const canonicalHref = isAuthenticatedArea
      ? `${SITE_URL}/?tab=${activeTab}`
      : `${SITE_URL}/`;
    const robotsContent = isAuthenticatedArea
      ? "noindex, nofollow"
      : "index, follow";

    document.title = nextTitle;
    upsertMetaTag(
      'meta[name="description"]',
      "name",
      "description",
      nextDescription,
    );
    upsertMetaTag(
      'meta[property="og:title"]',
      "property",
      "og:title",
      nextTitle,
    );
    upsertMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description",
      nextDescription,
    );
    upsertMetaTag(
      'meta[property="og:url"]',
      "property",
      "og:url",
      canonicalHref,
    );
    upsertMetaTag(
      'meta[name="twitter:title"]',
      "name",
      "twitter:title",
      nextTitle,
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      nextDescription,
    );
    upsertMetaTag('meta[name="robots"]', "name", "robots", robotsContent);
    upsertMetaTag('meta[name="googlebot"]', "name", "googlebot", robotsContent);
    upsertCanonicalLink(canonicalHref);
  }, [authLoading, user, activeTab]);

  useEffect(() => {
    updateMetaTags();
  }, [updateMetaTags]);

  // Check API health in dev mode
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const apiBase = "/api";
    fetch(`${apiBase}/health`, {
      headers: { Accept: "application/json" },
    })
      .then(async (r) => {
        const text = await r.text();
        try {
          JSON.parse(text);
        } catch (_e) {
          console.error(
            "❌ API Reachability issue (Not JSON):",
            text.substring(0, 200),
          );
        }
      })
      .catch((e) => console.error("❌ API Reachability issue (Network):", e));
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const tabParam = currentUrl.searchParams.get("tab");

    if (
      tabParam === "dashboard" ||
      tabParam === "pricing" ||
      tabParam === "create" ||
      tabParam === "list" ||
      tabParam === "analytics" ||
      tabParam === "admin" ||
      tabParam === "profile"
    ) {
      // This is handled by the parent component's setActiveTab
    }

    if (currentUrl.searchParams.has("logout")) {
      currentUrl.searchParams.delete("logout");
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    }
  }, []);
}
