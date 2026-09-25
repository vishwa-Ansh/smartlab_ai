"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Code2,
  FileCode2,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Reviews",
    icon: Code2,
    href: "/reviews",
  },
  {
    label: "Assignments",
    icon: FileCode2,
    href: "/assignments",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/[0.07] bg-[#090a0c]/95 lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-white/[0.07] px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
            <Sparkles size={16} />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-tight">
              SmartLab
            </div>

            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              AI Lab Assistant
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-5">
        <div className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
          Workspace
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />

                <span>{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/[0.07] p-3">
        <Link
          href="/settings"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            pathname.startsWith("/settings")
              ? "bg-white/[0.08] text-white"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
          }`}
        >
          <Settings size={17} />
          Settings
        </Link>

        <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[0.03] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
            A
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              Student
            </div>

            <div className="truncate text-xs text-zinc-600">
              SmartLab Workspace
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}