import { useState, useEffect, useRef } from "react";
import { Bell, BellDot, CheckCheck, Crown, Info, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcon = (type: string) => {
  if (type === "upgrade") return <Crown className="h-4 w-4 text-amber-500 shrink-0" />;
  if (type === "warning") return <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />;
  return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function fetchUnreadCount() {
    try {
      const data = await api.notifications.unreadCount();
      setUnread(data.count);
    } catch {}
  }

  async function handleOpen() {
    if (!open) {
      setOpen(true);
      setLoading(true);
      try {
        const data = await api.notifications.list();
        setNotifications(data);
        setUnread(data.filter((n: Notification) => !n.read).length);
      } catch {} finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }

  async function markRead(id: string) {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="relative h-9 w-9"
        aria-label="الإشعارات"
      >
        {unread > 0 ? (
          <BellDot className="h-5 w-5 text-foreground" />
        ) : (
          <Bell className="h-5 w-5 text-muted-foreground" />
        )}
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={`absolute top-11 ${isRtl ? "left-0" : "right-0"} w-80 bg-background border rounded-xl shadow-xl z-50 overflow-hidden`}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">الإشعارات</span>
              {unread > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px]">{unread}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground" onClick={markAllRead}>
                  <CheckCheck className="h-3 w-3" />
                  قراءة الكل
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/40 ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className="mt-0.5">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
