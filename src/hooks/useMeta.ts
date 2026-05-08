import { useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Tab } from "@/src/types";

const SITE_URL = "https://hotsnew.click";
const DEFAULT_APP_TITLE =
  "HotsNew Click - Tạo landing page trung gian cho link Shopee, TikTok với tiêu đề, mô tả, ảnh, video và thống kê click.";
const DEFAULT_APP_DESCRIPTION =
  "HotsNew Click giúp tạo landing page trung gian cho link Shopee, TikTok với tiêu đề, mô tả, ảnh, video và thống kê click.";

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

const titleMap: Record<Tab, string> = {
  dashboard: "Bảng Điều Khiển - HotsNew Click",
  install: "Cài app - HotsNew Click",
  pricing: "Bảng Giá - HotsNew Click",
  create: "Tạo link Shopee - HotsNew Click",
  list: "Danh sách link - HotsNew Click",
  analytics: "Phân tích dữ liệu - HotsNew Click",
  team: "Team Workspace - HotsNew Click",
  admin: "Quản lý user - HotsNew Click",
  profile: "Hồ sơ cá nhân - HotsNew Click",
};

const descriptionMap: Record<Tab, string> = {
  dashboard:
    "Theo dõi nhanh hiệu suất link, lượt click và tăng trưởng chiến dịch trên HotsNew Click.",
  install:
    "Hướng dẫn cài app HotsNew để mở workspace nhanh hơn như một ứng dụng riêng.",
  pricing:
    "Xem bảng giá và nâng cấp gói dịch vụ để tạo landing page Shopee chuyên nghiệp hơn.",
  create:
    "Tạo landing page rút gọn cho link Shopee với tiêu đề, mô tả, ảnh và video tùy chỉnh.",
  list: "Quản lý toàn bộ link Shopee đã tạo, chỉnh sửa nội dung và theo dõi hiệu quả.",
  analytics:
    "Phân tích lượt click, tăng trưởng và nguồn lưu lượng cho các link Shopee của bạn.",
  team: "Quản lý workspace, thành viên team, role editor/viewer và tạo link theo chiến dịch.",
  admin: "Trang quản lý người dùng và gói dịch vụ trên HotsNew Click.",
  profile: "Cập nhật thông tin hồ sơ và trạng thái tài khoản HotsNew Click.",
};

const validTabs: Tab[] = [
  "dashboard",
  "install",
  "pricing",
  "create",
  "list",
  "analytics",
  "team",
  "admin",
  "profile",
];

export function useMeta({ user, authLoading, activeTab }: UseMetaProps) {
  const updateMetaTags = useCallback(() => {
    if (authLoading) return;

    const isAuthenticatedArea = Boolean(user);
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

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    fetch("/api/health", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const text = await response.text();
        try {
          JSON.parse(text);
        } catch {
          console.error(
            "API Reachability issue (Not JSON):",
            text.substring(0, 200),
          );
        }
      })
      .catch((error) =>
        console.error("API Reachability issue (Network):", error),
      );
  }, []);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const tabParam = currentUrl.searchParams.get("tab");

    if (tabParam && validTabs.includes(tabParam as Tab)) {
      // Parent component owns tab syncing.
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
