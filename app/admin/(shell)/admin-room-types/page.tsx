import { redirect } from "next/navigation";

/** Les types de chambre sont désormais gérés dans l'onglet « Types de chambre » de la page Chambres. */
export default function AdminRoomTypesPage() {
  redirect("/admin/admin-rooms?tab=types");
}
