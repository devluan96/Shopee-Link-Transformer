import type { Locale } from "@/src/hooks/useLocale";
import {
  PUBLIC_SEO_CONTENT,
  type PublicSeoFaq,
  type PublicSeoItem,
} from "./publicSeo";

export type PublicPageKey =
  | "home"
  | "pricing"
  | "install"
  | "faq"
  | "landing-page-shopee"
  | "landing-page-tiktok"
  | "rut-gon-link-shopee"
  | "rut-gon-link-tiktok"
  | "tracking-click-affiliate"
  | "link-tiktok-affiliate"
  | "cach-rut-gon-link-shopee"
  | "cach-rut-gon-link-tiktok"
  | "cach-theo-doi-click-affiliate";

export interface PublicPageSection {
  title: string;
  description: string;
  bullets: string[];
}

export interface PublicPageContent {
  key: PublicPageKey;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  summaryCards: PublicSeoItem[];
  featureTitle: string;
  featureDescription: string;
  featureItems: PublicSeoItem[];
  workflowTitle: string;
  workflowDescription: string;
  workflowSteps: string[];
  useCaseTitle: string;
  useCaseDescription: string;
  useCaseItems: PublicSeoItem[];
  detailSections: PublicPageSection[];
  faqTitle: string;
  faqDescription: string;
  faqItems: PublicSeoFaq[];
  relatedPageKeys?: PublicPageKey[];
}

const buildCommonFaq = (locale: Locale): PublicSeoFaq[] =>
  locale === "vi"
    ? [
        {
          question: "HotsNew Click dùng để làm gì?",
          answer:
            "App dùng để tạo landing page trung gian cho link Shopee và TikTok, chủ động preview và theo dõi click cho từng chiến dịch.",
        },
        {
          question: "App có hỗ trợ domain và slug đẹp không?",
          answer:
            "Có. Hệ thống xuất link theo domain hoặc slug để dễ nhớ hơn, dễ đăng bài hơn và dễ quản lý hơn.",
        },
      ]
    : [
        {
          question: "What is HotsNew Click used for?",
          answer:
            "It is used to build intermediate landing pages for Shopee and TikTok links, control previews, and track clicks by campaign.",
        },
        {
          question: "Does the app support custom domains and clean slugs?",
          answer:
            "Yes. The system can publish links as domain or slug URLs so they are easier to share and manage.",
        },
      ];

const buildHomePage = (locale: Locale): PublicPageContent => {
  const seo = PUBLIC_SEO_CONTENT[locale];
  const isVi = locale === "vi";

  return {
    key: "home",
    path: "/",
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    heroEyebrow: seo.overview.eyebrow,
    heroTitle: seo.overview.title,
    heroDescription: seo.overview.description,
    summaryCards: isVi
      ? [
          {
            title: "Preview đẹp hơn",
            body: "Kiểm soát title, mô tả, ảnh và video để link khi dán ra ngoài trông rõ ràng hơn.",
          },
          {
            title: "URL gọn hơn",
            body: "Dùng domain hoặc slug riêng để link dễ nhớ hơn khi đăng bài, bio hoặc bình luận.",
          },
          {
            title: "Tracking tập trung",
            body: "Giữ click, UTM và nguồn traffic trong cùng một chỗ để dễ nhìn và tối ưu chiến dịch.",
          },
        ]
      : [
          {
            title: "Better previews",
            body: "Control titles, descriptions, images, and video so public link previews stay clearer.",
          },
          {
            title: "Cleaner URLs",
            body: "Use custom domains or slugs so links are easier to remember in posts, bios, and comments.",
          },
          {
            title: "Centralized tracking",
            body: "Keep clicks, UTM parameters, and traffic context in one clear dashboard.",
          },
        ],
    featureTitle: seo.benefits.title,
    featureDescription: seo.benefits.description,
    featureItems: seo.benefits.items,
    workflowTitle: seo.workflow.title,
    workflowDescription: seo.workflow.description,
    workflowSteps: seo.workflow.steps,
    useCaseTitle: seo.useCases.title,
    useCaseDescription: seo.useCases.description,
    useCaseItems: seo.useCases.items,
    detailSections: isVi
      ? [
          {
            title: "App này khác shortener thường ở điểm nào?",
            description:
              "Mục tiêu không chỉ là làm URL ngắn đi, mà là làm link dễ phân phối và dễ đo hơn.",
            bullets: [
              "Không phụ thuộc hoàn toàn vào URL gốc của Shopee hoặc TikTok.",
              "Chủ động được preview thay vì để social crawler tự đoán.",
              "Tạo được nhiều trang công khai theo từng ý định tìm kiếm và từng chiến dịch.",
            ],
          },
          {
            title: "Ai nên xem trang tổng quan này?",
            description:
              "Trang chủ public hợp với người mới muốn hiểu app giải bài toán gì trước khi đăng ký.",
            bullets: [
              "Người đi đăng bài cần một trang tổng quan để hiểu nhanh công cụ.",
              "Người làm affiliate cần xem sản phẩm có hỗ trợ tracking hay không.",
              "Crawler cần một trang root rõ ràng để hiểu entity của app.",
            ],
          },
        ]
      : [
          {
            title: "How is this different from a simple shortener?",
            description:
              "The goal is not only to shorten a URL, but to make it easier to distribute and measure.",
            bullets: [
              "It does not rely entirely on the raw Shopee or TikTok URL.",
              "It controls preview content instead of leaving it to crawlers.",
              "It supports dedicated public pages for SEO and campaign intent.",
            ],
          },
          {
            title: "Who should start with the public home page?",
            description:
              "The public home page is for visitors who want to understand the product before signing up.",
            bullets: [
              "Seeding teams that want a fast overview.",
              "Affiliate operators checking tracking capabilities.",
              "Search engines that need a clear root entity page.",
            ],
          },
        ],
    faqTitle: seo.faq.title,
    faqDescription: seo.faq.description,
    faqItems: seo.faq.items,
    relatedPageKeys: [
      "pricing",
      "install",
      "landing-page-shopee",
      "landing-page-tiktok",
    ],
  };
};

