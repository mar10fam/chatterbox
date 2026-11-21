"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { signOut } from "@/app/(auth)/actions";
import {
  BarChartIcon,
  CloseIcon,
  LogoMark,
  MenuIcon,
  MicIcon,
  SignOutIcon,
  SlidersIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/session", label: "Start Session", icon: MicIcon },
  { href: "/progress", label: "View Progress", icon: BarChartIcon },
  { href: "/settings", label: "Settings", icon: SlidersIcon },
];

type Variant = "desktop" | "drawer";

function Brand({ variant }: { variant: Variant }) {
  const desktop = variant === "desktop";
  return (
    <div className={`flex items-center ${desktop ? "gap-2.5 px-3" : "gap-2"}`}>
      <LogoMark size={desktop ? 34 : 28} />
      <span
        className={`font-display font-semibold ${desktop ? "text-2xl tracking-[-0.2px]" : "text-[21px]"}`}
      >
        Chatterbox
      </span>
    </div>
  );
}

function NavLinks({ variant, onNavigate }: { variant: Variant; onNavigate?: () => void }) {
  const pathname = usePathname();
  const row = variant === "desktop" ? "min-h-12 text-base" : "min-h-[52px] text-[17px]";

  return (
    <nav>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[14px] px-3 text-ink no-underline transition-colors ${row} ${
                  active
                    ? "bg-white font-bold shadow-[0_1px_3px_rgba(48,54,80,0.08)]"
                    : "font-semibold hover:bg-white/60"
                }`}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-[10px] ${
                    active ? "bg-brand text-white" : "text-ink"
                  }`}
                >
                  <Icon />
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
  const row = variant === "desktop" ? "min-h-12 text-base" : "min-h-[52px] text-[17px]";
  return (
    <div className="mt-auto flex flex-col gap-3">
      <div className="mx-3 h-px bg-lavender-line" />
      <form action={signOut}>
        <button
          type="submit"
          className={`flex w-full cursor-pointer items-center gap-3 rounded-[14px] border-none bg-transparent px-3 text-left font-sans font-semibold text-ink transition-colors hover:bg-white/60 ${row}`}
        >
          <span className="flex size-8 items-center justify-center">
            <SignOutIcon />
          </span>
          Sign out
        </button>
      </form>
    </div>
  );
}

export function DashboardNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Dashboard navigation"
        className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-9 bg-lavender px-4 pt-7 pb-6 lg:flex"
      >
        <Brand variant="desktop" />
        <NavLinks variant="desktop" />
        <SignOut variant="desktop" />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between bg-lavender pr-3 pl-5 lg:hidden">
        <Brand variant="drawer" />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
          className="flex size-12 cursor-pointer items-center justify-center rounded-[14px] border-none bg-transparent text-ink"
        >
          <MenuIcon />
        </button>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[rgba(48,54,80,0.45)] transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          id="mobile-nav"
          aria-label="Dashboard navigation"
          inert={!open}
          className={`absolute inset-y-0 left-0 flex w-76 max-w-[85vw] flex-col gap-7 bg-lavender px-4 pt-2 pb-7 transition-[translate,box-shadow] duration-200 ease-out ${
            open ? "translate-x-0 shadow-[8px_0_24px_rgba(48,54,80,0.18)]" : "-translate-x-full shadow-none"
          }`}
        >
          <div className="flex h-14 items-center justify-between pl-2">
            <Brand variant="drawer" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex size-12 cursor-pointer items-center justify-center rounded-[14px] border-none bg-transparent text-ink"
            >
              <CloseIcon />
            </button>
          </div>
          <NavLinks variant="drawer" onNavigate={() => setOpen(false)} />
          <SignOut variant="drawer" />
        </aside>
      </div>
    </>
  );
}
