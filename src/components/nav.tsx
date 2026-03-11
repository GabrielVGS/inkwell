"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/journal", label: "Diario" },
  { href: "/insights", label: "Insights" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  };

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="relative w-8 h-8 shrink-0 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Inkwell"
                fill
                className="dark:invert object-contain scale-[4] translate-y-[5px]"
              />
            </div>
            <span className="font-display text-xl tracking-tight">Inkwell</span>
          </Link>
          {session && (
            <div className="flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm transition-colors rounded-md",
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-foreground/60" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-[11px] text-muted-foreground/60 hidden sm:block">
                {session.user.name}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm text-foreground bg-foreground/10 hover:bg-foreground/15 px-3 py-1.5 rounded-md transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
