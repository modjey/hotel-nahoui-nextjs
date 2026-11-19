import { redirect } from "next/navigation";

/** Modification désormais faite en fenêtre depuis l'onglet « Catégories » de la page Plats. */
export default function AdminDishCategoryEditPage() {
  redirect("/admin/admin-dishes?tab=categories");
}
