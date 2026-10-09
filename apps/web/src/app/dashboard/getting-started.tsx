import Link from "next/link";
import type { Messages } from "@borocean/shared";
import { Card } from "@/components/ui/card";

/** First-run guide (UX plan 16.4): shown until the user has picked interest sectors, the
 * one setting the Panel can't do anything useful without. */
export function GettingStarted({ messages }: { messages: Messages["onboarding"] }) {
  const t = messages;
  return (
    <Card>
      <p className="text-sm font-semibold text-text-primary">{t.title}</p>
      <p className="mt-1 text-sm text-text-secondary">{t.intro}</p>
      <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-text-secondary">
        <li>
          {t.stepInterests}{" "}
          <Link href="/settings" className="font-medium text-accent hover:underline">
            {t.stepInterestsAction}
          </Link>
        </li>
        <li>{t.stepSearch}</li>
        <li>
          {t.stepTrack}{" "}
          <Link href="/watchlist" className="font-medium text-accent hover:underline">
            {t.stepTrackWatchlist}
          </Link>
          {" · "}
          <Link href="/portfolio" className="font-medium text-accent hover:underline">
            {t.stepTrackPortfolio}
          </Link>
        </li>
      </ol>
    </Card>
  );
}
