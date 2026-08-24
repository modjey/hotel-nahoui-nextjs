"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { api } from "@/lib/api-client";
import { Star, Check, X, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Review = {
  id: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  room: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [filter, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ reviews: Review[]; total: number; page: number; limit: number; totalPages: number }>("/api/admin/reviews", {
        params: {
          ...(filter !== "ALL" ? { status: filter } : {}),
          page: page.toString(),
          limit: "10",
        },
      });
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Erreur chargement avis:", err);
      toast.error("Erreur lors du chargement des avis");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/api/admin/reviews/${id}`, { status: "APPROVED" });
      toast.success("Avis approuvé");
      fetchReviews();
    } catch (err) {
      console.error("Erreur approbation:", err);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/api/admin/reviews/${id}`, { status: "REJECTED" });
      toast.success("Avis rejeté");
      fetchReviews();
    } catch (err) {
      console.error("Erreur rejet:", err);
      toast.error("Erreur lors du rejet");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) return;
    try {
      await api.del(`/api/admin/reviews/${id}`);
      toast.success("Avis supprimé");
      fetchReviews();
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleFilterChange = (newFilter: "ALL" | "PENDING" | "APPROVED" | "REJECTED") => {
    setFilter(newFilter);
    setPage(1);
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
  };

  return (
    <div>
      <PageHeader title="Avis" description="Modérez les avis clients et gérez les commentaires." />

      <div className="mt-6">
        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {status === "ALL" ? "Tous" : statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-card border border-border p-10 grid place-items-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-10 grid place-items-center text-sm text-muted-foreground">
            Aucun avis trouvé
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-card border border-border p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.rating}/5</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[review.status]}`}
                      >
                        {statusLabels[review.status]}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-3">{review.comment}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Par: {review.user.name || review.user.email || "Anonyme"}</span>
                      <span>•</span>
                      <span>Chambre: {review.room.name}</span>
                      <span>•</span>
                      <span>{format(new Date(review.createdAt), "dd MMM yyyy HH:mm", { locale: fr })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="h-8 w-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center hover:bg-green-200 transition-colors"
                          title="Approuver"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          className="h-8 w-8 rounded-full bg-red-100 text-red-800 flex items-center justify-center hover:bg-red-200 transition-colors"
                          title="Rejeter"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="h-8 w-8 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

