import type { Metadata } from "next";
import { IconBag, IconChatSpark, IconDownload, IconLock, IconMail, IconPeople, IconShare, IconWallet } from "@/components/icons";
import { OptionList } from "@/components/option-list";
import { getContext, getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.earn.title };
}

export default async function EarnPage() {
  const { t, view } = await getContext();

  // Business: revender, marca propia, clientes y equipos.
  if (view === "business") {
    const b = t.earn.bizItems;
    return (
      <OptionList
        title={t.earn.bizTitle}
        intro={t.earn.bizIntro}
        options={[
          { key: "resell", ...b.resell, color: "#8FB0D0", Icon: IconBag, href: "/revender" },
          { key: "whiteLabel", ...b.whiteLabel, color: "#C49BD0", Icon: IconLock, href: "/niveles" },
          { key: "clients", ...b.clients, color: "#7FC2B7", Icon: IconWallet, href: "/documentos" },
          { key: "teams", ...b.teams, color: "#E07A8F", Icon: IconPeople, href: "/equipo" },
          { key: "invoices", ...b.invoices, color: "#9FC08A", Icon: IconShare, href: "/documentos" },
          { key: "automations", ...b.automations, color: "#EA9272", Icon: IconChatSpark },
        ]}
      />
    );
  }

  const i = t.earn.items;
  return (
    <OptionList
      title={t.earn.title}
      intro={t.earn.intro}
      options={[
        { key: "automations", ...i.automations, color: "#EA9272", Icon: IconChatSpark },
        { key: "services", ...i.services, color: "#D8B170", Icon: IconBag, href: "/perfil/editar" },
        { key: "bundles", ...i.bundles, color: "#E07A8F", Icon: IconPeople, href: "/comunidad" },
        { key: "digital", ...i.digital, color: "#9FC08A", Icon: IconDownload },
        { key: "exclusive", ...i.exclusive, color: "#8FB0D0", Icon: IconLock },
        { key: "sales", ...i.sales, color: "#7FC2B7", Icon: IconWallet, href: "/panel" },
        { key: "email", ...i.email, color: "#C49BD0", Icon: IconMail },
      ]}
    />
  );
}
