import { useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Tab } from "@/src/types";
import { useLocale, type Locale } from "./useLocale";
import { PUBLIC_SEO_CONTENT } from "@/src/lib/publicSeo";
import {
  buildPublicPageStructuredData,
  resolvePublicPage,
} from "@/src/lib/publicPages";
import { DEFAULT_SITE_URL } from "@/src/lib/appConfig";
const JSON_LD_ID = "hotsnew-public-schema";
const DEFAULT_OG_IMAGE_WIDTH = "1200";
const DEFAULT_OG_IMAGE_HEIGHT = "630";

type MetaCopy = {
  tabs: Record<string, { title: string; description: string }>;
};

const META_COPY: Record<Locale, MetaCopy> = {
  vi: {
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
          "Xem bảng giá và nâng cấp gói dịch vụ để tạo landing page Shopee và TikTok chuyên nghiệp hơn.",
      },
      create: {
        title: "Tạo link Shopee và TikTok - HotsNew Click",
        description:
          "Tạo landing page rút gọn cho link Shopee và TikTok với tiêu đề, mô tả, ảnh và video tùy chỉnh.",
      },
      list: {
        title: "Danh sách link - HotsNew Click",
        description:
          "Quản lý toàn bộ link Shopee và TikTok đã tạo, chỉnh sửa nội dung và theo dõi hiệu quả.",
      },
      analytics: {
        title: "Phân tích dữ liệu - HotsNew Click",
        description:
          "Phân tích lượt click, tăng trưởng và nguồn lưu lượng cho các link Shopee và TikTok của bạn.",
      },
      team: {
        title: "Nhóm làm việc - HotsNew Click",
        description:
          "Quản lý không gian làm việc, thành viên nhóm và quyền chỉnh sửa hoặc chỉ xem cho từng chiến dịch.",
      },
      admin: {
        title: "Quản lý user - HotsNew Click",
        description:
          "Trang quản lý người dùng và gói dịch vụ trên HotsNew Click.",
      },
      profile: {
        title: "Hồ sơ cá nhân - HotsNew Click",
        description:
          "Cập nhật thông tin hồ sơ và trạng thái tài khoản HotsNew Click.",
      },
    },
  },
  en: {
    tabs: {
      dashboard: {
        title: "Dashboard - HotsNew Click",
        description:
          "Track link performance, clicks, and campaign growth quickly inside HotsNew Click.",
      },
      guide: {
        title: "Link Guide - HotsNew Click",
        description:
          "Review the link flow, landing page behavior, primary link, and step-2 flow in HotsNew Click before going live.",
      },
      install: {
        title: "Install App - HotsNew Click",
        description:
          "Install HotsNew as a standalone app so the workspace is faster to open and easier to reach.",
      },
      pricing: {
        title: "Pricing - HotsNew Click",
        description:
          "Review pricing and upgrade your plan to create more professional Shopee and TikTok landing pages.",
      },
      create: {
        title: "Create Shopee and TikTok Links - HotsNew Click",
        description:
          "Create shortened landing pages for Shopee and TikTok links with custom titles, descriptions, images, and videos.",
      },
      list: {
        title: "Link List - HotsNew Click",
        description:
          "Manage all created Shopee and TikTok links, edit their content, and track performance.",
      },
      analytics: {
        title: "Analytics - HotsNew Click",
        description:
          "Analyze clicks, growth, and traffic sources for your Shopee and TikTok links.",
      },
      team: {
        title: "Workspace Team - HotsNew Click",
        description:
          "Manage workspaces, team members, editor or viewer permissions, and campaign link creation.",
      },
      admin: {
        title: "Admin Center - HotsNew Click",
        description: "Manage users and subscription plans inside HotsNew Click.",
      },
      profile: {
        title: "Profile Settings - HotsNew Click",
        description:
          "Update your profile information and account status in HotsNew Click.",
      },
    },
  },
};

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

const upsertLinkTag = (
  selector: string,
  rel: string,
  href: string,
  extraAttributes?: Record<string, string>,
) => {
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  Object.entries(extraAttributes ?? {}).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });
};

const removeHeadNodes = (selector: string) => {
  document.head.querySelectorAll(selector).forEach((node) => node.remove());
};

