"use client";

import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  buildDisplayName,
  requestJson,
} from "@/app/dashboard/hr/users/_components/user-management-client";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/lib/toast";
import type {
  TrainingParticipantRecord,
  TrainingParticipantsReplacePayload,
  TrainingRecord,
  TrainingStatusUpdatePayload,
} from "@/lib/trainings";
import type { AuthUser } from "@/types/auth";

type UsersResponse = AuthUser[];

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateOnlyLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

async function uploadAttachment(
  trainingId: string,
  participantId: number,
  file: File,
): Promise<TrainingRecord> {
  const formData = new FormData();
  formData.append("uploaded_file", file);

  const response = await fetch(
    `/api/trainings/${trainingId}/participants/${participantId}/attachments`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | TrainingRecord
    | { detail?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string } | null)?.detail ?? "Upload failed.",
    );
  }
  return payload as TrainingRecord;
}

export function TrainingDetailClient({ trainingId }: { trainingId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingParticipants, setIsSavingParticipants] = useState(false);
  const [isRemovingParticipantId, setIsRemovingParticipantId] = useState<
    string | null
  >(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingFiles, setIsSavingFiles] = useState(false);
  const [training, setTraining] = useState<TrainingRecord | null>(null);
  const [users, setUsers] = useState<UsersResponse>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [pendingAddUserIds, setPendingAddUserIds] = useState<string[]>([]);
  const [fileManagerUserId, setFileManagerUserId] = useState<string | null>(
    null,
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  async function refreshTraining() {
    const fresh = await requestJson<TrainingRecord>(
      `/api/trainings/${trainingId}`,
    );
    setTraining(fresh);
    setPendingAddUserIds([]);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        const [trainingPayload, usersPayload] = await Promise.all([
          requestJson<TrainingRecord>(`/api/trainings/${trainingId}`),
          requestJson<UsersResponse>(
            "/api/users?include_superusers=true&active_only=true",
          ),
        ]);

        if (cancelled) {
          return;
        }

        setTraining(trainingPayload);
        setUsers(usersPayload);
        setPendingAddUserIds([]);
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            toast.error("Session expired. Please login again.");
            return;
          }
          toast.error(
            error instanceof Error ? error.message : "Unable to load training.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [trainingId]);

  const visibleUsers = useMemo(() => {
    const query = participantSearch.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => {
      const displayName = buildDisplayName(user) || user.email;
      const departmentCode = user.department?.code ?? "";
      return (
        displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        departmentCode.toLowerCase().includes(query)
      );
    });
  }, [participantSearch, users]);

  const savedParticipantUserIds = useMemo(
    () =>
      new Set(
        training?.participants.map((participant) => participant.user_id) ?? [],
      ),
    [training],
  );

  const availableUsers = useMemo(
    () => visibleUsers.filter((user) => !savedParticipantUserIds.has(user.id)),
    [savedParticipantUserIds, visibleUsers],
  );

  const savedParticipants = useMemo(
    () =>
      (training?.participants ?? [])
        .map((participant) => {
          const user = users.find((item) => item.id === participant.user_id);
          if (!user) {
            return null;
          }
          return { participant, user };
        })
        .filter(
          (
            value,
          ): value is {
            participant: TrainingParticipantRecord;
            user: AuthUser;
          } => value !== null,
        ),
    [training?.participants, users],
  );

  const fileManagerUser = useMemo(
    () => users.find((user) => user.id === fileManagerUserId) ?? null,
    [users, fileManagerUserId],
  );

  const fileManagerParticipant =
    useMemo<TrainingParticipantRecord | null>(() => {
      if (!training || !fileManagerUserId) {
        return null;
      }
      return (
        training.participants.find(
          (participant) => participant.user_id === fileManagerUserId,
        ) ?? null
      );
    }, [training, fileManagerUserId]);

  function toggleParticipant(userId: string, checked: boolean) {
    setPendingAddUserIds((current) => {
      if (checked) {
        return current.includes(userId) ? current : [...current, userId];
      }
      return current.filter((id) => id !== userId);
    });
  }

  async function saveParticipants() {
    if (!training) {
      return;
    }

    setIsSavingParticipants(true);
    try {
      const savedIds = training.participants.map(
        (participant) => participant.user_id,
      );
      const nextParticipantIds = Array.from(
        new Set([...savedIds, ...pendingAddUserIds]),
      );
      const payload: TrainingParticipantsReplacePayload = {
        participants: nextParticipantIds.map((userId) => ({
          user_id: userId,
        })),
      };
      const updated = await requestJson<TrainingRecord>(
        `/api/trainings/${training.id}/participants`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      setTraining(updated);
      setPendingAddUserIds([]);
      await refreshTraining();
      toast.success("Participants saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update participants.",
      );
    } finally {
      setIsSavingParticipants(false);
    }
  }

  async function removeParticipant(userId: string) {
    if (!training) {
      return;
    }
    setIsRemovingParticipantId(userId);
    try {
      const remainingParticipantIds = training.participants
        .map((participant) => participant.user_id)
        .filter((id) => id !== userId);
      const payload: TrainingParticipantsReplacePayload = {
        participants: remainingParticipantIds.map((id) => ({ user_id: id })),
      };
      const updated = await requestJson<TrainingRecord>(
        `/api/trainings/${training.id}/participants`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      setTraining(updated);
      await refreshTraining();
      toast.success("Participant removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove participant.",
      );
    } finally {
      setIsRemovingParticipantId(null);
    }
  }

  async function toggleTrainingStatus() {
    if (!training) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const nextStatus =
        training.status === "completed" ? "pending" : "completed";
      const payload: TrainingStatusUpdatePayload = { status: nextStatus };
      const updated = await requestJson<TrainingRecord>(
        `/api/trainings/${training.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
      setTraining(updated);
      await refreshTraining();
      toast.success(
        nextStatus === "completed"
          ? "Training marked completed."
          : "Training moved to pending.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update training status.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function savePendingFiles() {
    if (!training || !fileManagerParticipant) {
      toast.error("Save participants first before managing files.");
      return;
    }
    if (pendingFiles.length === 0) {
      toast.error("Choose at least one file.");
      return;
    }

    setIsSavingFiles(true);
    try {
      for (const file of pendingFiles) {
        await uploadAttachment(
          String(training.id),
          fileManagerParticipant.id,
          file,
        );
      }
      await refreshTraining();
      setPendingFiles([]);
      setFileManagerUserId(null);
      toast.success("Files uploaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload files.",
      );
    } finally {
      setIsSavingFiles(false);
    }
  }

  async function removeAttachment(attachmentId: number) {
    if (!training || !fileManagerParticipant) {
      return;
    }
    try {
      await requestJson<TrainingRecord>(
        `/api/trainings/${training.id}/participants/${fileManagerParticipant.id}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        },
      );
      await refreshTraining();
      toast.success("Attachment removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove attachment.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Training not found.
        </div>
        <Button asChild type="button" variant="outline">
          <Link href="/hr/trainings-management">
            <ArrowLeft className="size-4" />
            Back To Trainings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild type="button" variant="outline">
        <Link href="/hr/trainings-management">
          <ArrowLeft className="size-4" />
          Back To Trainings
        </Link>
      </Button>

      <HrModulePageScaffold
        title={training.title}
        description={
          training.description ||
          "Manage participants and per-user attachments for this training."
        }
        actions={
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={
                training.status === "completed" ? "default" : "secondary"
              }
            >
              {training.status === "completed" ? "Completed" : "Pending"}
            </Badge>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatDateOnlyLabel(training.training_date)}
            </p>
            <Button
              type="button"
              onClick={() => void toggleTrainingStatus()}
              disabled={isUpdatingStatus}
              size="sm"
            >
              {isUpdatingStatus ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {training.status === "completed"
                ? "Set To Pending"
                : "Mark Completed"}
            </Button>
          </div>
        }
      >
        <section className="space-y-3 rounded-xl border border-border/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Add Participants</h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void saveParticipants()}
              disabled={isSavingParticipants || pendingAddUserIds.length === 0}
            >
              {isSavingParticipants ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSavingParticipants ? "Saving..." : "Save Participants"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-participant-search">
              Search Participants
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="training-participant-search"
                value={participantSearch}
                onChange={(event) => setParticipantSearch(event.target.value)}
                placeholder="Search by name, email, or department code"
                className="pl-9"
              />
            </div>
          </div>

          {users.length > 0 ? (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border/60 p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                {availableUsers.map((user) => {
                  const checked = pendingAddUserIds.includes(user.id);
                  const displayName = buildDisplayName(user) || user.email;
                  const departmentCode = user.department?.code ?? "No Dept";

                  return (
                    <Label
                      key={user.id}
                      htmlFor={`participant-${user.id}`}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-2"
                    >
                      <span className="flex flex-col text-sm">
                        <span>{displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {departmentCode}
                        </span>
                      </span>
                      <Checkbox
                        id={`participant-${user.id}`}
                        checked={checked}
                        onCheckedChange={(next) =>
                          toggleParticipant(user.id, next === true)
                        }
                      />
                    </Label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No users available for assignment.
            </p>
          )}
          {users.length > 0 && availableUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All users are already saved as participants.
            </p>
          ) : null}
        </section>

        {savedParticipants.length > 0 ? (
          <section className="space-y-3 rounded-xl border border-border/70 p-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Participant Attachments</h3>
            </div>

            <div className="space-y-4">
              {savedParticipants.map(({ participant, user }) => {
                const displayName = buildDisplayName(user) || user.email;
                const count = participant.attachments.length;
                const isRemoving = isRemovingParticipantId === user.id;
                const hasAttachments = count > 0;

                return (
                  <div
                    key={`attachments-${user.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {count > 0
                          ? `${count} file(s) attached`
                          : "No files attached"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFileManagerUserId(user.id)}
                      >
                        <Paperclip className="size-4" />
                        Manage Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void removeParticipant(user.id)}
                        disabled={isRemoving || hasAttachments}
                      >
                        {isRemoving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </HrModulePageScaffold>

      <Dialog
        open={fileManagerUserId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFileManagerUserId(null);
            setPendingFiles([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Files
              {fileManagerUser
                ? `: ${buildDisplayName(fileManagerUser) || fileManagerUser.email}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              Files are persisted to Supabase storage when you click Save Files.
            </DialogDescription>
          </DialogHeader>

          {fileManagerUser ? (
            <div className="space-y-4">
              {fileManagerParticipant ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`file-manager-${fileManagerUser.id}`}>
                      Add Files
                    </Label>
                    <Input
                      id={`file-manager-${fileManagerUser.id}`}
                      type="file"
                      multiple
                      onChange={(event) =>
                        setPendingFiles(Array.from(event.target.files ?? []))
                      }
                    />
                    {pendingFiles.length > 0 ? (
                      <div className="space-y-1">
                        {pendingFiles.map((file, index) => (
                          <p
                            key={`${file.name}-${file.size}-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            {file.name} ({formatFileSize(file.size)})
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-2">
                    {fileManagerParticipant.attachments.length > 0 ? (
                      fileManagerParticipant.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2"
                        >
                          <p className="text-xs text-muted-foreground">
                            {attachment.file_name} (
                            {formatFileSize(attachment.file_size)})
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void removeAttachment(attachment.id)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No files attached yet.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void savePendingFiles()}
                      disabled={isSavingFiles || pendingFiles.length === 0}
                    >
                      {isSavingFiles ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      {isSavingFiles ? "Saving..." : "Save Files"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Save participants first before managing files.
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