const buildPagesForLocale = (locale: Locale): PublicPageContent[] => {
  const isVi = locale === "vi";
  const base = PUBLIC_SEO_CONTENT[locale];
  const commonFaq = buildCommonFaq(locale);

  const pages: PublicPageContent[] = [
    buildHomePage(locale),
    {
      key: "pricing",
      path: "/discover/pricing",
      title: isVi
        ? "Bảng giá HotsNew Click | Domain, video preview và click tracking"
        : "HotsNew Click Pricing | Domains, video previews, and click tracking",
      description: isVi
        ? "Xem bảng giá HotsNew Click để chọn domain đầu ra, video preview và công cụ tracking phù hợp cho link Shopee, TikTok."
        : "Review HotsNew Click pricing to choose the right output domains, video previews, and tracking features for Shopee and TikTok links.",
      keywords: [
        ...base.keywords,
        isVi ? "bảng giá landing page" : "landing page pricing",
        ...(isVi ? ["bang gia landing page", "bang gia hotsnew click"] : []),
      ],
      heroEyebrow: isVi ? "Giá và quy mô sử dụng" : "Pricing and scale",
      heroTitle: isVi
        ? "Chọn gói theo nhu cầu domain, video và số lượng link thật sự phải chạy."
        : "Choose a plan based on the real domain, video, and link volume you need to run.",
      heroDescription: isVi
        ? "Trang này dành cho người đang cân đối chi phí giữa giai đoạn test nhỏ, nhu cầu mở nhiều domain và lượng link cần dùng mỗi ngày."
        : "This page helps visitors compare costs between small tests, larger link volume, and multi-domain needs.",
      summaryCards: isVi
        ? [
            {
              title: "Mở domain đầu ra",
              body: "Phân biệt rõ nhu cầu chạy trên một domain hay nhiều domain cho nhiều luồng khác nhau.",
            },
            {
              title: "Quota link và video",
              body: "Nhìn thẳng vào số lượng link và video cần phục vụ mỗi ngày để chọn gói.",
            },
            {
              title: "Phù hợp cho team",
              body: "Bảng giá nên gắn với cách team cộng tác chứ không chỉ với một user đơn lẻ.",
            },
          ]
        : [
            {
              title: "Output domains",
              body: "Separate single-domain use from multi-domain public distribution.",
            },
            {
              title: "Link and video quota",
              body: "Match the plan to your expected daily volume.",
            },
            {
              title: "Team fit",
              body: "Pricing should reflect collaborative operations, not only single-user usage.",
            },
          ],
      featureTitle: isVi
        ? "Bảng giá nên trả lời điều gì."
        : "What pricing should answer.",
      featureDescription: isVi
        ? "Người đọc trang giá không chỉ muốn biết số tiền, mà còn muốn biết gói nào hợp với cách họ đăng link và theo dõi hiệu quả."
        : "Pricing readers do not only want the price. They want to know which plan fits their workflow.",
      featureItems: isVi
        ? [
            {
              title: "Domain riêng cho từng kênh chia sẻ",
              body: "Một nhóm có thể cần domain khác nhau cho TikTok bio, Facebook seeding và giai đoạn test.",
            },
            {
              title: "Video preview khi cần",
              body: "Không phải link nào cũng cần video, nhưng link nào cần thì phải có quota rõ ràng.",
            },
            {
              title: "Quy mô link thực tế",
              body: "Link volume mới là chỗ dễ phát sinh nghẽn nếu bảng giá không khớp thực tế.",
            },
          ]
        : [
            {
              title: "Domain separation by flow",
              body: "Teams may need different domains for TikTok bios, Facebook seeding, and testing.",
            },
            {
              title: "Video where it matters",
              body: "Not every link flow needs video, but the ones that do should have clear quota.",
            },
            {
              title: "Real link volume",
              body: "Link volume is where plans often break if they do not fit real usage.",
            },
          ],
      workflowTitle: isVi
        ? "Cách chọn gói nhanh."
        : "How to choose a plan quickly.",
      workflowDescription: isVi
        ? "Chọn từ domain trước, quota sau, rồi mới nhìn đến chuyện nhiều thành viên cùng dùng."
        : "Start from domains, then quota, then think about how many people need to use it together.",
      workflowSteps: isVi
        ? [
            "Liệt kê số domain cần dùng.",
            "Ước lượng số link và video phát sinh mỗi ngày.",
            "Quyết định có cần tách riêng theo nhóm dùng hoặc theo khách hàng hay không.",
          ]
        : [
            "List the number of public domains you need.",
            "Estimate daily link and video volume.",
            "Decide whether you need separate spaces by team or by client.",
          ],
      useCaseTitle: isVi
        ? "Khi nào trang này có giá trị."
        : "When this page matters.",
      useCaseDescription: isVi
        ? "Hợp với người đã hiểu sản phẩm và đang cần chốt gói để bắt đầu dùng hoặc nâng cấp."
        : "Useful for visitors who already understand the product and need to choose a starting or upgrade plan.",
      useCaseItems: isVi
        ? [
            {
              title: "Khi bắt đầu chia link ra nhiều kênh",
              body: "Khi số trang công khai tăng lên, bảng giá phải phản ánh đúng sức tải thực tế.",
            },
            {
              title: "Khi cần nhiều domain",
              body: "Nếu bạn chạy nhiều bề mặt, bảng giá domain là phần phải đọc trước.",
            },
          ]
        : [
            {
              title: "Scaling traffic operations",
              body: "As your public pages grow, pricing needs to match real load.",
            },
            {
              title: "Multi-domain setups",
              body: "If you operate across surfaces, domain pricing becomes primary.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Đừng chọn gói theo suy đoán chung.",
              description:
                "Sai lầm phổ biến là nhìn bảng giá như một bảng tính năng tĩnh thay vì một quyết định theo luồng sử dụng.",
              bullets: [
                "Một link bio TikTok có thể cần domain khác với một trang SEO dài.",
                "Một campaign cần video preview sẽ tốn quota khác campaign chỉ dùng ảnh.",
                "Một nhóm nhiều người cần xem quyền dùng chung, không chỉ nhìn số link.",
              ],
            },
            {
              title: "Chọn gói xong phải biết làm gì tiếp.",
              description:
                "Trang giá tốt phải giúp người đọc hiểu họ cần làm gì sau khi chọn gói.",
              bullets: [
                "Chọn domain nào cho trang công khai chính.",
                "Nhóm nào sẽ dùng chung một không gian làm việc.",
                "Quota nào là ngưỡng nghẽn đầu tiên cần tránh.",
              ],
            },
          ]
        : [
            {
              title: "Do not choose a plan from a generic guess.",
              description:
                "A pricing page should be read against your real workflow, not as a static feature checklist.",
              bullets: [
                "TikTok bio pages may need a different domain than long-form SEO pages.",
                "Video-preview campaigns consume a different quota than image-only flows.",
                "Multi-user teams need clarity around shared access and permissions, not only link counts.",
              ],
            },
            {
              title: "Good pricing should lead into setup decisions.",
              description:
                "The page should help visitors understand what comes next after they choose a plan.",
              bullets: [
                "Which domain to assign to the main public pages.",
                "Which team should share the same working space.",
                "Which quota is likely to become the first bottleneck.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ về bảng giá." : "Pricing FAQ.",
      faqDescription: isVi
        ? "Tập trung vào domain, quota và cách chọn gói theo flow."
        : "Focused on domains, quota, and choosing a plan by workflow.",
      faqItems: [
        ...commonFaq,
        ...(isVi
          ? [
              {
                question: "Bảng giá liên quan gì đến tracking?",
                answer:
                  "Gói cao hơn thường giúp chạy nhiều domain, nhiều link và nhiều video hơn, từ đó dữ liệu tracking cũng đầy đủ hơn cho cùng một campaign.",
              },
            ]
          : [
              {
                question: "How does pricing affect tracking?",
                answer:
                  "Higher plans usually allow more domains, links, and video flows, which leads to richer tracking coverage for the same campaign.",
              },
            ]),
      ],
      relatedPageKeys: [
        "install",
        "faq",
        "tracking-click-affiliate",
        "landing-page-shopee",
        "landing-page-tiktok",
        "rut-gon-link-shopee",
      ],
    },
    {
      key: "install",
      path: "/discover/install",
      title: isVi
        ? "Cài app HotsNew Click | Mở công cụ nhanh hơn như một app riêng"
        : "Install HotsNew Click | Open the app like a dedicated tool",
      description: isVi
        ? "Hướng dẫn cài HotsNew Click để mở công cụ nhanh hơn, thao tác gọn hơn và giữ luồng tạo link, landing page và analytics tập trung."
        : "Install HotsNew Click to open the app faster and keep link creation, landing pages, and analytics in one focused flow.",
      keywords: [
        ...base.keywords,
        isVi ? "cài app HotsNew" : "install HotsNew app",
      ],
      heroEyebrow: isVi ? "Desktop và onboarding" : "Desktop and onboarding",
      heroTitle: isVi
        ? "Biến HotsNew Click thành điểm vào gọn hơn so với việc mở lại từng tab browser."
        : "Turn the app into a cleaner entry point than reopening another browser tab.",
      heroDescription: isVi
        ? "Trang này dành cho người đang tìm cách cài app, ghim shortcut hoặc giảm thao tác mở lại công cụ mỗi ngày."
        : "This page focuses on app installation, shortcuts, and reducing repeated access friction.",
      summaryCards: isVi
        ? [
            {
              title: "Mở nhanh hơn",
              body: "App hoặc shortcut giúp vào thẳng công cụ thay vì phải tìm lại tab cũ.",
            },
            {
              title: "Gọn luồng onboarding",
              body: "Người mới có thể được hướng dẫn vào một điểm truy cập rõ ràng hơn.",
            },
            {
              title: "Giảm rối browser",
              body: "Tách công cụ ra khỏi một rừng tab giúp giảm nhầm lẫn khi chạy campaign.",
            },
          ]
        : [
            {
              title: "Faster access",
              body: "App install or shortcuts take users directly into the app.",
            },
            {
              title: "Cleaner onboarding",
              body: "New users get a clearer entry point.",
            },
            {
              title: "Less browser clutter",
              body: "A dedicated install reduces tab chaos during campaigns.",
            },
          ],
      featureTitle: isVi
        ? "Trang cài app nên nói về gì."
        : "What an install page should cover.",
      featureDescription: isVi
        ? "Ý định tìm kiếm của trang này khác hẳn trang landing page hay trang giá."
        : "Install intent is different from landing-page or pricing intent.",
      featureItems: isVi
        ? [
            {
              title: "Shortcut rõ ràng",
              body: "Người dùng desktop thường cần đường vào nhanh, không chỉ một URL.",
            },
            {
              title: "Onboarding dễ lặp lại",
              body: "Đội mới vào cần cùng một cách mở app thay vì mỗi người một kiểu.",
            },
            {
              title: "Tập trung thao tác",
              body: "Luồng tạo link, xem analytics và chỉnh chiến dịch ở gần nhau hơn.",
            },
          ]
        : [
            {
              title: "Clear shortcut flow",
              body: "Desktop users often need a fast entry point, not only a URL.",
            },
            {
              title: "Repeatable onboarding",
              body: "New team members benefit from a consistent access pattern.",
            },
            {
              title: "Focused actions",
              body: "Link creation, analytics, and edits stay closer together.",
            },
          ],
      workflowTitle: isVi ? "Luồng cài đặt ngắn." : "A short install flow.",
      workflowDescription: isVi
        ? "Mục tiêu của trang này là giúp người dùng đi từ ý định cài app sang thao tác sử dụng thật."
        : "The point of this page is to move visitors from install intent into real usage.",
      workflowSteps: isVi
        ? [
            "Mở app trên browser hỗ trợ.",
            "Cài hoặc ghim shortcut.",
            "Đăng nhập và kiểm tra tạo link, danh sách link và analytics.",
          ]
        : [
            "Open the app in a supported browser.",
            "Install it or pin a shortcut.",
            "Sign in and verify create-link, link list, and analytics access.",
          ],
      useCaseTitle: isVi
        ? "Khi nào nên cài app."
        : "When app install makes sense.",
      useCaseDescription: isVi
        ? "Hợp với đội phải vào hệ thống nhiều lần trong ngày và không muốn phụ thuộc hoàn toàn vào tab browser."
        : "Useful for teams that reopen the system many times a day and want less browser dependence.",
      useCaseItems: isVi
        ? [
            {
              title: "Đội seeding theo ca",
              body: "Ca trực cần mở app nhanh, đóng nhanh và quay lại đúng chỗ.",
            },
            {
              title: "Team nhiều thành viên",
              body: "Mỗi thành viên có cùng một cách truy cập giúp support nội bộ đơn giản hơn.",
            },
          ]
        : [
            {
              title: "Shift-based operators",
              body: "Teams that need fast open-close-return cycles.",
            },
            {
              title: "Larger teams",
              body: "Consistent access patterns simplify internal support.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Trang cài app không nên nói như một trang giới thiệu sản phẩm.",
              description:
                "Người vào trang này đã có ý định hành động, nên nội dung phải nghiêng về thao tác, thói quen dùng và onboarding.",
              bullets: [
                "Giảm thời gian tìm lại đúng tab.",
                "Tạo một đường vào thống nhất cho cả team.",
                "Giữ workflow bớt phụ thuộc vào browser memory của từng người.",
              ],
            },
            {
              title: "Page này nên dẫn được sang bước sau.",
              description:
                "Sau khi cài, người dùng cần biết vào đâu tiếp theo để tạo giá trị thật.",
              bullets: [
                "Tạo link đầu tiên.",
                "Kiểm tra màn hình chính hiện tại.",
                "Xem bảng giá nếu cần thêm domain hoặc quota.",
              ],
            },
          ]
        : [
            {
              title: "An install page should not read like a product page.",
              description:
                "Visitors here already have action intent, so the copy should focus on setup, habits, and onboarding.",
              bullets: [
                "Reduce time spent finding the right tab again.",
                "Create one shared entry path for the whole team.",
                "Make usage less dependent on each person's browser habits.",
              ],
            },
            {
              title: "The page should lead to the next useful step.",
              description:
                "After installation, users need to know what to do next to unlock value.",
              bullets: [
                "Create the first link.",
                "Verify the current home screen.",
                "Review pricing if more domain or quota is needed.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ cài app." : "Install FAQ.",
      faqDescription: isVi
        ? "Tập trung vào thao tác cài, mở nhanh và onboarding."
        : "Focused on install flow, quick access, and onboarding.",
      faqItems: commonFaq,
      relatedPageKeys: ["pricing", "faq", "home", "landing-page-shopee"],
    },
    {
      key: "faq",
      path: "/discover/faq",
      title: isVi
        ? "FAQ HotsNew Click | Landing page Shopee, TikTok, slug và click tracking"
        : "HotsNew Click FAQ | Shopee landing pages, slugs, and click tracking",
      description: isVi
        ? "Tổng hợp câu hỏi thường gặp về landing page Shopee, TikTok, custom slug, preview social và tracking click trên HotsNew Click."
        : "Frequently asked questions about Shopee and TikTok landing pages, custom slugs, social previews, and click tracking in HotsNew Click.",
      keywords: [
        ...base.keywords,
        "HotsNew Click FAQ",
        ...(isVi ? ["cau hoi thuong gap hotsnew click", "faq hotsnew click"] : []),
      ],
      heroEyebrow: isVi ? "Trang trả lời câu hỏi" : "Answer-first page",
      heroTitle: isVi
        ? "Một trang dành riêng cho người đang cần xác nhận sản phẩm có đúng bài toán của họ hay không."
        : "A page dedicated to visitors confirming whether the product matches their problem.",
      heroDescription: isVi
        ? "FAQ không nên chỉ là phần phụ. Với ý định tìm kiếm thông tin, nó nên là một trang có giá trị riêng."
        : "FAQ should not only be a supporting block. For informational intent, it should stand as a real page.",
      summaryCards: isVi
        ? [
            {
              title: "Giảm câu hỏi lặp",
              body: "Trang FAQ gom lại các câu hỏi nền tảng trước khi người dùng đăng ký hoặc mua.",
            },
            {
              title: "Phù hợp intent thông tin",
              body: "Nó phục vụ nhóm search muốn hiểu trước khi hành động.",
            },
            {
              title: "Tốt cho internal link",
              body: "FAQ là điểm điều hướng sang trang giá, trang cài app hoặc landing page phù hợp.",
            },
          ]
        : [
            {
              title: "Reduce repeated questions",
              body: "The FAQ page consolidates foundational questions before signup or purchase.",
            },
            {
              title: "Matches informational intent",
              body: "It serves searchers who want to understand first.",
            },
            {
              title: "Strong internal linking node",
              body: "FAQ can guide visitors into pricing, install, or landing pages.",
            },
          ],
      featureTitle: isVi
        ? "Trang FAQ khác gì các trang còn lại."
        : "How the FAQ page differs.",
      featureDescription: isVi
        ? "Trang FAQ không bán trực tiếp. Nó giải thích, gỡ mơ hồ và dẫn sang trang phù hợp hơn."
        : "The FAQ page does not sell directly. It explains, removes ambiguity, and guides visitors onward.",
      featureItems: isVi
        ? [
            {
              title: "Giải thích khái niệm",
              body: "Làm rõ domain, slug, preview và tracking nghĩa là gì trong ngữ cảnh app.",
            },
            {
              title: "Xử lý phản đối ban đầu",
              body: "Nhiều người chưa chắc app có đúng nhu cầu; FAQ giải quyết điểm này.",
            },
            {
              title: "Dẫn sang trang phù hợp hơn",
              body: "Sau khi hiểu, người dùng nên được dẫn sang trang giá hoặc trang phù hợp với nhu cầu cụ thể.",
            },
          ]
        : [
            {
              title: "Clarify concepts",
              body: "Explain domains, slugs, previews, and tracking in product context.",
            },
            {
              title: "Handle early objections",
              body: "Many visitors are still unsure about fit; FAQ addresses that.",
            },
            {
              title: "Route to deeper pages",
              body: "After understanding, users should move into pricing or a specific use-case page.",
            },
          ],
      workflowTitle: isVi
        ? "Cách người dùng đi qua trang này."
        : "How visitors move through this page.",
      workflowDescription: isVi
        ? "Thông thường người dùng đọc FAQ trước, chốt hiểu biết cơ bản rồi mới sang trang có ý định mua rõ hơn."
        : "Visitors often use FAQ first, then move into more commercial pages once the basics are clear.",
      workflowSteps: isVi
        ? [
            "Xem app làm gì và khác shortener thường ở đâu.",
            "Kiểm tra câu hỏi về tracking, domain, slug và social preview.",
            "Chuyển sang trang giá hoặc trang phù hợp với nhu cầu.",
          ]
        : [
            "Understand what the app does and how it differs from a simple shortener.",
            "Check answers about tracking, domains, slugs, and social previews.",
            "Move into pricing or the relevant use-case page.",
          ],
      useCaseTitle: isVi
        ? "Ai nên vào trang FAQ."
        : "Who should use the FAQ page.",
      useCaseDescription: isVi
        ? "Hợp với search intent thông tin, so sánh hoặc xác nhận trước khi dùng thử."
        : "Useful for informational, comparison, or validation intent before trying the product.",
      useCaseItems: isVi
        ? [
            {
              title: "Người mới từ search",
              body: "Chưa hiểu app làm gì nhưng đã thấy keyword liên quan.",
            },
            {
              title: "Người đang so với công cụ khác",
              body: "Cần xem khác biệt giữa short link thường và landing page có tracking.",
            },
          ]
        : [
            {
              title: "New search visitors",
              body: "They found a relevant keyword but do not yet understand the product.",
            },
            {
              title: "Visitors comparing tools",
              body: "They need to understand the difference between plain short links and trackable landing pages.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "FAQ là một trang SEO, không chỉ là widget.",
              description:
                "Khi nội dung được gom đúng ý định, trang FAQ có thể tự đứng và kéo traffic riêng.",
              bullets: [
                "Không nên lặp nguyên FAQ từ trang khác sang mà không có ngữ cảnh.",
                "Nên trả lời bằng ngôn ngữ rõ và thực dụng thay vì quá marketing.",
                "Nên dẫn người dùng sang đúng trang tiếp theo sau mỗi nhóm câu hỏi.",
              ],
            },
            {
              title: "FAQ tốt giúp giảm nhầm kỳ vọng.",
              description:
                "Người dùng càng hiểu rõ app làm gì và không làm gì, conversion càng sạch hơn.",
              bullets: [
                "Giảm signup sai kỳ vọng.",
                "Giảm ticket support lặp lại.",
                "Giúp crawler hiểu rõ product intent hơn.",
              ],
            },
          ]
        : [
            {
              title: "FAQ can be a real SEO page, not only a widget.",
              description:
                "When aligned to intent, FAQ can stand on its own and attract dedicated traffic.",
              bullets: [
                "Do not blindly duplicate the same FAQ from every other page.",
                "Use clear and practical language instead of only marketing language.",
                "Guide users toward the right next page after each question cluster.",
              ],
            },
            {
              title: "Strong FAQ reduces mismatched expectations.",
              description:
                "The clearer users understand what the app does and does not do, the cleaner conversion becomes.",
              bullets: [
                "Reduce misaligned signups.",
                "Reduce repeated support questions.",
                "Help crawlers understand product intent more clearly.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ HotsNew Click." : "HotsNew Click FAQ.",
      faqDescription: isVi
        ? "Các câu hỏi nền tảng quanh domain, slug, preview và tracking."
        : "Core questions around domains, slugs, previews, and tracking.",
      faqItems: [
        ...commonFaq,
        ...(isVi
          ? [
              {
                question: "Trang FAQ có khác gì landing page?",
                answer:
                  "Có. FAQ phục vụ ý định tìm hiểu và xác nhận, còn landing page tập trung vào một nhu cầu hoặc từ khóa cụ thể hơn.",
              },
            ]
          : [
              {
                question:
                  "How is the FAQ page different from a landing page?",
                answer:
                  "The FAQ page serves understanding and validation intent, while landing pages target specific use cases or keywords.",
              },
            ]),
      ],
      relatedPageKeys: [
        "pricing",
        "install",
        "landing-page-shopee",
        "landing-page-tiktok",
        "tracking-click-affiliate",
      ],
    },
    {
      key: "landing-page-shopee",
      path: "/discover/landing-page-shopee",
      title: isVi
        ? "Landing page Shopee | Tạo trang trung gian để đăng bài và giữ card đẹp"
        : "Shopee landing page | Build a cleaner intermediate page for sharing",
      description: isVi
        ? "Tìm hiểu cách HotsNew Click tạo landing page Shopee với tiêu đề, mô tả, ảnh, video, slug và click tracking để chia sẻ đẹp hơn."
        : "Learn how HotsNew Click creates Shopee landing pages with title, description, image, video, slug, and click tracking for cleaner sharing.",
      keywords: [
        ...base.keywords,
        "landing page Shopee",
        ...(isVi ? ["landing page shopee"] : []),
      ],
      heroEyebrow: isVi
        ? "Intent: landing page Shopee"
        : "Intent: Shopee landing pages",
      heroTitle: isVi
        ? "Landing page Shopee không chỉ để đẹp mà để đăng bài và đo được."
        : "A Shopee landing page should do more than look good. It should publish cleanly and stay measurable.",
      heroDescription: isVi
        ? "Route này tập trung vào bài toán đăng bài, giữ card đẹp và không để URL Shopee gốc làm loãng tracking."
        : "This page focuses on publishing cleaner Shopee links, keeping shared cards tidy, and protecting tracking quality.",
      summaryCards: isVi
        ? [
            {
              title: "Card đẹp hơn",
              body: "Shopee URL gốc thường không đủ linh hoạt cho title, ảnh và video khi chia sẻ.",
            },
            {
              title: "Đăng bài sạch hơn",
              body: "Một trang trung gian giúp bài đăng và bình luận gọn hơn, đỡ nặng URL.",
            },
            {
              title: "Tracking giữ được ngữ cảnh",
              body: "Link trung gian giúp giữ UTM, tag và campaign context rõ ràng hơn.",
            },
          ]
        : [
            {
              title: "Cleaner cards",
              body: "Raw Shopee URLs are often weak for title, image, and video control.",
            },
            {
              title: "Cleaner publishing",
              body: "An intermediate page keeps posts and comments lighter.",
            },
            {
              title: "Better tracking context",
              body: "A landing layer keeps UTM, tags, and campaign context clearer.",
            },
          ],
      featureTitle: isVi
        ? "Một landing page Shopee tốt cần gì."
        : "What makes a strong Shopee landing page.",
      featureDescription: isVi
        ? "Route này không nói chung về short link. Nó nói riêng về use case Shopee và social posting."
        : "This page is not about generic short links. It focuses on the Shopee sharing use case.",
      featureItems: isVi
        ? [
            {
              title: "Title theo đúng thông điệp",
              body: "Bạn cần title phù hợp với bài đăng chứ không bị trói bởi title gốc.",
            },
            {
              title: "Ảnh và video đủ hút click",
              body: "Preview phải đủ rõ để giữ tỷ lệ click khi cạnh tranh trên feed.",
            },
            {
              title: "Slug phù hợp chiến dịch",
              body: "Slug nên phản ánh campaign hoặc chủ đề để dễ đọc và dễ nhớ.",
            },
          ]
        : [
            {
              title: "Message-aligned title",
              body: "You need a title that fits the post, not only the raw source title.",
            },
            {
              title: "Images and video that earn clicks",
              body: "Preview assets should compete effectively on feeds.",
            },
            {
              title: "Campaign-ready slugs",
              body: "The slug should reflect the campaign or topic.",
            },
          ],
      workflowTitle: isVi
        ? "Cách dùng trang này cho link Shopee."
        : "How to use this page for Shopee.",
      workflowDescription: isVi
        ? "Mỗi bước đều xoay quanh việc làm một URL Shopee gốc trở thành một asset có thể phát hành."
        : "Each step turns a raw Shopee URL into a publishable asset.",
      workflowSteps: isVi
        ? [
            "Dán link Shopee gốc vào app.",
            "Viết title, mô tả, chọn ảnh hoặc video và đặt slug cho campaign.",
            "Dùng trang công khai này để đăng bài, bình luận hoặc phân phối ra nhiều kênh.",
          ]
        : [
            "Paste the raw Shopee link into the app.",
            "Write title and description, choose image or video, and define a campaign slug.",
            "Use the public page in posts, comments, or multi-channel distribution.",
          ],
      useCaseTitle: isVi
        ? "Khi trang này đáng dùng."
        : "When this page is worth using.",
      useCaseDescription: isVi
        ? "Hợp khi bạn cần một trang Shopee tối ưu riêng, thay vì dùng chung một link ngắn vô ngữ cảnh."
        : "Useful when you need a Shopee-specific public page instead of a context-free short URL.",
      useCaseItems: isVi
        ? [
            {
              title: "Seeding Facebook",
              body: "Post hoặc comment trong nhóm cần preview dễ hiểu và URL nhìn gọn.",
            },
            {
              title: "Chạy nhiều chiến dịch",
              body: "Mỗi chiến dịch có thể có slug, title và preview riêng.",
            },
          ]
        : [
            {
              title: "Facebook seeding",
              body: "Posts and comments need understandable previews and lighter URLs.",
            },
            {
              title: "Multiple campaigns",
              body: "Each campaign can get its own slug, title, and preview.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Trang Shopee khác trang TikTok ở đâu?",
              description:
                "Trang Shopee thường nhấn vào bài đăng, card feed và tracking theo campaign nhiều hơn bio flow.",
              bullets: [
                "Tối ưu cho post và comment hơn là bio link.",
                "Thường cần preview kiểu card rõ hơn là một hub nhiều điểm đến.",
                "Slug nên gần với chủ đề hoặc nội dung seeding.",
              ],
            },
            {
              title: "Đừng biến trang Shopee thành một URL rút gọn trống nội dung.",
              description:
                "Nếu trang này chỉ ngắn hơn mà không rõ hơn, nó chưa tạo đủ giá trị cho use case Shopee.",
              bullets: [
                "Title nên bám thông điệp campaign.",
                "Mô tả nên hỗ trợ click thay vì lặp title.",
                "Ảnh hoặc video nên phản ánh đúng thứ người dùng sắp thấy.",
              ],
            },
          ]
        : [
            {
              title: "How is a Shopee page different from a TikTok page?",
              description:
                "Shopee pages usually emphasize posts, feed cards, and campaign tracking more than bio flow.",
              bullets: [
                "Optimized more for posts and comments than bio links.",
                "Usually needs a stronger card preview rather than a multi-destination hub.",
                "Slugs should stay close to the seeding topic or campaign message.",
              ],
            },
            {
              title: "Do not reduce a Shopee page to an empty short URL.",
              description:
                "If the page is only shorter and not clearer, it is not creating enough value for Shopee use cases.",
              bullets: [
                "Titles should match the campaign message.",
                "Descriptions should support click intent instead of repeating the title.",
                "Images or video should reflect what the visitor is about to see.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ landing page Shopee." : "Shopee landing page FAQ.",
      faqDescription: isVi
        ? "Những câu hỏi thực dụng nhất quanh bài toán landing page Shopee."
        : "The most practical questions around Shopee landing page workflows.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "rut-gon-link-shopee",
        "pricing",
        "tracking-click-affiliate",
        "faq",
      ],
    },
    {
      key: "landing-page-tiktok",
      path: "/discover/landing-page-tiktok",
      title: isVi
        ? "Landing page TikTok | Tạo trang trung gian để điều hướng traffic đẹp hơn"
        : "TikTok landing page | Build a cleaner intermediate page for traffic routing",
      description: isVi
        ? "Tìm hiểu cách HotsNew Click tạo landing page TikTok với tiêu đề, mô tả, ảnh, video, slug và tracking click để bio và luồng điều hướng rõ hơn."
        : "Learn how HotsNew Click creates TikTok landing pages with title, description, image, video, slug, and click tracking for cleaner bio and routing flows.",
      keywords: [
        ...base.keywords,
        "landing page TikTok",
        ...(isVi ? ["landing page tiktok"] : []),
      ],
      heroEyebrow: isVi
        ? "Intent: landing page TikTok"
        : "Intent: TikTok landing pages",
      heroTitle: isVi
        ? "Landing page TikTok giúp bio dễ nhớ hơn và luồng traffic dễ đo hơn."
        : "A TikTok landing page makes the bio easier to remember and the traffic flow easier to measure.",
      heroDescription: isVi
        ? "Route này nói về bio, video điều hướng và việc biến raw TikTok URL thành một điểm đến rõ ràng hơn."
        : "This page is about bio links, routing videos, and turning a raw TikTok URL into a clearer destination.",
      summaryCards: isVi
        ? [
            {
              title: "Bio rõ hơn",
              body: "Một trang riêng giúp bio trông gọn hơn và dễ nhắc lại hơn.",
            },
            {
              title: "Điều hướng mềm hơn",
              body: "Traffic từ video hoặc bio có thể đi qua một lớp preview có kiểm soát.",
            },
            {
              title: "Đo được creator flow",
              body: "Tracking theo creator hoặc theo campaign rõ hơn so với raw URL.",
            },
          ]
        : [
            {
              title: "Cleaner bio presence",
              body: "A dedicated page makes the bio easier to remember and repeat.",
            },
            {
              title: "Smoother routing",
              body: "Video or bio traffic can pass through a controlled preview layer.",
            },
            {
              title: "Measurable creator flow",
              body: "Tracking by creator or campaign becomes clearer than with a raw URL.",
            },
          ],
      featureTitle: isVi
        ? "TikTok landing page cần nhấn vào gì."
        : "What a TikTok landing page should emphasize.",
      featureDescription: isVi
        ? "Trang TikTok khác trang Shopee ở chỗ nó nghiêng về bio, creator flow và điều hướng nhiều bề mặt."
        : "TikTok pages differ from Shopee pages by leaning into bio usage, creator flow, and multi-surface routing.",
      featureItems: isVi
        ? [
            {
              title: "Slug dễ đọc trong bio",
              body: "Nếu slug khó đọc, trang này mất một phần lớn giá trị trong bio.",
            },
            {
              title: "Preview hợp với creator flow",
              body: "Ảnh hoặc video nên phản ánh nội dung người xem vừa đi ra từ TikTok.",
            },
            {
              title: "Theo dõi click theo nguồn",
              body: "Route TikTok nên hỗ trợ đo theo video, creator hoặc chiến dịch.",
            },
          ]
        : [
            {
              title: "Bio-friendly slugs",
              body: "If the slug is hard to read, the page loses a major part of its value.",
            },
            {
              title: "Preview tuned for creator flow",
              body: "Images or video should match the TikTok context users came from.",
            },
            {
              title: "Source-aware click tracking",
              body: "TikTok pages should support creator-, video-, or campaign-level measurement.",
            },
          ],
      workflowTitle: isVi
        ? "Cách dùng trang này cho TikTok."
        : "How to use this page for TikTok.",
      workflowDescription: isVi
        ? "Mỗi bước đều xoay quanh bio, video điều hướng và cách giữ URL dễ nhớ."
        : "Each step is built around bio usage, routing videos, and memorable URLs.",
      workflowSteps: isVi
        ? [
            "Dán link TikTok gốc hoặc link affiliate.",
            "Viết title, mô tả, chọn ảnh hoặc video và đặt slug dễ đọc.",
            "Đưa trang công khai này vào bio hoặc luồng video rồi theo dõi click.",
          ]
        : [
            "Paste the raw TikTok or affiliate link.",
            "Write title and description, choose image or video, and define a readable slug.",
            "Place the public page in the bio or routing video and track clicks.",
          ],
      useCaseTitle: isVi
        ? "Khi trang này phù hợp."
        : "When this page fits best.",
      useCaseDescription: isVi
        ? "Hợp khi bạn cần một trang TikTok chuyên cho bio, creator flow hoặc điều hướng từ nhiều video."
        : "Useful when you need a TikTok-specific page for bio usage, creator flow, or routing from multiple videos.",
      useCaseItems: isVi
        ? [
            {
              title: "Bio cá nhân hoặc bio brand",
              body: "URL ngắn, dễ đọc và không quá nặng so với raw TikTok URL.",
            },
            {
              title: "Campaign nhiều video",
              body: "Có thể gắn tracking rõ hơn khi nhiều video cùng kéo về một đích.",
            },
          ]
        : [
            {
              title: "Personal or brand bio",
              body: "A shorter, clearer URL than a raw TikTok link.",
            },
            {
              title: "Multi-video campaigns",
              body: "Provides clearer tracking when several videos lead to one destination.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Trang TikTok là bài toán điều hướng, không chỉ là preview.",
              description:
                "Một trang TikTok tốt không chỉ đẹp khi dán, mà còn phải hợp với luồng người dùng từ bio hoặc từ video.",
              bullets: [
                "Slug phải dễ nhắc lại bằng miệng hoặc trong caption.",
                "Preview nên tiếp nối cảm giác của nội dung trước đó.",
                "Tracking nên đủ chi tiết để phân biệt creator hoặc chiến dịch.",
              ],
            },
            {
              title: "Đừng dùng cùng một cách nghĩ như với trang Shopee.",
              description:
                "Trang TikTok thường cần tính linh hoạt về bio và điều hướng mạnh hơn trang Shopee.",
              bullets: [
                "Tập trung vào trí nhớ và độ gọn của URL.",
                "Tập trung vào flow creator hơn flow bài đăng cộng đồng.",
                "Tập trung vào khả năng lặp lại qua nhiều nội dung video.",
              ],
            },
          ]
        : [
            {
              title:
                "A TikTok page is a routing problem, not only a preview problem.",
              description:
                "A strong TikTok page should not only look good when pasted. It should fit the user flow from bio or video.",
              bullets: [
                "The slug must be easy to repeat verbally or in captions.",
                "The preview should continue the feeling of the previous content.",
                "Tracking should be detailed enough to separate creators or campaigns.",
              ],
            },
            {
              title: "Do not apply the Shopee mindset directly.",
              description:
                "TikTok pages usually need stronger flexibility around bio usage and routing than Shopee pages do.",
              bullets: [
                "Optimize for memorability and URL compactness.",
                "Focus on creator flow more than community post flow.",
                "Support repeated use across multiple video assets.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ landing page TikTok." : "TikTok landing page FAQ.",
      faqDescription: isVi
        ? "Những câu hỏi thực dụng nhất quanh bài toán landing page TikTok."
        : "The most practical questions around TikTok landing page workflows.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "rut-gon-link-tiktok",
        "link-tiktok-affiliate",
        "tracking-click-affiliate",
        "faq",
      ],
    },
    {
      key: "rut-gon-link-shopee",
      path: "/discover/rut-gon-link-shopee",
      title: isVi
        ? "Rút gọn link Shopee | Tạo slug đẹp, dễ nhớ và dễ quản lý"
        : "Shorten Shopee links | Create cleaner and more memorable slugs",
      description: isVi
        ? "Rút gọn link Shopee với HotsNew Click để có domain hoặc slug dễ nhớ, preview đẹp hơn và dễ đo click theo campaign."
        : "Shorten Shopee links with HotsNew Click to get cleaner domain or slug URLs, stronger previews, and campaign-level click tracking.",
      keywords: [
        ...base.keywords,
        "rút gọn link Shopee",
        ...(isVi ? ["rut gon link Shopee", "rut gon link shopee"] : []),
      ],
      heroEyebrow: isVi
        ? "Intent: rút gọn link Shopee, Tiktok"
        : "Intent: shorten Shopee, Tiktok links",
      heroTitle: isVi
        ? "Rút gọn link Shopee để không chỉ ngắn hơn mà còn dễ mang đi chạy campaign."
        : "Shorten Shopee links so they are not just shorter, but easier to use in campaigns.",
      heroDescription: isVi
        ? "Route này nhấn vào slug, domain và cách biến một link dài thành một URL có cấu trúc rõ ràng."
        : "This page emphasizes slugs, domains, and turning a long link into a structured public URL.",
      summaryCards: isVi
        ? [
            {
              title: "Slug đọc được",
              body: "Một slug tốt giúp người đọc đoán được nội dung thay vì chỉ thấy mã ngẫu nhiên.",
            },
            {
              title: "Domain đúng bề mặt",
              body: "Cùng một link Shopee nhưng có thể cần domain khác nhau cho từng flow phân phối.",
            },
            {
              title: "Ngắn mà vẫn có ngữ cảnh",
              body: "Link ngắn không nên biến thành một endpoint vô nghĩa.",
            },
          ]
        : [
            {
              title: "Readable slugs",
              body: "A good slug helps visitors infer the content instead of seeing random code.",
            },
            {
              title: "Surface-appropriate domains",
              body: "The same Shopee link may need different domains on different distribution surfaces.",
            },
            {
              title: "Short but still contextual",
              body: "A short URL should not become a meaningless endpoint.",
            },
          ],
      featureTitle: isVi
        ? "Link Shopee ngắn hơn chưa đủ."
        : "A shorter Shopee link is not enough.",
      featureDescription: isVi
        ? "Trang này không nói về beauty link chung chung, mà về khả năng dùng slug cho Shopee thật sự."
        : "This page is not about generic pretty URLs. It is about actually using structured Shopee slugs.",
      featureItems: isVi
        ? [
            {
              title: "Tên slug có chủ đích",
              body: "Slug nên phản ánh campaign, nội dung hoặc nhóm sản phẩm.",
            },
            {
              title: "Preview vẫn giữ được",
              body: "Rút gọn không có nghĩa là bỏ mất title, mô tả và ảnh.",
            },
            {
              title: "Quản lý dễ hơn theo chiến dịch",
              body: "Khi slug có cấu trúc, việc lọc, tìm và báo cáo cũng dễ hơn.",
            },
          ]
        : [
            {
              title: "Intentional slug naming",
              body: "The slug should reflect the campaign, content theme, or product group.",
            },
            {
              title: "Preview still matters",
              body: "Shortening should not remove title, description, and image control.",
            },
            {
              title: "Campaign-friendly management",
              body: "Structured slugs make filtering, finding, and reporting easier.",
            },
          ],
      workflowTitle: isVi
        ? "Cách rút gọn link Shopee có cấu trúc."
        : "How to shorten Shopee links with structure.",
      workflowDescription: isVi
        ? "Mỗi bước đều nhấn vào việc giữ ngữ cảnh cho URL sau khi rút gọn."
        : "Each step focuses on preserving context after shortening.",
      workflowSteps: isVi
        ? [
            "Chọn domain đầu ra phù hợp với bề mặt chia sẻ.",
            "Đặt slug bám sát chiến dịch hoặc nhóm nội dung.",
            "Giữ preview và tracking để link ngắn vẫn có giá trị khi mang đi đăng và đo hiệu quả.",
          ]
        : [
            "Choose the output domain that fits the distribution surface.",
            "Define a slug that matches the campaign or content group.",
            "Keep preview and tracking so the short link stays operationally useful.",
          ],
      useCaseTitle: isVi
        ? "Khi trang này hợp lý."
        : "When this page makes sense.",
      useCaseDescription: isVi
        ? "Hợp với người đang tìm cách làm URL Shopee bớt dài nhưng vẫn giữ được cấu trúc chiến dịch."
        : "Useful for visitors trying to reduce raw Shopee URL length while preserving campaign structure.",
      useCaseItems: isVi
        ? [
            {
              title: "Seeding nhiều bài",
              body: "Slug rõ giúp đội nhớ nhanh và dùng đúng link cho đúng bài.",
            },
            {
              title: "Campaign có nhiều biến thể",
              body: "Mỗi biến thể có thể có slug riêng để tách rõ đo lường.",
            },
          ]
        : [
            {
              title: "Multi-post seeding",
              body: "Clear slugs help teams remember and reuse the right links.",
            },
            {
              title: "Variant-heavy campaigns",
              body: "Each variation can have its own slug for clearer measurement.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Short link không đồng nghĩa với good link.",
              description:
                "Nếu chỉ cắt ngắn URL mà không giữ được ngữ cảnh, trang này chưa tạo thêm nhiều giá trị.",
              bullets: [
                "Slug nên có ý nghĩa chứ không chỉ ngắn.",
                "Domain nên hợp với nơi người dùng sẽ nhìn thấy link.",
                "Tracking nên đi cùng trang này, không nên tách rời.",
              ],
            },
            {
              title: "Trang rút gọn link Shopee nên rất thực dụng.",
              description:
                "Người vào trang này thường không tìm triết lý thương hiệu. Họ chỉ muốn link gọn và dễ dùng hơn.",
              bullets: [
                "Tập trung vào ví dụ campaign.",
                "Nói rõ lợi ích của slug và domain.",
                "Dẫn sang trang tracking hoặc trang giá khi cần.",
              ],
            },
          ]
        : [
            {
              title: "A short link is not automatically a good link.",
              description:
                "If shortening removes context, the page is not creating enough value.",
              bullets: [
                "The slug should be meaningful, not only shorter.",
                "The domain should fit where users will actually see the link.",
                "Tracking should live with the page instead of being detached from it.",
              ],
            },
            {
              title: "A Shopee short-link page should stay practical.",
              description:
                "Visitors here are looking for a cleaner working URL, not abstract brand theory.",
              bullets: [
                "Use campaign-oriented examples.",
                "Explain slug and domain value directly.",
                "Guide users into tracking or pricing when relevant.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ rút gọn link Shopee." : "Shopee short-link FAQ.",
      faqDescription: isVi
        ? "Tập trung vào slug, domain và tracking."
        : "Focused on slugs, domains, and tracking.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "landing-page-shopee",
        "tracking-click-affiliate",
        "pricing",
        "faq",
      ],
    },
    {
      key: "rut-gon-link-tiktok",
      path: "/discover/rut-gon-link-tiktok",
      title: isVi
        ? "Rút gọn link TikTok | Tạo slug đẹp, dễ nhớ và dễ gắn vào bio"
        : "Shorten TikTok links | Create cleaner slugs for bio and routing",
      description: isVi
        ? "Rút gọn link TikTok với HotsNew Click để có domain hoặc slug dễ nhớ, preview đẹp hơn và dễ tracking click theo creator hoặc campaign."
        : "Shorten TikTok links with HotsNew Click to get cleaner domain or slug URLs, stronger previews, and click tracking by creator or campaign.",
      keywords: [
        ...base.keywords,
        "rút gọn link TikTok",
        "link TikTok bio",
        ...(isVi
          ? ["rut gon link TikTok", "rut gon link tiktok", "link tiktok bio"]
          : []),
      ],
      heroEyebrow: isVi
        ? "Intent: rút gọn link TikTok"
        : "Intent: shorten TikTok links",
      heroTitle: isVi
        ? "Rút gọn link TikTok để bio dễ nhớ hơn và luồng điều hướng gọn hơn."
        : "Shorten TikTok links so your bio is easier to remember and the routing flow is cleaner.",
      heroDescription: isVi
        ? "Route này tập trung vào bio, creator flow và cách làm cho raw TikTok URL trở nên dễ mang đi phân phối hơn."
        : "This page focuses on bio usage, creator flows, and making raw TikTok URLs easier to distribute.",
      summaryCards: isVi
        ? [
            {
              title: "Bio ngắn và rõ",
              body: "TikTok bio hưởng lợi trực tiếp khi URL dễ nhớ và dễ đọc.",
            },
            {
              title: "Slug hợp creator flow",
              body: "Slug nên đủ gọn để nhắc lại trong video hoặc caption.",
            },
            {
              title: "Tracking theo creator",
              body: "Một trang TikTok tốt giúp đo rõ nguồn click theo campaign hoặc creator.",
            },
          ]
        : [
            {
              title: "Cleaner bio URLs",
              body: "TikTok bio benefits directly from memorable and readable links.",
            },
            {
              title: "Creator-flow slugs",
              body: "Slugs should be short enough to repeat in videos or captions.",
            },
            {
              title: "Creator-level tracking",
              body: "A strong TikTok page makes creator- or campaign-based tracking clearer.",
            },
          ],
      featureTitle: isVi
        ? "TikTok short link cần điều gì."
        : "What a TikTok short link needs.",
      featureDescription: isVi
        ? "Trang TikTok không nên chỉ ngắn, mà còn phải dễ đọc trong bio và hợp với cách creator phân phối traffic."
        : "A TikTok page should not only be short. It should be readable in bios and fit creator distribution habits.",
      featureItems: isVi
        ? [
            {
              title: "Slug dễ nhắc lại",
              body: "Người xem có thể nhìn hoặc nghe lại slug mà vẫn nhớ được.",
            },
            {
              title: "Preview phù hợp nguồn vào",
              body: "Người click từ TikTok cần một lớp chuyển tiếp mạch lạc.",
            },
            {
              title: "Domain đúng ngữ cảnh",
              body: "Có bề mặt nên dùng domain khác để nhìn tự nhiên hơn trong bio.",
            },
          ]
        : [
            {
              title: "Repeatable slugs",
              body: "Users should be able to see or hear the slug and still remember it.",
            },
            {
              title: "Preview fit for entry context",
              body: "TikTok traffic benefits from a coherent transition layer.",
            },
            {
              title: "Context-aware domains",
              body: "Some surfaces benefit from a more natural-looking public domain.",
            },
          ],
      workflowTitle: isVi
        ? "Cách rút gọn link TikTok có thể scale."
        : "How to shorten TikTok links in a scalable way.",
      workflowDescription: isVi
        ? "Cách làm ở đây ưu tiên bio, khả năng lặp lại và tracking theo creator."
        : "This workflow prioritizes bio readability, repeatability, and creator-level tracking.",
      workflowSteps: isVi
        ? [
            "Chọn domain đầu ra phù hợp với bề mặt bio hoặc nội dung điều hướng.",
            "Đặt slug ngắn và dễ nhắc lại.",
            "Gắn preview và tracking để trang này vừa đẹp vừa đo được.",
          ]
        : [
            "Choose an output domain that fits the bio or routing surface.",
            "Create a short, repeatable slug.",
            "Attach preview and tracking so the page stays both clean and measurable.",
          ],
      useCaseTitle: isVi
        ? "Khi trang này đáng dùng."
        : "When this page is worth using.",
      useCaseDescription: isVi
        ? "Hợp với creator, affiliate hoặc team social đang muốn làm TikTok URL dễ dùng hơn mà không mất ngữ cảnh."
        : "Useful for creators, affiliates, or social teams that want cleaner TikTok URLs without losing context.",
      useCaseItems: isVi
        ? [
            {
              title: "Bio cá nhân",
              body: "Một slug dễ nhớ giúp bio đỡ nặng và dễ nhắc hơn.",
            },
            {
              title: "Creator campaign",
              body: "Mỗi creator hoặc chiến dịch có thể có trang riêng để tracking rõ hơn.",
            },
          ]
        : [
            {
              title: "Personal bio links",
              body: "A memorable slug makes the bio lighter and easier to repeat.",
            },
            {
              title: "Creator campaigns",
              body: "Each creator or campaign can get its own page for clearer tracking.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Trang rút gọn link TikTok thiên về độ dễ nhớ.",
              description:
                "Người dùng TikTok thường cần một link có thể được nhớ lại nhanh hơn so với raw URL dài.",
              bullets: [
                "Slug phải đủ ngắn để dùng trong bio.",
                "URL phải đủ rõ để đọc nhanh trên màn hình nhỏ.",
                "Tracking phải bám được theo creator hoặc content cluster.",
              ],
            },
            {
              title: "Đừng tách short-link TikTok khỏi preview.",
              description:
                "Nếu trang TikTok chỉ có slug mà không có preview hợp lý, nó mất một phần lớn sức mạnh khi chia sẻ.",
              bullets: [
                "Preview nên tiếp nối ngữ cảnh từ TikTok.",
                "Route nên phục vụ cả bio lẫn luồng điều hướng ngoài video.",
                "Nên dẫn sang landing page TikTok khi cần nội dung sâu hơn.",
              ],
            },
          ]
        : [
            {
              title: "TikTok short-link pages are about memorability.",
              description:
                "TikTok users often need a link they can recall faster than a long raw URL.",
              bullets: [
                "Slugs should stay compact enough for bios.",
                "URLs should remain readable on small screens.",
                "Tracking should map back to creators or content clusters.",
              ],
            },
            {
              title:
                "Do not separate the TikTok short-link page from preview quality.",
              description:
                "If the page only has a short slug but weak preview context, it loses a major part of its value.",
              bullets: [
                "Preview should continue the TikTok context.",
                "The page should serve both bio and external routing flows.",
                "It should guide into the TikTok landing page when deeper content is needed.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ rút gọn link TikTok." : "TikTok short-link FAQ.",
      faqDescription: isVi
        ? "Tập trung vào bio, slug và tracking."
        : "Focused on bios, slugs, and tracking.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "landing-page-tiktok",
        "link-tiktok-affiliate",
        "tracking-click-affiliate",
        "faq",
      ],
    },
    {
      key: "tracking-click-affiliate",
      path: "/discover/tracking-click-affiliate",
      title: isVi
        ? "Tracking click affiliate | Đo lưu lượng và hiệu quả link"
        : "Affiliate click tracking | Measure traffic and link performance",
      description: isVi
        ? "Tracking click affiliate với HotsNew Click để biết traffic đến từ đâu, link nào kéo tốt và domain nào phù hợp cho từng campaign."
        : "Use HotsNew Click for affiliate click tracking to understand traffic sources, top-performing links, and the best domain setup for each campaign.",
      keywords: [
        ...base.keywords,
        "tracking click affiliate",
        ...(isVi ? ["theo dõi click affiliate", "theo doi click affiliate"] : []),
      ],
      heroEyebrow: isVi
        ? "Intent: tracking click affiliate"
        : "Intent: affiliate click tracking",
      heroTitle: isVi
        ? "Tracking click affiliate có giá trị khi nó quay lại phục vụ quyết định campaign."
        : "Affiliate click tracking matters when it feeds back into campaign decisions.",
      heroDescription: isVi
        ? "Route này nói thẳng về lưu lượng, nguồn click và cách tracking phải giúp quyết định phân phối tiếp theo."
        : "This page speaks directly about traffic, click sources, and how tracking should improve the next distribution decision.",
      summaryCards: isVi
        ? [
            {
              title: "Biết click đến từ đâu",
              body: "Không chỉ đếm click, mà còn biết nguồn và ngữ cảnh phân phối.",
            },
            {
              title: "Biết link nào đáng đẩy tiếp",
              body: "Tracking tốt giúp ưu tiên đúng link thay vì đoán theo cảm giác.",
            },
            {
              title: "Giữ domain và slug có ý nghĩa",
              body: "Khi trang công khai rõ ràng, dữ liệu phân tích cũng dễ đọc hơn.",
            },
          ]
        : [
            {
              title: "Know where clicks come from",
              body: "Not only count clicks, but identify source and distribution context.",
            },
            {
              title: "Know which links deserve more push",
              body: "Good tracking helps prioritize the right pages instead of guessing.",
            },
            {
              title: "Keep domain and slug meaningful",
              body: "Clear public pages make analysis easier to read.",
            },
          ],
      featureTitle: isVi
        ? "Tracking tốt phải trả lời điều gì."
        : "What good tracking should answer.",
      featureDescription: isVi
        ? "Trang này không chỉ nói về analytics chung, mà về quyết định affiliate dựa trên link-level data."
        : "This page is not about generic analytics. It is about affiliate decisions driven by link-level data.",
      featureItems: isVi
        ? [
            {
              title: "Nguồn traffic",
              body: "Biết click đến từ bio, Facebook group, comment hay từng trang công khai cụ thể.",
            },
            {
              title: "Hiệu quả theo chiến dịch",
              body: "Tách được link nào đang kéo chuyển động tốt nhất cho campaign.",
            },
            {
              title: "Tối ưu vòng sau",
              body: "Tracking phải dẫn đến quyết định sửa title, domain, slug hoặc cách phân phối link.",
            },
          ]
        : [
            {
              title: "Traffic source",
              body: "Identify whether traffic came from bio, Facebook groups, comments, or specific public pages.",
            },
            {
              title: "Campaign efficiency",
              body: "Separate the links driving the strongest movement for a campaign.",
            },
            {
              title: "Next-iteration optimization",
              body: "Tracking should lead to changes in title, domain, slug, or distribution strategy.",
            },
          ],
      workflowTitle: isVi
        ? "Flow tracking thực dụng."
        : "A practical tracking flow.",
      workflowDescription: isVi
        ? "Mục tiêu của trang này là đưa tracking về một vòng quyết định ngắn và rõ."
        : "The goal of this page is to connect tracking to a short, clear decision loop.",
      workflowSteps: isVi
        ? [
            "Tạo link có slug, UTM và tag rõ ràng.",
            "Phân phối link trên từng bề mặt cụ thể.",
            "Đọc lại click theo nguồn rồi tối ưu link hoặc chiến dịch tiếp theo.",
          ]
        : [
            "Create links with clear slugs, UTM parameters, and tags.",
            "Distribute each link on specific surfaces.",
            "Review clicks by source and refine the link or campaign.",
          ],
      useCaseTitle: isVi
        ? "Khi trang này quan trọng."
        : "When this page matters.",
      useCaseDescription: isVi
        ? "Hợp khi bạn đã có nhiều trang công khai và cần biết link nào thật sự mang lại giá trị."
        : "Useful when you already have several public pages and need to know which ones truly create value.",
      useCaseItems: isVi
        ? [
            {
              title: "Đội chạy nhiều kênh",
              body: "Traffic từ nhiều bề mặt chỉ có ý nghĩa khi được đo tách bạch.",
            },
            {
              title: "Campaign có nhiều biến thể",
              body: "Mỗi biến thể cần link và dữ liệu riêng để tối ưu đúng.",
            },
          ]
        : [
            {
              title: "Multi-channel teams",
              body: "Traffic across multiple surfaces only matters when measured separately.",
            },
            {
              title: "Variant-heavy campaigns",
              body: "Each variant needs its own link and data to be optimized correctly.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title: "Trang tracking không nên chỉ là một trang dashboard copy.",
              description:
                "Người tìm 'tracking click affiliate' cần nội dung gần với quyết định phân phối, không chỉ là mô tả chung về analytics.",
              bullets: [
                "Nói rõ link-level decision là gì.",
                "Nói rõ UTM và tag giúp tách traffic ra sao.",
                "Nói rõ slug và domain cũng ảnh hưởng đến khả năng đọc dữ liệu.",
              ],
            },
            {
              title: "Tracking chỉ có ích khi nó tạo được vòng lặp.",
              description:
                "Nếu xem xong số liệu mà không thay đổi link, title hoặc bề mặt phân phối, tracking chưa hoàn thành nhiệm vụ.",
              bullets: [
                "Sửa link nào đang yếu.",
                "Đẩy thêm link nào đang tốt.",
                "Bỏ link nào đang chỉ tạo noise.",
              ],
            },
          ]
        : [
            {
              title:
                "A tracking page should not read like a generic dashboard page.",
              description:
                "Visitors searching for affiliate click tracking need content tied to distribution decisions, not only analytics overview copy.",
              bullets: [
                "Explain what link-level decision-making means.",
                "Explain how UTM and tags separate traffic.",
                "Explain how domain and slug clarity also affect analysis.",
              ],
            },
            {
              title: "Tracking is only useful when it creates a loop.",
              description:
                "If the data does not change the link, title, or distribution surface, the tracking job is incomplete.",
              bullets: [
                "Fix weak-performing links.",
                "Push the links already performing well.",
                "Stop the links that only create noise.",
              ],
            },
          ],
      faqTitle: isVi
        ? "FAQ tracking click affiliate."
        : "Affiliate click-tracking FAQ.",
      faqDescription: isVi
        ? "Tập trung vào nguồn traffic, UTM và cách đọc dữ liệu."
        : "Focused on traffic sources, UTM, and how to read the data.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "pricing",
        "rut-gon-link-shopee",
        "rut-gon-link-tiktok",
        "landing-page-shopee",
        "landing-page-tiktok",
      ],
    },
    {
      key: "link-tiktok-affiliate",
      path: "/discover/link-tiktok-affiliate",
      title: isVi
        ? "Link TikTok affiliate | Tạo landing page và điều hướng click gọn hơn"
        : "TikTok affiliate links | Build cleaner landing pages and routing flows",
      description: isVi
        ? "Tạo link TikTok affiliate với landing page trung gian, ảnh hoặc video preview, slug đẹp và tracking click để điều hướng traffic rõ hơn."
        : "Build TikTok affiliate links with intermediate landing pages, image or video previews, clean slugs, and click tracking for clearer traffic routing.",
      keywords: [
        ...base.keywords,
        "link TikTok affiliate",
        ...(isVi ? ["link tiktok affiliate"] : []),
      ],
      heroEyebrow: isVi
        ? "Intent: TikTok affiliate link"
        : "Intent: TikTok affiliate links",
      heroTitle: isVi
        ? "Link TikTok affiliate cần một điểm đến dễ nhớ, dễ chia sẻ và dễ tracking."
        : "TikTok affiliate links work better with a memorable, shareable, and trackable destination.",
      heroDescription: isVi
        ? "Route này tập trung vào affiliate flow của TikTok: bio, video, nhiều creator và nhu cầu đo click rõ hơn."
        : "This page focuses on TikTok affiliate flows: bios, videos, multiple creators, and clearer click measurement.",
      summaryCards: isVi
        ? [
            {
              title: "Bio và video đi cùng nhau",
              body: "Route nên phục vụ cả nơi đặt link lẫn nơi giải thích lý do phải bấm.",
            },
            {
              title: "Slug nhớ được",
              body: "Affiliate flow càng nhanh, slug càng cần dễ đọc và dễ lặp lại.",
            },
            {
              title: "Creator tracking rõ hơn",
              body: "Một trang tốt giúp tách traffic theo creator hoặc campaign.",
            },
          ]
        : [
            {
              title: "Bio and video work together",
              body: "The page should serve both link placement and click motivation.",
            },
            {
              title: "Memorable slugs",
              body: "The faster the affiliate flow, the more readable the slug should be.",
            },
            {
              title: "Clearer creator tracking",
              body: "A strong page helps separate traffic by creator or campaign.",
            },
          ],
      featureTitle: isVi
        ? "Trang TikTok affiliate cần nhấn vào đâu."
        : "What a TikTok affiliate page should emphasize.",
      featureDescription: isVi
        ? "Khác với trang TikTok tổng quát, trang này đi sâu hơn vào affiliate flow và traffic điều hướng."
        : "Unlike a generic TikTok page, this page goes deeper into affiliate flow and traffic routing.",
      featureItems: isVi
        ? [
            {
              title: "Điểm đến rõ ràng",
              body: "Người xem cần biết trang này dẫn họ đi đâu và vì sao đáng bấm.",
            },
            {
              title: "Preview đủ thuyết phục",
              body: "Title, ảnh hoặc video phải tiếp nối đúng ngữ cảnh từ creator.",
            },
            {
              title: "Dễ gắn vào workflow creator",
              body: "Trang này cần hoạt động tốt với bio, video điều hướng và campaign ngắn hạn.",
            },
          ]
        : [
            {
              title: "Clear destination",
              body: "Viewers need to know where the page leads and why it is worth clicking.",
            },
            {
              title: "Convincing preview",
              body: "Title, image, or video should continue the creator context.",
            },
            {
              title: "Creator-workflow fit",
              body: "The page should work across bios, routing videos, and short campaigns.",
            },
          ],
      workflowTitle: isVi
        ? "Cách dùng cho TikTok affiliate."
        : "How to use it for TikTok affiliate.",
      workflowDescription: isVi
        ? "Trang này được viết cho người đang cần biến raw affiliate URL thành một link có thể mang đi phân phối."
        : "This page is designed for turning a raw affiliate URL into a distribution-ready asset.",
      workflowSteps: isVi
        ? [
            "Tạo link với slug dễ nhớ và domain phù hợp.",
            "Gắn preview, mô tả và ngữ cảnh click rõ ràng.",
            "Phân phối qua bio hoặc creator content rồi theo dõi click theo campaign.",
          ]
        : [
            "Create a link with a memorable slug and suitable domain.",
            "Add preview assets, descriptive copy, and clear click context.",
            "Distribute it through bios or creator content and measure campaign clicks.",
          ],
      useCaseTitle: isVi ? "Khi trang này phù hợp." : "When this page fits.",
      useCaseDescription: isVi
        ? "Hợp với người đang làm affiliate TikTok và cần một trang công khai có thể mang đi dùng lặp lại."
        : "Useful for TikTok affiliates who need a reusable public page.",
      useCaseItems: isVi
        ? [
            {
              title: "Nhiều creator cùng đẩy",
              body: "Mỗi creator hoặc nhóm creator có thể có link riêng để đo riêng.",
            },
            {
              title: "Campaign cần tối ưu nhanh",
              body: "Có thể đổi preview hoặc slug mà không phải phụ thuộc hoàn toàn vào raw URL.",
            },
          ]
        : [
            {
              title: "Multiple creators driving traffic",
              body: "Each creator or creator group can get its own measurable link.",
            },
            {
              title: "Fast-iteration campaigns",
              body: "You can change preview or slug without relying only on the raw URL.",
            },
          ],
      detailSections: isVi
        ? [
            {
              title:
                "Trang TikTok affiliate là điểm nối giữa creator và đích đến.",
              description:
                "Nó không chỉ là bước trung gian kỹ thuật mà là phần của trải nghiệm click.",
              bullets: [
                "Người xem cần hiểu họ sẽ gặp gì sau khi bấm.",
                "Creator cần một link đủ gọn để dùng lại nhiều lần.",
                "Người theo dõi hiệu quả cần dữ liệu đủ rõ để biết creator nào kéo tốt.",
              ],
            },
            {
              title: "Đừng để trang affiliate chỉ là một cú redirect thô.",
              description:
                "Nếu trang này không có preview, title hoặc cấu trúc đủ rõ thì rất khó tối ưu creator flow lâu dài.",
              bullets: [
                "Giữ slug dễ nhớ.",
                "Giữ preview ăn khớp với creator context.",
                "Giữ tracking đi cùng link thay vì tách rời.",
              ],
            },
          ]
        : [
            {
              title:
                "A TikTok affiliate page connects creators to the destination.",
              description:
                "It is not only a technical middle layer. It is part of the click experience.",
              bullets: [
                "Viewers need to understand what they will see after clicking.",
                "Creators need a link compact enough to reuse repeatedly.",
                "Operators need data clear enough to compare creator performance.",
              ],
            },
            {
              title: "Do not let the affiliate page become a raw redirect.",
              description:
                "Without preview, title, or structure, the page becomes much harder to optimize over time.",
              bullets: [
                "Keep the slug memorable.",
                "Keep the preview aligned with creator context.",
                "Keep tracking attached to the link itself.",
              ],
            },
          ],
      faqTitle: isVi
        ? "FAQ link TikTok affiliate."
        : "TikTok affiliate link FAQ.",
      faqDescription: isVi
        ? "Những câu hỏi quanh bio link, preview và tracking."
        : "Common questions around bio links, previews, and tracking.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "landing-page-tiktok",
        "rut-gon-link-tiktok",
        "tracking-click-affiliate",
        "faq",
      ],
    },
    {
      key: "cach-rut-gon-link-shopee",
      path: "/discover/cach-rut-gon-link-shopee",
      title: isVi
        ? "Cách rút gọn link Shopee | Làm link gọn, dễ nhớ và dễ đăng bài hơn"
        : "How to shorten Shopee links | Make links cleaner, easier to remember, and easier to post",
      description: isVi
        ? "Hướng dẫn cách rút gọn link Shopee để link dễ nhớ hơn, card chia sẻ rõ hơn và vẫn giữ được tracking cho từng chiến dịch."
        : "Learn how to shorten Shopee links so they are easier to remember, clearer when shared, and still measurable by campaign.",
      keywords: [
        ...base.keywords,
        isVi ? "cách rút gọn link Shopee" : "how to shorten Shopee links",
        ...(isVi ? ["cach rut gon link Shopee", "cach rut gon link shopee"] : []),
      ],
      heroEyebrow: isVi ? "Hướng dẫn thực hành" : "Practical guide",
      heroTitle: isVi
        ? "Rút gọn link Shopee đúng cách là làm link gọn hơn mà vẫn giữ được ngữ cảnh và lượt bấm."
        : "Shortening a Shopee link the right way means making it cleaner without losing context or click visibility.",
      heroDescription: isVi
        ? "Bài này dành cho người đang muốn thay raw URL dài bằng một link dễ đọc hơn để đăng bài, bình luận hoặc chạy campaign."
        : "This guide is for people who want to replace long raw URLs with cleaner links for posts, comments, and campaigns.",
      summaryCards: isVi
        ? [
            { title: "Slug dễ nhớ", body: "Người xem nhìn vào link là đoán được nội dung thay vì thấy một chuỗi dài khó đọc." },
            { title: "Card chia sẻ rõ hơn", body: "Link gọn nên đi kèm title, mô tả và ảnh để người xem có lý do bấm." },
            { title: "Tracking vẫn giữ", body: "Rút gọn xong vẫn phải biết link nào đang kéo traffic tốt hơn." },
          ]
        : [
            { title: "Memorable slugs", body: "People should be able to infer the content instead of seeing a long unreadable string." },
            { title: "Clearer share cards", body: "A shorter link still needs title, description, and image context." },
            { title: "Tracking preserved", body: "Shortening should not remove the ability to compare link performance." },
          ],
      featureTitle: isVi ? "Rút gọn link Shopee nên bắt đầu từ đâu." : "Where Shopee link shortening should begin.",
      featureDescription: isVi
        ? "Đừng chỉ nhìn vào độ ngắn. Link tốt là link dễ đọc, hợp chỗ đăng và còn đo được hiệu quả sau khi chia sẻ."
        : "Do not optimize only for length. A good link should be readable, fit the posting surface, and remain measurable.",
      featureItems: isVi
        ? [
            { title: "Chọn domain hợp chỗ đăng", body: "Link mang đi comment, bio hay bài seeding có thể cần domain khác nhau để trông tự nhiên hơn." },
            { title: "Đặt slug theo nội dung", body: "Slug nên bám tên chiến dịch, nhóm sản phẩm hoặc chủ đề đang đẩy." },
            { title: "Giữ preview đủ rõ", body: "Khi dán link ra ngoài, người xem vẫn cần thấy đúng title, mô tả và ảnh." },
          ]
        : [
            { title: "Choose the right domain", body: "Comment links, bios, and seeding posts may benefit from different domains." },
            { title: "Name the slug by intent", body: "The slug should match the campaign, product group, or content theme." },
            { title: "Keep the preview clear", body: "When the link is pasted outside, viewers should still see the right title, description, and image." },
          ],
      workflowTitle: isVi ? "3 bước rút gọn link Shopee thực dụng." : "A practical 3-step Shopee short-link flow.",
      workflowDescription: isVi
        ? "Làm theo từng bước để link ngắn hơn nhưng không bị mất bối cảnh khi mang đi dùng thật."
        : "Follow these steps to shorten the link without losing the context that makes people click.",
      workflowSteps: isVi
        ? [
            "Dán link Shopee gốc và chọn domain muốn xuất ra.",
            "Đặt slug dễ nhớ, bám đúng nội dung hoặc chiến dịch.",
            "Kiểm tra preview rồi mới mang link đi đăng bài hoặc bình luận.",
          ]
        : [
            "Paste the original Shopee URL and choose the output domain.",
            "Set a memorable slug tied to the content or campaign.",
            "Check the preview before posting the link in a post or comment.",
          ],
      useCaseTitle: isVi ? "Khi bài này hữu ích." : "When this guide is useful.",
      useCaseDescription: isVi
        ? "Hợp với người đang đăng nhiều link Shopee và thấy raw URL dài làm card xấu, khó nhớ hoặc khó tách hiệu quả."
        : "Useful for people posting many Shopee links and finding raw URLs too long, ugly, or hard to measure.",
      useCaseItems: isVi
        ? [
            { title: "Seeding Facebook", body: "Giúp link nhìn gọn hơn trong bài đăng và bớt phá bố cục comment." },
            { title: "Chạy nhiều biến thể", body: "Mỗi nội dung có thể có slug riêng để dễ nhìn lại hiệu quả." },
          ]
        : [
            { title: "Facebook seeding", body: "Makes links cleaner inside posts and less disruptive inside comments." },
            { title: "Variant-heavy campaigns", body: "Each content angle can have its own slug for easier review later." },
          ],
      detailSections: isVi
        ? [
            {
              title: "Rút gọn link không chỉ là bớt ký tự.",
              description: "Nếu link ngắn hơn nhưng người xem vẫn không hiểu mình sắp bấm vào đâu thì giá trị tăng thêm rất ít.",
              bullets: [
                "Slug nên có nghĩa thay vì chỉ là mã ngẫu nhiên.",
                "Title nên tiếp nối đúng điều người xem vừa đọc.",
                "Ảnh preview nên giúp card nhìn đáng bấm hơn ngay trên newsfeed.",
              ],
            },
            {
              title: "Tracking nên đi cùng link ngay từ đầu.",
              description: "Nếu bạn chỉ rút gọn cho đẹp mà không gắn cách đo click, bạn sẽ khó biết nội dung nào đang kéo traffic thật.",
              bullets: [
                "Gắn UTM hoặc tag từ lúc tạo link.",
                "Giữ mỗi chiến dịch hoặc mỗi bài quan trọng một link riêng.",
                "Xem lại click rồi sửa title, slug hoặc chỗ phân phối ở vòng sau.",
              ],
            },
          ]
        : [
            {
              title: "Shortening is not only about fewer characters.",
              description: "If the link is shorter but viewers still do not understand where it leads, the gain is limited.",
              bullets: [
                "The slug should mean something instead of being random code.",
                "The title should continue what the viewer just read.",
                "The preview image should make the card more clickable on the feed.",
              ],
            },
            {
              title: "Tracking should be attached from the start.",
              description: "If you shorten only for aesthetics and skip measurement, it becomes hard to know which content truly drives traffic.",
              bullets: [
                "Attach UTM parameters or tags when the link is created.",
                "Keep a separate link for each important campaign or post.",
                "Review the clicks and refine title, slug, or placement in the next round.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ cách rút gọn link Shopee." : "How to shorten Shopee links FAQ.",
      faqDescription: isVi ? "Các câu hỏi thường gặp khi muốn làm link Shopee gọn hơn nhưng vẫn đo được." : "Common questions about making Shopee links shorter without losing measurement.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "rut-gon-link-shopee",
        "landing-page-shopee",
        "tracking-click-affiliate",
        "pricing",
      ],
    },
    {
      key: "cach-rut-gon-link-tiktok",
      path: "/discover/cach-rut-gon-link-tiktok",
      title: isVi
        ? "Cách rút gọn link TikTok | Làm link bio gọn hơn và dễ nhớ hơn"
        : "How to shorten TikTok links | Make bio links cleaner and easier to remember",
      description: isVi
        ? "Tìm hiểu cách rút gọn link TikTok để dễ dùng trong bio, video điều hướng và vẫn giữ được preview lẫn tracking rõ ràng."
        : "Learn how to shorten TikTok links for bio usage, routing videos, while keeping preview and tracking clear.",
      keywords: [
        ...base.keywords,
        isVi ? "cách rút gọn link TikTok" : "how to shorten TikTok links",
        ...(isVi ? ["cach rut gon link TikTok", "cach rut gon link tiktok"] : []),
      ],
      heroEyebrow: isVi ? "Hướng dẫn TikTok" : "TikTok guide",
      heroTitle: isVi
        ? "Rút gọn link TikTok tốt là link người xem nhớ được ngay khi thấy trong bio."
        : "A good shortened TikTok link is one people can remember the moment they see it in the bio.",
      heroDescription: isVi
        ? "Bài này tập trung vào nhu cầu thật của TikTok: bio dễ đọc, link gọn, preview đủ rõ và vẫn theo dõi được theo creator hoặc chiến dịch."
        : "This guide focuses on real TikTok needs: readable bios, compact links, clear previews, and creator or campaign tracking.",
      summaryCards: isVi
        ? [
            { title: "Dễ đọc trong bio", body: "Link ngắn và rõ giúp người xem bớt lướt qua khi đang xem profile." },
            { title: "Dễ nhắc lại", body: "Slug dễ nhớ giúp creator đọc lại trong video hoặc caption." },
            { title: "Theo dõi theo creator", body: "Mỗi creator hoặc campaign có thể có link riêng để đo rõ hơn." },
          ]
        : [
            { title: "Readable in bios", body: "A cleaner link is easier to notice when people scan a profile." },
            { title: "Easy to repeat", body: "A memorable slug helps creators mention it in videos or captions." },
            { title: "Creator-level tracking", body: "Each creator or campaign can have a separate measurable link." },
          ],
      featureTitle: isVi ? "TikTok short link cần ưu tiên gì." : "What a TikTok short link should prioritize.",
      featureDescription: isVi
        ? "Khác với link cho newsfeed, link TikTok phải hợp với nhịp xem nhanh, bio ngắn và khả năng nhắc lại bằng miệng."
        : "Unlike feed links, TikTok links need to fit fast scanning, short bios, and verbal repetition.",
      featureItems: isVi
        ? [
            { title: "Slug ngắn nhưng rõ", body: "Ngắn thôi chưa đủ, người xem còn phải đọc được và nhớ được." },
            { title: "Preview đúng ngữ cảnh", body: "Ảnh hoặc video nên nối tiếp đúng kỳ vọng từ bio hoặc clip vừa xem." },
            { title: "Điều hướng mượt", body: "Người xem phải hiểu mình sẽ đi đến đâu sau khi bấm." },
          ]
        : [
            { title: "Short but readable slug", body: "Being shorter is not enough. People still need to read and remember it." },
            { title: "Context-matching preview", body: "Images or video should continue the expectation created by the bio or clip." },
            { title: "Smooth routing", body: "People should understand where they will land after clicking." },
          ],
      workflowTitle: isVi ? "3 bước rút gọn link TikTok." : "A 3-step TikTok short-link flow.",
      workflowDescription: isVi
        ? "Bắt đầu từ raw URL, rút gọn lại, rồi kiểm tra xem nó có thật sự hợp với bio và video hay chưa."
        : "Start from the raw URL, shorten it, then verify that it really fits the bio and video flow.",
      workflowSteps: isVi
        ? [
            "Dán link TikTok gốc hoặc link affiliate.",
            "Đặt slug ngắn, dễ đọc và bám đúng chủ đề hoặc creator.",
            "Kiểm tra preview rồi mới đưa link vào bio hoặc nội dung điều hướng.",
          ]
        : [
            "Paste the original TikTok or affiliate URL.",
            "Set a short readable slug tied to the creator or content angle.",
            "Check the preview before placing the link in the bio or routing content.",
          ],
      useCaseTitle: isVi ? "Khi bài này phù hợp." : "When this guide fits.",
      useCaseDescription: isVi
        ? "Hợp với người đang làm bio link, link cho creator hoặc cần rút gọn link TikTok để dùng lặp lại nhiều lần."
        : "Useful for people building bio links, creator links, or repeatable TikTok campaign links.",
      useCaseItems: isVi
        ? [
            { title: "Link bio cá nhân", body: "Dễ đọc hơn raw URL và nhìn gọn hơn trên profile." },
            { title: "Chiến dịch nhiều video", body: "Có thể tách riêng link theo từng nhóm video hoặc từng creator." },
          ]
        : [
            { title: "Personal bio links", body: "Cleaner than raw URLs and easier to scan on a profile." },
            { title: "Multi-video campaigns", body: "You can split links by video cluster or by creator." },
          ],
      detailSections: isVi
        ? [
            {
              title: "Link TikTok ngắn nhưng phải hợp môi trường bio.",
              description: "Một link nhìn ổn trong dashboard chưa chắc đã dễ đọc khi đặt vào bio hoặc nói bằng miệng trong video.",
              bullets: [
                "Ưu tiên slug ngắn, tránh từ quá dài hoặc khó phát âm.",
                "Giữ domain nhìn tự nhiên với bối cảnh người xem.",
                "Kiểm tra xem preview có tiếp nối đúng ngữ cảnh từ clip hay không.",
              ],
            },
            {
              title: "Đừng tách short link khỏi tracking.",
              description: "Rút gọn chỉ để dễ nhớ là chưa đủ. TikTok thường cần biết traffic đến từ creator nào hoặc clip nào.",
              bullets: [
                "Giữ mỗi creator một link nếu cần đo riêng.",
                "Dùng tag hoặc UTM khi có nhiều nguồn traffic.",
                "Xem lại link nào kéo tốt rồi nhân rộng ở vòng sau.",
              ],
            },
          ]
        : [
            {
              title: "A TikTok short link must fit the bio environment.",
              description: "A link that looks fine in a dashboard may still be hard to read inside a bio or say out loud in a video.",
              bullets: [
                "Prefer short slugs and avoid long or awkward wording.",
                "Keep the domain natural for the audience context.",
                "Check whether the preview continues the clip context correctly.",
              ],
            },
            {
              title: "Do not separate short links from tracking.",
              description: "Memorability alone is not enough. TikTok often requires knowing which creator or clip generated the traffic.",
              bullets: [
                "Keep one link per creator when separate measurement matters.",
                "Use tags or UTM parameters when multiple traffic sources exist.",
                "Review which links win and expand those in the next round.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ cách rút gọn link TikTok." : "How to shorten TikTok links FAQ.",
      faqDescription: isVi ? "Các câu hỏi thường gặp khi làm link bio hoặc link creator cho TikTok." : "Common questions when building bio or creator links for TikTok.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "rut-gon-link-tiktok",
        "landing-page-tiktok",
        "link-tiktok-affiliate",
        "tracking-click-affiliate",
      ],
    },
    {
      key: "cach-theo-doi-click-affiliate",
      path: "/discover/cach-theo-doi-click-affiliate",
      title: isVi
        ? "Cách theo dõi click affiliate | Đọc nguồn traffic và tối ưu link theo dữ liệu"
        : "How to track affiliate clicks | Read traffic sources and optimize links with data",
      description: isVi
        ? "Hướng dẫn cách theo dõi click affiliate để biết traffic đến từ đâu, link nào đang hiệu quả và nên sửa gì ở vòng tối ưu tiếp theo."
        : "Learn how to track affiliate clicks so you know where traffic comes from, which links work best, and what to change next.",
      keywords: [
        ...base.keywords,
        isVi ? "cách theo dõi click affiliate" : "how to track affiliate clicks",
        ...(isVi
          ? ["cach theo doi click affiliate", "theo doi click affiliate"]
          : []),
      ],
      heroEyebrow: isVi ? "Hướng dẫn tracking" : "Tracking guide",
      heroTitle: isVi
        ? "Theo dõi click affiliate có ích khi nó giúp bạn quyết định nên giữ, sửa hay bỏ link nào."
        : "Affiliate click tracking becomes useful when it tells you which links to keep, change, or stop using.",
      heroDescription: isVi
        ? "Bài này tập trung vào cách đọc nguồn traffic, tách từng link và biến dữ liệu click thành quyết định phân phối thực tế."
        : "This guide focuses on reading traffic sources, separating links, and turning click data into real distribution decisions.",
      summaryCards: isVi
        ? [
            { title: "Biết nguồn click", body: "Không chỉ biết có bao nhiêu click, mà biết click đến từ đâu." },
            { title: "Biết link nào hiệu quả", body: "Mỗi bề mặt phân phối có thể cho ra kết quả khác nhau." },
            { title: "Biết nên sửa gì", body: "Dữ liệu tốt phải dẫn đến thay đổi ở title, slug hoặc chỗ đặt link." },
          ]
        : [
            { title: "Know the source", body: "Not only how many clicks happened, but where they came from." },
            { title: "Know which link works", body: "Each distribution surface can produce different outcomes." },
            { title: "Know what to change", body: "Useful data should lead to changes in title, slug, or placement." },
          ],
      featureTitle: isVi ? "Theo dõi click affiliate nên trả lời điều gì." : "What affiliate click tracking should answer.",
      featureDescription: isVi
        ? "Một dashboard đẹp chưa đủ. Phần quan trọng là bạn có nhìn ra được link nào đang kéo đúng traffic hay không."
        : "A pretty dashboard is not enough. The key is whether you can identify which links are attracting the right traffic.",
      featureItems: isVi
        ? [
            { title: "Nguồn traffic nào đang tốt", body: "So sánh bio, bài đăng, comment, group hoặc creator để biết chỗ nào đáng đẩy tiếp." },
            { title: "Link nào đang yếu", body: "Có những link có click nhưng không tạo ra giá trị bằng các link còn lại." },
            { title: "Vòng tối ưu tiếp theo", body: "Sau khi xem dữ liệu, bạn phải biết nên sửa title, slug hay đổi bề mặt phân phối." },
          ]
        : [
            { title: "Which traffic source is winning", body: "Compare bios, posts, comments, groups, or creators to see what deserves more push." },
            { title: "Which links are weak", body: "Some links get clicks but still underperform compared with the rest." },
            { title: "What the next optimization loop is", body: "After reviewing the data, you should know whether to change title, slug, or placement." },
          ],
      workflowTitle: isVi ? "3 bước theo dõi click affiliate." : "A 3-step affiliate click tracking flow.",
      workflowDescription: isVi
        ? "Tạo link có cấu trúc, mang đi phân phối, rồi xem lại dữ liệu theo nguồn để tối ưu vòng sau."
        : "Create structured links, distribute them, then review source-level data to improve the next round.",
      workflowSteps: isVi
        ? [
            "Tạo từng link với slug, UTM hoặc tag rõ ràng.",
            "Đưa từng link lên đúng bề mặt như bio, post, comment hoặc creator.",
            "Đọc lại dữ liệu click theo nguồn rồi giữ hoặc sửa link tương ứng.",
          ]
        : [
            "Create each link with clear slugs, UTM parameters, or tags.",
            "Place each link on the intended surface such as bio, posts, comments, or creator channels.",
            "Review click data by source and keep or revise the corresponding links.",
          ],
      useCaseTitle: isVi ? "Khi bài này đáng đọc." : "When this guide is worth reading.",
      useCaseDescription: isVi
        ? "Hợp khi bạn đã có vài link đang chạy thật và muốn biết nên dồn traffic vào đâu thay vì đoán theo cảm giác."
        : "Useful when you already have live links and want to know where to concentrate traffic instead of guessing.",
      useCaseItems: isVi
        ? [
            { title: "Nhiều kênh cùng chạy", body: "Cần biết post, comment hay bio đang kéo tốt hơn." },
            { title: "Nhiều biến thể nội dung", body: "Mỗi góc nội dung nên có link riêng để đọc dữ liệu cho chính xác." },
          ]
        : [
            { title: "Many channels running together", body: "You need to know whether posts, comments, or bios are pulling better." },
            { title: "Many content angles", body: "Each content angle should have its own link for cleaner reading." },
          ],
      detailSections: isVi
        ? [
            {
              title: "Tracking chỉ có ích khi tách được từng nguồn.",
              description: "Nếu mọi traffic đều đổ vào một link chung, bạn sẽ rất khó biết chính xác điều gì đang hoạt động.",
              bullets: [
                "Tách link theo kênh hoặc theo chiến dịch quan trọng.",
                "Gắn tag để dễ lọc và so sánh lại sau.",
                "Đừng chờ quá lâu mới nhìn dữ liệu, vì lúc đó sửa sẽ chậm hơn.",
              ],
            },
            {
              title: "Xem dữ liệu xong phải có hành động.",
              description: "Mục tiêu cuối cùng không phải là có thêm biểu đồ, mà là biết link nào nên nhân rộng và link nào nên bỏ.",
              bullets: [
                "Giữ lại link có nguồn traffic chất lượng.",
                "Sửa title hoặc preview nếu link có click nhưng CTR chưa tốt.",
                "Bỏ hoặc gộp các link chỉ tạo nhiễu mà không thêm giá trị.",
              ],
            },
          ]
        : [
            {
              title: "Tracking only helps when sources are separated.",
              description: "If all traffic lands on one shared link, it becomes much harder to know what is truly working.",
              bullets: [
                "Split links by channel or by important campaign.",
                "Attach tags so the data is easier to filter later.",
                "Do not wait too long before reviewing the data, or changes become slower.",
              ],
            },
            {
              title: "Data review should lead to action.",
              description: "The final goal is not more charts. It is knowing which links to expand and which ones to stop using.",
              bullets: [
                "Keep the links that attract higher-quality traffic.",
                "Refine title or preview if clicks exist but CTR is weak.",
                "Remove or merge links that only add noise.",
              ],
            },
          ],
      faqTitle: isVi ? "FAQ cách theo dõi click affiliate." : "How to track affiliate clicks FAQ.",
      faqDescription: isVi ? "Các câu hỏi hay gặp khi muốn đọc dữ liệu click rõ hơn." : "Common questions about reading affiliate click data more clearly.",
      faqItems: commonFaq,
      relatedPageKeys: [
        "tracking-click-affiliate",
        "pricing",
        "rut-gon-link-shopee",
        "rut-gon-link-tiktok",
      ],
    },
  ];

  return pages;
};

export const PUBLIC_PAGE_PATHS = [
  "/",
  "/discover/pricing",
  "/discover/install",
  "/discover/faq",
  "/discover/landing-page-shopee",
  "/discover/landing-page-tiktok",
  "/discover/rut-gon-link-shopee",
  "/discover/rut-gon-link-tiktok",
  "/discover/tracking-click-affiliate",
  "/discover/link-tiktok-affiliate",
  "/discover/cach-rut-gon-link-shopee",
  "/discover/cach-rut-gon-link-tiktok",
  "/discover/cach-theo-doi-click-affiliate",
] as const;

export function getPublicPages(locale: Locale) {
  return buildPagesForLocale(locale);
}

export function resolvePublicPage(
  locale: Locale,
  pathname: string,
): PublicPageContent {
  const normalizedPath =
    pathname === "/" ? "/" : pathname.replace(/\/+$/, "").toLowerCase();
  const pages = getPublicPages(locale);
  return (
    pages.find((page) => page.path.toLowerCase() === normalizedPath) || pages[0]
  );
}

export function buildPublicPageStructuredData(
  origin: string,
  locale: Locale,
  page: PublicPageContent,
) {
  const inLanguage = locale === "vi" ? "vi-VN" : "en-US";
  const pageUrl = new URL(page.path, origin).toString();
  const imageUrl = new URL(
    PUBLIC_SEO_CONTENT[locale].ogImagePath,
    origin,
  ).toString();
  const logoUrl = new URL("/logo-app-512.png", origin).toString();

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: PUBLIC_SEO_CONTENT[locale].siteName,
      url: new URL("/", origin).toString(),
      logo: logoUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      url: pageUrl,
      description: page.description,
      inLanguage,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: PUBLIC_SEO_CONTENT[locale].siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage,
      url: pageUrl,
      image: imageUrl,
      description: page.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage,
      mainEntity: page.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}
