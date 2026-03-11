"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/journal", label: "Diario" },
  { href: "/insights", label: "Insights" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-tight">
          Reflexivo
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-1.5 text-sm transition-colors rounded-md",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-foreground/60" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
