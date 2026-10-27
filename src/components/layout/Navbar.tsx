"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, Settings, FileText, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const [diagnostics, setDiagnostics] = useState<{
    providers?: {
      parallel?: { status: string };
      openai?: { status: string };
    };
  } | null>(null);

  useEffect(() => {
    fetch("/api/diagnostics")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDiagnostics(data);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { href: "/", label: "Research Workspace", icon: BarChart3 },
    { href: "/history", label: "Research History", icon: History },
    { href: "/settings", label: "Diagnostics & Telemetry", icon: Settings },
  ];

  const isParallelActive = diagnostics?.providers?.parallel?.status === "configured";
  const isOpenAIActive = diagnostics?.providers?.openai?.status === "configured";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-7 w-7 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm tracking-wider shadow-xs group-hover:bg-slate-800 transition-colors">
                EI
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-foreground leading-tight">
                  EQUITY INTELLIGENCE
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                  Autonomous Deep Research
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-200/70 text-slate-900 font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Provider Status Pill */}
          <div className="hidden sm:flex items-center gap-2">
            {isParallelActive ? (
              <Badge variant="positive" className="font-mono text-[11px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Parallel Deep Research
              </Badge>
            ) : isOpenAIActive ? (
              <Badge variant="positive" className="font-mono text-[11px] gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                OpenAI GPT-4o
              </Badge>
            ) : (
              <Badge variant="neutral" className="font-mono text-[11px] gap-1 text-slate-600">
                <Cpu className="h-3 w-3 text-slate-500" />
                Deterministic Fixtures Active
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
