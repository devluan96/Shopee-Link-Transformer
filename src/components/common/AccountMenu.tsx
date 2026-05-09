import React from "react";
import { ChevronDown, LogOut, Tag, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Tab, UserProfile } from "@/src/types";
import { useLocale } from "@/src/hooks/useLocale";

interface AccountMenuProps {
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  isActuallyAdmin: boolean;
  userProfile: UserProfile | null;
  userEmail?: string;
  handleLogout: () => void;
  className?: string;
  fullWidth?: boolean;
  menuPlacement?: "bottom-right" | "top-right";
  compact?: boolean;
}

export function AccountMenu({
  activeTab,
  onSelectTab,
  isActuallyAdmin,
  userProfile,
  userEmail,
  handleLogout,
  className,
  fullWidth = false,
  menuPlacement = "bottom-right",
  compact = false,
}: AccountMenuProps) {
  const { t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = isActuallyAdmin
    ? t("sidebar.roleAdmin")
    : userProfile?.subscription_plan === "monthly" ||
        userProfile?.subscription_plan === "yearly"
      ? t("sidebar.rolePaid")
      : t("sidebar.roleFree");

  const handleAvatarError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    event.currentTarget.style.display = "none";
    event.currentTarget.parentElement
      ?.querySelector(".avatar-placeholder")
      ?.classList.remove("hidden");
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {open && (
        <div
          className={cn(
            "absolute right-0 z-20 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/70 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30",
            fullWidth ? "w-full" : "w-72",
            menuPlacement === "top-right" ? "bottom-full mb-3" : "top-full mt-3",
          )}
        >
          <button
            onClick={() => {
              onSelectTab("pricing");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all",
              activeTab === "pricing"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            )}
          >
            <Tag size={18} />
            {t("sidebar.plans")}
          </button>
          <button
            onClick={() => {
              onSelectTab("profile");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all",
              activeTab === "profile"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200",
            )}
          >
            <User size={18} />
            {t("sidebar.profile")}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut size={18} />
            {t("sidebar.signOut")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("sidebar.accountMenu")}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-2 py-2 text-left shadow-lg shadow-gray-200/60 transition-all hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20",
          compact ? "pr-3" : "",
          fullWidth ? "w-full justify-between" : "",
        )}
      >
        <div className="shrink-0 rounded-full transition-transform hover:scale-105">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={
                userProfile?.full_name || userEmail || t("sidebar.accountAvatar")
              }
              className={cn(
                "rounded-full bg-gray-100 object-cover",
                compact ? "h-9 w-9" : "h-10 w-10",
              )}
              onError={handleAvatarError}
            />
          ) : null}
          <div
            className={cn(
              "avatar-placeholder flex items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-300",
              compact ? "h-9 w-9" : "h-10 w-10",
              userProfile?.avatar_url ? "hidden" : "",
            )}
          >
            <User size={compact ? 18 : 20} />
          </div>
        </div>

        <div className="min-w-0 pr-1">
          <p
            className={cn(
              "truncate font-bold text-gray-900 dark:text-slate-100",
              compact ? "text-[13px]" : "text-sm",
            )}
          >
            {userProfile?.full_name || userEmail}
          </p>
          <p
            className={cn(
              "font-bold uppercase text-green-600 dark:text-green-400",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            {roleLabel}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-gray-400 transition-transform dark:text-slate-400",
            open ? "rotate-180" : "",
          )}
        />
      </button>
    </div>
  );
}
