"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, CheckCircle, Archive } from "lucide-react";

type ContactSubmission = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
};

export default function ContactSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied" | "archived">("all");

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const status = filter === "all" ? "" : filter;
      const response = await fetch(`/api/admin/contact-submissions?status=${status}`);
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data.submissions);
      }
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchSubmissions();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting contact submission:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSubmissions();
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: "bg-blue-600 hover:bg-blue-600 text-white",
      read: "bg-yellow-600 hover:bg-yellow-600 text-white",
      replied: "bg-green-600 hover:bg-green-600 text-white",
      archived: "bg-gray-600 hover:bg-gray-600 text-white",
    };
    const labels = {
      new: "Nouveau",
      read: "Lu",
      replied: "Répondu",
      archived: "Archivé",
    };
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Messages de contact"
        description="Gérez les messages envoyés via le formulaire de contact"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tous
        </Button>
        <Button
          variant={filter === "new" ? "default" : "outline"}
          onClick={() => setFilter("new")}
        >
          Nouveaux
        </Button>
        <Button
          variant={filter === "read" ? "default" : "outline"}
          onClick={() => setFilter("read")}
        >
          lus
        </Button>
        <Button
          variant={filter === "replied" ? "default" : "outline"}
          onClick={() => setFilter("replied")}
        >
          Répondus
        </Button>
        <Button
          variant={filter === "archived" ? "default" : "outline"}
          onClick={() => setFilter("archived")}
        >
          Archivés
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4">Nom</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Sujet</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Statut</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t border-border">
                <td className="p-4">
                  <div className="font-medium">
                    {submission.firstName} {submission.lastName}
                  </div>
                  {submission.phone && (
                    <div className="text-sm text-muted-foreground">{submission.phone}</div>
                  )}
                </td>
                <td className="p-4">{submission.email}</td>
                <td className="p-4">{submission.subject}</td>
                <td className="p-4">
                  {new Date(submission.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4">{getStatusBadge(submission.status)}</td>
                <td className="p-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/contact-submissions/${submission.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {submission.status !== "read" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(submission.id, "read")}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {submission.status !== "archived" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(submission.id, "archived")}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(submission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucun message trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
