"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Trash2, CheckCircle, Archive } from "lucide-react";

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
  repliedAt: string | null;
  createdAt: string;
};

export default function ContactSubmissionDetailPage() {
  const router = useRouter();
  const [submission, setSubmission] = useState<ContactSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetchSubmission(id);
    }
  }, []);

  const fetchSubmission = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contact-submissions/${id}`);
      const data = await response.json();
      if (data.success) {
        setSubmission(data.data.submission);
        setReply(data.data.submission.reply || "");
      }
    } catch (error) {
      console.error("Error fetching contact submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmission(data.data.submission);
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "replied",
          reply 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSubmission(data.data.submission);
        alert("Réponse enregistrée");
      } else {
        alert("Erreur lors de l'enregistrement de la réponse");
      }
    } catch (error) {
      console.error("Error saving reply:", error);
      alert("Erreur lors de l'enregistrement de la réponse");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      
      const response = await fetch(`/api/admin/contact-submissions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin/contact-submissions");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting contact submission:", error);
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!submission) {
    return <div>Message introuvable</div>;
  }

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

  return (
    <div className="p-6">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <PageHeader title="Détail du message" />

      <div className="grid gap-6 max-w-4xl">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Nom complet</Label>
              <p className="font-medium">{submission.firstName} {submission.lastName}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="font-medium">{submission.email}</p>
            </div>
            <div>
              <Label>Téléphone</Label>
              <p className="font-medium">{submission.phone || "-"}</p>
            </div>
            <div>
              <Label>Sujet</Label>
              <p className="font-medium">{submission.subject}</p>
            </div>
          </div>

          <div className="mb-6">
            <Label>Message</Label>
            <div className="p-4 bg-muted rounded-lg mt-2 whitespace-pre-wrap">
              {submission.message}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <Label>Date de réception</Label>
              <p>{new Date(submission.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
            </div>
            <div>
              <Label>Statut</Label>
              <div className="mt-2">{getStatusBadge(submission.status)}</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-display text-xl mb-4">Actions rapides</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus("read")}
              disabled={saving || submission.status === "read"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer comme lu
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus("archived")}
              disabled={saving || submission.status === "archived"}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>

          <div className="border-t pt-4">
            <Label>Changer le statut</Label>
            <Select
              value={submission.status}
              onValueChange={handleUpdateStatus}
              disabled={saving}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="read">Lu</SelectItem>
                <SelectItem value="replied">Répondu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-display text-xl mb-4">Répondre</h3>
          <div className="space-y-4">
            <div>
              <Label>Votre réponse</Label>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Écrivez votre réponse ici..."
                rows={6}
                className="mt-2"
              />
            </div>
            <Button onClick={handleReply} disabled={saving || !reply.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer et marquer comme répondu"}
            </Button>
            {submission.reply && (
              <div className="border-t pt-4">
                <Label>Réponse précédente</Label>
                <div className="p-4 bg-muted rounded-lg mt-2 whitespace-pre-wrap">
                  {submission.reply}
                </div>
                {submission.repliedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Répondu le {new Date(submission.repliedAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
