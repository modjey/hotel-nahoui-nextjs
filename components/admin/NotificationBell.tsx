"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Star,
  Mail,
  UserPlus,
  XCircle,
  CheckCheck,
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: AdminNotification[]; unreadCount: number }>(
        "/api/admin/notifications"
      );
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silencieux : la cloche ne doit pas casser l'admin
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
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
    <div className="relative" ref={ref}>
      <button
        className="h-10 w-10 grid place-items-center rounded-full hover:bg-secondary relative"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-w-[90vw] rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">
                Aucune notification
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0 ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-8 w-8 shrink-0 grid place-items-center rounded-full ${
                        n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{n.title}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/70 mt-1">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/admin/notifications");
            }}
            className="w-full px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/60 border-t border-border"
          >
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}
