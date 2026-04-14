"use client";

import { Bell, CheckCheck, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type NotificationItem = {
  id: number;
  content: string;
  url: string | null;
  read: boolean;
  created_at: string;
};

type UnreadCountResponse = {
  unread_count: number;
};

const INITIAL_VISIBLE_NOTIFICATIONS = 8;
const VISIBLE_NOTIFICATIONS_STEP = 8;

function formatTimeLabel(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const diffMs = parsed.getTime() - Date.now();
  const absoluteMinutes = Math.round(Math.abs(diffMs) / 60000);
  if (absoluteMinutes < 1) {
    return "just now";
  }
  if (absoluteMinutes < 60) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(Math.round(diffMs / 60000), "minute");
  }
  const absoluteHours = Math.round(Math.abs(diffMs) / 3600000);
  if (absoluteHours < 24) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(Math.round(diffMs / 3600000), "hour");
  }

  return parsed.toLocaleDateString();
}

export function SidebarNotificationMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_NOTIFICATIONS,
  );

  const loadUnreadCount = useCallback(async () => {
    const response = await fetch("/api/notifications/unread-count", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Unable to load unread notifications.");
    }
    const payload = (await response.json()) as UnreadCountResponse;
    setUnreadCount(Math.max(0, payload.unread_count || 0));
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/notifications?limit=200", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }
      const payload = (await response.json()) as NotificationItem[];
      setNotifications(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load notifications.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void refreshNotifications();
  }, [open, refreshNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingAllRead || unreadCount === 0) {
      return;
    }
    setIsMarkingAllRead(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Unable to mark all notifications as read.");
      }
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to mark all notifications as read.";
      setErrorMessage(message);
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [isMarkingAllRead, unreadCount]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setErrorMessage(null);
      setVisibleCount(INITIAL_VISIBLE_NOTIFICATIONS);
    }
  }, []);

  const handleNotificationClick = useCallback(
    async (notification: NotificationItem) => {
      if (!notification.read) {
        try {
          const response = await fetch(
            `/api/notifications/${notification.id}/read`,
            {
              method: "POST",
            },
          );
          if (response.ok) {
            setNotifications((current) =>
              current.map((item) =>
                item.id === notification.id ? { ...item, read: true } : item,
              ),
            );
            setUnreadCount((current) => Math.max(0, current - 1));
          }
        } catch {
          // Best-effort mark-read for navigation action.
        }
      }

      if (notification.url) {
        setOpen(false);
        router.push(notification.url);
      }
    },
    [router],
  );

  const hasNotifications = useMemo(
    () => notifications.length > 0,
    [notifications],
  );
  const visibleNotifications = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount],
  );
  const hasMoreToShow = useMemo(
    () => notifications.length > visibleNotifications.length,
    [notifications.length, visibleNotifications.length],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="relative rounded-2xl"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
          ) : null}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(44rem,calc(100%-2rem))] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You have {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[26rem] space-y-1 overflow-y-auto px-2 py-2">
          {isLoading ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Loading notifications...
            </p>
          ) : null}

          {errorMessage ? (
            <p className="px-2 py-3 text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {!isLoading && !errorMessage && !hasNotifications ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : null}

          {!isLoading && !errorMessage
            ? visibleNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/50"
                    onClick={() => void handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-muted-foreground/30" : "bg-primary"}`}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {notification.content}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {formatTimeLabel(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                  {index < visibleNotifications.length - 1 ? (
                    <Separator className="mt-2" />
                  ) : null}
                </div>
              ))
            : null}

          {!isLoading && !errorMessage && hasMoreToShow ? (
            <div className="px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() =>
                  setVisibleCount((current) =>
                    Math.min(
                      notifications.length,
                      current + VISIBLE_NOTIFICATIONS_STEP,
                    ),
                  )
                }
              >
                <ChevronDown className="size-4" />
                See More
              </Button>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 justify-center rounded-none border-t bg-muted/30 px-4 py-3 sm:justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleMarkAllRead()}
            disabled={isMarkingAllRead || unreadCount === 0}
          >
            <CheckCheck className="size-4" />
            {isMarkingAllRead ? "Marking..." : "Mark All Read"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
