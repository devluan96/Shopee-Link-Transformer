import type { Locale } from "@/src/hooks/useLocale";

export interface PublicSeoItem {
  title: string;
  body: string;
}

export interface PublicSeoFaq {
  question: string;
  answer: string;
}

export interface PublicSeoContent {
  siteName: string;
  title: string;
  description: string;
  keywords: string[];
  ogImagePath: string;
  ogImageAlt: string;
  nav: {
    features: string;
    workflow: string;
    useCases: string;
    faq: string;
  };
  overview: {
    eyebrow: string;
    title: string;
    description: string;
  };
  benefits: {
    eyebrow: string;
    title: string;
    description: string;
    items: PublicSeoItem[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    description: string;
    steps: string[];
  };
  useCases: {
    eyebrow: string;
    title: string;
    description: string;
    items: PublicSeoItem[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: PublicSeoFaq[];
  };
  cta: {
    title: string;
    description: string;
  };
}

export const PUBLIC_SEO_CONTENT: Record<Locale, PublicSeoContent> = {
  vi: {
    siteName: "HotsNew Click",
    title:
      "HotsNew Click | Tạo landing page rút gọn link Shopee, TikTok và theo dõi click",
    description:
      "HotsNew Click giúp tạo landing page trung gian cho link Shopee và TikTok với tiêu đề, mô tả, ảnh, video, slug đẹp và thống kê click để tối ưu chia sẻ mạng xã hội.",
    keywords: [
      "landing page Shopee",
      "landing page shopee",
      "rút gọn link Shopee",
      "rut gon link Shopee",
      "rut gon link shopee",
      "landing page TikTok",
      "landing page tiktok",
      "rút gọn link TikTok",
      "rut gon link TikTok",
      "rut gon link tiktok",
      "tracking click affiliate",
      "theo dõi click affiliate",
      "theo doi click affiliate",
      "slug đẹp",
      "slug dep",
      "preview Facebook",
      "preview Zalo",
      "HotsNew Click",
    ],
    ogImagePath: "/og-image.png",
    ogImageAlt:
      "HotsNew Click dashboard và landing page cho link Shopee, TikTok",
    nav: {
      features: "Tính năng",
      workflow: "Quy trình",
      useCases: "Ứng dụng",
      faq: "FAQ",
    },
    overview: {
      eyebrow: "SEO landing cho affiliate",
      title: "Một app để tạo link đẹp, preview đẹp và đo được hiệu quả.",
      description:
        "HotsNew Click giúp bạn biến link Shopee hoặc TikTok thành một trang trung gian gọn gàng, dán lên mạng xã hội nhìn rõ hơn và dễ theo dõi lượt bấm hơn.",
    },
    benefits: {
      eyebrow: "Giá trị cốt lõi",
      title: "Những gì người xem cần thấy trước khi bấm vào link.",
      description:
        "Không chỉ làm link ngắn hơn. App giúp link rõ hơn, preview đẹp hơn và việc theo dõi hiệu quả dễ hiểu hơn.",
      items: [
        {
          title: "Preview social rõ ràng hơn",
          body: "Chủ động title, description, thumbnail và video để card chia sẻ thuyết phục hơn trên Facebook, Zalo và các kênh phân phối khác.",
        },
        {
          title: "Slug gọn và dễ nhớ",
          body: "Link xuất ra theo domain hoặc slug để dễ đọc, dễ nhớ và dễ mang đi đăng bài thay vì để nguyên URL dài.",
        },
        {
          title: "Theo dõi click để tối ưu",
          body: "Xem lượt bấm, nguồn truy cập và các tham số chiến dịch để biết link nào đang hoạt động tốt.",
        },
      ],
    },
    workflow: {
      eyebrow: "Cách hoạt động",
      title: "Quy trình 3 bước để đưa link ra thị trường nhanh hơn.",
      description:
        "Từ lúc dán link gốc đến lúc mang link đi đăng bài, luồng này được giữ ngắn và rất thực dụng.",
      steps: [
        "Dán link Shopee hoặc TikTok gốc vào app và chọn domain xuất link.",
        "Tùy chỉnh tiêu đề, mô tả, thumbnail, video, slug và các tham số tracking cần dùng.",
        "Xuất link, dán lên kênh cần dùng và xem lại lượt bấm để chỉnh preview nếu cần.",
      ],
    },
    useCases: {
      eyebrow: "Tình huống phù hợp",
      title: "Hợp với những ai muốn link gọn hơn, card đẹp hơn và biết được link nào đang có hiệu quả.",
      description:
        "Landing page trung gian phù hợp khi cần giữ card đẹp, bảo vệ luồng affiliate và tách riêng từng nguồn traffic.",
      items: [
        {
          title: "Seeding Facebook và nhóm cộng đồng",
          body: "Duy trì card chia sẻ gọn gàng và dễ nhận biết hơn khi đăng bài, bình luận hoặc phân phối link vào nhiều nhóm.",
        },
        {
          title: "TikTok bio và video điều hướng",
          body: "Gắn slug dễ nhớ, bổ sung image hoặc video và giữ cho link dễ đọc hơn khi đưa vào bio hoặc nội dung điều hướng.",
        },
        {
          title: "Quản lý nhiều link gọn hơn",
          body: "Gắn tag, UTM và nhóm link để khi cần xem lại hiệu quả bạn không phải lò dò từng URL.",
        },
      ],
    },
    faq: {
      eyebrow: "Câu hỏi thường gặp",
      title: "Những câu hỏi người xem thường muốn rõ trước khi dùng tool.",
      description:
        "FAQ này trả lời nhanh những điều quan trọng nhất: link có đẹp hơn không, preview có rõ hơn không và có theo dõi được lượt bấm hay không.",
      items: [
        {
          question: "HotsNew Click dùng để làm gì?",
          answer:
            "App dùng để tạo landing page trung gian cho link Shopee và TikTok, chủ động nội dung preview và theo dõi click để tối ưu phân phối.",
        },
        {
          question: "App có hỗ trợ slug đẹp theo domain riêng không?",
          answer:
            "Có. Hệ thống tạo link theo domain hoặc slug và cho phép bạn quản lý mã rút gọn để link dễ nhớ hơn và dễ mang đi đăng bài.",
        },
        {
          question: "Có theo dõi được click và nguồn traffic không?",
          answer:
            "Có. App hỗ trợ thống kê click, UTM, tag và các thông tin cần thiết để xem link nào đang hoạt động tốt.",
        },
        {
          question: "Landing page có dùng cho Shopee và TikTok cùng lúc không?",
          answer:
            "Có. Hệ thống được thiết kế cho cả luồng link Shopee lẫn TikTok, kể cả trường hợp cần video, thumbnail và luồng chuyển hướng hai bước.",
        },
      ],
    },
    cta: {
      title: "Bắt đầu bằng một link dễ nhớ và một preview đẹp hơn.",
      description:
        "Tạo link đầu tiên, chỉnh preview cho rõ ràng hơn và xem thêm lượt bấm ngay trên cùng một luồng thao tác.",
    },
  },
  en: {
    siteName: "HotsNew Click",
    title:
      "HotsNew Click | Build Shopee and TikTok landing pages with clean slugs and click tracking",
    description:
      "HotsNew Click helps you build intermediate landing pages for Shopee and TikTok links with titles, descriptions, images, videos, clean slugs, and click analytics.",
    keywords: [
      "Shopee landing page",
      "Shopee short link",
      "TikTok landing page",
      "TikTok short link",
      "affiliate click tracking",
      "clean slug",
      "Facebook preview",
      "Zalo preview",
      "HotsNew Click",
    ],
    ogImagePath: "/og-image.png",
    ogImageAlt:
      "HotsNew Click dashboard and landing page builder for Shopee and TikTok links",
    nav: {
      features: "Features",
      workflow: "Workflow",
      useCases: "Use cases",
      faq: "FAQ",
    },
    overview: {
      eyebrow: "SEO landing for affiliate links",
      title: "One app for cleaner links, stronger previews, and measurable traffic.",
      description:
        "HotsNew Click helps sellers turn Shopee and TikTok links into cleaner public pages with stronger previews and click performance visible in one place.",
    },
    benefits: {
      eyebrow: "Core value",
      title: "What crawlers, viewers, and operators all need in one flow.",
      description:
        "This is more than link shortening. The app makes links easier to remember, share cards easier to trust, and campaigns easier to optimize.",
      items: [
        {
          title: "Stronger social previews",
          body: "Control title, description, thumbnail, and video so shared cards look sharper across Facebook, Zalo, and other distribution channels.",
        },
        {
          title: "Clean and memorable slugs",
          body: "Publish links as domain or slug URLs so they are easier to copy, recognize, and manage than long raw URLs.",
        },
        {
          title: "Click analytics for optimization",
          body: "Keep click data, UTM parameters, and traffic signals in one place so you know which links deserve more spend.",
        },
      ],
    },
    workflow: {
      eyebrow: "How it works",
      title: "A three-step flow to publish campaign links faster.",
      description:
        "The workflow is streamlined for seeding teams, affiliate operators, KOCs, and campaign managers.",
      steps: [
        "Paste the original Shopee or TikTok URL and choose the public output domain.",
        "Customize the title, description, thumbnail, video, slug, and tracking parameters you need.",
        "Publish the link, monitor clicks, and refine the content when the campaign needs another iteration.",
      ],
    },
    useCases: {
      eyebrow: "Best-fit scenarios",
      title: "Built for people who need both distribution speed and measurable results.",
      description:
        "Intermediate landing pages are useful when you need better cards, cleaner affiliate protection, and clearer traffic segmentation.",
      items: [
        {
          title: "Facebook seeding and community posts",
          body: "Keep shared cards cleaner and easier to recognize when posting in threads, comments, and community groups.",
        },
        {
          title: "TikTok bio and traffic routing",
          body: "Use memorable slugs, attach image or video context, and make the link easier to read inside bios or routing content.",
        },
        {
          title: "Organized sharing for teams",
          body: "Split campaigns by folder, tag, UTM, and team member so a larger link inventory stays organized.",
        },
      ],
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "Questions users and crawlers usually need answered first.",
      description:
        "This FAQ lives on the public landing page so both new visitors and search engines understand the product intent clearly.",
      items: [
        {
          question: "What is HotsNew Click used for?",
          answer:
            "It is used to create intermediate landing pages for Shopee and TikTok links, control preview content, and track clicks for distribution optimization.",
        },
        {
          question: "Does the app support clean slugs on custom domains?",
          answer:
            "Yes. The system publishes links as domain or slug URLs and lets you manage the short code so links stay shorter and easier to share.",
        },
        {
          question: "Can I track clicks and traffic sources?",
          answer:
            "Yes. The app supports click analytics, UTM parameters, tags, and related signals so you can understand which links perform best.",
        },
        {
          question: "Can the landing page be used for both Shopee and TikTok?",
          answer:
            "Yes. The system supports Shopee and TikTok flows, including video, thumbnail, and step-two redirect scenarios.",
        },
      ],
    },
    cta: {
      title: "Start with one cleaner link and one stronger preview.",
      description:
        "Create your first landing page, publish the first link, and inspect click performance inside one compact flow.",
    },
  },
};
