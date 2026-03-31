"use client";

import { Loader2, Megaphone, Vote } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  AnnouncementCreatePayload,
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

export function AnnouncementsPollsClient({ isStaff }: { isStaff: boolean }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [actionItemId, setActionItemId] = useState<number | null>(null);
  const [voteSelectionByPoll, setVoteSelectionByPoll] = useState<
    Record<number, number[]>
  >({});

  const loadFeed = useCallback(
    async (nextFilter: FilterType, showSpinner: boolean) => {
      if (showSpinner) {
        setRefreshing(true);
      }

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
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadFeed(filter, false);
  }, [filter, loadFeed]);

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
      toast.success(
        shouldPublish
          ? "Announcement published."
          : "Announcement draft created.",
      );
      await loadFeed(filter, true);
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
      toast.success(shouldPublish ? "Poll published." : "Poll draft created.");
      await loadFeed(filter, true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create poll.",
      );
    } finally {
      setSubmittingPoll(false);
    }
  }

  async function runAnnouncementAction(
    id: number,
    action: "publish" | "archive",
  ) {
    setActionItemId(id);
    try {
      await requestJson(`/api/performance/announcements/${id}/${action}`, {
        method: "POST",
      });
      toast.success(`Announcement ${action}d.`);
      await loadFeed(filter, true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setActionItemId(null);
    }
  }

  async function runPollAction(
    id: number,
    action: "publish" | "close" | "archive",
  ) {
    setActionItemId(id);
    try {
      await requestJson(`/api/performance/polls/${id}/${action}`, {
        method: "POST",
      });
      toast.success(`Poll ${action}d.`);
      await loadFeed(filter, true);
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
      await requestJson(`/api/performance/polls/${poll.id}/votes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Vote submitted.");
      await loadFeed(filter, true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit vote.",
      );
    } finally {
      setActionItemId(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Announcements and Polls</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {feedCountLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "announcement" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("announcement")}
            >
              Announcements
            </Button>
            <Button
              variant={filter === "poll" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("poll")}
            >
              Polls
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadFeed(filter, true)}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isStaff ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="size-4" />
                Create Announcement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="Title"
              />
              <Input
                value={announcementSummary}
                onChange={(event) => setAnnouncementSummary(event.target.value)}
                placeholder="Summary (optional)"
              />
              <Textarea
                rows={5}
                value={announcementContent}
                onChange={(event) => setAnnouncementContent(event.target.value)}
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
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Vote className="size-4" />
                Create Poll
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  onClick={() => setPollChoices((current) => [...current, ""])}
                >
                  Add Choice
                </Button>
              </div>
              <label
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
              </label>
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
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        {loading || refreshing ? (
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
            return (
              <Card
                key={`announcement-${announcement.id}`}
                className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">
                      {announcement.title}
                    </CardTitle>
                    <Badge variant={statusVariant(announcement.status)}>
                      {announcement.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {announcement.status === "published"
                      ? `Published ${formatDate(announcement.published_at)}`
                      : `Created ${formatDate(announcement.created_at)}`}
                  </p>
                  {announcement.summary ? (
                    <p className="text-sm text-muted-foreground">
                      {announcement.summary}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  {isStaff ? (
                    <div className="flex gap-2">
                      {announcement.status === "draft" ? (
                        <Button
                          size="sm"
                          disabled={actionItemId === announcement.id}
                          onClick={() =>
                            void runAnnouncementAction(
                              announcement.id,
                              "publish",
                            )
                          }
                        >
                          Publish
                        </Button>
                      ) : null}
                      {announcement.status !== "archived" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionItemId === announcement.id}
                          onClick={() =>
                            void runAnnouncementAction(
                              announcement.id,
                              "archive",
                            )
                          }
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          }

          if (item.item_type === "poll" && item.poll) {
            const poll = item.poll;
            const selectedChoiceIds =
              voteSelectionByPoll[poll.id] ?? poll.user_vote_choice_ids ?? [];
            const totalVotes = poll.choices.reduce(
              (sum, choice) => sum + choice.vote_count,
              0,
            );

            return (
              <Card
                key={`poll-${poll.id}`}
                className="border-border/70 bg-card/85 shadow-lg shadow-black/5"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">{poll.question}</CardTitle>
                    <Badge variant={statusVariant(poll.status)}>
                      {poll.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {poll.status === "published"
                      ? `Published ${formatDate(poll.published_at)}`
                      : `Created ${formatDate(poll.created_at)}`}
                  </p>
                  {poll.description ? (
                    <p className="text-sm text-muted-foreground">
                      {poll.description}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {poll.choices
                      .slice()
                      .sort((left, right) => left.position - right.position)
                      .map((choice) => {
                        const checked = selectedChoiceIds.includes(choice.id);
                        const controlId = `poll-${poll.id}-choice-${choice.id}`;
                        return (
                          <div
                            key={choice.id}
                            className="rounded-lg border border-border/70 p-3"
                          >
                            <label
                              htmlFor={controlId}
                              className="flex cursor-pointer items-start justify-between gap-3"
                            >
                              <div className="flex items-start gap-2">
                                {poll.allow_multiple_choices ? (
                                  <Checkbox
                                    id={controlId}
                                    checked={checked}
                                    disabled={poll.status !== "published"}
                                    onCheckedChange={(value) =>
                                      toggleMultiChoiceSelection(
                                        poll.id,
                                        choice.id,
                                        value === true,
                                      )
                                    }
                                  />
                                ) : (
                                  <input
                                    id={controlId}
                                    type="radio"
                                    name={`poll-${poll.id}`}
                                    checked={checked}
                                    disabled={poll.status !== "published"}
                                    onChange={() =>
                                      setSingleChoiceSelection(
                                        poll.id,
                                        choice.id,
                                      )
                                    }
                                  />
                                )}
                                <span className="text-sm">{choice.text}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {choice.vote_count} vote
                                {choice.vote_count === 1 ? "" : "s"}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Total votes: {totalVotes}
                    </p>
                    <div className="flex gap-2">
                      {poll.status === "published" ? (
                        <Button
                          size="sm"
                          disabled={actionItemId === poll.id}
                          onClick={() => void submitVote(poll)}
                        >
                          Submit vote
                        </Button>
                      ) : null}

                      {isStaff && poll.status === "draft" ? (
                        <Button
                          size="sm"
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
                          disabled={actionItemId === poll.id}
                          onClick={() => void runPollAction(poll.id, "close")}
                        >
                          Close
                        </Button>
                      ) : null}

                      {isStaff && poll.status !== "archived" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionItemId === poll.id}
                          onClick={() => void runPollAction(poll.id, "archive")}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return null;
        })}
      </section>
    </div>
  );
}
