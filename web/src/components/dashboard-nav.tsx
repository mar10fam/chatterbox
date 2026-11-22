"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChartNoAxesColumn,
  LogOut,
  Menu,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LogoMark } from "./icons";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/session", label: "Start Session", icon: Mic },
  { href: "/progress", label: "View Progress", icon: ChartNoAxesColumn },
];

type Variant = "desktop" | "drawer";

const rowSize = (variant: Variant) =>
  variant === "desktop" ? "min-h-12 text-base" : "min-h-13 text-[17px]";

function Brand({ variant }: { variant: Variant }) {
  const desktop = variant === "desktop";
  return (
    <div className={cn("flex items-center", desktop ? "gap-2.5 px-3" : "gap-2")}>
      <LogoMark size={desktop ? 34 : 28} />
      <span className={cn("font-display font-semibold", desktop ? "text-2xl tracking-[-0.2px]" : "text-[21px]")}>
        Chatterbox
      </span>
    </div>
  );
}

function NavLinks({ variant, onNavigate }: { variant: Variant; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 text-sidebar-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
                  rowSize(variant),
                  active
                    ? "bg-sidebar-accent font-bold shadow-[0_1px_3px_rgba(48,54,80,0.08)]"
                    : "font-semibold hover:bg-sidebar-accent/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[10px]",
                    active && "bg-sidebar-primary text-sidebar-primary-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SignOut({ variant }: { variant: Variant }) {
  return (
    <div className="mt-auto flex flex-col gap-3">
      <Separator className="mx-3 bg-sidebar-border data-horizontal:w-auto" />
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className={cn(
            "h-auto w-full justify-start gap-3 px-3 font-semibold hover:bg-sidebar-accent/60",
            rowSize(variant),
          )}
        >
          <span className="flex size-8 items-center justify-center">
            <LogOut className="size-5" />
          </span>
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function DashboardNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Dashboard navigation"
        className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-9 bg-sidebar px-4 pt-7 pb-6 text-sidebar-foreground lg:flex"
      >
        <Brand variant="desktop" />
        <NavLinks variant="desktop" />
        <SignOut variant="desktop" />
      </aside>

      {/* Mobile top bar + slide-out drawer */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between bg-sidebar pr-3 pl-5 lg:hidden">
        <Brand variant="drawer" />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="hover:bg-sidebar-accent/60">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-describedby={undefined}
            className="w-76 max-w-[85vw] gap-7 border-none bg-sidebar px-4 pt-2 pb-7 text-sidebar-foreground data-[side=left]:w-76 [&>[data-slot=sheet-close]]:top-4 [&>[data-slot=sheet-close]]:right-4 [&>[data-slot=sheet-close]]:size-11"
          >
            <SheetTitle className="flex h-14 items-center pl-2">
              <Brand variant="drawer" />
            </SheetTitle>
            <NavLinks variant="drawer" onNavigate={() => setOpen(false)} />
            <SignOut variant="drawer" />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
