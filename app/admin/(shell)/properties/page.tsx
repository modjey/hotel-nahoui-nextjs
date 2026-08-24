import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { properties } from "@/data/properties";

export default function AdminPropertiesPage() {
  return (
    <div>
      <PageHeader
        title="Hébergements"
        description="Gérez les villas, suites et chambres proposées."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        }
      />

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left">
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Hébergement</th>
              <th className="px-5 py-3 font-medium">Localisation</th>
              <th className="px-5 py-3 font-medium">Catégorie</th>
              <th className="px-5 py-3 font-medium">Prix / nuit</th>
              <th className="px-5 py-3 font-medium">Note</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="h-10 w-14 rounded object-cover"
                    />
                    <span className="font-medium">{p.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{p.location}</td>
                <td className="px-5 py-3">{p.category}</td>
                <td className="px-5 py-3">{(p.price * 600).toLocaleString()} FCFA</td>
                <td className="px-5 py-3">{p.rating} · {p.reviews} avis</td>
                <td className="px-5 py-3 text-right">
                  <Button variant="ghost" size="sm">Modifier</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
