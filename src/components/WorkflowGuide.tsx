import React from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Link2,
  PlayCircle,
  Route,
  Settings2,
} from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";
import { Tab } from "@/src/types";

interface WorkflowGuideProps {
  onSelectTab?: (tab: Tab) => void;
}

export const WorkflowGuide = ({ onSelectTab }: WorkflowGuideProps) => {
  const { locale } = useLocale();
  const isVi = locale === "vi";

  const hero = isVi
    ? {
        badge: "Hướng dẫn sử dụng",
        title: "Hiểu luồng tạo link trước khi chạy thật.",
        description:
          "Trang này giải thích đúng luồng mà app đang xử lý: tạo xong thì link mở thẳng hay qua landing page, khi nào có bước 2, và mỗi ô trong form tạo link dùng để làm gì.",
        primaryAction: "Mở tab Tạo liên kết",
        secondaryAction: "Mở Danh sách liên kết",
      }
    : {
        badge: "Usage guide",
        title: "Understand the link flow before you run it live.",
        description:
          "This page explains the real app behavior: when a link opens directly, when it goes through a landing page, when step 2 appears, and what each field in the create form actually controls.",
        primaryAction: "Open Create tab",
        secondaryAction: "Open Link List",
      };

  const flowModes = isVi
    ? [
        {
          title: "Luồng 1: Link mở thẳng",
          eyebrow: "Không có video",
          summary:
            "Nếu bạn chỉ tạo link gốc và không gắn video, người dùng bấm vào short link sẽ nhảy thẳng đến link chính.",
          steps: [
            "Người dùng mở short link.",
            "Hệ thống redirect trực tiếp đến link gốc.",
            "Không hiện landing page trung gian.",
          ],
          note: "Hợp cho trường hợp cần đi thẳng, ít bước thao tác.",
          icon: Link2,
          tone: "from-sky-500/15 via-sky-400/5 to-transparent",
        },
        {
          title: "Luồng 2: Landing page 1 bước",
          eyebrow: "Có video hoặc ảnh",
          summary:
            "Nếu có media hiển thị, short link sẽ mở trang trung gian. User xem nội dung xong bấm để đi đến link gốc.",
          steps: [
            "Người dùng mở short link.",
            "App hiện trang trung gian với tiêu đề, mô tả, ảnh/video.",
            "User bấm hành động chính để mở link gốc.",
          ],
          note: "Hợp khi bạn muốn tạo cái nhìn giống bài đăng và giữ user ở lại lâu hơn.",
          icon: PlayCircle,
          tone: "from-orange-500/15 via-amber-400/5 to-transparent",
        },
        {
          title: "Luồng 3: Bảo vệ 2 bước",
          eyebrow: "Có video + link bước 2",
          summary:
            "Link bước 2 chỉ bật khi bạn đã có video. Luồng này giúp user đi qua link chính trước, sau đó mở thêm một điểm đến tiếp theo trong cùng flow.",
          steps: [
            "Người dùng mở short link và thấy trang trung gian.",
            "Lần bấm đầu tiên đi theo luồng chính / mở link gốc.",
            "Sau đó user tiếp tục trên trang trung gian để mở bước 2 sang link phụ.",
          ],
          note: "Dùng khi bạn cần luồng 2 điểm đến: ví dụ Shopee trước, rồi thêm TikTok hoặc một link Shopee phụ.",
          icon: GitBranch,
          tone: "from-emerald-500/15 via-cyan-400/5 to-transparent",
        },
      ]
    : [
        {
          title: "Flow 1: Direct link",
          eyebrow: "No video",
          summary:
            "If you only create the primary destination and do not attach video, the short link opens the primary URL directly.",
          steps: [
            "User opens the short link.",
            "The system redirects straight to the primary URL.",
            "No landing page is rendered.",
          ],
          note: "Best when you want the shortest path with minimal friction.",
          icon: Link2,
          tone: "from-sky-500/15 via-sky-400/5 to-transparent",
        },
        {
          title: "Flow 2: One-step landing page",
          eyebrow: "With image or video",
          summary:
            "If media is attached, the short link opens a landing page first. The user then clicks through to the primary URL.",
          steps: [
            "User opens the short link.",
            "The app shows an intermediate page with title, description, and media.",
            "User clicks the main action to open the primary URL.",
          ],
          note: "Useful when you want a post-like preview and better context before the click.",
          icon: PlayCircle,
          tone: "from-orange-500/15 via-amber-400/5 to-transparent",
        },
        {
          title: "Flow 3: Two-step protected flow",
          eyebrow: "Video + step 2 link",
          summary:
            "Step 2 is only available when video is present. This lets the user pass through the main destination first, then continue to another destination in the same flow.",
          steps: [
            "User opens the short link and lands on the preview page.",
            "The first action follows the main flow / primary destination.",
            "The user can then continue and open step 2 as the secondary destination.",
          ],
          note: "Useful when you want two destinations, for example Shopee first and TikTok or another Shopee link after that.",
          icon: GitBranch,
          tone: "from-emerald-500/15 via-cyan-400/5 to-transparent",
        },
      ];

  const createSteps = isVi
    ? [
        {
          title: "1. Dán link gốc",
          detail:
            "Đây là điểm đến chính. Nếu không có video, short link sẽ đi thẳng đến đây.",
          icon: Link2,
        },
        {
          title: "2. Thêm tiêu đề, mô tả, ảnh/video",
          detail:
            "Media quyết định việc có hiện landing page trung gian hay không. Có video/ảnh thì user sẽ thấy trang preview.",
          icon: PlayCircle,
        },
        {
          title: "3. Mở Cài đặt nâng cao nếu cần",
          detail:
            "Tại đây bạn thêm UTM, affiliate, thư mục, nhãn, hết hạn, bước 2 và A/B testing.",
          icon: Settings2,
        },
        {
          title: "4. Nếu dùng bước 2, phải có video trước",
          detail:
            "Không có video thì app không cho bật link bước 2. Nếu bước 2 là Shopee, nó phải hợp lệ theo rule của app.",
          icon: GitBranch,
        },
        {
          title: "5. Bấm Rút gọn liên kết",
          detail:
            "Hệ thống tạo short link, slug đẹp, lưu thông tin tracking và cho phép bạn copy QR ngay.",
          icon: Route,
        },
        {
          title: "6. Kiểm tra lại luồng thật",
          detail:
            "Sau khi tạo, hãy tự bấm thử short link để xem nó đi thẳng, mở landing page, hay chạy theo luồng 2 bước đúng như bạn mong muốn.",
          icon: CheckCircle2,
        },
      ]
    : [
        {
          title: "1. Paste the primary link",
          detail:
            "This is the main destination. Without video, the short link goes here immediately.",
          icon: Link2,
        },
        {
          title: "2. Add title, description, and image/video",
          detail:
            "Media determines whether the app renders a landing page before the destination.",
          icon: PlayCircle,
        },
        {
          title: "3. Open advanced settings if needed",
          detail:
            "This is where you add UTM, affiliate params, folder, tags, expiry, step 2, and A/B testing.",
          icon: Settings2,
        },
        {
          title: "4. Step 2 requires video first",
          detail:
            "Without video, the app does not enable the secondary step flow. If step 2 is Shopee, it must match the app rules.",
          icon: GitBranch,
        },
        {
          title: "5. Click Create short link",
          detail:
            "The system generates the short link, pretty slug, tracking data, and lets you copy the QR code immediately.",
          icon: Route,
        },
        {
          title: "6. Test the real flow",
          detail:
            "After creating the link, open it yourself to confirm whether it goes direct, opens a landing page, or follows the 2-step flow you intended.",
          icon: CheckCircle2,
        },
      ];

  const fieldNotes = isVi
    ? [
        {
          label: "Link gốc",
          value: "Điểm đến chính mà user sẽ tới.",
        },
        {
          label: "Ảnh / video",
          value: "Bật trang trung gian và tăng khả năng giữ user trên preview.",
        },
        {
          label: "Link bước 2",
          value: "Chỉ dùng được khi đã có video; phục vụ luồng 2 điểm đến.",
        },
        {
          label: "UTM / Affiliate",
          value: "Gắn tracking marketing và tham số affiliate vào luồng click.",
        },
        {
          label: "A/B testing",
          value: "Chia traffic giữa 2 biến thể nếu gói của bạn hỗ trợ.",
        },
        {
          label: "Hết hạn / thư mục / nhãn",
          value: "Dùng để quản lý chiến dịch và vòng đời của từng link.",
        },
      ]
    : [
        {
          label: "Primary link",
          value: "The main destination the user should reach.",
        },
        {
          label: "Image / video",
          value: "Enables the preview landing page and keeps the user in context longer.",
        },
        {
          label: "Step 2 link",
          value: "Only available when video exists; used for a two-destination flow.",
        },
        {
          label: "UTM / Affiliate",
          value: "Adds marketing tracking and affiliate parameters to the click flow.",
        },
        {
          label: "A/B testing",
          value: "Splits traffic between two variants when your plan supports it.",
        },
        {
          label: "Expiry / folder / tags",
          value: "Helps you manage campaigns and each link lifecycle.",
        },
      ];

  const example = isVi
    ? {
        title: "Ví dụ để nhớ nhanh",
        description:
          "Bạn tạo một link có video, link gốc là Shopee, link bước 2 là TikTok. Khi user mở short link, họ thấy landing page. Sau thao tác chính, user đi theo luồng đến link gốc. Nếu bạn đang dùng luồng 2 bước, user có thể tiếp tục để mở thêm link bước 2.",
      }
    : {
        title: "Quick example",
        description:
          "You create a link with video, set the primary URL to Shopee, and the step 2 URL to TikTok. When the user opens the short link, they first see the landing page. After the main action, they follow the primary flow. If the 2-step flow is enabled, they can continue and open the secondary destination afterward.",
      };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_28%)]" />

      <section className="overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#f8fafc_100%)] p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-[linear-gradient(135deg,#111827_0%,#0f172a_52%,#111827_100%)] md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
              <BookOpen size={14} />
              {hero.badge}
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              {hero.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 md:text-base">
              {hero.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onSelectTab?.("create")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700"
            >
              <Route size={16} />
              {hero.primaryAction}
            </button>
            <button
              onClick={() => onSelectTab?.("list")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ExternalLink size={16} />
              {hero.secondaryAction}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            {isVi ? "Luồng sau khi mở link" : "After opening the link"}
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {isVi
              ? "Người dùng sẽ bị dẫn đi đâu?"
              : "Where does the user go next?"}
          </h3>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {flowModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <article
                key={mode.title}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-br ${mode.tone}`}
                />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        {mode.eyebrow}
                      </p>
                      <h4 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
                        {mode.title}
                      </h4>
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                    {mode.summary}
                  </p>

                  <div className="mt-5 space-y-3">
                    {mode.steps.map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-black text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
                          {index + 1}
                        </div>
                        <p className="text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {mode.note}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200">
              <Settings2 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                {isVi ? "Luồng tạo link" : "Create flow"}
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                {isVi
                  ? "Điền form theo thứ tự này"
                  : "Fill the form in this order"}
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {createSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                      <Icon size={18} />
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h4>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <div className="space-y-8">
          <article className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              {isVi ? "Ý nghĩa từng ô" : "What each field means"}
            </p>
            <div className="mt-5 space-y-3">
              {fieldNotes.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                        {item.value}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-orange-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_60%,#f0fdf4_100%)] p-6 shadow-sm dark:border-emerald-500/20 dark:bg-[linear-gradient(135deg,#052e16_0%,#0f172a_58%,#052e16_100%)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {example.title}
              </h3>
            </div>
            <p className="mt-4 text-sm font-medium leading-7 text-slate-700 dark:text-slate-200">
              {example.description}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
};
