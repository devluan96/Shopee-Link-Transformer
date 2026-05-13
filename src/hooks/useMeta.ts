import { useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Tab } from "@/src/types";
import { useLocale, type Locale } from "./useLocale";

const SITE_URL = "https://hotsnew.click";

type MetaCopy = {
  defaultTitle: string;
  defaultDescription: string;
  tabs: Record<Tab, { title: string; description: string }>;
};

const META_COPY: Record<Locale, MetaCopy> = {
  vi: {
    defaultTitle:
      "HotsNew Click - Tạo landing page trung gian cho link Shopee, TikTok với tiêu đề, mô tả, ảnh, video và thống kê click.",
    defaultDescription:
      "HotsNew Click giúp tạo landing page trung gian cho link Shopee, TikTok với tiêu đề, mô tả, ảnh, video và thống kê click.",
    tabs: {
      dashboard: {
        title: "Bảng điều khiển - HotsNew Click",
        description:
          "Theo dõi nhanh hiệu suất link, lượt click và tăng trưởng chiến dịch trên HotsNew Click.",
      },
      guide: {
        title: "Hướng dẫn tạo link - HotsNew Click",
        description:
          "Xem luồng tạo link, landing page, link gốc và bước 2 trong HotsNew Click trước khi chạy thật.",
      },
      install: {
        title: "Cài app - HotsNew Click",
        description:
          "Hướng dẫn cài ứng dụng HotsNew để mở không gian làm việc nhanh hơn như một app riêng.",
      },
      pricing: {
        title: "Bảng giá - HotsNew Click",
        description:
          "Xem bảng giá và nâng cấp gói dịch vụ để tạo landing page Shopee chuyên nghiệp hơn.",
      },
      create: {
        title: "Tạo link Shopee - HotsNew Click",
        description:
          "Tạo landing page rút gọn cho link Shopee với tiêu đề, mô tả, ảnh và video tùy chỉnh.",
      },
      list: {
        title: "Danh sách link - HotsNew Click",
        description:
          "Quản lý toàn bộ link Shopee đã tạo, chỉnh sửa nội dung và theo dõi hiệu quả.",
      },
      analytics: {
        title: "Phân tích dữ liệu - HotsNew Click",
        description:
          "Phân tích lượt click, tăng trưởng và nguồn lưu lượng cho các link Shopee của bạn.",
      },
      team: {
        title: "Nhóm làm việc - HotsNew Click",
        description:
          "Quản lý không gian làm việc, thành viên nhóm, quyền biên tập hoặc chỉ xem và tạo link theo chiến dịch.",
      },
      admin: {
        title: "Quản lý user - HotsNew Click",
        description: "Trang quản lý người dùng và gói dịch vụ trên HotsNew Click.",
      },
      profile: {
        title: "Hồ sơ cá nhân - HotsNew Click",
        description:
          "Cập nhật thông tin hồ sơ và trạng thái tài khoản HotsNew Click.",
      },
    },
  },
  en: {
    defaultTitle:
      "HotsNew Click - Create intermediate landing pages for Shopee and TikTok links with titles, descriptions, images, videos, and click analytics.",
    defaultDescription:
      "HotsNew Click helps you create intermediate landing pages for Shopee and TikTok links with titles, descriptions, images, videos, and click analytics.",
    tabs: {
      dashboard: {
        title: "Dashboard - HotsNew Click",
        description:
          "Track link performance, clicks, and campaign growth quickly inside HotsNew Click.",
      },
      guide: {
        title: "Link Guide - HotsNew Click",
        description:
          "Review the link flow, landing page behavior, primary link, and step 2 flow in HotsNew Click before going live.",
      },
      install: {
        title: "Install App - HotsNew Click",
        description:
          "Install HotsNew as a standalone app so the workspace is faster to open and easier to reach.",
      },
      pricing: {
        title: "Pricing - HotsNew Click",
        description:
          "Review pricing and upgrade your plan to create more professional Shopee landing pages.",
      },
      create: {
        title: "Create Shopee Link - HotsNew Click",
        description:
          "Create a shortened landing page for Shopee links with custom titles, descriptions, images, and videos.",
      },
      list: {
        title: "Link List - HotsNew Click",
        description:
          "Manage all created Shopee links, edit their content, and track performance.",
      },
      analytics: {
        title: "Analytics - HotsNew Click",
        description:
          "Analyze clicks, growth, and traffic sources for your Shopee links.",
      },
      team: {
        title: "Workspace Team - HotsNew Click",
        description:
          "Manage workspaces, team members, editor or viewer permissions, and campaign link creation.",
      },
      admin: {
        title: "Admin Center - HotsNew Click",
        description:
          "Manage users and subscription plans inside HotsNew Click.",
      },
      profile: {
        title: "Profile Settings - HotsNew Click",
        description:
          "Update your profile information and account status in HotsNew Click.",
      },
    },
  },
};

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

const validTabs: Tab[] = [
  "dashboard",
  "guide",
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
  const { locale } = useLocale();

  const updateMetaTags = useCallback(() => {
    if (authLoading) return;

    const isAuthenticatedArea = Boolean(user);
    const metaCopy = META_COPY[locale];
    const activeMeta = metaCopy.tabs[activeTab];
    const nextTitle = isAuthenticatedArea
      ? activeMeta.title
      : metaCopy.defaultTitle;
    const nextDescription = isAuthenticatedArea
      ? activeMeta.description
      : metaCopy.defaultDescription;
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
  }, [activeTab, authLoading, locale, user]);

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
