// Site-wide footer. Rendered once in app/layout.tsx.

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t-2 border-fh-gold bg-fh-white">
      <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-fh-green flex justify-center gap-2">
        <span>&copy; 2025 - FH Meal Website -</span>
        <Link href="/privacy" className="underline hover:text-[var(--fh-gold)]">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
