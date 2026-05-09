import React from "react";
import { Globe, ShieldCheck } from "lucide-react";
import { useLocale } from "@/src/hooks/useLocale";

export const Footer = () => {
  const { t } = useLocale();

  return (
    <footer className="fixed bottom-0 right-0 z-40 hidden w-full p-6 lg:block lg:w-[calc(100%-288px)]">
      <div className="mx-auto flex max-w-4xl items-center justify-between opacity-30 grayscale transition-all hover:opacity-100 hover:grayscale-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {t("common.footer.infrastructure")}
        </span>
        <div className="flex gap-6">
          <Globe size={16} />
          <ShieldCheck size={16} />
        </div>
      </div>
    </footer>
  );
};
