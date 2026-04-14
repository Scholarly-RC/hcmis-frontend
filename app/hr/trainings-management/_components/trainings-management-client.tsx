"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ApiError,
  requestJson,
} from "@/app/dashboard/hr/users/_components/user-management-client";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type {
  TrainingCreatePayload,
  TrainingRecord,
  TrainingStatus,
} from "@/lib/trainings";

const addTrainingSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().optional(),
  training_date: z.string().trim().min(1, "Training date is required."),
});

type AddTrainingValues = z.infer<typeof addTrainingSchema>;

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
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

function statusBadgeVariant(status: TrainingStatus): "secondary" | "default" {
  return status === "completed" ? "default" : "secondary";
}

export function TrainingsManagementClient() {
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTrainingValues>({
    resolver: zodResolver(addTrainingSchema),
    defaultValues: {
      title: "",
      description: "",
      training_date: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadTrainings() {
      setIsLoadingTrainings(true);
      try {
        const trainingsPayload =
          await requestJson<TrainingRecord[]>("/api/trainings");

        if (!cancelled) {
          setTrainings(trainingsPayload);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            toast.error("Session expired. Please login again.");
          } else {
            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to load trainings.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTrainings(false);
        }
      }
    }

    void loadTrainings();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDialogChange(nextOpen: boolean) {
    setIsDialogOpen(nextOpen);
    if (!nextOpen) {
      reset({ title: "", description: "", training_date: "" });
    }
  }

  async function onSubmit(values: AddTrainingValues) {
    const payload: TrainingCreatePayload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      training_date: values.training_date,
    };

    try {
      const created = await requestJson<TrainingRecord>("/api/trainings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTrainings((current) => [created, ...current]);
      toast.success("Training added.");
      handleDialogChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create training.",
      );
    }
  }

  return (
    <HrModulePageScaffold
      title="Trainings Management"
      description="Create trainings, review status, and open each training to manage participants and attachments."
      actions={
        <Button type="button" onClick={() => setIsDialogOpen(true)}>
          <Plus className="size-4" />
          Add Training
        </Button>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
        <Table className="min-w-[900px]">
          <TableHeader className="bg-muted/95">
            <TableRow>
              <TableHead>Training</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Training Date</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoadingTrainings && trainings.length > 0 ? (
              trainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="font-medium">{training.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {training.description || "No description provided."}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={statusBadgeVariant(training.status)}>
                      {training.status === "completed"
                        ? "Completed"
                        : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateOnlyLabel(training.training_date)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {training.participants.length} participant(s)
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDateLabel(training.updated_at)}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link href={`/hr/trainings-management/${training.id}`}>
                          <Eye className="size-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : isLoadingTrainings ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading trainings...
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No trainings yet. Click Add Training to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Training</DialogTitle>
            <DialogDescription>
              Add the title and description first. Manage participants in the
              training detail page after creation.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="training-title">Training Title</Label>
              <Input
                id="training-title"
                placeholder="Enter training title"
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-date">Training Date</Label>
              <Input
                id="training-date"
                type="date"
                {...register("training_date")}
              />
              {errors.training_date ? (
                <p className="text-xs text-destructive">
                  {errors.training_date.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="training-description">Description</Label>
              <Textarea
                id="training-description"
                placeholder="Optional notes about this training"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Training"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </HrModulePageScaffold>
  );
}
