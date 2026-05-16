import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  CirclePlay,
  Layers3,
  Link2,
  MonitorSmartphone,
  Radar,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "@/src/hooks/useLocale";
import {
  getPublicPages,
  type PublicPageContent,
  type PublicPageKey,
} from "@/src/lib/publicPages";
import { PUBLIC_SEO_CONTENT } from "@/src/lib/publicSeo";

interface PublicPageScreenProps {
  page: PublicPageContent;
}

type VisualMode =
  | "editorial"
  | "dashboard"
  | "spotlight"
  | "magazine"
  | "campaign";

type VisualStat = {
  label: string;
  value: string;
  icon: typeof Sparkles;
};

type VisualMedia = {
  title: string;
  note: string;
  src: string;
  alt: string;
  objectClass: string;
  shellClass: string;
  preview:
    | "create"
    | "analytics"
    | "install"
    | "pricing"
    | "library"
    | "tiktok";
};

type RouteArtDirection = {
  mode: VisualMode;
  pageClass: string;
  headerClass: string;
  heroClass: string;
  surfaceClass: string;
  chipClass: string;
  spotlightClass: string;
  sectionToneClass: string;
  stats: VisualStat[];
  media: VisualMedia[];
};

type PublicPageCtaConfig = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

const RELATED_MEDIA_PREFERENCE: Record<PublicPageKey, VisualMedia["preview"][]> = {
  home: ["library", "create", "analytics"],
  pricing: ["pricing", "library", "install"],
  install: ["install", "create", "analytics"],
  faq: ["library", "create", "analytics"],
  "landing-page-shopee": ["create", "library", "analytics"],
  "landing-page-tiktok": ["tiktok", "create", "analytics"],
  "rut-gon-link-shopee": ["library", "create", "analytics"],
  "rut-gon-link-tiktok": ["tiktok", "create", "analytics"],
  "tracking-click-affiliate": ["analytics", "library", "create"],
  "link-tiktok-affiliate": ["tiktok", "analytics", "create"],
  "cach-rut-gon-link-shopee": ["create", "library", "analytics"],
  "cach-rut-gon-link-tiktok": ["tiktok", "create", "analytics"],
  "cach-theo-doi-click-affiliate": ["analytics", "library", "create"],
};

