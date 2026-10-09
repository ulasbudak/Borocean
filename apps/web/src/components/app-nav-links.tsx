"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavLinks({
  items,
  label,
}: {
  items: { href: string; label: string }[];
  label: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="mb-4 flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-accent/50 bg-surface-hover text-text-primary"
                : "border-border-subtle text-text-secondary hover:border-accent/50 hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