const upsertJsonLd = (id: string, data: unknown) => {
  let script = document.head.querySelector<HTMLScriptElement>(`#${id}`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

const removeJsonLd = (id: string) => {
  document.head.querySelector(`#${id}`)?.remove();
};

const syncAlternateLinks = (canonicalHref: string) => {
  [
    { hreflang: "vi-VN", href: canonicalHref },
    { hreflang: "en-US", href: canonicalHref },
    { hreflang: "x-default", href: canonicalHref },
  ].forEach(({ hreflang, href }) => {
    upsertLinkTag(
      `link[rel="alternate"][hreflang="${hreflang}"]`,
      "alternate",
      href,
      { hreflang, "data-seo-alternate": "true" },
    );
  });
};

interface UseMetaProps {
  user: User | null;
  authLoading: boolean;
  activeTab: Tab;
}

export function useMeta({ user, authLoading, activeTab }: UseMetaProps) {
  const { locale } = useLocale();

  const updateMetaTags = useCallback(() => {
    if (authLoading) return;

    const isAuthenticatedArea = Boolean(user);
    const publicSeo = PUBLIC_SEO_CONTENT[locale];
    const currentPathname =
      typeof window !== "undefined" ? window.location.pathname : "/";
    const publicPage = resolvePublicPage(locale, currentPathname);
    const activeMeta =
      META_COPY[locale].tabs[activeTab] ?? META_COPY[locale].tabs.dashboard;
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : DEFAULT_SITE_URL;
    const publicCanonicalHref = new URL(publicPage.path, origin).toString();
    const authCanonicalUrl = new URL("/", origin);
    authCanonicalUrl.searchParams.set("tab", activeTab);
    const canonicalHref = isAuthenticatedArea
      ? authCanonicalUrl.toString()
      : publicCanonicalHref;
    const nextTitle = isAuthenticatedArea ? activeMeta.title : publicPage.title;
    const nextDescription = isAuthenticatedArea
      ? activeMeta.description
      : publicPage.description;
    const ogImageUrl = new URL(publicSeo.ogImagePath, origin).toString();
    const robotsContent = isAuthenticatedArea
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    document.title = nextTitle;

    upsertMetaTag(
      'meta[name="description"]',
      "name",
      "description",
      nextDescription,
    );
    upsertMetaTag(
      'meta[name="keywords"]',
      "name",
      "keywords",
      publicPage.keywords.join(", "),
    );
    upsertMetaTag('meta[name="robots"]', "name", "robots", robotsContent);
    upsertMetaTag('meta[name="googlebot"]', "name", "googlebot", robotsContent);

    upsertMetaTag('meta[property="og:title"]', "property", "og:title", nextTitle);
    upsertMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description",
      nextDescription,
    );
    upsertMetaTag('meta[property="og:type"]', "property", "og:type", "website");
    upsertMetaTag(
      'meta[property="og:site_name"]',
      "property",
      "og:site_name",
      publicSeo.siteName,
    );
    upsertMetaTag(
      'meta[property="og:locale"]',
      "property",
      "og:locale",
      locale === "vi" ? "vi_VN" : "en_US",
    );
    upsertMetaTag('meta[property="og:url"]', "property", "og:url", canonicalHref);
    upsertMetaTag(
      'meta[property="og:image"]',
      "property",
      "og:image",
      ogImageUrl,
    );
    upsertMetaTag(
      'meta[property="og:image:secure_url"]',
      "property",
      "og:image:secure_url",
      ogImageUrl,
    );
    upsertMetaTag(
      'meta[property="og:image:width"]',
      "property",
      "og:image:width",
      DEFAULT_OG_IMAGE_WIDTH,
    );
    upsertMetaTag(
      'meta[property="og:image:height"]',
      "property",
      "og:image:height",
      DEFAULT_OG_IMAGE_HEIGHT,
    );
    upsertMetaTag(
      'meta[property="og:image:alt"]',
      "property",
      "og:image:alt",
      publicSeo.ogImageAlt,
    );

    upsertMetaTag(
      'meta[name="twitter:card"]',
      "name",
      "twitter:card",
      "summary_large_image",
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
    upsertMetaTag(
      'meta[name="twitter:image"]',
      "name",
      "twitter:image",
      ogImageUrl,
    );
    upsertMetaTag(
      'meta[name="twitter:image:alt"]',
      "name",
      "twitter:image:alt",
      publicSeo.ogImageAlt,
    );

    upsertLinkTag('link[rel="canonical"]', "canonical", canonicalHref);

    if (isAuthenticatedArea) {
      removeHeadNodes('link[data-seo-alternate="true"]');
      removeJsonLd(JSON_LD_ID);
    } else {
      syncAlternateLinks(publicCanonicalHref);
      upsertJsonLd(
        JSON_LD_ID,
        buildPublicPageStructuredData(origin, locale, publicPage),
      );
    }
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
