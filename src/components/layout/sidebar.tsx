"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ProjectSwitcher } from "./project-switcher";
import {
  LayoutDashboard,
  Rocket,
  FileText,
  Users,
  Activity,
  Settings,
  Zap,
  Brain,
  ListChecks,
} from "lucide-react";

const navItems = [
  { href: "/board", label: "Pano", icon: LayoutDashboard },
  { href: "/kickoff", label: "Başlangıç", icon: Rocket },
  { href: "/backlog", label: "Backlog", icon: ListChecks },
  { href: "/documents", label: "Dokümanlar", icon: FileText },
  { href: "/memory", label: "Hafıza", icon: Brain },
  { href: "/personas", label: "Personalar", icon: Users },
  { href: "/activity", label: "Aktivite", icon: Activity },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4">
        <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
        <span className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
          KORTEX
        </span>
        <span className="ml-auto rounded-full bg-[var(--accent-primary)]/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
          v2
        </span>
      </div>

      {/* Project Switcher */}
      <div className="mb-2">
        <ProjectSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--accent-primary)]">P</span>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">Prime</p>
            <p className="text-[10px] text-[var(--text-muted)]">Orchestrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
