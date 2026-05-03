import {
  CheckCircle2,
  Download,
  ExternalLink,
  MousePointerClick,
  Puzzle,
  Smartphone,
} from "lucide-react";
import { InstallAppButton } from "@/src/components/common/InstallAppButton";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

const extensionSteps = [
  "Mở trang quản lý extension của trình duyệt: chrome://extensions hoặc coccoc://extensions.",
  "Bật Chế độ nhà phát triển.",
  "Chọn Tải tiện ích đã giải nén và trỏ tới thư mục extension trong project này.",
  "Ghim HotsNew Quick Link lên thanh công cụ để lấy link nhanh.",
];

const quickActions = [
  "Right-click vào link hoặc ngay trên trang TikTok/Shopee để gửi URL sang HotsNew.",
  "Bấm icon extension để lấy link tab hiện tại, copy nhanh hoặc mở thẳng màn tạo link.",
  "Nếu HotsNew đang mở sẵn, extension sẽ focus lại tab đó thay vì mở tab mới liên tục.",
];

export function InstallCenter() {
  const { canInstall, isInstalled } = usePWAInstall();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
          <Download size={14} />
          Cài app / Extension
        </div>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100 md:text-4xl">
          Cài nhanh để lấy link ngay trên TikTok và Shopee
        </h2>
        <p className="max-w-3xl text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
          Tab này gom toàn bộ chỗ cài đặt. Người dùng có thể cài app web để mở
          nhanh từ desktop/mobile, đồng thời nạp extension để lấy link bằng
          right-click hoặc popup ngay trên trình duyệt.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
              <Smartphone size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                Cài app HotsNew
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Dùng khi cần mở dashboard như app riêng, ghim ra desktop hoặc
                dùng full-screen trên mobile.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2
                size={18}
                className={isInstalled ? "text-emerald-500" : "text-orange-500"}
              />
              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                {isInstalled
                  ? "App đã được cài trên thiết bị này."
                  : canInstall
                    ? "Trình duyệt hiện hỗ trợ cài app trực tiếp."
                    : "Nếu nút cài chưa hiện, mở site bằng Chrome/Cốc Cốc rồi dùng menu Cài đặt ứng dụng."}
              </span>
            </div>

            <InstallAppButton />
          </div>
        </section>

        <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Puzzle size={26} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
                Cài extension trình duyệt
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Phù hợp khi cần lấy link TikTok/Shopee nhanh ngay trên tab đang
                xem.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {extensionSteps.map((step) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />
                <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-slate-300">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <MousePointerClick size={20} className="text-orange-500" />
          <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
            Sau khi cài xong, extension làm được gì
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <div
              key={action}
              className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-slate-300">
                {action}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Mở HotsNew
            <ExternalLink size={14} />
          </a>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-xs font-bold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
            Thư mục extension: <code>extension/</code>
          </span>
        </div>
      </section>
    </div>
  );
}
