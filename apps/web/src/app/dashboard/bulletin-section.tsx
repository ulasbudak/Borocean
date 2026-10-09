"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { translateSector, type Locale, type Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";
import { ProseText } from "@/components/ui/prose-text";
import { fetchEntitlement } from "@/lib/entitlements-client";
import { fetchBulletins, type Bulletin } from "@/lib/bulletins-client";

/**
 * Daily sector bulletins (Story 9.3). The dashboard passes `latestOnly` to show just the
 * newest one with a link to the archive page (/bulletins), which shows them all.
 */
export function BulletinSection({
  messages,
  locale,
  latestOnly = false,
}: {
  messages: Messages["bulletin"];
  locale: Locale;
  latestOnly?: boolean;
}) {
  const t = messages;
  const [locked, setLocked] = useState<boolean | null>(null);
  const [bulletins, setBulletins] = useState<Bulletin[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const entitlement = await fetchEntitlement();
        if (cancelled) return;
        setLocked(!entitlement.ai_reports);
        if (!entitlement.ai_reports) return;
        const data = await fetchBulletins();
        if (!cancelled) setBulletins(data.bulletins);
      } catch {
        if (!cancelled) setError(t.loadError);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
    };
  }, [t.loadError]);

  if (error) return null;
  if (locked === null) return <p className="text-sm text-text-tertiary">{t.loading}</p>;

  if (locked) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">{t.lockedMessage}</p>
      </Card>
    );
  }

  if (bulletins === null) return <p className="text-sm text-text-tertiary">{t.loading}</p>;
  if (bulletins.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-sm text-text-secondary">{t.empty}</p>
      </Card>
    );
  }

  const shown = latestOnly ? bulletins.slice(0, 1) : bulletins;

  return (
    <div className="flex flex-col gap-3">
      {shown.map((bulletin) => (
        <Card key={bulletin.bulletin_date}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-accent">
              {translateSector(bulletin.sector, locale)}
            </span>
            <span className="text-xs text-text-tertiary">
              {new Date(bulletin.bulletin_date).toLocaleDateString(locale)}
            </span>
          </div>
          <ProseText text={bulletin.content} />
          {bulletin.picks.length > 0 && (
            <div className="mt-3 border-t border-border-subtle pt-3">
              <p className="mb-1.5 text-xs text-text-tertiary">{t.picksLabel}</p>
              <ul className="flex flex-wrap gap-1.5">
                {bulletin.picks.map((pick) => (
                  <li
                    key={pick.symbol}
                    className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {pick.symbol} · {pick.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-text-tertiary">{t.disclaimer}</p>
        </Card>
      ))}
      {latestOnly && (
        <Link
          href="/bulletins"
          className="flex items-center justify-center gap-1.5 self-center rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/50 hover:text-accent"
        >
          {t.viewAll}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
