"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Star,
  Mail,
  UserPlus,
  XCircle,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api-client";

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: AdminNotification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  BOOKING_CREATED: CalendarCheck,
  BOOKING_CONFIRMED: CalendarCheck,
  BOOKING_CANCELLED: XCircle,
  PAYMENT_SUCCESS: CreditCard,
  PAYMENT_FAILED: CreditCard,
  REVIEW_CREATED: Star,
  CONTACT_MESSAGE: Mail,
  USER_REGISTERED: UserPlus,
};

const TYPE_LABELS: Record<string, string> = {
  BOOKING_CREATED: "Réservation",
  BOOKING_CONFIRMED: "Réservation",
  BOOKING_CANCELLED: "Annulation",
  PAYMENT_SUCCESS: "Paiement",
  PAYMENT_FAILED: "Paiement",
  REVIEW_CREATED: "Avis",
  CONTACT_MESSAGE: "Contact",
  USER_REGISTERED: "Utilisateur",
};

const PULL_THRESHOLD = 70;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pull-to-refresh
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      const data = await api.get<NotificationsResponse>("/api/admin/notifications", {
        params: { page: String(pageNum), limit: "30" },
      });
      setNotifications((prev) => (append ? [...prev, ...data.notifications] : data.notifications));
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch {
      // silencieux
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    setRefreshing(false);
  }, [fetchNotifications]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchNotifications(page + 1, true);
    setLoadingMore(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await fetchNotifications(1);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchNotifications]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || touchStartY.current === null) return;
    const distance = e.touches[0].clientY - touchStartY.current;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance / 2, PULL_THRESHOLD + 30));
    }
  };

  const onTouchEnd = async () => {
    if (pulling.current && pullDistance >= PULL_THRESHOLD) {
      await refresh();
    }
    pulling.current = false;
    touchStartY.current = null;
    setPullDistance(0);
  };

  const markRead = async (n: AdminNotification) => {
    if (!n.read) {
      try {
        await api.patch("/api/admin/notifications", { id: n.id });
      } catch {
        // silencieux
      }
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/admin/notifications", { all: true });
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicateur pull-to-refresh */}
      <div
        className="flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 40 : 0) : 0 }}
      >
        <RefreshCw
          className={`h-5 w-5 text-primary ${refreshing || pullDistance >= PULL_THRESHOLD ? "animate-spin" : ""}`}
          style={{ opacity: Math.min(1, pullDistance / PULL_THRESHOLD) }}
        />
      </div>

      <PageHeader
        title="Notifications"
        description={`${total} notification${total > 1 ? "s" : ""} · ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout marquer lu
              </Button>
            )}
          </div>
        }
      />

      <div className="rounded-2xl bg-card border border-border">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full flex items-start gap-4 p-5 text-left hover:bg-muted/50 transition-colors ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-10 w-10 shrink-0 grid place-items-center rounded-full ${
                        n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{n.title}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {TYPE_LABELS[n.type] || n.type}
                        </span>
                      </span>
                      <span className="block text-sm text-muted-foreground mt-1">{n.message}</span>
                      <span className="block text-xs text-muted-foreground/70 mt-1.5">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
            {hasMore && (
              <div className="p-4 border-t border-border text-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Chargement..." : "Charger plus"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
