import type { Metadata } from "next";
import { DocsView } from "@/components/docs-view";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.biz.docs.title };
}

export default async function DocumentsPage() {
  const { locale } = await getDictionary();
  return <DocsView locale={locale} />;
}
