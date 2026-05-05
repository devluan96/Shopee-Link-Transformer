import React from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  MousePointerClick,
  Puzzle,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { InstallAppButton } from "@/src/components/common/InstallAppButton";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

const extensionSteps = [
  {
    title: "Mở trang quản lý extension",
    body: "Dùng chrome://extensions. Dùng Cốc Cốc: coccoc://extensions.",
  },
  {
    title: "Bật chế độ nhà phát triển",
    body: "Bật Developer mode để trình duyệt cho phép tải bản extension local.",
  },
  {
    title: "Nạp thư mục extension/",
    body: "Bấm Nạp extension và chọn thư mục extension trong project.",
  },
  {
    title: "Ghim extension lên thanh công cụ",
    body: "Ghim HotsNew Quick Link để lấy link tab hiện tại nhanh hơn.",
  },
];

const extensionBenefits = [
  "Lấy link TikTok/Shopee ngay trên tab đang xem",
  "Right-click vào link để gửi thẳng sang HotsNew mà không cần copy-paste",
  "Mở thẳng màn tạo link mà không cần vào dashboard",
  "Nếu HotsNew đã mở sẵn extension, extension sẽ focus lại tab đó thay vì mở tab mới",
];

const troubleshooting = [
  "Không thấy nút Cài app: mở site bằng Chrome/Coc Coc bản mới nhất rồi thử lại.",
  "Không nạp được extension: kiểm tra bạn đã chọn đúng thư mục extension/ chưa.",
  "Popup extension không lấy được link: đảm bảo tab hiện tại là TikTok hoặc Shopee.",
  "Cập nhật extension local: vào trang extensions và bấm Reload sau khi sửa code.",
];

const browserLinks = [
  { label: "Chrome extensions", value: "chrome://extensions" },
  { label: "Cốc Cốc extensions", value: "coccoc://extensions" },
  { label: "Thư mục extension", value: "extension/" },
];

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left text-xs font-bold text-gray-700 transition-all hover:border-orange-200 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-500/20 dark:hover:bg-slate-800"
    >
      <Copy
        size={14}
        className={copied ? "text-emerald-500" : "text-orange-500"}
      />
      <span className="font-black">{label}:</span>
      <code className="truncate text-[11px]">{copied ? "Da copy" : value}</code>
    </button>
  );
}

export function InstallCenter() {
  const { canInstall, isInstalled } = usePWAInstall();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
          <Download size={14} />
          Cài app / Extension
        </div>
        <div className="max-w-4xl space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100 md:text-4xl">
            Cài 1 lần, lấy link nhanh hơn mỗi ngày
          </h2>
          <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
            Tab này được làm lại theo hướng thực dụng: có lộ trình cài app, cài
            extension, copy nhanh đường dẫn, và checklist để người dùng tự cài
            xong trong vài phút.
          </p>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
              <Smartphone size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                Cài app HotsNew
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Phù hợp khi cần mở dashboard như app riêng, ghim ra desktop, vào
                nhanh bằng 1 chạm trên mobile, hoặc dùng full-screen để vận hành
                liên tục.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className={
                  isInstalled
                    ? "mt-0.5 text-emerald-500"
                    : "mt-0.5 text-orange-500"
                }
              />
              <div className="text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300">
                {isInstalled
                  ? "App đã được cài trên thiết bị này. Bạn có thể mở như một app riêng mà không cần vào lại trình duyệt."
                  : canInstall
                    ? "Trình duyệt hiện tại đang hỗ trợ cài app trực tiếp. Bấm nút bên dưới để cài ngay."
                    : "ếu chưa thấy nút cài, hãy mở site bằng Chrome/Coc Coc bản mới hơn, vào menu trình duyệt và chọn Cài đặt ứng dụng."}
              </div>
            </div>

            <InstallAppButton />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                  Desktop
                </p>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  Mở nhanh dashboard, tách khỏi browser, phù hợp cho user vận
                  hành nhiều link mỗi ngày.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                  Mobile
                </p>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  Ghim ra màn hình chính để mở HotsNew như app, không cần tìm
                  lại trong browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Puzzle size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                Cài extension trinh duyệt
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Dành cho user cần rút gọn link ngay trong lúc đang xem TikTok,
                Shopee, hoặc cần right-click để gửi URL sang HotsNew.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {extensionSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-[11px] font-black text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-slate-100">
                    {step.title}
                  </p>
                </div>
                <p className="pl-10 text-sm font-medium leading-relaxed text-gray-600 dark:text-slate-300">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3">
            {browserLinks.map((item) => (
              <CopyChip
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <Sparkles size={20} className="text-orange-500" />
          <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
            Extension sẽ giúp gì sau khi cài đặt
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {extensionBenefits.map((benefit) => (
            <div
              key={benefit}
              className="rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="mb-3 inline-flex rounded-full bg-orange-50 p-2 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                <MousePointerClick size={16} />
              </div>
              <p className="text-sm font-bold leading-relaxed text-gray-700 dark:text-slate-300">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
              Nếu có lỗi khi cài đặt
            </h3>
          </div>

          <div className="space-y-3">
            {troubleshooting.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm font-medium leading-relaxed text-gray-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <FolderOpen size={20} className="text-blue-500" />
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
              Nhanh tay bắt đầu thôi!
            </h3>
          </div>

          <div className="space-y-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-sm font-black text-white transition-all hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <span>Mở HotsNew trong tab mới</span>
              <ExternalLink size={16} />
            </a>

            <div className="rounded-[1.75rem] border border-orange-100 bg-orange-50/70 p-5 dark:border-orange-500/20 dark:bg-orange-500/10">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-300">
                Gợi ý workflow
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  1. Cài app nếu bạn mở dashboard thường xuyên.
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  2. Cài extension nếu bạn lấy link ngay trên TikTok/Shopee.
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  3. Ghim extension + ghim app để tối ưu thao tác hàng ngày.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
