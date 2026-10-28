"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardPlus, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
    { href: "/assessment", label: "Новый анализ", icon: ClipboardPlus },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Администрирование", icon: ShieldCheck }] : []),
  ];

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Основная навигация">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname === href ? "nav-link active" : "nav-link"}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <button className="user-pill" onClick={logout} title="Выйти" type="button">
            <span>{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="user-pill-copy"><strong>{user.name}</strong><small>{user.role === "ADMIN" ? "Администратор" : "Клиент"}</small></span>
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>
            <Icon size={20} /><span>{label === "Администрирование" ? "Админ" : label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
