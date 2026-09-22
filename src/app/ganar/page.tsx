import type { Metadata } from "next";
import { IconBag, IconChatSpark, IconDownload, IconLock, IconMail, IconPeople, IconWallet } from "@/components/icons";
import { OptionList } from "@/components/option-list";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.earn.title };
}

export default async function EarnPage() {
  const { t } = await getDictionary();
  const i = t.earn.items;
  return (
    <OptionList
      title={t.earn.title}
      intro={t.earn.intro}
      options={[
        { key: "automations", ...i.automations, color: "#EA9272", Icon: IconChatSpark },
        { key: "services", ...i.services, color: "#D8B170", Icon: IconBag },
        { key: "bundles", ...i.bundles, color: "#E07A8F", Icon: IconPeople },
        { key: "digital", ...i.digital, color: "#9FC08A", Icon: IconDownload },
        { key: "exclusive", ...i.exclusive, color: "#8FB0D0", Icon: IconLock },
        { key: "sales", ...i.sales, color: "#7FC2B7", Icon: IconWallet },
        { key: "email", ...i.email, color: "#C49BD0", Icon: IconMail },
      ]}
    />
  );
}
