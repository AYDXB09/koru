"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  ClipboardList,
  Archive,
  Bell,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/server/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Compass },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: Archive },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "My profile", icon: User },
];

export function AppShellClient({
  unread,
  userName,
  userEmail,
  children,
}: {
  unread: number;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main navigation">
      <p className="label-mono px-3 pb-2 pt-4 text-sidebar-foreground/60">Workspace</p>
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 border-l-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring",
              active
                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-foreground"
                : "border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/notifications" && unread > 0 && (
              <span className="tabular grid h-5 min-w-5 place-items-center bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="space-y-3 border-t border-sidebar-border pt-4">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-sidebar-primary/40 font-display text-sm font-medium text-sidebar-foreground">
          {userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{userEmail}</p>
        </div>
      </div>
      <form action={logout}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </Button>
      </form>
    </div>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="border-b border-sidebar-border px-2 pb-4">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Brand titleClassName="text-sidebar-foreground" subtitleClassName="text-sidebar-foreground/50" />
        </Link>
      </div>
      {nav}
      {userBlock}
      <p className="label-mono px-3 pb-1 text-sidebar-foreground/60">Koru · Suva</p>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 bg-sidebar md:block">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-sm p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Close menu"
              autoFocus
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 bg-accent ring-2 ring-background" />
            )}
          </Link>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
