import { PageHeader } from "@/components/admin/PageHeader";

export default function AdminPage() {
  return (
    <div>
      <PageHeader title="Médias" description="Bibliothèque d'images et de vidéos du site." />
      <div className="rounded-2xl bg-card border border-border p-10 grid place-items-center text-sm text-muted-foreground">
        (Section « Médias » — à implémenter)
      </div>
    </div>
  );
}