const scrollToSection = (id: string) => {
  if (typeof document === "undefined") return;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const IMAGE_CREATE_LINK = "/seo-real/create.png";
const IMAGE_ANALYTICS = "/seo-real/analytics.png";
const IMAGE_INSTALL = "/seo-real/install.png";
const IMAGE_PRICING = "/seo-real/pricing.png";
const IMAGE_LIBRARY = "/seo-real/library.png";
const IMAGE_TIKTOK = "/seo-real/create-tiktok.png";

const buildArtDirection = (
  key: PublicPageKey,
  locale: "vi" | "en",
): RouteArtDirection => {
  const isVi = locale === "vi";

  const sharedMedia = {
    create: {
      src: IMAGE_CREATE_LINK,
      alt: "HotsNew Click create-link flow",
      objectClass: "object-cover object-center",
      preview: "create" as const,
    },
    analytics: {
      src: IMAGE_ANALYTICS,
      alt: "HotsNew Click analytics view",
      objectClass: "object-cover object-center",
      preview: "analytics" as const,
    },
    install: {
      src: IMAGE_INSTALL,
      alt: "HotsNew Click install center",
      objectClass: "object-cover object-center",
      preview: "install" as const,
    },
    pricing: {
      src: IMAGE_PRICING,
      alt: "HotsNew Click pricing board",
      objectClass: "object-cover object-center",
      preview: "pricing" as const,
    },
    library: {
      src: IMAGE_LIBRARY,
      alt: "HotsNew Click link library",
      objectClass: "object-cover object-center",
      preview: "library" as const,
    },
    tiktok: {
      src: IMAGE_TIKTOK,
      alt: "HotsNew Click TikTok routing flow",
      objectClass: "object-cover object-center",
      preview: "tiktok" as const,
    },
  };

  const map: Record<PublicPageKey, RouteArtDirection> = {
    home: {
      mode: "editorial",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#ffe5c7_0,#f5efe7_40%,#f2eadf_100%)]",
      headerClass: "bg-white/75 border-white/80",
      heroClass:
        "bg-[linear-gradient(145deg,#1d160f_0%,#352312_55%,#7e4413_130%)] text-white",
      surfaceClass: "bg-white/82 border-white/80",
      chipClass: "border-orange-200 bg-orange-50 text-orange-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff8f0_0,#fff2e5_55%,#f5efe7_100%)]",
      sectionToneClass: "from-[#fff8f0] to-white",
      stats: [
        {
          label: isVi ? "Trang công khai" : "Public pages",
          value: "10+",
          icon: Layers3,
        },
        {
          label: isVi ? "Tối ưu preview" : "Preview control",
          value: isVi ? "ảnh + video" : "image + video",
          icon: CirclePlay,
        },
        {
          label: isVi ? "Đo lượt bấm" : "Click analytics",
          value: isVi ? "UTM / click" : "UTM / click",
          icon: Radar,
        },
      ],
      media: [
        {
          title: isVi ? "Bảng điều khiển chính" : "Main dashboard",
          note: isVi ? "Xem link và lượt bấm ngay trên cùng một màn" : "See links and clicks in one place",
          shellClass: "rotate-[-2deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "Logo và domain sạch" : "Brand and clean domains",
          note: isVi ? "Hợp cho link chính bạn mang đi chia sẻ" : "Built for the main link you share",
          shellClass: "rotate-[3deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Card chia sẻ ngoài social" : "Social share card",
          note: isVi ? "Preview rõ hơn khi phát tán" : "Sharper public sharing preview",
          shellClass: "rotate-[-3deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    pricing: {
      mode: "dashboard",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#fff1d8_0,#f4eee7_38%,#ede8e0_100%)]",
      headerClass: "bg-white/85 border-white/85",
      heroClass:
        "bg-[linear-gradient(140deg,#0d1726_0%,#16263d_40%,#31527f_100%)] text-white",
      surfaceClass: "bg-white/88 border-slate-200",
      chipClass: "border-sky-200 bg-sky-50 text-sky-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#eff6ff_0,#f8fafc_48%,#ffffff_100%)]",
      sectionToneClass: "from-[#eff6ff] to-white",
      stats: [
        {
          label: isVi ? "Domain đầu ra" : "Output domains",
          value: isVi ? "1 -> multi" : "1 -> multi",
          icon: Link2,
        },
        {
          label: isVi ? "Số link" : "Link volume",
          value: isVi ? "linh hoạt" : "flexible",
          icon: Layers3,
        },
        {
          label: isVi ? "Nhu cầu dùng" : "Usage fit",
          value: isVi ? "cá nhân -> nhóm" : "solo -> team",
          icon: ShieldCheck,
        },
      ],
      media: [
        {
          title: isVi ? "Màn hình so gói" : "Plan comparison panel",
          note: isVi ? "Đọc giá theo nhu cầu thật" : "Read pricing by real usage",
          shellClass: "translate-y-2",
          ...sharedMedia.pricing,
        },
        {
          title: isVi ? "Flow link và video" : "Link and video flow",
          note: isVi ? "Quota nên bám traffic" : "Quota should follow traffic",
          shellClass: "rotate-[-4deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "So sánh gói dễ hiểu" : "Easy plan comparison",
          note: isVi ? "Xem nhanh gói nào hợp với nhu cầu hiện tại" : "See which plan fits your current needs",
          shellClass: "rotate-[4deg]",
          ...sharedMedia.install,
        },
      ],
    },
    install: {
      mode: "spotlight",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#f7f0df_0,#f7f5ee_45%,#ece8e0_100%)]",
      headerClass: "bg-white/80 border-white/85",
      heroClass:
        "bg-[linear-gradient(145deg,#fffdf9_0%,#f8f2e8_45%,#ffe5c8_100%)] text-slate-950",
      surfaceClass: "bg-white/90 border-orange-100",
      chipClass: "border-amber-200 bg-amber-50 text-amber-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff7ed_0,#fffdf8_42%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff7ed] to-white",
      stats: [
        {
          label: isVi ? "Điểm vào nhanh" : "Fast entry",
          value: isVi ? "desktop" : "desktop",
          icon: MonitorSmartphone,
        },
        {
          label: isVi ? "Giảm tab rối" : "Less tab clutter",
          value: isVi ? "focused" : "focused",
          icon: Waypoints,
        },
        {
          label: isVi ? "Bắt đầu nhanh" : "Faster start",
          value: isVi ? "1 luồng" : "1 flow",
          icon: Sparkles,
        },
      ],
      media: [
        {
          title: isVi ? "Màn hình app" : "App view",
          note: isVi ? "Dùng như app riêng" : "Use it like a dedicated app",
          shellClass: "rotate-[-5deg]",
          ...sharedMedia.install,
        },
        {
          title: isVi ? "Shortcut gọn hơn" : "Cleaner shortcut entry",
          note: isVi ? "Giảm thao tác mở lại" : "Reduce re-open friction",
          shellClass: "translate-y-6 rotate-[4deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Hướng dẫn trực quan" : "Visual walkthrough",
          note: isVi ? "Phù hợp cho người mới dùng lần đầu" : "Useful for first-time users",
          shellClass: "rotate-[2deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    faq: {
      mode: "magazine",
      pageClass:
        "bg-[radial-gradient(circle_at_top,#f3ebff_0,#f8f4ff_34%,#f7f0e8_100%)]",
      headerClass: "bg-white/78 border-white/80",
      heroClass:
        "bg-[linear-gradient(135deg,#28164b_0%,#3f286f_55%,#7d4dd8_130%)] text-white",
      surfaceClass: "bg-white/88 border-violet-100",
      chipClass: "border-violet-200 bg-violet-50 text-violet-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#faf5ff_0,#ffffff_55%,#f7f0e8_100%)]",
      sectionToneClass: "from-[#faf5ff] to-white",
      stats: [
        {
          label: isVi ? "Câu hỏi trọng tâm" : "Core questions",
          value: isVi ? "SEO + app" : "SEO + app",
          icon: Sparkles,
        },
        {
          label: isVi ? "Crawler hiểu đúng" : "Crawler clarity",
          value: isVi ? "schema" : "schema",
          icon: Radar,
        },
        {
          label: isVi ? "Người mới đỡ rối" : "Faster onboarding",
          value: isVi ? "rõ luồng" : "clearer flow",
          icon: ShieldCheck,
        },
      ],
      media: [
        {
          title: isVi ? "FAQ có cấu trúc" : "Structured FAQ",
          note: isVi ? "Vừa cho người đọc vừa cho schema" : "For readers and schema together",
          shellClass: "rotate-[-2deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Màn hình public rõ ràng" : "Clear public surface",
          note: isVi ? "Giải thích đúng bối cảnh app" : "Explain the app in the right context",
          shellClass: "translate-y-4 rotate-[3deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "Điểm neo thông tin" : "Information anchors",
          note: isVi ? "Nội dung dài nhưng vẫn dễ quét" : "Long-form but still scannable",
          shellClass: "rotate-[-5deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "landing-page-shopee": {
      mode: "campaign",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#fde8d4_0,#fbf2e8_44%,#efe8de_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(140deg,#2a1308_0%,#4a2209_44%,#f7771d_140%)] text-white",
      surfaceClass: "bg-white/88 border-orange-100",
      chipClass: "border-orange-200 bg-orange-50 text-orange-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff7ed_0,#fffdf9_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff7ed] to-white",
      stats: [
        {
          label: isVi ? "Link Shopee" : "Shopee link",
          value: isVi ? "share-ready" : "share-ready",
          icon: Link2,
        },
        {
          label: isVi ? "Preview mạnh" : "Preview power",
          value: isVi ? "card đẹp" : "clean cards",
          icon: CirclePlay,
        },
        {
          label: isVi ? "Đo click" : "Click tracking",
          value: isVi ? "theo link" : "per link",
          icon: BarChart3,
        },
      ],
      media: [
        {
          title: isVi ? "Landing page cho Shopee" : "Shopee landing page",
          note: isVi ? "Giữ ý định mua trước khi redirect" : "Preserve purchase intent before redirect",
          shellClass: "rotate-[-3deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Khối giải thích offer" : "Offer explanation block",
          note: isVi ? "Cho người xem biết vì sao nên bấm" : "Show why the click is worth it",
          shellClass: "translate-y-6 rotate-[5deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "Card CTA ngắn gọn" : "Compact CTA card",
          note: isVi ? "Thân thiện với traffic social" : "Fits social traffic surfaces",
          shellClass: "rotate-[2deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "landing-page-tiktok": {
      mode: "campaign",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#ffd9df_0,#fff4f6_35%,#f5efe7_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(140deg,#140b1d_0%,#281534_42%,#ff5a76_145%)] text-white",
      surfaceClass: "bg-white/88 border-rose-100",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff1f4_0,#fffdfd_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff1f4] to-white",
      stats: [
        {
          label: isVi ? "Link TikTok" : "TikTok link",
          value: isVi ? "bio / video" : "bio / video",
          icon: CirclePlay,
        },
        {
          label: isVi ? "Context click" : "Click context",
          value: isVi ? "creator-fit" : "creator-fit",
          icon: Sparkles,
        },
        {
          label: isVi ? "Preview dọc" : "Vertical preview",
          value: isVi ? "visual" : "visual",
          icon: MonitorSmartphone,
        },
      ],
      media: [
        {
          title: isVi ? "Bố cục hợp TikTok" : "TikTok-first composition",
          note: isVi ? "Nhịp nhìn nhanh, CTA rõ" : "Fast scanning with clear CTA",
          shellClass: "rotate-[3deg]",
          ...sharedMedia.tiktok,
        },
        {
          title: isVi ? "Preview đi cùng creator" : "Preview aligned to creator",
          note: isVi ? "Dễ gắn vào bio và video điều hướng" : "Easy to connect with bio and routing clips",
          shellClass: "translate-y-5 rotate-[-4deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Khối CTA nhỏ gọn" : "Compact CTA block",
          note: isVi ? "Giữ route dễ nhớ" : "Keeps the route memorable",
          shellClass: "rotate-[5deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "rut-gon-link-shopee": {
      mode: "editorial",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#ffe7d0_0,#f8f1e8_42%,#efe7dd_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(145deg,#24160c_0%,#40220d_50%,#c76b18_130%)] text-white",
      surfaceClass: "bg-white/88 border-orange-100",
      chipClass: "border-orange-200 bg-orange-50 text-orange-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff8ef_0,#fffdf8_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff8ef] to-white",
      stats: [
        {
          label: isVi ? "Slug dễ nhớ" : "Memorable slug",
          value: isVi ? "clean URL" : "clean URL",
          icon: Link2,
        },
        {
          label: isVi ? "Shopee share" : "Shopee share",
          value: isVi ? "gọn hơn" : "cleaner",
          icon: Sparkles,
        },
        {
          label: isVi ? "Theo dõi click" : "Click readback",
          value: isVi ? "rõ hơn" : "clearer",
          icon: Radar,
        },
      ],
      media: [
        {
          title: isVi ? "Route rút gọn chuẩn hơn" : "Cleaner shortened route",
          note: isVi ? "Đỡ phụ thuộc URL gốc dài" : "Less dependent on a long raw URL",
          shellClass: "rotate-[-4deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "Slug đọc được" : "Readable slug",
          note: isVi ? "Tốt hơn cho comment và bio" : "Better for comments and bios",
          shellClass: "rotate-[4deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Landing tách bối cảnh" : "Landing for context control",
          note: isVi ? "Không chỉ rút ngắn mà còn trình bày lại" : "Not only shortening, but reframing the click",
          shellClass: "translate-y-4 rotate-[-2deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "rut-gon-link-tiktok": {
      mode: "spotlight",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#ffe0eb_0,#fff3f6_36%,#f3ece6_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(145deg,#1a1025_0%,#33173f_50%,#ff6484_135%)] text-white",
      surfaceClass: "bg-white/88 border-rose-100",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff1f5_0,#fffdfd_46%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff1f5] to-white",
      stats: [
        {
          label: isVi ? "TikTok slug" : "TikTok slug",
          value: isVi ? "gọn và nhớ" : "compact",
          icon: Link2,
        },
        {
          label: isVi ? "Bio route" : "Bio route",
          value: isVi ? "dễ đọc" : "readable",
          icon: MonitorSmartphone,
        },
        {
          label: isVi ? "Share context" : "Share context",
          value: isVi ? "đủ rõ" : "clear",
          icon: CirclePlay,
        },
      ],
      media: [
        {
          title: isVi ? "Link TikTok gọn hơn" : "Shorter TikTok route",
          note: isVi ? "Tốt cho bio lẫn caption điều hướng" : "Works for bio and routing captions",
          shellClass: "rotate-[5deg]",
          ...sharedMedia.tiktok,
        },
        {
          title: isVi ? "Mô-đun preview" : "Preview module",
          note: isVi ? "Giúp click có thêm bối cảnh" : "Adds context before the click",
          shellClass: "rotate-[-4deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Icon route nhận diện" : "Recognizable route icon",
          note: isVi ? "Gắn chặt với creator flow" : "Fits creator workflows",
          shellClass: "translate-y-6 rotate-[2deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "tracking-click-affiliate": {
      mode: "dashboard",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#dff2ff_0,#edf7ff_35%,#efe9e1_100%)]",
      headerClass: "bg-white/84 border-white/85",
      heroClass:
        "bg-[linear-gradient(145deg,#0d1521_0%,#15324b_48%,#21a1d8_130%)] text-white",
      surfaceClass: "bg-white/90 border-sky-100",
      chipClass: "border-sky-200 bg-sky-50 text-sky-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#eff6ff_0,#fbfdff_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#eff6ff] to-white",
      stats: [
        {
          label: isVi ? "Nguồn truy cập" : "Traffic source",
          value: isVi ? "tách rõ" : "split",
          icon: Radar,
        },
        {
          label: isVi ? "Dữ liệu theo link" : "Link-level data",
          value: isVi ? "rõ ràng" : "clear",
          icon: BarChart3,
        },
        {
          label: isVi ? "Ra quyết định" : "Optimization loop",
          value: isVi ? "xem -> chỉnh" : "review -> adjust",
          icon: Waypoints,
        },
      ],
      media: [
        {
          title: isVi ? "Bảng tracking chính" : "Tracking board",
          note: isVi ? "Xem mỗi link đang hoạt động ra sao" : "See how each link performs",
          shellClass: "translate-y-2",
          ...sharedMedia.analytics,
        },
        {
          title: isVi ? "Mô-đun UTM và tag" : "UTM and tag module",
          note: isVi ? "Biết lượt bấm đến từ đâu để chỉnh lại" : "Use the data to refine what you share",
          shellClass: "rotate-[-4deg]",
          ...sharedMedia.library,
        },
        {
          title: isVi ? "Card quyết định vòng sau" : "Next-iteration card",
          note: isVi ? "Xem số xong phải biết nên đổi gì" : "Use the numbers to decide what to change",
          shellClass: "rotate-[4deg]",
          ...sharedMedia.create,
        },
      ],
    },
    "link-tiktok-affiliate": {
      mode: "campaign",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#ffe1ec_0,#fff3f7_38%,#f2ece5_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(140deg,#170d1f_0%,#34163e_40%,#ff6a8b_145%)] text-white",
      surfaceClass: "bg-white/88 border-rose-100",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff0f5_0,#fffefe_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff0f5] to-white",
      stats: [
        {
          label: isVi ? "Link cho creator" : "Creator link",
          value: isVi ? "bio / group" : "bio / group",
          icon: CirclePlay,
        },
        {
          label: isVi ? "Slug nhớ nhanh" : "Fast-recognition slug",
          value: isVi ? "clean" : "clean",
          icon: Link2,
        },
        {
          label: isVi ? "Đo theo creator" : "Creator tracking",
          value: isVi ? "tách traffic" : "split traffic",
          icon: BarChart3,
        },
      ],
      media: [
        {
          title: isVi ? "Link dùng cho creator" : "Creator-ready link",
          note: isVi ? "Dùng lại nhiều lần nhưng vẫn đo được" : "Reusable while still measurable",
          shellClass: "rotate-[-3deg]",
          ...sharedMedia.tiktok,
        },
        {
          title: isVi ? "Card giới thiệu ngắn" : "Short intro card",
          note: isVi ? "Cho người xem biết sẽ gặp gì" : "Show viewers what comes next",
          shellClass: "translate-y-5 rotate-[4deg]",
          ...sharedMedia.create,
        },
        {
          title: isVi ? "Route icon rõ thương hiệu" : "Branded route icon",
          note: isVi ? "Phù hợp cho luồng affiliate lặp lại" : "Good for repeatable affiliate flows",
          shellClass: "rotate-[5deg]",
          ...sharedMedia.analytics,
        },
      ],
    },
    "cach-rut-gon-link-shopee": {
      mode: "editorial",
      pageClass:
        "bg-[radial-gradient(circle_at_top_left,#ffe7d0_0,#f8f1e8_42%,#efe7dd_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(145deg,#24160c_0%,#40220d_50%,#c76b18_130%)] text-white",
      surfaceClass: "bg-white/88 border-orange-100",
      chipClass: "border-orange-200 bg-orange-50 text-orange-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff8ef_0,#fffdf8_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff8ef] to-white",
      stats: [
        { label: isVi ? "Hướng dẫn Shopee" : "Shopee guide", value: isVi ? "thực dụng" : "practical", icon: Sparkles },
        { label: isVi ? "Slug dễ nhớ" : "Memorable slug", value: isVi ? "clean URL" : "clean URL", icon: Link2 },
        { label: isVi ? "Theo dõi click" : "Click readback", value: isVi ? "rõ hơn" : "clearer", icon: Radar },
      ],
      media: [
        { title: isVi ? "Các bước tạo link" : "Link creation steps", note: isVi ? "Nhìn đúng thứ cần chỉnh trước khi đăng" : "See what to tune before posting", shellClass: "rotate-[-4deg]", ...sharedMedia.create },
        { title: isVi ? "Danh sách link dễ so sánh" : "Library for quick comparison", note: isVi ? "Dễ nhìn lại từng slug và chiến dịch" : "Easy to review each slug and campaign", shellClass: "rotate-[3deg]", ...sharedMedia.library },
        { title: isVi ? "Tracking đi kèm" : "Tracking attached", note: isVi ? "Không rút gọn xong rồi mất dữ liệu" : "Do not lose the data after shortening", shellClass: "translate-y-4 rotate-[-2deg]", ...sharedMedia.analytics },
      ],
    },
    "cach-rut-gon-link-tiktok": {
      mode: "spotlight",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#ffe0eb_0,#fff3f6_36%,#f3ece6_100%)]",
      headerClass: "bg-white/82 border-white/80",
      heroClass:
        "bg-[linear-gradient(145deg,#1a1025_0%,#33173f_50%,#ff6484_135%)] text-white",
      surfaceClass: "bg-white/88 border-rose-100",
      chipClass: "border-rose-200 bg-rose-50 text-rose-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#fff1f5_0,#fffdfd_46%,#ffffff_100%)]",
      sectionToneClass: "from-[#fff1f5] to-white",
      stats: [
        { label: isVi ? "Hướng dẫn TikTok" : "TikTok guide", value: isVi ? "bio-ready" : "bio-ready", icon: MonitorSmartphone },
        { label: isVi ? "Slug gọn" : "Compact slug", value: isVi ? "dễ nhớ" : "memorable", icon: Link2 },
        { label: isVi ? "Đo theo creator" : "Creator tracking", value: isVi ? "rõ hơn" : "clearer", icon: BarChart3 },
      ],
      media: [
        { title: isVi ? "Link bio dễ đọc" : "Readable bio link", note: isVi ? "Hợp với bio và clip điều hướng" : "Fits bios and routing clips", shellClass: "rotate-[5deg]", ...sharedMedia.tiktok },
        { title: isVi ? "Khối preview đúng ngữ cảnh" : "Context-matched preview", note: isVi ? "Người xem nhìn là hiểu mình sắp đi đâu" : "Viewers quickly understand where they are going", shellClass: "rotate-[-4deg]", ...sharedMedia.create },
        { title: isVi ? "Theo dõi creator" : "Creator-level analytics", note: isVi ? "Tách riêng theo người đẩy traffic" : "Separate results by the traffic source", shellClass: "translate-y-6 rotate-[2deg]", ...sharedMedia.analytics },
      ],
    },
    "cach-theo-doi-click-affiliate": {
      mode: "dashboard",
      pageClass:
        "bg-[radial-gradient(circle_at_top_right,#dff2ff_0,#edf7ff_35%,#efe9e1_100%)]",
      headerClass: "bg-white/84 border-white/85",
      heroClass:
        "bg-[linear-gradient(145deg,#0d1521_0%,#15324b_48%,#21a1d8_130%)] text-white",
      surfaceClass: "bg-white/90 border-sky-100",
      chipClass: "border-sky-200 bg-sky-50 text-sky-700",
      spotlightClass:
        "bg-[radial-gradient(circle_at_top,#eff6ff_0,#fbfdff_50%,#ffffff_100%)]",
      sectionToneClass: "from-[#eff6ff] to-white",
      stats: [
        { label: isVi ? "Nguồn click" : "Click source", value: isVi ? "tách rõ" : "separate", icon: Radar },
        { label: isVi ? "Hiệu quả link" : "Link performance", value: isVi ? "so sánh" : "compare", icon: BarChart3 },
        { label: isVi ? "Quyết định vòng sau" : "Next action", value: isVi ? "giữ / sửa / bỏ" : "keep / change / stop", icon: Waypoints },
      ],
      media: [
        { title: isVi ? "Bảng click chính" : "Primary click board", note: isVi ? "Xem nguồn nào đang kéo tốt" : "See which source is performing best", shellClass: "translate-y-2", ...sharedMedia.analytics },
        { title: isVi ? "Nhóm link theo tag" : "Links grouped by tags", note: isVi ? "Dễ lọc lại theo chiến dịch hoặc bề mặt" : "Easy to filter by campaign or surface", shellClass: "rotate-[-4deg]", ...sharedMedia.library },
        { title: isVi ? "Vòng tối ưu tiếp theo" : "Next optimization loop", note: isVi ? "Nhìn số xong phải biết nên đổi gì" : "Use the numbers to decide what to change", shellClass: "rotate-[4deg]", ...sharedMedia.create },
      ],
    },
  };

  return map[key];
};

const buildPageCta = (
  page: PublicPageContent,
  locale: "vi" | "en",
): PublicPageCtaConfig => {
  const isVi = locale === "vi";

  const sharedPrimary = isVi
    ? {
        primaryLabel: "Vào app để bắt đầu",
        primaryHref: "/",
      }
    : {
        primaryLabel: "Open the app",
        primaryHref: "/",
      };

  switch (page.key) {
    case "home":
      return isVi
        ? {
            title: "Bắt đầu từ một link đầu tiên.",
            description:
              "Vào app để tạo link, chỉnh preview và xem ngay lượt bấm trên cùng một luồng thao tác.",
            primaryLabel: "Tạo link đầu tiên",
            primaryHref: "/",
            secondaryLabel: "Xem bảng giá",
            secondaryHref: "/discover/pricing",
          }
        : {
            title: "Start with your first link.",
            description:
              "Open the app to create a link, control the preview, and review clicks in one flow.",
            primaryLabel: "Create your first link",
            primaryHref: "/",
            secondaryLabel: "See pricing",
            secondaryHref: "/discover/pricing",
          };
    case "pricing":
      return isVi
        ? {
            title: "Đã biết nhu cầu, bước tiếp theo là vào app.",
            description:
              "Chọn gói phù hợp rồi vào app để tạo link, gắn domain và bắt đầu chạy thử với nhu cầu thật.",
            ...sharedPrimary,
            secondaryLabel: "Xem cách cài app",
            secondaryHref: "/discover/install",
          }
        : {
            title: "Once the plan is clear, the next step is opening the app.",
            description:
              "Choose the right plan, then open the app to create links, attach domains, and test with real traffic.",
            ...sharedPrimary,
            secondaryLabel: "See install guide",
            secondaryHref: "/discover/install",
          };
    case "install":
      return isVi
        ? {
            title: "Cài xong thì đăng nhập và dùng ngay.",
            description:
              "Mở app, đăng nhập, tạo link đầu tiên rồi quay lại bảng giá nếu cần thêm domain hoặc quota.",
            primaryLabel: "Đăng nhập ngay",
            primaryHref: "/",
            secondaryLabel: "Xem bảng giá",
            secondaryHref: "/discover/pricing",
          }
        : {
            title: "After install, sign in and start using it.",
            description:
              "Open the app, sign in, create the first link, then come back to pricing if you need more domains or quota.",
            primaryLabel: "Sign in now",
            primaryHref: "/",
            secondaryLabel: "See pricing",
            secondaryHref: "/discover/pricing",
          };
    case "faq":
      return isVi
        ? {
            title: "Đã hết thắc mắc, chuyển sang bước phù hợp hơn.",
            description:
              "Nếu bạn đang cân nhắc chi phí thì xem bảng giá. Nếu muốn bắt đầu thao tác, vào app hoặc xem cách cài nhanh.",
            primaryLabel: "Xem bảng giá",
            primaryHref: "/discover/pricing",
            secondaryLabel: "Xem cách cài app",
            secondaryHref: "/discover/install",
          }
        : {
            title: "Once the questions are clear, move to the next useful step.",
            description:
              "Go to pricing if you are comparing costs, or move into the app and install flow if you are ready to start.",
            primaryLabel: "See pricing",
            primaryHref: "/discover/pricing",
            secondaryLabel: "See install guide",
            secondaryHref: "/discover/install",
          };
    case "landing-page-shopee":
      return isVi
        ? {
            title: "Nếu bạn cần card đẹp hơn, bước tiếp theo là tạo link thật.",
            description:
              "Vào app để dán link Shopee, chỉnh title, mô tả, ảnh và xuất ra một trang công khai dễ mang đi đăng bài.",
            primaryLabel: "Tạo link Shopee",
            primaryHref: "/",
            secondaryLabel: "Xem bản rút gọn Shopee",
            secondaryHref: "/discover/rut-gon-link-shopee",
          }
        : {
            title: "If you want a cleaner share card, the next step is creating a real link.",
            description:
              "Open the app to paste the Shopee URL, tune title, description, image, and publish a cleaner public page.",
            primaryLabel: "Create a Shopee link",
            primaryHref: "/",
            secondaryLabel: "See Shopee short-link page",
            secondaryHref: "/discover/rut-gon-link-shopee",
          };
    case "landing-page-tiktok":
      return isVi
        ? {
            title: "Muốn bio gọn và dễ nhớ hơn thì vào app để tạo link.",
            description:
              "Dán link TikTok, chọn slug dễ đọc, thêm preview rồi đưa link đó vào bio hoặc video điều hướng.",
            primaryLabel: "Tạo link TikTok",
            primaryHref: "/",
            secondaryLabel: "Xem bản rút gọn TikTok",
            secondaryHref: "/discover/rut-gon-link-tiktok",
          }
        : {
            title: "If you want a cleaner bio link, create the real page inside the app.",
            description:
              "Paste the TikTok URL, choose a readable slug, add a preview, then use that link in the bio or routing video.",
            primaryLabel: "Create a TikTok link",
            primaryHref: "/",
            secondaryLabel: "See TikTok short-link page",
            secondaryHref: "/discover/rut-gon-link-tiktok",
          };
    case "rut-gon-link-shopee":
      return isVi
        ? {
            title: "Đã rõ cách rút gọn, giờ hãy làm link thật để dùng ngay.",
            description:
              "Vào app để tạo slug dễ nhớ, chọn domain phù hợp và giữ luôn preview lẫn tracking cho link Shopee.",
            primaryLabel: "Rút gọn link Shopee",
            primaryHref: "/",
            secondaryLabel: "Xem đo lượt bấm",
            secondaryHref: "/discover/tracking-click-affiliate",
          }
        : {
            title: "If the short-link idea is clear, build the real link now.",
            description:
              "Open the app to create a memorable slug, choose the right domain, and keep preview plus tracking on the Shopee link.",
            primaryLabel: "Shorten a Shopee link",
            primaryHref: "/",
            secondaryLabel: "See click tracking",
            secondaryHref: "/discover/tracking-click-affiliate",
          };
    case "rut-gon-link-tiktok":
      return isVi
        ? {
            title: "Đã rõ cách làm link gọn hơn, giờ hãy tạo link TikTok thật.",
            description:
              "Vào app để đặt slug ngắn, thêm preview và dùng link đó cho bio, creator hoặc chiến dịch TikTok.",
            primaryLabel: "Rút gọn link TikTok",
            primaryHref: "/",
            secondaryLabel: "Xem link TikTok affiliate",
            secondaryHref: "/discover/link-tiktok-affiliate",
          }
        : {
            title: "If the short-link pattern is clear, build the TikTok link now.",
            description:
              "Open the app to set a short slug, attach a preview, and use that link for bio, creator, or TikTok campaign flows.",
            primaryLabel: "Shorten a TikTok link",
            primaryHref: "/",
            secondaryLabel: "See TikTok affiliate links",
            secondaryHref: "/discover/link-tiktok-affiliate",
          };
    case "tracking-click-affiliate":
      return isVi
        ? {
            title: "Muốn có dữ liệu thì phải có link thật để đo.",
            description:
              "Vào app để tạo link có slug, UTM và tag rõ ràng, rồi quay lại xem link nào đáng đẩy tiếp.",
            primaryLabel: "Tạo link để đo click",
            primaryHref: "/",
            secondaryLabel: "Xem bảng giá",
            secondaryHref: "/discover/pricing",
          }
        : {
            title: "If you want useful data, start with a real measurable link.",
            description:
              "Open the app to create links with slugs, UTM parameters, and tags, then come back to review what deserves more traffic.",
            primaryLabel: "Create a measurable link",
            primaryHref: "/",
            secondaryLabel: "See pricing",
            secondaryHref: "/discover/pricing",
          };
    case "link-tiktok-affiliate":
      return isVi
        ? {
            title: "Nếu bạn chạy affiliate TikTok, bước tiếp theo là tạo link dùng được ngay.",
            description:
              "Vào app để làm link dễ nhớ, hợp bio và có tracking rõ theo creator hoặc chiến dịch.",
            primaryLabel: "Tạo link TikTok affiliate",
            primaryHref: "/",
            secondaryLabel: "Xem landing page TikTok",
            secondaryHref: "/discover/landing-page-tiktok",
          }
        : {
            title: "If you run TikTok affiliate traffic, the next step is building a reusable link.",
            description:
              "Open the app to create a memorable link that fits bio usage and keeps creator or campaign tracking clear.",
            primaryLabel: "Create a TikTok affiliate link",
            primaryHref: "/",
            secondaryLabel: "See TikTok landing page",
            secondaryHref: "/discover/landing-page-tiktok",
          };
    case "cach-rut-gon-link-shopee":
      return isVi
        ? {
            title: "Đã nắm cách làm, giờ bạn chỉ cần tạo link Shopee thật.",
            description:
              "Vào app để dán link Shopee, rút gọn URL, chỉnh preview và giữ luôn phần đo lượt bấm trên cùng một luồng.",
            primaryLabel: "Tạo link Shopee ngay",
            primaryHref: "/",
            secondaryLabel: "Xem bản rút gọn Shopee",
            secondaryHref: "/discover/rut-gon-link-shopee",
          }
        : {
            title: "If the method is clear, the next step is creating a real Shopee link.",
            description:
              "Open the app to paste the Shopee URL, shorten it, tune the preview, and keep click tracking in the same flow.",
            primaryLabel: "Create a Shopee link now",
            primaryHref: "/",
            secondaryLabel: "See the Shopee short-link page",
            secondaryHref: "/discover/rut-gon-link-shopee",
          };
    case "cach-rut-gon-link-tiktok":
      return isVi
        ? {
            title: "Đã hiểu cách làm, giờ hãy tạo link TikTok dùng được ngay.",
            description:
              "Vào app để dán link TikTok, chọn slug dễ nhớ, thêm preview và dùng link đó cho bio hoặc video điều hướng.",
            primaryLabel: "Tạo link TikTok ngay",
            primaryHref: "/",
            secondaryLabel: "Xem bản rút gọn TikTok",
            secondaryHref: "/discover/rut-gon-link-tiktok",
          }
        : {
            title: "If the pattern is clear, build the TikTok link you can use right away.",
            description:
              "Open the app to paste the TikTok URL, choose a readable slug, add a preview, and use that link in bio or routing videos.",
            primaryLabel: "Create a TikTok link now",
            primaryHref: "/",
            secondaryLabel: "See the TikTok short-link page",
            secondaryHref: "/discover/rut-gon-link-tiktok",
          };
    case "cach-theo-doi-click-affiliate":
      return isVi
        ? {
            title: "Muốn đo đúng thì phải bắt đầu từ một link đo được.",
            description:
              "Vào app để tạo link có slug, UTM và tag rõ ràng, rồi quay lại xem kênh nào đang kéo click tốt nhất.",
            primaryLabel: "Tạo link để đo click",
            primaryHref: "/",
            secondaryLabel: "Xem trang tracking",
            secondaryHref: "/discover/tracking-click-affiliate",
          }
        : {
            title: "To measure properly, start with a link you can actually track.",
            description:
              "Open the app to create links with clean slugs, UTM parameters, and tags, then come back to see which source performs best.",
            primaryLabel: "Create a measurable link",
            primaryHref: "/",
            secondaryLabel: "See the tracking page",
            secondaryHref: "/discover/tracking-click-affiliate",
          };
    default:
      return isVi
        ? {
            title: "Bắt đầu từ một link thật.",
            description:
              "Vào app để tạo link, chỉnh preview và bắt đầu dùng đúng theo nhu cầu của bạn.",
            ...sharedPrimary,
          }
        : {
            title: "Start with a real link.",
            description:
              "Open the app to create a link, tune the preview, and start using it for your real workflow.",
            ...sharedPrimary,
          };
  }
};

const pickRelatedMedia = (
  item: PublicPageContent,
  locale: "vi" | "en",
): VisualMedia => {
  const art = buildArtDirection(item.key, locale);
  const preferred = RELATED_MEDIA_PREFERENCE[item.key] ?? [];

  for (const preview of preferred) {
    const found = art.media.find((media) => media.preview === preview);
    if (found) return found;
  }

  return art.media[0];
};

export function PublicPageScreen({ page }: PublicPageScreenProps) {
  const { locale } = useLocale();
  const seo = PUBLIC_SEO_CONTENT[locale];
  const isVi = locale === "vi";
  const art = buildArtDirection(page.key, locale);
  const pageCta = buildPageCta(page, locale);
  const allPages = getPublicPages(locale);
  const pageMap = new Map(allPages.map((item) => [item.key, item]));
  const relatedPages =
    page.relatedPageKeys
      ?.map((key) => pageMap.get(key))
      .filter((item): item is PublicPageContent => Boolean(item)) ?? [];

  return (
    <div className={`min-h-dvh text-slate-950 ${art.pageClass}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <header
          className={`rounded-[2rem] border px-5 py-4 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur sm:px-6 ${art.headerClass}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo-app-192.png"
                alt="HotsNew Click"
                className="h-12 w-12 rounded-xl border border-orange-100 object-cover shadow-sm"
              />
              <div>
                <p className="text-xl font-bold tracking-[-0.03em] text-slate-950">
                  HotsNew <span className="text-orange-600">Click</span>
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  {page.heroEyebrow}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <SectionButton
                label={isVi ? "Ảnh app" : "App shots"}
                target="public-captures"
                className={art.chipClass}
              />
              <SectionButton
                label={seo.nav.workflow}
                target="public-workflow"
                className={art.chipClass}
              />
              <SectionButton
                label={seo.nav.features}
                target="public-features"
                className={art.chipClass}
              />
              <SectionButton
                label={seo.nav.faq}
                target="public-faq"
                className={art.chipClass}
              />
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_60%,#ff9a3c_100%)] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_16px_35px_rgba(255,106,0,0.22)]"
              >
                {isVi ? "Đăng nhập" : "Sign in"}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <HeroSection page={page} art={art} isVi={isVi} />
          <CaptureGallery art={art} isVi={isVi} />

          <section
            id="public-features"
            className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]"
          >
            <section
              className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
            >
              <SectionHeading
                title={page.featureTitle}
                description={page.featureDescription}
                compact
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {page.featureItems.slice(0, 3).map((item, index) => (
                  <CompactInfoCard
                    key={item.title}
                    index={index + 1}
                    title={item.title}
                    body={item.body}
                    tint={pickTint(page.key)}
                  />
                ))}
              </div>
            </section>

            <section
              id="public-workflow"
              className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
            >
              <SectionHeading
                title={page.workflowTitle}
                description={page.workflowDescription}
                compact
              />
              <div className="mt-5 grid gap-3">
                {page.workflowSteps.slice(0, 3).map((step, index) => (
                  <FlowStepCard
                    key={step}
                    step={step}
                    index={index + 1}
                    tint={pickTint(page.key)}
                  />
                ))}
              </div>
            </section>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section
              className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
            >
              <SectionHeading
                title={page.useCaseTitle}
                description={page.useCaseDescription}
                compact
              />
              <div className="mt-5 grid gap-3">
                {page.useCaseItems.slice(0, 3).map((item) => (
                  <MiniUseCaseCard
                    key={item.title}
                    title={item.title}
                    body={item.body}
                  />
                ))}
              </div>
            </section>

            <section
              id="public-details"
              className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
            >
              <SectionHeading
                title={isVi ? "Xem kỹ hơn" : "See more details"}
                description={
                  isVi
                    ? "Giữ phần giải thích sâu ở chế độ gấp gọn để trang nhìn nhẹ hơn nhưng ai cần vẫn có thể xem kỹ."
                    : "Keep deeper explanations folded so the page feels lighter while still letting interested readers go deeper."
                }
                compact
              />
              <div className="mt-5 space-y-3">
                {page.detailSections.slice(0, 2).map((section) => (
                  <details
                    key={section.title}
                    className="rounded-[1.35rem] border border-slate-200 bg-[#fcfbf9] px-5 py-4"
                  >
                    <summary className="cursor-pointer list-none text-base font-semibold tracking-[-0.02em] text-slate-950">
                      {section.title}
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {section.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {section.bullets.slice(0, 3).map((bullet) => (
                        <li
                          key={bullet}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          </section>

          <section
            id="public-faq"
            className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
          >
            <SectionHeading
              title={page.faqTitle}
              description={page.faqDescription}
              compact
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {page.faqItems.slice(0, 4).map((item) => (
                <details
                  key={item.question}
                  className="rounded-[1.35rem] border border-slate-200 bg-[#fcfbf9] px-5 py-4"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold tracking-[-0.02em] text-slate-950">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section
            className={`overflow-hidden rounded-[2rem] border shadow-[0_24px_60px_rgba(82,56,20,0.10)] ${art.surfaceClass}`}
          >
            <div className={`bg-gradient-to-br p-6 sm:p-7 ${art.spotlightClass}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <SectionEyebrow
                    label={isVi ? "Bước tiếp theo" : "Next step"}
                  />
                  <h2 className="mt-4 text-2xl font-bold tracking-[-0.035em] text-slate-950">
                    {pageCta.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    {pageCta.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={pageCta.primaryHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff7a00_0%,#ff5a00_60%,#ff9a3c_100%)] px-5 py-3 text-sm font-black tracking-[-0.01em] text-white shadow-[0_16px_35px_rgba(255,106,0,0.22)]"
                  >
                    {pageCta.primaryLabel}
                    <ArrowRight size={16} />
                  </a>
                  {pageCta.secondaryHref && pageCta.secondaryLabel ? (
                    <a
                      href={pageCta.secondaryHref}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-900"
                    >
                      {pageCta.secondaryLabel}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {relatedPages.length > 0 ? (
            <section
              className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
            >
              <SectionHeading
                 title={isVi ? "Xem thêm" : "Related pages"}
                description={
                  isVi
                    ? "Giữ liên kết nội bộ theo đúng intent gần nhất, tránh đổ toàn bộ cụm SEO thành một bài dài."
                    : "Keep internal links close to the same intent instead of turning the whole SEO cluster into one long article."
                }
                compact
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {relatedPages.map((item, index) => {
                  const relatedArt = buildArtDirection(item.key, locale);
                  const relatedMedia = pickRelatedMedia(item, locale);

                  return (
                    <a
                      key={item.path}
                      href={item.path}
                      className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[#fcfbf9] transition-transform hover:-translate-y-1"
                    >
                      <div className={`relative h-48 overflow-hidden ${relatedArt.spotlightClass}`}>
                        <img
                          src={relatedMedia.src}
                          alt={relatedMedia.alt}
                          className={`h-full w-full ${relatedMedia.objectClass}`}
                        />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                          <span className="rounded-full border border-white/80 bg-white/88 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 backdrop-blur">
                            0{index + 1}
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/76 via-slate-950/28 to-transparent p-4">
                          <p className="max-w-[80%] text-[11px] font-bold uppercase tracking-[0.18em] text-white/78">
                            {item.heroEyebrow}
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3
                          className="text-base font-semibold tracking-[-0.02em] text-slate-950"
                          style={compactClamp(3)}
                        >
                          {item.title}
                        </h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function HeroSection({
  page,
  art,
  isVi,
}: {
  page: PublicPageContent;
  art: RouteArtDirection;
  isVi: boolean;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
      <article
        className={`overflow-hidden rounded-[2.7rem] border border-white/10 px-6 py-7 shadow-[0_30px_100px_rgba(24,16,8,0.24)] sm:px-8 ${art.heroClass}`}
      >
        <SectionEyebrow label={page.heroEyebrow} dark />
        <h1 className="mt-5 max-w-3xl text-[2.25rem] font-bold leading-[1.02] tracking-[-0.045em] sm:text-[3.05rem]">
          {page.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 sm:text-[15px]">
          {page.heroDescription}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {art.stats.map((stat) => (
            <StatLine key={stat.label} stat={stat} dark compact />
          ))}
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/82">
          <ChevronDown size={16} />
          {isVi
            ? "Xem nhanh giao diện thật, hiểu cách link hoạt động rồi mới đọc sâu hơn."
            : "See the real interface first, understand the flow, then go deeper into the details."}
        </p>
      </article>

      <article
        className={`rounded-[2.7rem] border p-6 shadow-[0_30px_90px_rgba(82,56,20,0.10)] ${art.surfaceClass}`}
      >
        <SectionEyebrow label={isVi ? "Điểm nhấn nhanh" : "Quick highlights"} />
        <div className="mt-4 grid gap-3">
          {page.summaryCards.slice(0, 3).map((item, index) => (
            <CompactInfoCard
              key={item.title}
              index={index + 1}
              title={item.title}
              body={item.body}
              tint={pickTint(page.key)}
            />
          ))}
        </div>
      </article>
    </section>
  );
}

function CaptureGallery({
  art,
  isVi,
}: {
  art: RouteArtDirection;
  isVi: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = art.media[activeIndex] ?? art.media[0];

  useEffect(() => {
    if (art.media.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % art.media.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [art.media.length]);

  return (
    <section
      id="public-captures"
      className={`rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(82,56,20,0.08)] backdrop-blur ${art.surfaceClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionEyebrow label={isVi ? "Luồng trong app" : "In-app flow"} />
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-slate-950">
            {isVi
              ? "Trang SEO nên cho thấy app đang làm gì, không chỉ mô tả bằng chữ."
              : "SEO pages should show what the app does, not only describe it."}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">
          {isVi
            ? "Ảnh chụp tập trung vào các màn người dùng hay xem nhất: tạo link, bảng giá, cài app và theo dõi lượt bấm."
            : "These screenshots focus on the screens users care about most: create link, pricing, install, and click analytics."}
        </p>
      </div>
      <div className="mt-6">
        <article className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(82,56,20,0.08)]">
          <div className="relative aspect-[16/8.5] overflow-hidden bg-[#f7efe5]">
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
              {isVi
                ? `Màn ${activeIndex + 1}/${art.media.length}`
                : `Frame ${activeIndex + 1}/${art.media.length}`}
            </div>
            <img
              key={activeMedia.src}
              src={activeMedia.src}
              alt={activeMedia.alt}
              className={`h-full w-full ${activeMedia.objectClass}`}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/82 via-slate-950/36 to-transparent p-5 text-white">
              <h3 className="text-lg font-semibold tracking-[-0.03em]">
                {activeMedia.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
                {activeMedia.note}
              </p>
            </div>
          </div>
        </article>

        <div className="hidden grid gap-3">
          {art.media.map((media, index) => (
            <MediaThumbButton
              key={media.title}
              media={media}
              active={index === activeIndex}
              badge={isVi ? `Màn ${index + 1}` : `Frame ${index + 1}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {art.media.map((media, index) => (
            <button
              key={`${media.title}-dot`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={isVi ? `Chuyển tới màn ${index + 1}` : `Go to frame ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-10 bg-orange-500"
                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="hidden mt-6 grid gap-4 lg:grid-cols-2">
        {art.media.map((media, index) => (
          <MediaCard
            key={media.title}
            media={media}
            tall={index === 0}
            badge={isVi ? `Bước ${index + 1}` : `Step ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function SectionButton({
  label,
  target,
  className,
}: {
  label: string;
  target: string;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(target)}
      className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:opacity-85 ${className}`}
    >
      {label}
    </button>
  );
}

function SectionHeading({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-[-0.035em] text-slate-950">
        {title}
      </h2>
      <p
        className={`mt-3 max-w-3xl text-sm text-slate-600 ${
          compact ? "leading-6" : "leading-7"
        }`}
        style={compact ? compactClamp(2) : undefined}
      >
        {description}
      </p>
    </>
  );
}

function SectionEyebrow({
  label,
  dark = false,
}: {
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] ${
        dark
          ? "border-white/12 bg-white/10 text-orange-200"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      <Sparkles size={14} className={dark ? "text-orange-300" : "text-orange-500"} />
      {label}
    </div>
  );
}

function StatLine({
  stat,
  dark = false,
  compact = false,
}: {
  stat: VisualStat;
  dark?: boolean;
  compact?: boolean;
}) {
  const Icon = stat.icon;
  return (
    <div
      className={`rounded-[1.35rem] border px-4 py-4 ${
        dark
          ? "border-white/12 bg-white/8 text-white"
          : "border-slate-200 bg-white text-slate-950"
      } ${compact ? "min-h-[96px]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${dark ? "text-white/52" : "text-slate-400"}`}>
            {stat.label}
          </p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
            {stat.value}
          </p>
        </div>
        <Icon size={18} className={dark ? "text-orange-300" : "text-orange-500"} />
      </div>
    </div>
  );
}

function StatPill({
  stat,
  dark = false,
}: {
  stat: VisualStat;
  dark?: boolean;
}) {
  const Icon = stat.icon;
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 ${
        dark
          ? "border-white/14 bg-white/10 text-white"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <Icon size={16} className={dark ? "text-orange-300" : "text-orange-500"} />
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${dark ? "text-white/52" : "text-slate-400"}`}>
          {stat.label}
        </p>
        <p className="text-sm font-semibold">{stat.value}</p>
      </div>
    </div>
  );
}

function MediaThumbButton({
  media,
  active = false,
  badge,
  onClick,
}: {
  media: VisualMedia;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-[1.5rem] border bg-white text-left shadow-[0_14px_30px_rgba(82,56,20,0.06)] transition-all ${
        active
          ? "border-orange-300 ring-2 ring-orange-200/80"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-orange-200"
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#f7efe5]">
        {badge ? (
          <div className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
            {badge}
          </div>
        ) : null}
        <img
          src={media.src}
          alt={media.alt}
          className={`h-full w-full ${media.objectClass}`}
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
          {media.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600" style={compactClamp(2)}>
          {media.note}
        </p>
      </div>
    </button>
  );
}

function MediaCard({
  media,
  tall = false,
  badge,
}: {
  media: VisualMedia;
  tall?: boolean;
  badge?: string;
}) {
  return (
    <article
      className={`overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(82,56,20,0.08)] ${media.shellClass}`}
    >
      <div className={`${tall ? "aspect-[16/9]" : "aspect-[16/10]"} relative overflow-hidden bg-[#f7efe5]`}>
        {badge ? (
          <div className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
            {badge}
          </div>
        ) : null}
        <img
          src={media.src}
          alt={media.alt}
          className={`h-full w-full ${media.objectClass}`}
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">
          {media.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600" style={compactClamp(2)}>
          {media.note}
        </p>
      </div>
    </article>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
    </div>
  );
}

function CompactInfoCard({
  index,
  title,
  body,
  tint,
}: {
  index: number;
  title: string;
  body: string;
  tint: string;
}) {
  return (
    <div
      className="rounded-[1.4rem] border border-slate-200 px-4 py-4"
      style={{ background: `linear-gradient(145deg, #ffffff 0%, ${tint} 100%)` }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        0{index}
      </p>
      <h3 className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600" style={compactClamp(3)}>
        {body}
      </p>
    </div>
  );
}

function FlowStepCard({
  step,
  index,
  tint,
}: {
  step: string;
  index: number;
  tint: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-950"
          style={{ backgroundColor: tint }}
        >
          {index}
        </span>
        <p className="text-sm leading-6 text-slate-700" style={compactClamp(3)}>
          {step}
        </p>
      </div>
    </div>
  );
}

function MiniUseCaseCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-slate-200 bg-[#fcfbf9] px-4 py-4">
      <h3 className="text-base font-semibold tracking-[-0.02em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600" style={compactClamp(3)}>
        {body}
      </p>
    </article>
  );
}

function compactClamp(lines: number) {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

function AppScreenPreview({
  preview,
}: {
  preview: VisualMedia["preview"];
}) {
  switch (preview) {
    case "create":
      return <CreateLinkPreview />;
    case "analytics":
      return <AnalyticsPreview />;
    case "install":
      return <InstallPreview />;
    case "pricing":
      return <PricingPreview />;
    case "library":
      return <LibraryPreview />;
    case "tiktok":
      return <TikTokPreview />;
    default:
      return null;
  }
}

function PreviewShell({
  topTone = "bg-[#1f1711]",
  children,
}: {
  topTone?: string;
  children: ReactNode;
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-[1.3rem] border border-white/70 bg-[#fffaf4] p-2">
      <div className={`flex h-7 items-center gap-1 rounded-t-[0.9rem] px-3 ${topTone}`}>
        <span className="h-2 w-2 rounded-full bg-[#ff8d5b]" />
        <span className="h-2 w-2 rounded-full bg-[#ffd166]" />
        <span className="h-2 w-2 rounded-full bg-[#7bd389]" />
      </div>
      <div className="h-[calc(100%-1.75rem)] rounded-b-[0.9rem] bg-white p-3">
        {children}
      </div>
    </div>
  );
}

function CreateLinkPreview() {
  return (
    <PreviewShell>
      <div className="grid h-full grid-cols-[0.8fr_1.2fr] gap-3">
        <div className="rounded-[0.9rem] bg-[#22170f] p-3 text-white">
          <div className="h-2 w-16 rounded-full bg-[#ffb560]" />
          <div className="mt-3 space-y-2">
            <div className="h-7 rounded-full bg-white/10" />
            <div className="h-7 rounded-full bg-white/10" />
            <div className="h-7 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[0.9rem] border border-[#f0dbc8] bg-[#fff8f0] p-3">
            <div className="h-2 w-24 rounded-full bg-[#b08b62]" />
            <div className="mt-3 h-8 rounded-2xl bg-white" />
            <div className="mt-2 h-8 rounded-2xl bg-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[0.9rem] bg-[#1f1711] p-3">
              <div className="h-2 w-16 rounded-full bg-[#ffd8aa]" />
              <div className="mt-3 h-14 rounded-[0.8rem] bg-white/10" />
            </div>
            <div className="rounded-[0.9rem] border border-[#f0dbc8] bg-[#fff8f0] p-3">
              <div className="h-2 w-14 rounded-full bg-[#ff8a2a]" />
              <div className="mt-3 h-14 rounded-[0.8rem] bg-white" />
            </div>
          </div>
          <div className="rounded-[1rem] bg-[linear-gradient(135deg,#ff7a14,#ffb347)] px-4 py-3">
            <div className="mx-auto h-2 w-28 rounded-full bg-white/80" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function AnalyticsPreview() {
  return (
    <PreviewShell topTone="bg-[#102034]">
      <div className="grid h-full gap-3">
        <div className="grid grid-cols-3 gap-2">
          {["#fff3e7", "#eef8ff", "#eefbf2"].map((bg, index) => (
            <div
              key={bg}
              className="rounded-[0.9rem] border border-[#dbe8f3] p-2"
              style={{ backgroundColor: bg }}
            >
              <div className="h-2 w-10 rounded-full bg-[#7f93a8]" />
              <div className="mt-2 h-4 w-12 rounded-full bg-[#102034]" />
              <div
                className="mt-2 h-5 w-5 rounded-full"
                style={{
                  backgroundColor:
                    index === 0 ? "#fb923c" : index === 1 ? "#3b82f6" : "#10b981",
                }}
              />
            </div>
          ))}
        </div>
        <div className="rounded-[1rem] border border-[#dbe8f3] bg-[#f7fbff] p-3">
          <div className="h-2 w-20 rounded-full bg-[#7f93a8]" />
          <div className="mt-3 flex h-20 items-end gap-2">
            {[28, 44, 34, 62, 54, 72, 66].map((height) => (
              <div
                key={height}
                className="w-full rounded-t-full bg-[linear-gradient(180deg,#37a7ff,#84d9ff)]"
                style={{ height }}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
          <div className="rounded-[0.9rem] bg-[#102034] p-3">
            <div className="h-2 w-20 rounded-full bg-[#d3efff]" />
            <div className="mt-3 flex h-16 items-end gap-2">
              {[20, 34, 26, 40, 30].map((height) => (
                <div
                  key={height}
                  className="w-full rounded-t-full bg-[#20a4ff]"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-[0.9rem] border border-[#dbe8f3] bg-white p-3">
            <div className="h-3 w-24 rounded-full bg-[#102034]" />
            <div className="h-2 rounded-full bg-[#e9f2ff]" />
            <div className="h-2 rounded-full bg-[#e9f2ff]" />
            <div className="h-2 w-5/6 rounded-full bg-[#e9f2ff]" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function InstallPreview() {
  return (
    <PreviewShell topTone="bg-[#fff5e8]">
      <div className="grid h-full grid-cols-[1fr_0.95fr] gap-3">
        <div className="rounded-[1rem] bg-[#f8f0e4] p-3">
          <div className="h-2 w-16 rounded-full bg-[#b69161]" />
          <div className="mt-3 h-4 w-28 rounded-full bg-[#24170f]" />
          <div className="mt-4 h-20 rounded-[1rem] border border-[#ead9c3] bg-white" />
          <div className="mt-3 h-10 rounded-[1rem] bg-[#24170f]" />
        </div>
        <div className="rounded-[1rem] border border-[#ead9c3] bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-2 w-14 rounded-full bg-[#c19864]" />
              <div className="mt-2 h-4 w-20 rounded-full bg-[#24170f]" />
            </div>
            <div className="rounded-full bg-[#ecfdf3] px-3 py-1 text-[8px] font-black text-[#1b8f5f]">
              READY
            </div>
          </div>
          <div className="mt-4 h-16 rounded-[1rem] border border-[#ead9c3] bg-[#fff8ee]" />
          <div className="mt-3 h-10 rounded-[1rem] bg-[linear-gradient(135deg,#ff7a12,#ffaf45)]" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="h-12 rounded-[0.9rem] bg-[#f8f4ee]" />
            <div className="h-12 rounded-[0.9rem] bg-[#24170f]" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function PricingPreview() {
  return (
    <PreviewShell topTone="bg-[#0f1a2a]">
      <div className="grid h-full grid-cols-3 gap-3">
        <PricingTier accent="#e9f2ff" dark={false} highlighted={false} />
        <PricingTier accent="#102034" dark highlighted />
        <PricingTier accent="#f2f8ff" dark={false} highlighted={false} />
      </div>
    </PreviewShell>
  );
}

function PricingTier({
  accent,
  dark,
  highlighted,
}: {
  accent: string;
  dark: boolean;
  highlighted: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] border p-3 ${
        dark ? "border-[#21374f] bg-[#102034]" : "border-[#dbe7f4] bg-white"
      }`}
    >
      <div className={`h-2 w-12 rounded-full ${dark ? "bg-[#7dd2ff]" : "bg-[#6883a0]"}`} />
      <div className={`mt-3 h-4 w-16 rounded-full ${dark ? "bg-white" : "bg-[#0d1f34]"}`} />
      <div className={`mt-4 h-3 w-20 rounded-full ${dark ? "bg-[#dceeff]" : "bg-[#2d71ff]"}`} />
      <div className="mt-4 space-y-2">
        <div className={`h-2 rounded-full ${dark ? "bg-[#254566]" : "bg-[#e9f2ff]"}`} />
        <div className={`h-2 rounded-full ${dark ? "bg-[#254566]" : "bg-[#e9f2ff]"}`} />
        <div className={`h-2 w-5/6 rounded-full ${dark ? "bg-[#254566]" : "bg-[#e9f2ff]"}`} />
      </div>
      <div
        className="mt-6 h-10 rounded-[0.9rem]"
        style={{
          background: highlighted
            ? "linear-gradient(135deg,#27A6FF,#73D4FF)"
            : accent,
        }}
      />
    </div>
  );
}

function LibraryPreview() {
  return (
    <PreviewShell topTone="bg-[#22160e]">
      <div className="grid h-full grid-cols-[0.8fr_1.2fr] gap-3">
        <div className="rounded-[0.9rem] bg-[#fbf4ea] p-3">
          <div className="h-2 w-14 rounded-full bg-[#b08c63]" />
          <div className="mt-3 h-4 w-20 rounded-full bg-[#24170e]" />
          <div className="mt-4 space-y-3">
            <div className="h-12 rounded-[0.8rem] border border-[#ead7c2] bg-white" />
            <div className="h-12 rounded-[0.8rem] border border-[#ead7c2] bg-white" />
            <div className="h-12 rounded-[0.8rem] border border-[#ead7c2] bg-white" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="rounded-[0.9rem] border border-[#eedbc7] bg-[#fff7ee] p-3"
            >
              <div className="h-3 w-28 rounded-full bg-[#1e140e]" />
              <div className="mt-3 h-2 w-40 rounded-full bg-[#8e755a]" />
            </div>
          ))}
        </div>
      </div>
    </PreviewShell>
  );
}

function TikTokPreview() {
  return (
    <PreviewShell topTone="bg-[#1a1022]">
      <div className="grid h-full grid-cols-[0.82fr_1.18fr] gap-3">
        <div className="rounded-[1rem] bg-[#19101f] p-3 text-white">
          <div className="h-2 w-14 rounded-full bg-[#ff8aa4]" />
          <div className="mt-3 h-4 w-20 rounded-full bg-white/80" />
          <div className="mt-4 h-16 rounded-[1rem] bg-white/10" />
          <div className="mt-4 h-10 rounded-[1rem] bg-[linear-gradient(135deg,#ff6286,#ff9db2)]" />
          <div className="mt-4 h-16 rounded-[1rem] bg-white/10" />
        </div>
        <div className="grid gap-3">
          <div className="rounded-[1rem] border border-[#f0d8e1] bg-[#fff4f7] p-3">
            <div className="h-2 w-16 rounded-full bg-[#ca6e86]" />
            <div className="mt-3 h-4 w-24 rounded-full bg-[#23151c]" />
            <div className="mt-4 h-16 rounded-[1rem] border border-[#f0d8e1] bg-white" />
          </div>
          <div className="rounded-[1rem] bg-[#23151c] p-3">
            <div className="h-2 w-20 rounded-full bg-[#ffd5e0]" />
            <div className="mt-4 h-3 rounded-full bg-[#ff7a98]" />
            <div className="mt-3 h-2 rounded-full bg-[#b895a0]" />
            <div className="mt-2 h-2 w-5/6 rounded-full bg-[#b895a0]" />
            <div className="mt-4 h-10 w-32 rounded-[0.9rem] bg-[#fff2f6]" />
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function pickTint(key: PublicPageKey) {
  switch (key) {
    case "pricing":
    case "tracking-click-affiliate":
      return "#eff6ff";
    case "faq":
      return "#faf5ff";
    case "landing-page-tiktok":
    case "rut-gon-link-tiktok":
    case "link-tiktok-affiliate":
      return "#fff1f5";
    default:
      return "#fff7ed";
  }
}
