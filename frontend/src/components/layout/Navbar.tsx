"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownHeader, DropdownItem } from "@/components/ui/Dropdown";
import { ROLE_LABELS } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const unreadCount = useUnreadNotifications();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-semibold text-slate-900">HRMS</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Dropdown
          label="Open profile menu"
          trigger={
            <span className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-slate-100">
              <Avatar name={user.name} src={user.profileImage} />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-slate-900">
                  {user.name}
                </span>
                <span className="block text-xs text-slate-500">{ROLE_LABELS[user.role]}</span>
              </span>
              <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
            </span>
          }
        >
          <DropdownHeader>
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </DropdownHeader>
          <DropdownItem icon={User} href="/profile">
            My profile
          </DropdownItem>
          <DropdownItem icon={LogOut} onClick={logout} danger>
            Logout
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}