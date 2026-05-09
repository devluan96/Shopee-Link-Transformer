import { Download, ExternalLink, Monitor, MonitorDown, Sparkles } from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

export function InstallCenter() {
  const { messages } = useLocale();
  const copy = messages.installCenter;
  const { canInstall, isInstalled, isInstalling, install } = usePWAInstall();
  const desktopHref = import.meta.env.VITE_DESKTOP_APP_URL ?? "";

  const primaryAction = desktopHref ? (
    <a
      href={desktopHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-w-[250px] items-center justify-between gap-4 rounded-[1.2rem] bg-[#111827] px-5 py-4 text-sm font-black text-white shadow-[0_18px_45px_-24px_rgba(17,24,39,0.7)] transition-all hover:-translate-y-0.5 hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
    >
      <span>{copy.platforms.actions.desktopDownload}</span>
      <ExternalLink size={18} />
    </a>
  ) : canInstall ? (
    <button
      type="button"
      onClick={() => void install()}
      disabled={isInstalling}
      className="inline-flex min-w-[250px] items-center justify-between gap-4 rounded-[1.2rem] bg-[linear-gradient(135deg,#f97316,#ea580c)] px-5 py-4 text-sm font-black text-white shadow-[0_22px_50px_-26px_rgba(249,115,22,0.82)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span>
        {isInstalling
          ? messages.common.installApp.installing
          : copy.platforms.actions.installHere}
      </span>
      <Download size={18} />
    </button>
  ) : (
    <div className="inline-flex min-w-[250px] items-center justify-between gap-4 rounded-[1.2rem] border border-dashed border-slate-300 bg-white/75 px-5 py-4 text-sm font-bold text-slate-500 backdrop-blur dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-400">
      <span>{copy.platforms.actions.unavailable}</span>
      <ExternalLink size={18} />
    </div>
  );

  const statusLabel = isInstalled
    ? copy.status.labels.installed
    : canInstall
      ? copy.status.labels.ready
      : copy.status.labels.menu;

  const statusDescription = isInstalled
    ? copy.status.descriptions.installed
    : canInstall
      ? copy.status.descriptions.ready
      : copy.status.descriptions.menu;

  const helperText = desktopHref
    ? copy.platforms.hints.direct
    : canInstall
      ? copy.platforms.hints.fallback
      : copy.platforms.hints.configure;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="relative overflow-hidden rounded-[2.6rem] border border-white/60 bg-[radial-gradient(circle_at_left_top,rgba(250,204,21,0.28),transparent_28%),radial-gradient(circle_at_right_center,rgba(249,115,22,0.18),transparent_24%),linear-gradient(120deg,rgba(255,250,240,0.97),rgba(255,255,255,0.94))] p-6 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_left_top,rgba(251,191,36,0.12),transparent_22%),radial-gradient(circle_at_right_center,rgba(249,115,22,0.14),transparent_24%),linear-gradient(120deg,rgba(15,23,42,0.98),rgba(30,41,59,0.95))] md:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.14),rgba(255,255,255,0.14))] dark:bg-[linear-gradient(0deg,rgba(15,23,42,0.14),rgba(15,23,42,0.14))]" />
        <div className="absolute -left-10 top-16 h-52 w-52 rounded-full bg-yellow-200/35 blur-3xl dark:bg-yellow-400/10" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl dark:bg-orange-500/10" />

        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-600 backdrop-blur dark:border-orange-500/20 dark:bg-slate-900/70 dark:text-orange-300">
              <Sparkles size={14} />
              {copy.badge}
            </div>

            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-6xl md:leading-[1.02]">
                {copy.title}
              </h2>
              <p className="max-w-2xl text-base font-medium leading-8 text-slate-600 dark:text-slate-300">
                {copy.description}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                {copy.platforms.desktop.badge}
              </p>
              <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-4xl">
                {copy.platforms.desktop.title}
              </h3>
              <p className="max-w-xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                {copy.platforms.desktop.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:w-fit">
              {primaryAction}
              <div className="rounded-[1.1rem] border border-white/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                {helperText}
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[560px]">
              <div className="absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_58%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_58%)]" />

              <div className="relative ml-auto w-full max-w-[520px] rounded-[2.4rem] border border-white/70 bg-white/70 p-5 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/75">
                <div className="rounded-[2rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff)] p-5 dark:bg-[linear-gradient(145deg,#111827,#0f172a)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#f97316,#fb923c)] text-white shadow-[0_16px_35px_-20px_rgba(249,115,22,0.85)]">
                        <MonitorDown size={26} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-slate-400 dark:text-slate-500">
                          {copy.status.eyebrow}
                        </p>
                        <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                          Windows
                        </h3>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {statusLabel}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.7rem] border border-slate-200/80 bg-white/85 p-5 dark:border-slate-700 dark:bg-slate-900/65">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                        <Monitor size={20} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">
                          {copy.platforms.actions.desktopDownload}
                        </p>
                        <p className="text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                          {statusDescription}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {copy.highlights.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/50"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {item.label}
                          </p>
                          <p className="mt-2 text-lg font-black text-slate-950 dark:text-slate-50">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        {copy.flow.preview.actionLabel}
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950 dark:text-slate-50">
                        {copy.flow.preview.actionValue}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/50">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        {copy.flow.preview.accessLabel}
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950 dark:text-slate-50">
                        {copy.flow.preview.accessValue}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
