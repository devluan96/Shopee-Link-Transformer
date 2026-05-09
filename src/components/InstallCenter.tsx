import React from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Zap,
} from "lucide-react";
import { InstallAppButton } from "@/src/components/common/InstallAppButton";
import { useLocale } from "@/src/hooks/useLocale";
import { usePWAInstall } from "@/src/hooks/usePWAInstall";

function SectionTitle({
  icon: Icon,
  title,
  description,
  accentClass,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] ${accentClass}`}
      >
        <Icon size={24} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </div>
  );
}

export function InstallCenter() {
  const { messages } = useLocale();
  const copy = messages.installCenter;
  const { canInstall, isInstalled } = usePWAInstall();

  const installStatus = isInstalled
    ? {
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        label: copy.status.labels.installed,
        description: copy.status.descriptions.installed,
      }
    : canInstall
      ? {
          tone: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300",
          label: copy.status.labels.ready,
          description: copy.status.descriptions.ready,
        }
      : {
          tone: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
          label: copy.status.labels.menu,
          description: copy.status.descriptions.menu,
        };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-8 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.95))] md:p-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-500/10" />
        <div className="relative space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-600 backdrop-blur dark:border-orange-500/20 dark:bg-slate-900/80 dark:text-orange-300">
            <Download size={14} />
            {copy.badge}
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-5">
              <div className="space-y-4">
                <h2 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 md:text-5xl md:leading-[1.05]">
                  {copy.title}
                </h2>
                <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 md:text-base">
                  {copy.description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {copy.highlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/75"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-xl font-black text-slate-950 dark:text-slate-50">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                      {item.hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200/80 bg-white/85 p-6 shadow-lg shadow-slate-200/30 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                    {copy.status.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                    {copy.status.title}
                  </h3>
                </div>
                <div
                  className={`hidden rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] md:inline-flex ${installStatus.tone}`}
                >
                  {installStatus.label}
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/70">
                <div className="mb-5 flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className={
                      isInstalled
                        ? "mt-0.5 text-emerald-500"
                        : "mt-0.5 text-orange-500"
                    }
                  />
                  <p className="text-sm font-medium leading-7 text-slate-700 dark:text-slate-300">
                    {installStatus.description}
                  </p>
                </div>

                <InstallAppButton />

                <div
                  className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] md:hidden ${installStatus.tone}`}
                >
                  {installStatus.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2.25rem] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-7 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.9)] dark:border-slate-700 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-300">
                {copy.flow.eyebrow}
              </p>
              <h3 className="text-2xl font-black tracking-tight md:text-3xl">
                {copy.flow.title}
              </h3>
              <p className="max-w-xl text-sm font-medium leading-7 text-slate-300">
                {copy.flow.description}
              </p>
            </div>

            <div className="space-y-3">
              {copy.flow.useCases.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Zap size={16} />
                  </div>
                  <p className="text-sm font-medium leading-6 text-slate-300">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            </div>
            <div className="mt-4 rounded-[1.25rem] bg-white/95 p-4 text-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    {copy.flow.preview.eyebrow}
                  </p>
                  <p className="mt-2 text-base font-black">
                    {copy.flow.preview.title}
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">
                  <MonitorSmartphone size={16} />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-100 px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {copy.flow.preview.currentWorkspace}
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {copy.flow.preview.currentWorkspaceValue}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {copy.flow.preview.actionLabel}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {copy.flow.preview.actionValue}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {copy.flow.preview.accessLabel}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {copy.flow.preview.accessValue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white p-7 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800 md:p-8">
          <SectionTitle
            icon={Smartphone}
            title={copy.surfaces.title}
            description={copy.surfaces.description}
            accentClass="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {copy.surfaces.items.map((surface) => (
              <div
                key={surface.title}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-500">
                  {surface.title}
                </p>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {surface.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white p-7 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800 md:p-8">
          <SectionTitle
            icon={Sparkles}
            title={copy.workflow.title}
            description={copy.workflow.description}
            accentClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
          />

          <div className="mt-6 space-y-3">
            {copy.workflow.checklist.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 size={15} />
                </div>
                <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white p-7 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-800 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                {copy.troubleshooting.eyebrow}
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
                {copy.troubleshooting.title}
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {copy.troubleshooting.items.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.45rem] border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
              >
                <p className="text-sm font-black text-slate-950 dark:text-slate-50">
                  {item.title}
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-7 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.9)] dark:border-slate-700 md:p-8">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">
              {copy.cta.eyebrow}
            </p>
            <h3 className="text-2xl font-black tracking-tight">
              {copy.cta.title}
            </h3>
            <p className="max-w-3xl text-sm font-medium leading-7 text-slate-300">
              {copy.cta.description}
            </p>
          </div>

          <div className="mt-6">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between rounded-[1.35rem] bg-white px-5 py-4 text-sm font-black text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-orange-50"
            >
              <span>{copy.cta.button}</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
