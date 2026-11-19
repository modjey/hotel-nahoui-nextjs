import { redirect } from "next/navigation";

/** Les catégories de plats sont désormais gérées dans l'onglet « Catégories » de la page Plats. */
export default function AdminDishCategoriesPage() {
  redirect("/admin/admin-dishes?tab=categories");
}
