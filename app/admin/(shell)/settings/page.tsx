import { PageHeader } from "@/components/admin/PageHeader";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration générale, contacts, intégrations." />
      <div className="rounded-2xl bg-card border border-border p-10 grid place-items-center text-sm text-muted-foreground">
        (Section « Paramètres » — à implémenter)
      </div>
    </div>
  );
}
