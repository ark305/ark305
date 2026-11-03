import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EditProfile } from "@/components/edit-profile";
import { getDictionary } from "@/lib/i18n";
import { getViewer } from "@/lib/profiles-db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.edit.title };
}

export default async function EditProfilePage() {
  const { locale } = await getDictionary();
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/entrar?next=/perfil/editar");
  if (!viewer.row) redirect("/bienvenida");
  return <EditProfile locale={locale} row={viewer.row} services={viewer.services} />;
}
