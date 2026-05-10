import React from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  Download,
  LayoutDashboard,
  List,
  Lock,
  MessageCircle,
  PlusCircle,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Tab, UserProfile, Workspace } from "@/src/types";
import { AccountMenu } from "@/src/components/common/AccountMenu";
import { useLocale } from "@/src/hooks/useLocale";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isActuallyAdmin: boolean;
  userProfile: UserProfile | null;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  userEmail: string | undefined;
  handleLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  compactDesktop?: boolean;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  isLocked,
  compact = false,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
  isLocked?: boolean;
  compact?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex w-full items-center justify-between rounded-xl text-left font-bold transition-all",
      compact ? "px-3 py-2.5 text-[13px]" : "px-4 py-3 text-sm",
      active
        ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      {label}
    </div>
    {isLocked && (
      <Lock
        size={14}
        className={cn(
          "opacity-40 transition-opacity group-hover:opacity-100",
          active ? "text-white" : "text-gray-400",
        )}
      />
    )}
  </button>
);

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isActuallyAdmin,
  userProfile,
  workspaces,
  currentWorkspaceId,
  onWorkspaceChange,
  userEmail,
  handleLogout,
  isOpen,
  onClose,
  compactDesktop = false,
}: SidebarProps) => {
  const { locale, t } = useLocale();
  const zaloContactUrl = "https://zalo.me/0969361607";
  const adminCenterLabel =
    locale === "vi" ? "Trung tâm quản trị" : "Admin center";

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white p-6 transition-transform dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:z-0 lg:h-screen lg:translate-x-0",
          compactDesktop ? "w-72 lg:w-60 lg:p-4" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("flex items-center justify-between", compactDesktop ? "mb-8" : "mb-12")}>
          <div className="flex items-center gap-3">
            <img
              src="/logo-app-192.png"
              alt={t("sidebar.logoAlt")}
              className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-orange-100"
            />
            <div>
              <h1 className={cn("font-black leading-none tracking-tight text-gray-900 dark:text-white", compactDesktop ? "text-lg" : "text-xl")}>
                HotsNew
              </h1>
              <p className={cn("mt-1 font-black uppercase tracking-[0.2em] text-orange-500", compactDesktop ? "text-[9px]" : "text-[10px]")}>
                click <span className="italic opacity-50">&alpha;</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 lg:hidden"
            aria-label={t("sidebar.close")}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <div className={cn("rounded-2xl border border-gray-100 bg-gray-50/80 dark:border-slate-700 dark:bg-slate-800/80", compactDesktop ? "mb-4 p-2.5" : "mb-5 p-3")}>
            <label className="mb-2 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              <Building2 size={12} className="text-orange-500" />
              {t("sidebar.currentWorkspace")}
            </label>
            <div className="relative">
              <select
                value={currentWorkspaceId}
                onChange={(e) => onWorkspaceChange(e.target.value)}
                className={cn(
                  "w-full appearance-none rounded-xl border border-transparent bg-white pr-10 font-bold text-gray-900 outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 dark:bg-slate-900 dark:text-slate-100",
                  compactDesktop ? "px-3 py-2.5 text-[13px]" : "px-4 py-3 text-sm",
                )}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                    {workspace.role ? ` · ${workspace.role}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className={cn("font-black uppercase tracking-widest text-gray-400 dark:text-slate-500", compactDesktop ? "mb-3 px-3 text-[9px]" : "mb-4 px-4 text-[10px]")}>
            {t("sidebar.mainMenu")}
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label={t("sidebar.dashboard")}
            active={activeTab === "dashboard"}
            onClick={() => handleTabClick("dashboard")}
            compact={compactDesktop}
          />
          <SidebarItem
            icon={PlusCircle}
            label={t("sidebar.createLinks")}
            active={activeTab === "create"}
            onClick={() => handleTabClick("create")}
            isLocked={
              !isActuallyAdmin && userProfile?.subscription_plan === "free"
            }
            compact={compactDesktop}
          />
          <SidebarItem
            icon={List}
            label={t("sidebar.linkList")}
            active={activeTab === "list"}
            onClick={() => handleTabClick("list")}
            compact={compactDesktop}
          />
          <SidebarItem
            icon={BarChart3}
            label={t("sidebar.analytics")}
            active={activeTab === "analytics"}
            onClick={() => handleTabClick("analytics")}
            compact={compactDesktop}
          />
          <SidebarItem
            icon={UsersIcon}
            label={t("sidebar.team")}
            active={activeTab === "team"}
            onClick={() => handleTabClick("team")}
            compact={compactDesktop}
          />
          <SidebarItem
            icon={Download}
            label={t("sidebar.installApp")}
            active={activeTab === "install"}
            onClick={() => handleTabClick("install")}
            compact={compactDesktop}
          />

          {isActuallyAdmin && (
            <>
              <div className={cn("font-black uppercase tracking-widest text-orange-400", compactDesktop ? "mb-3 mt-6 px-3 text-[9px]" : "mb-4 mt-8 px-4 text-[10px]")}>
                {t("sidebar.admin")}
              </div>
              <SidebarItem
                icon={UsersIcon}
                label={adminCenterLabel}
                active={activeTab === "admin"}
                onClick={() => handleTabClick("admin")}
                compact={compactDesktop}
              />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-gray-100 pt-6 dark:border-slate-700">
          <a
            href={zaloContactUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-4 flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-xs font-black uppercase tracking-widest text-sky-700 transition-all hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20"
          >
            <MessageCircle size={16} />
            {t("sidebar.contactAdmin")}
          </a>
          <div className="lg:hidden">
            <AccountMenu
              activeTab={activeTab}
              onSelectTab={handleTabClick}
              isActuallyAdmin={isActuallyAdmin}
              userProfile={userProfile}
              userEmail={userEmail}
              handleLogout={handleLogout}
              className="w-full"
              fullWidth
              menuPlacement="top-right"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
