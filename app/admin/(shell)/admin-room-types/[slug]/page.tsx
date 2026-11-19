import { redirect } from "next/navigation";

/** Modification désormais faite en fenêtre depuis l'onglet « Types de chambre » de la page Chambres. */
export default function AdminRoomTypeEditPage() {
  redirect("/admin/admin-rooms?tab=types");
}
