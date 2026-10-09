import { redirect } from "next/navigation";
import { messages } from "@borocean/shared";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/ui/page-header";
import { BulletinSection } from "../dashboard/bulletin-section";

/** Archive of all daily sector bulletins; the dashboard shows only the newest one. */
export default async function BulletinsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/login");
  }

  const locale = await getLocale();
  const t = messages[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        backHref="/dashboard"
        backLabel={t.bulletin.backToDashboard}
        title={t.bulletin.archiveTitle}
      />
      <BulletinSection messages={t.bulletin} locale={locale} />
    </div>
  );
}
