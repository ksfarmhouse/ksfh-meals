// Responsive navbar with "priority+" overflow.
//
// As the window narrows, the right-most pills get dropped into a hamburger
// dropdown one at a time, so the navbar always fits on a single line.
//
// How the measurement works:
//   1. We render a hidden copy of EVERY pill off-screen (the measureRef
//      layer below) so we know each one's natural width.
//   2. A ResizeObserver fires whenever the visible nav's width changes.
//   3. We greedily add pills from left to right until the next one wouldn't
//      fit (reserving room for the hamburger button if there's any overflow).
//   4. The pills that didn't fit get rendered inside the dropdown panel.

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Menu" },
  { href: "/this-week", label: "This Week" },
  { href: "/default-plan", label: "Default Plan" },
  { href: "/plates", label: "Plates" },
  { href: "/find-id", label: "Find ID" },
  { href: "/files", label: "Files" },
  { href: "/treasurer", label: "Treasurer" },
  { href: "/admin/login", label: "Admin" },
];

// "Is this nav link the current page?" Two special cases:
//   - "/" must match exactly, otherwise it would match every URL.
//   - "/admin/login" stays highlighted on every /admin/* page so the user
//     always sees where to leave when they're in the admin section.
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/admin/login") return pathname.startsWith("/admin");
  return pathname === href || pathname.startsWith(href + "/");
}

const GAP_PX = 8;
const HAMBURGER_RESERVE = 56;

export function Navbar() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const widthsRef = useRef<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(LINKS.length);
  const [openMenu, setOpenMenu] = useState(false);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const children = Array.from(measureRef.current.children) as HTMLElement[];
    widthsRef.current = children.map((c) => c.offsetWidth);
  }, []);

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current || widthsRef.current.length === 0) return;
      const available = containerRef.current.clientWidth;
      const widths = widthsRef.current;
      const totalAll = widths.reduce(
        (s, w, i) => s + w + (i > 0 ? GAP_PX : 0),
        0,
      );
      if (totalAll <= available) {
        setVisibleCount(LINKS.length);
        return;
      }
      let used = HAMBURGER_RESERVE + GAP_PX;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const cost = widths[i] + (i > 0 ? GAP_PX : 0);
        if (used + cost <= available) {
          used += cost;
          count = i + 1;
        } else break;
      }
      setVisibleCount(count);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  useEffect(() => {
    setOpenMenu(false);
  }, [pathname]);

  const visible = LINKS.slice(0, visibleCount);
  const overflow = LINKS.slice(visibleCount);
  const overflowActive = overflow.some((l) => isActive(pathname, l.href));

  return (
    <nav className="bg-fh-white border-b-4 border-fh-gold relative">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-fh-green whitespace-nowrap"
        >
          <Image
            src="/icon.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          KSFH Meals
        </Link>

        <div
          ref={measureRef}
          aria-hidden
          className="flex gap-2"
          style={{
            position: "fixed",
            top: -9999,
            left: -9999,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          {LINKS.map((l) => (
            <span key={l.href} className="fh-pill">
              {l.label}
            </span>
          ))}
        </div>

        <div
          ref={containerRef}
          className="flex-1 min-w-0 flex items-center justify-end gap-2 flex-nowrap"
        >
          {visible.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`fh-pill ${isActive(pathname, l.href) ? "fh-pill-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}

          {overflow.length > 0 && (
            <div className="relative">
              <button
                type="button"
                aria-label="More navigation"
                aria-expanded={openMenu}
                onClick={() => setOpenMenu((v) => !v)}
                className={`fh-pill px-3 ${overflowActive ? "fh-pill-active" : ""}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              {openMenu && (
                <ul className="absolute right-0 top-full mt-2 bg-fh-white border-2 border-fh-green rounded shadow-lg min-w-[10rem] z-50 flex flex-col gap-1 p-1">
                  {overflow.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={`fh-pill block text-center ${
                          isActive(pathname, l.href) ? "fh-pill-active" : ""
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
