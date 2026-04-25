import React, { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  PlusCircle,
  Tag,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Tab, UserProfile } from "@/src/types";

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isActuallyAdmin: boolean;
  userProfile: UserProfile | null;
  userEmail: string | undefined;
  handleLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  isLocked,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  isLocked?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition-all",
      active
        ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
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
  userEmail,
  handleLogout,
  isOpen,
  onClose,
}: SidebarProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsUserMenuOpen(false);
    }
  }, [isOpen]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsUserMenuOpen(false);
  };

  const handleAvatarError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    event.currentTarget.style.display = "none";
    event.currentTarget.parentElement
      ?.querySelector(".avatar-placeholder")
      ?.classList.remove("hidden");
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white p-6 transition-transform lg:sticky lg:z-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-app.png"
              alt="HotsNew Click logo"
              className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-orange-100"
            />
            <div>
              <h1 className="text-xl font-black leading-none tracking-tight text-gray-900">
                HotsNew
              </h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                click <span className="italic opacity-50">&alpha;</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 lg:hidden"
          >
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          <div className="mb-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Menu chính
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Bảng điều khiển"
            active={activeTab === "dashboard"}
            onClick={() => handleTabClick("dashboard")}
          />
          <SidebarItem
            icon={PlusCircle}
            label="Tạo Link"
            active={activeTab === "create"}
            onClick={() => handleTabClick("create")}
            isLocked={
              !isActuallyAdmin && userProfile?.subscription_plan === "free"
            }
          />
          <SidebarItem
            icon={List}
            label="Danh sách Link"
            active={activeTab === "list"}
            onClick={() => handleTabClick("list")}
          />
          <SidebarItem
            icon={BarChart3}
            label="Phân tích dữ liệu"
            active={activeTab === "analytics"}
            onClick={() => handleTabClick("analytics")}
          />

          {isActuallyAdmin && (
            <>
              <div className="mb-4 mt-8 px-4 text-[10px] font-black uppercase tracking-widest text-orange-400">
                Quản trị viên
              </div>
              <SidebarItem
                icon={UsersIcon}
                label="Quản lý User"
                active={activeTab === "admin"}
                onClick={() => handleTabClick("admin")}
              />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-gray-100 pt-6">
          <div ref={userMenuRef} className="relative">
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-3 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/70">
                <button
                  onClick={() => handleTabClick("pricing")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all",
                    activeTab === "pricing"
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <Tag size={18} />
                  Gói dịch vụ
                </button>
                <button
                  onClick={() => handleTabClick("profile")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all",
                    activeTab === "profile"
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-200"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <User size={18} />
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 transition-all hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Đăng xuất
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 p-2">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-label="Mở menu tài khoản"
                aria-expanded={isUserMenuOpen}
                className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile?.full_name || userEmail || "User avatar"}
                    className="h-10 w-10 rounded-full bg-gray-100 object-cover"
                    onError={handleAvatarError}
                  />
                ) : null}
                <div
                  className={cn(
                    "avatar-placeholder flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400",
                    userProfile?.avatar_url ? "hidden" : "",
                  )}
                >
                  <User size={20} />
                </div>
              </button>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  {userProfile?.full_name || userEmail}
                </p>
                <p className="text-[10px] font-bold uppercase text-green-600">
                  {isActuallyAdmin
                    ? "Administrator"
                    : userProfile?.subscription_plan === "monthly" ||
                        userProfile?.subscription_plan === "yearly"
                      ? "Premium Member"
                      : "Free Member"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
