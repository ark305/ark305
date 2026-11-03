import { redirect } from "next/navigation";

// Comunidad ahora vive dentro de Academia.
export default function CommunityPage() {
  redirect("/academia");
}
