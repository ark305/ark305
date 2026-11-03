import { RequestsInbox } from "@/components/requests-inbox";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getDictionary();
  return { title: t.requests.title };
}

export default async function RequestsPage() {
  const { locale } = await getContext();
  return <RequestsInbox locale={locale} />;
}
