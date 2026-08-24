import { PageHeader } from "@/components/admin/PageHeader";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Restaurant" description="Mettez à jour le menu, les horaires et les disponibilités." />
      <div className="rounded-2xl bg-card border border-border p-10 grid place-items-center text-sm text-muted-foreground">
        (Section « Restaurant » — à implémenter)
      </div>
    </div>
  );
}
