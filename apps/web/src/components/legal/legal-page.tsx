import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const LEGAL_PAGES = [
  { href: "/terms", title: "Kullanım Koşulları" },
  { href: "/kvkk", title: "KVKK Aydınlatma Metni" },
  { href: "/privacy", title: "Gizlilik Politikası" },
];

/** Shared frame for the legal texts (Story 12.2). The texts are Turkish-only on purpose:
 * the Turkish version is the one with legal effect under KVKK. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        backHref="/"
        backLabel="Ana sayfaya dön"
        title={title}
        meta={<p className="mt-1 text-xs text-text-tertiary">Son güncelleme: {updated}</p>}
      />
      <Card>
        <div className="prose prose-sm max-w-none">{children}</div>
      </Card>
      <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
        {LEGAL_PAGES.filter((page) => page.title !== title).map((page) => (
          <Link key={page.href} href={page.href} className="underline hover:text-text-primary">
            {page.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export const CONTACT_EMAIL = "serdarulasbudak@gmail.com";
