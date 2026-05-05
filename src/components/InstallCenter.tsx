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
    title: "Mo trang quan ly extension",
    body: "Dung Chrome: chrome://extensions. Dung Coc Coc: coccoc://extensions.",
  },
  {
    title: "Bat Che do nha phat trien",
    body: "Bat Developer mode de trinh duyet cho phep nap ban extension local.",
  },
  {
    title: "Nap thu muc extension/",
    body: "Bam Tai tien ich da giai nen va tro toi thu muc extension trong project.",
  },
  {
    title: "Ghim extension len thanh cong cu",
    body: "Ghim HotsNew Quick Link de lay link tab hien tai nhanh hon.",
  },
];

const extensionBenefits = [
  "Lay link TikTok/Shopee ngay tren tab dang xem",
  "Right-click vao link de gui URL sang HotsNew",
  "Mo thang man tao link voi URL da duoc dien san",
  "Neu HotsNew da mo san, extension se focus lai tab do",
];

const troubleshooting = [
  "Khong thay nut Cai app: mo site bang Chrome/Coc Coc ban moi nhat roi thu lai.",
  "Khong nap duoc extension: kiem tra ban da chon dung thu muc extension/ chua.",
  "Popup extension khong lay duoc link: dam bao tab hien tai la TikTok hoac Shopee.",
  "Cap nhat extension local: vao trang extensions va bam Reload sau khi sua code.",
];

const browserLinks = [
  { label: "Chrome extensions", value: "chrome://extensions" },
  { label: "Coc Coc extensions", value: "coccoc://extensions" },
  { label: "Thu muc extension", value: "extension/" },
];

function CopyChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
      <Copy size={14} className={copied ? "text-emerald-500" : "text-orange-500"} />
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
          Cai app / Extension
        </div>
        <div className="max-w-4xl space-y-3">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100 md:text-4xl">
            Cai 1 lan, lay link nhanh hon moi ngay
          </h2>
          <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
            Tab nay duoc lam lai theo huong thuc dung: co lo trinh cai app,
            cai extension, copy nhanh duong dan, va checklist de user tu cai
            xong trong vai phut.
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
                Cai app HotsNew
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Phu hop khi can mo dashboard nhu app rieng, ghim ra desktop,
                vao nhanh bang 1 cham tren mobile, hoac dung full-screen de van
                hanh lien tuc.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className={isInstalled ? "mt-0.5 text-emerald-500" : "mt-0.5 text-orange-500"}
              />
              <div className="text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300">
                {isInstalled
                  ? "App da duoc cai tren thiet bi nay. Ban co the mo nhu mot app rieng ma khong can vao lai trinh duyet."
                  : canInstall
                    ? "Trinh duyet hien tai dang ho tro cai app truc tiep. Bam nut ben duoi de cai ngay."
                    : "Neu chua thay nut cai, hay mo site bang Chrome/Coc Coc ban moi hon, vao menu trinh duyet va chon Cai dat ung dung."}
              </div>
            </div>

            <InstallAppButton />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                  Desktop
                </p>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  Mo nhanh dashboard, tach khoi browser, phu hop cho user van
                  hanh nhieu link moi ngay.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[11px] font-black uppercase tracking-widest text-orange-500">
                  Mobile
                </p>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-slate-300">
                  Ghim ra man hinh chinh de mo thang HotsNew nhu app, khong can
                  tim lai trong browser.
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
                Cai extension trinh duyet
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500 dark:text-slate-400">
                Danh cho user can rut gon link ngay trong luc dang xem TikTok,
                Shopee, hoac can right-click de gui URL sang HotsNew.
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
              <CopyChip key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[2.25rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <Sparkles size={20} className="text-orange-500" />
          <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">
            Extension se giup gi sau khi cai
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {extensionBenefits.map((benefit) => (
            <div
              key={benefit}
              className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-900/70"
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
              Neu bi loi khi cai
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
              Nhanh tay bat dau
            </h3>
          </div>

          <div className="space-y-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl bg-gray-900 px-5 py-4 text-sm font-black text-white transition-all hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <span>Mo HotsNew trong tab moi</span>
              <ExternalLink size={16} />
            </a>

            <div className="rounded-[1.75rem] border border-orange-100 bg-orange-50/70 p-5 dark:border-orange-500/20 dark:bg-orange-500/10">
              <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-300">
                Goi y workflow
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  1. Cai app neu ban mo dashboard thuong xuyen.
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  2. Cai extension neu ban lay link ngay tren TikTok/Shopee.
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  3. Ghim extension + ghim app de toi uu thao tac hang ngay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
