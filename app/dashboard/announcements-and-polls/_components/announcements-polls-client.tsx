"use client";

import { FilePenLine, Loader2, Megaphone, Vote } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type {
  AnnouncementCreatePayload,
  AnnouncementRecord,
  FeedItemRecord,
  PollCreatePayload,
  PollRecord,
  PollVotePayload,
} from "@/lib/performance-updates";
import { toast } from "@/lib/toast";

type FilterType = "all" | "announcement" | "poll";

type RequestError = {
  detail?: string;
};

async function requestJson<T>(pathname: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(pathname, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | T
    | RequestError
    | null;

  if (!response.ok) {
    throw new Error(
      (payload as RequestError | null)?.detail ?? "Request failed.",
    );
  }

  return payload as T;
}

function statusVariant(
  status: string,
): "secondary" | "outline" | "destructive" {
  if (status === "published") {
    return "secondary";
  }
  if (status === "archived") {
    return "destructive";
  }
  return "outline";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function itemTypeLabel(itemType: "announcement" | "poll") {
  return itemType === "announcement" ? "Announcement" : "Poll";
}

function itemTypeAccentClasses(_itemType: "announcement" | "poll") {
  return "border-border/70 bg-card";
}

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function AnnouncementsPollsClient({ isStaff }: { isStaff: boolean }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [feed, setFeed] = useState<FeedItemRecord[]>([]);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementSummary, setAnnouncementSummary] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollChoices, setPollChoices] = useState<string[]>(["", ""]);

  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [submittingPoll, setSubmittingPoll] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [archivedModalOpen, setArchivedModalOpen] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedAnnouncements, setArchivedAnnouncements] = useState<
    AnnouncementRecord[]
  >([]);
  const [archivedPolls, setArchivedPolls] = useState<PollRecord[]>([]);
  const [actionItemId, setActionItemId] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<FeedItemRecord | null>(null);
  const [highlightedItemKey, setHighlightedItemKey] = useState<string | null>(
    null,
  );
  const [voteSelectionByPoll, setVoteSelectionByPoll] = useState<
    Record<number, number[]>
  >({});
  const appliedDeepLinkItemKeyRef = useRef<string | null>(null);
  const deepLinkedAnnouncementId = parsePositiveInt(
    searchParams.get("announcement_id"),
  );
  const deepLinkedPollId = parsePositiveInt(searchParams.get("poll_id"));

  const loadFeed = useCallback(async (nextFilter: FilterType) => {
    try {
      const query =
        nextFilter === "all"
          ? ""
          : `?item_type=${encodeURIComponent(nextFilter)}`;
      const data = await requestJson<FeedItemRecord[]>(
        `/api/performance/feed${query}`,
      );
      setFeed(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load feed.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(filter);
  }, [filter, loadFeed]);

  useEffect(() => {
    if (deepLinkedAnnouncementId && filter !== "announcement") {
      setFilter("announcement");
      return;
    }
    if (deepLinkedPollId && filter !== "poll") {
      setFilter("poll");
    }
  }, [deepLinkedAnnouncementId, deepLinkedPollId, filter]);

  useEffect(() => {
    if (!deepLinkedAnnouncementId && !deepLinkedPollId) {
      return;
    }
    const matchedItem = feed.find((item) => {
      if (
        deepLinkedAnnouncementId &&
        item.item_type === "announcement" &&
        item.announcement
      ) {
        return item.announcement.id === deepLinkedAnnouncementId;
      }
      if (deepLinkedPollId && item.item_type === "poll" && item.poll) {
        return item.poll.id === deepLinkedPollId;
      }
      return false;
    });
    if (!matchedItem) {
      return;
    }

    const targetId =
      matchedItem.item_type === "announcement"
        ? matchedItem.announcement?.id
        : matchedItem.poll?.id;
    if (!targetId) {
      return;
    }

    const targetKey = `${matchedItem.item_type}-${targetId}`;
    if (appliedDeepLinkItemKeyRef.current === targetKey) {
      return;
    }
    appliedDeepLinkItemKeyRef.current = targetKey;
    setPreviewItem(matchedItem);
    setHighlightedItemKey(targetKey);
    requestAnimationFrame(() => {
      document
        .getElementById(`feed-card-${targetKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => {
      setHighlightedItemKey((current) =>
        current === targetKey ? null : current,
      );
    }, 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [deepLinkedAnnouncementId, deepLinkedPollId, feed]);

  const feedCountLabel = useMemo(() => {
    if (filter === "all") {
      return `${feed.length} item${feed.length === 1 ? "" : "s"}`;
    }
    return `${feed.length} ${filter}${feed.length === 1 ? "" : "s"}`;
  }, [feed.length, filter]);

  async function createAnnouncement(shouldPublish: boolean) {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setSubmittingAnnouncement(true);
    try {
      const payload: AnnouncementCreatePayload = {
        title: announcementTitle.trim(),
        summary: announcementSummary.trim() || null,
        content: announcementContent.trim(),
      };

      const created = await requestJson<{ id: number }>(
        "/api/performance/announcements",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (shouldPublish) {
        await requestJson(
          `/api/performance/announcements/${created.id}/publish`,
          {
            method: "POST",
          },
        );
      }

      setAnnouncementTitle("");
      setAnnouncementSummary("");
      setAnnouncementContent("");
      setAnnouncementModalOpen(false);
      toast.success(
        shouldPublish
          ? "Announcement published."
          : "Announcement draft created.",
      );
      await loadFeed(filter);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create announcement.",
      );
    } finally {
      setSubmittingAnnouncement(false);
    }
  }

  async function createPoll(shouldPublish: boolean) {
    const normalizedChoices = pollChoices
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (!pollQuestion.trim()) {
      toast.error("Poll question is required.");
      return;
    }

    if (normalizedChoices.length < 2) {
      toast.error("At least two poll choices are required.");
      return;
    }

    setSubmittingPoll(true);
    try {
      const payload: PollCreatePayload = {
        question: pollQuestion.trim(),
        description: pollDescription.trim() || null,
        allow_multiple_choices: pollAllowMultiple,
        choices: normalizedChoices.map((text) => ({ text })),
      };

      const created = await requestJson<{ id: number }>(
        "/api/performance/polls",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      if (shouldPublish) {
        await requestJson(`/api/performance/polls/${created.id}/publish`, {
          method: "POST",
        });
      }

      setPollQuestion("");
      setPollDescription("");
      setPollAllowMultiple(false);
      setPollChoices(["", ""]);
      setPollModalOpen(false);
      toast.success(shouldPublish ? "Poll published." : "Poll draft created.");
      await loadFeed(filter);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create poll.",
      );
    } finally {
      setSubmittingPoll(false);
    }
  }

  const loadArchivedItems = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const archivedFeed = await requestJson<FeedItemRecord[]>(
        "/api/performance/feed?include_archived=true",
      );
      setArchivedAnnouncements(
        archivedFeed
          .filter(
            (
              item,
            ): item is FeedItemRecord & { announcement: AnnouncementRecord } =>
              item.item_type === "announcement" && item.announcement !== null,
          )
          .map((item) => item.announcement),
      );
      setArchivedPolls(
        archivedFeed
          .filter(
            (item): item is FeedItemRecord & { poll: PollRecord } =>
              item.item_type === "poll" && item.poll !== null,
          )
          .map((item) => item.poll),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load archived items.",
      );
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  async function runAnnouncementAction(
    id: number,
    action: "publish" | "archive" | "unarchive" | "draft",
  ) {
    setActionItemId(id);
    try {
      await requestJson(`/api/performance/announcements/${id}/${action}`, {
        method: "POST",
      });
      const messageByAction = {
        publish: "Announcement published.",
        archive: "Announcement archived.",
        unarchive: "Announcement restored.",
        draft: "Announcement moved back to draft.",
      } as const;
      toast.success(messageByAction[action]);
      await loadFeed(filter);
      if (archivedModalOpen) {
        await loadArchivedItems();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setActionItemId(null);
    }
  }

  async function runPollAction(
    id: number,
    action: "publish" | "close" | "reopen" | "archive" | "unarchive",
  ) {
    setActionItemId(id);
    try {
      await requestJson(`/api/performance/polls/${id}/${action}`, {
        method: "POST",
      });
      const messageByAction = {
        publish: "Poll published.",
        close: "Poll closed.",
        reopen: "Poll reopened.",
        archive: "Poll archived.",
        unarchive: "Poll restored.",
      } as const;
      toast.success(messageByAction[action]);
      await loadFeed(filter);
      if (archivedModalOpen) {
        await loadArchivedItems();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setActionItemId(null);
    }
  }

  function setSingleChoiceSelection(pollId: number, choiceId: number) {
    setVoteSelectionByPoll((current) => ({
      ...current,
      [pollId]: [choiceId],
    }));
  }

  function toggleMultiChoiceSelection(
    pollId: number,
    choiceId: number,
    checked: boolean,
  ) {
    setVoteSelectionByPoll((current) => {
      const currentSelection = current[pollId] ?? [];
      const nextSelection = checked
        ? Array.from(new Set([...currentSelection, choiceId]))
        : currentSelection.filter((id) => id !== choiceId);
      return {
        ...current,
        [pollId]: nextSelection,
      };
    });
  }

  async function submitVote(poll: PollRecord) {
    const selectedChoiceIds = voteSelectionByPoll[poll.id] ?? [];
    if (selectedChoiceIds.length === 0) {
      toast.error("Select at least one choice.");
      return;
    }

    setActionItemId(poll.id);
    try {
      const payload: PollVotePayload = {
        choice_ids: selectedChoiceIds,
      };
      const updatedPoll = await requestJson<PollRecord>(
        `/api/performance/polls/${poll.id}/votes`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      setFeed((current) =>
        current.map((item) =>
          item.item_type === "poll" && item.poll?.id === updatedPoll.id
            ? { ...item, poll: updatedPoll }
            : item,
        ),
      );
      setPreviewItem((current) =>
        current?.item_type === "poll" && current.poll?.id === updatedPoll.id
          ? { ...current, poll: updatedPoll }
          : current,
      );
      setVoteSelectionByPoll((current) => ({
        ...current,
        [updatedPoll.id]: updatedPoll.user_vote_choice_ids,
      }));
      toast.success("Vote submitted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit vote.",
      );
    } finally {
      setActionItemId(null);
    }
  }

  const previewAnnouncement =
    previewItem?.item_type === "announcement" ? previewItem.announcement : null;
  const previewPoll =
    previewItem?.item_type === "poll" ? previewItem.poll : null;
  const previewPollHasSubmittedVote =
    previewPoll !== null && previewPoll.user_vote_choice_ids.length > 0;
  const showAnnouncementCreate = filter !== "poll";
  const showPollCreate = filter !== "announcement";

  useEffect(() => {
    if (archivedModalOpen) {
      void loadArchivedItems();
    }
  }, [archivedModalOpen, loadArchivedItems]);

  return (
    <div className="flex w-full flex-col gap-5">
      <Card className="overflow-hidden border-border/70 bg-card shadow-lg shadow-black/5">
        <CardHeader className="gap-4 border-b border-border/60 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                <Megaphone className="size-3.5" />
                Workspace Bulletin
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-xl tracking-tight sm:text-2xl">
                  Announcements and Polls
                </CardTitle>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Follow published announcements, scan active polls, and open
                  items without digging through notifications.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  {feedCountLabel}
                </div>
                <div className="rounded-full border border-border/60 bg-background/75 px-3 py-1.5">
                  {filter === "all"
                    ? "Showing all updates"
                    : `Filtered to ${filter}s`}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start rounded-2xl border border-border/60 bg-background/70 p-1.5">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "announcement" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl"
                onClick={() => setFilter("announcement")}
              >
                Announcements
              </Button>
              <Button
                variant={filter === "poll" ? "default" : "ghost"}
                size="sm"
                className="rounded-xl"
                onClick={() => setFilter("poll")}
              >
                Polls
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isStaff ? (
        <section className="flex flex-wrap items-center gap-2">
          {showAnnouncementCreate ? (
            <Dialog
              open={announcementModalOpen}
              onOpenChange={setAnnouncementModalOpen}
            >
              <Button onClick={() => setAnnouncementModalOpen(true)}>
                <Megaphone className="size-4" />
                New Announcement
              </Button>
              <DialogContent className="max-h-[90vh] w-[min(96vw,44rem)] !max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    Draft or publish an announcement for employees.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    value={announcementTitle}
                    onChange={(event) =>
                      setAnnouncementTitle(event.target.value)
                    }
                    placeholder="Title"
                  />
                  <Input
                    value={announcementSummary}
                    onChange={(event) =>
                      setAnnouncementSummary(event.target.value)
                    }
                    placeholder="Summary (optional)"
                  />
                  <Textarea
                    rows={6}
                    value={announcementContent}
                    onChange={(event) =>
                      setAnnouncementContent(event.target.value)
                    }
                    placeholder="Announcement content"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={submittingAnnouncement}
                      onClick={() => void createAnnouncement(false)}
                    >
                      {submittingAnnouncement ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Save Draft
                    </Button>
                    <Button
                      disabled={submittingAnnouncement}
                      onClick={() => void createAnnouncement(true)}
                    >
                      {submittingAnnouncement ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Publish
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

          {showPollCreate ? (
            <Dialog open={pollModalOpen} onOpenChange={setPollModalOpen}>
              <Button variant="outline" onClick={() => setPollModalOpen(true)}>
                <Vote className="size-4" />
                New Poll
              </Button>
              <DialogContent className="max-h-[90vh] w-[min(96vw,44rem)] !max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Poll</DialogTitle>
                  <DialogDescription>
                    Create a poll, then publish when ready.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    value={pollQuestion}
                    onChange={(event) => setPollQuestion(event.target.value)}
                    placeholder="Poll question"
                  />
                  <Textarea
                    rows={3}
                    value={pollDescription}
                    onChange={(event) => setPollDescription(event.target.value)}
                    placeholder="Description (optional)"
                  />
                  <div className="space-y-2 rounded-lg border border-border/70 p-3">
                    {pollChoices.map((choice, index) => (
                      <Input
                        key={`${index + 1}`}
                        value={choice}
                        onChange={(event) => {
                          const next = [...pollChoices];
                          next[index] = event.target.value;
                          setPollChoices(next);
                        }}
                        placeholder={`Choice ${index + 1}`}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPollChoices((current) => [...current, ""])
                      }
                    >
                      Add Choice
                    </Button>
                  </div>
                  <Label
                    htmlFor="allow-multiple-choices"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Checkbox
                      id="allow-multiple-choices"
                      checked={pollAllowMultiple}
                      onCheckedChange={(checked) =>
                        setPollAllowMultiple(checked === true)
                      }
                    />
                    Allow multiple choices
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={submittingPoll}
                      onClick={() => void createPoll(false)}
                    >
                      {submittingPoll ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Save Draft
                    </Button>
                    <Button
                      disabled={submittingPoll}
                      onClick={() => void createPoll(true)}
                    >
                      {submittingPoll ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Publish
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchivedModalOpen(true)}
          >
            Archived Items
          </Button>
        </section>
      ) : null}

      <section className="space-y-3">
        {loading ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading announcements and polls...
            </CardContent>
          </Card>
        ) : null}

        {!loading && feed.length === 0 ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardContent className="py-8 text-sm text-muted-foreground">
              No items yet.
            </CardContent>
          </Card>
        ) : null}

        {feed.map((item) => {
          if (item.item_type === "announcement" && item.announcement) {
            const announcement = item.announcement;
            const previewText = truncateText(
              announcement.summary ?? announcement.content,
              180,
            );

            return (
              <Card
                id={`feed-card-announcement-${announcement.id}`}
                key={`announcement-${announcement.id}`}
                className={
                  highlightedItemKey === `announcement-${announcement.id}`
                    ? `shadow-lg shadow-black/5 ring-1 ring-border ${itemTypeAccentClasses("announcement")}`
                    : `shadow-md shadow-black/5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${itemTypeAccentClasses("announcement")}`
                }
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                        <Megaphone className="size-3.5" />
                        {itemTypeLabel("announcement")}
                      </div>
                      <CardTitle className="max-w-3xl text-lg tracking-tight sm:text-xl">
                        {announcement.title}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={statusVariant(announcement.status)}
                      className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                    >
                      {announcement.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span>
                      {announcement.status === "published"
                        ? `Published ${formatDate(announcement.published_at)}`
                        : `Created ${formatDate(announcement.created_at)}`}
                    </span>
                    {announcement.summary ? (
                      <span className="rounded-full bg-background/80 px-2.5 py-1">
                        Summary Available
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="space-y-3">
                      {announcement.summary ? (
                        <p className="max-w-3xl text-sm font-medium leading-6 text-foreground/85">
                          {announcement.summary}
                        </p>
                      ) : null}
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {previewText}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-background/80"
                      onClick={() => setPreviewItem(item)}
                    >
                      Read Notice
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {isStaff && announcement.status === "draft" ? (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={actionItemId === announcement.id}
                        onClick={() =>
                          void runAnnouncementAction(announcement.id, "publish")
                        }
                      >
                        Publish
                      </Button>
                    ) : null}
                    {isStaff && announcement.status === "published" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl bg-background/80"
                        disabled={actionItemId === announcement.id}
                        onClick={() =>
                          void runAnnouncementAction(announcement.id, "draft")
                        }
                      >
                        <FilePenLine className="size-4" />
                        Move To Draft
                      </Button>
                    ) : null}
                    {isStaff && announcement.status !== "archived" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={actionItemId === announcement.id}
                        onClick={() =>
                          void runAnnouncementAction(announcement.id, "archive")
                        }
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          }

          if (item.item_type === "poll" && item.poll) {
            const poll = item.poll;
            const totalVotes = poll.choices.reduce(
              (sum, choice) => sum + choice.vote_count,
              0,
            );

            return (
              <Card
                id={`feed-card-poll-${poll.id}`}
                key={`poll-${poll.id}`}
                className={
                  highlightedItemKey === `poll-${poll.id}`
                    ? `shadow-lg shadow-black/5 ring-1 ring-border ${itemTypeAccentClasses("poll")}`
                    : `shadow-md shadow-black/5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${itemTypeAccentClasses("poll")}`
                }
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                        <Vote className="size-3.5" />
                        {itemTypeLabel("poll")}
                      </div>
                      <CardTitle className="max-w-3xl text-lg tracking-tight sm:text-xl">
                        {poll.question}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={statusVariant(poll.status)}
                      className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                    >
                      {poll.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span>
                      {poll.status === "published"
                        ? `Published ${formatDate(poll.published_at)}`
                        : `Created ${formatDate(poll.created_at)}`}
                    </span>
                    <span className="rounded-full bg-background/80 px-2.5 py-1">
                      {poll.choices.length} choice
                      {poll.choices.length === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-background/80 px-2.5 py-1">
                      {totalVotes} total vote{totalVotes === 1 ? "" : "s"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="space-y-3">
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {truncateText(
                          poll.description ??
                            "Open the poll to review choices and cast a vote.",
                          180,
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-background/80"
                      onClick={() => setPreviewItem(item)}
                    >
                      {poll.status === "published"
                        ? "Participate"
                        : "View Poll"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    {isStaff && poll.status === "draft" ? (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={actionItemId === poll.id}
                        onClick={() => void runPollAction(poll.id, "publish")}
                      >
                        Publish
                      </Button>
                    ) : null}
                    {isStaff && poll.status === "published" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl bg-background/80"
                        disabled={actionItemId === poll.id}
                        onClick={() => void runPollAction(poll.id, "close")}
                      >
                        Close
                      </Button>
                    ) : null}
                    {isStaff && poll.status === "closed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl bg-background/80"
                        disabled={actionItemId === poll.id}
                        onClick={() => void runPollAction(poll.id, "reopen")}
                      >
                        Reopen
                      </Button>
                    ) : null}
                    {isStaff && poll.status !== "archived" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={actionItemId === poll.id}
                        onClick={() => void runPollAction(poll.id, "archive")}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          }

          return null;
        })}
      </section>

      <Dialog open={archivedModalOpen} onOpenChange={setArchivedModalOpen}>
        <DialogContent className="max-h-[90vh] w-[min(96vw,52rem)] !max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived Items</DialogTitle>
            <DialogDescription>
              Restore archived announcements and polls back into the feed.
            </DialogDescription>
          </DialogHeader>

          {archivedLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading archived items...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Announcements</h3>
                {archivedAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No archived announcements.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivedAnnouncements.map((announcement) => (
                      <div
                        key={`archived-announcement-${announcement.id}`}
                        className="rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {announcement.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Archived {formatDate(announcement.archived_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={actionItemId === announcement.id}
                            onClick={() =>
                              void runAnnouncementAction(
                                announcement.id,
                                "unarchive",
                              )
                            }
                          >
                            Unarchive
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">Polls</h3>
                {archivedPolls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No archived polls.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {archivedPolls.map((poll) => (
                      <div
                        key={`archived-poll-${poll.id}`}
                        className="rounded-lg border border-border/70 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {poll.question}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Archived {formatDate(poll.archived_at)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            disabled={actionItemId === poll.id}
                            onClick={() =>
                              void runPollAction(poll.id, "unarchive")
                            }
                          >
                            Unarchive
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewItem(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[min(96vw,52rem)] !max-w-4xl overflow-y-auto border-border/70 bg-background p-0 shadow-2xl shadow-black/10">
          {previewAnnouncement ? (
            <>
              <DialogHeader className="gap-4 border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      <Megaphone className="size-3.5" />
                      Announcement
                    </div>
                    <DialogTitle className="max-w-3xl text-xl leading-tight tracking-tight sm:text-2xl">
                      {previewAnnouncement.title}
                    </DialogTitle>
                  </div>
                  <Badge
                    variant={statusVariant(previewAnnouncement.status)}
                    className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                  >
                    {previewAnnouncement.status}
                  </Badge>
                </div>
                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span>
                    {previewAnnouncement.status === "published"
                      ? `Published ${formatDate(previewAnnouncement.published_at)}`
                      : `Created ${formatDate(previewAnnouncement.created_at)}`}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                {previewAnnouncement.summary ? (
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      Summary
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-foreground/85">
                      {previewAnnouncement.summary}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-border/60 bg-background/78 p-3 sm:p-4">
                  <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                    Full Notice
                  </p>
                  <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">
                    {previewAnnouncement.content}
                  </p>
                </div>
              </div>
              {isStaff ? (
                <div className="flex flex-wrap gap-2 border-t border-border/60 px-5 py-4 sm:px-6">
                  {previewAnnouncement.status === "draft" ? (
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={actionItemId === previewAnnouncement.id}
                      onClick={() =>
                        void runAnnouncementAction(
                          previewAnnouncement.id,
                          "publish",
                        )
                      }
                    >
                      Publish
                    </Button>
                  ) : null}
                  {previewAnnouncement.status === "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-background/80"
                      disabled={actionItemId === previewAnnouncement.id}
                      onClick={() =>
                        void runAnnouncementAction(
                          previewAnnouncement.id,
                          "draft",
                        )
                      }
                    >
                      <FilePenLine className="size-4" />
                      Move To Draft
                    </Button>
                  ) : null}
                  {previewAnnouncement.status !== "archived" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      disabled={actionItemId === previewAnnouncement.id}
                      onClick={() =>
                        void runAnnouncementAction(
                          previewAnnouncement.id,
                          "archive",
                        )
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {previewPoll ? (
            <>
              <DialogHeader className="gap-4 border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      <Vote className="size-3.5" />
                      Poll
                    </div>
                    <DialogTitle className="max-w-3xl text-xl leading-tight tracking-tight sm:text-2xl">
                      {previewPoll.question}
                    </DialogTitle>
                  </div>
                  <Badge
                    variant={statusVariant(previewPoll.status)}
                    className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em]"
                  >
                    {previewPoll.status}
                  </Badge>
                </div>
                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span>
                    {previewPoll.status === "published"
                      ? `Published ${formatDate(previewPoll.published_at)}`
                      : `Created ${formatDate(previewPoll.created_at)}`}
                  </span>
                  <span className="rounded-full border border-border/60 bg-background/75 px-2.5 py-1">
                    {previewPoll.choices.length} choice
                    {previewPoll.choices.length === 1 ? "" : "s"}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                {previewPoll.description ? (
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      Description
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-foreground/85">
                      {previewPoll.description}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                      Choices
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total votes:{" "}
                      {previewPoll.choices.reduce(
                        (sum, choice) => sum + choice.vote_count,
                        0,
                      )}
                    </p>
                  </div>
                  {(() => {
                    const sortedChoices = previewPoll.choices
                      .slice()
                      .sort((left, right) => left.position - right.position);
                    const selectedChoiceIds =
                      voteSelectionByPoll[previewPoll.id] ??
                      previewPoll.user_vote_choice_ids ??
                      [];
                    const selectedChoiceId = selectedChoiceIds[0]
                      ? String(selectedChoiceIds[0])
                      : "";

                    if (previewPoll.allow_multiple_choices) {
                      return (
                        <div className="space-y-3">
                          {sortedChoices.map((choice) => {
                            const checked = selectedChoiceIds.includes(
                              choice.id,
                            );
                            const controlId = `preview-poll-${previewPoll.id}-choice-${choice.id}`;
                            return (
                              <div
                                key={choice.id}
                                className="rounded-xl border border-border/60 bg-background/78 p-3.5 transition-colors hover:bg-background"
                              >
                                <Label
                                  htmlFor={controlId}
                                  className="flex cursor-pointer items-start justify-between gap-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      id={controlId}
                                      checked={checked}
                                      disabled={
                                        previewPoll.status !== "published" ||
                                        previewPollHasSubmittedVote
                                      }
                                      onCheckedChange={(value) =>
                                        toggleMultiChoiceSelection(
                                          previewPoll.id,
                                          choice.id,
                                          value === true,
                                        )
                                      }
                                    />
                                    <span className="text-sm leading-6">
                                      {choice.text}
                                    </span>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                                    {choice.vote_count} vote
                                    {choice.vote_count === 1 ? "" : "s"}
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <RadioGroup
                        value={selectedChoiceId}
                        disabled={
                          previewPoll.status !== "published" ||
                          previewPollHasSubmittedVote
                        }
                        onValueChange={(value) => {
                          const choiceId = Number(value);
                          if (Number.isNaN(choiceId)) {
                            return;
                          }
                          setSingleChoiceSelection(previewPoll.id, choiceId);
                        }}
                        className="space-y-3"
                      >
                        {sortedChoices.map((choice) => {
                          const controlId = `preview-poll-${previewPoll.id}-choice-${choice.id}`;
                          return (
                            <div
                              key={choice.id}
                              className="rounded-xl border border-border/60 bg-background/78 p-3.5 transition-colors hover:bg-background"
                            >
                              <Label
                                htmlFor={controlId}
                                className="flex cursor-pointer items-start justify-between gap-3"
                              >
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem
                                    id={controlId}
                                    value={String(choice.id)}
                                  />
                                  <span className="text-sm leading-6">
                                    {choice.text}
                                  </span>
                                </div>
                                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                                  {choice.vote_count} vote
                                  {choice.vote_count === 1 ? "" : "s"}
                                </span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    );
                  })()}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-4 sm:px-6">
                {previewPollHasSubmittedVote ? (
                  <p className="text-xs text-muted-foreground">
                    Your vote has already been submitted.
                  </p>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap gap-2">
                  {previewPoll.status === "published" &&
                  !previewPollHasSubmittedVote ? (
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={actionItemId === previewPoll.id}
                      onClick={() => void submitVote(previewPoll)}
                    >
                      <Vote className="size-4" />
                      Submit Vote
                    </Button>
                  ) : null}

                  {isStaff && previewPoll.status === "draft" ? (
                    <Button
                      size="sm"
                      className="rounded-xl"
                      disabled={actionItemId === previewPoll.id}
                      onClick={() =>
                        void runPollAction(previewPoll.id, "publish")
                      }
                    >
                      Publish
                    </Button>
                  ) : null}

                  {isStaff && previewPoll.status === "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-background/80"
                      disabled={actionItemId === previewPoll.id}
                      onClick={() =>
                        void runPollAction(previewPoll.id, "close")
                      }
                    >
                      Close
                    </Button>
                  ) : null}
                  {isStaff && previewPoll.status === "closed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl bg-background/80"
                      disabled={actionItemId === previewPoll.id}
                      onClick={() =>
                        void runPollAction(previewPoll.id, "reopen")
                      }
                    >
                      Reopen
                    </Button>
                  ) : null}

                  {isStaff && previewPoll.status !== "archived" ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      disabled={actionItemId === previewPoll.id}
                      onClick={() =>
                        void runPollAction(previewPoll.id, "archive")
                      }
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
