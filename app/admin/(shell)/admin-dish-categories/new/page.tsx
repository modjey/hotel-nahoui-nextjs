import { redirect } from "next/navigation";

/** Création désormais faite en fenêtre depuis l'onglet « Catégories » de la page Plats. */
export default function AdminDishCategoryNewPage() {
  redirect("/admin/admin-dishes?tab=categories");
}
