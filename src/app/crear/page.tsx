import type { Metadata } from "next";
import { IconBag, IconImage, IconPeople } from "@/components/icons";
import { OptionList } from "@/components/option-list";
import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.create.title };
}

// Esta pantalla no estaba en el diseño: usa el mismo estilo que "Gana dinero".
export default async function CreatePage() {
  const { t } = await getDictionary();
  const i = t.create.items;
  return (
    <OptionList
      title={t.create.title}
      intro={t.create.intro}
      options={[
        { key: "service", ...i.service, color: "#D8B170", Icon: IconBag },
        { key: "post", ...i.post, color: "#EA9272", Icon: IconImage },
        { key: "bundle", ...i.bundle, color: "#E07A8F", Icon: IconPeople },
      ]}
    />
  );
}
