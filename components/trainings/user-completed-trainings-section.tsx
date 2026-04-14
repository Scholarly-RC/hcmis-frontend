"use client";

import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import type { TrainingRecord } from "@/lib/trainings";

function formatDateLabel(value: string) {
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

type UserCompletedTrainingsSectionProps = {
  userId: string;
  scope: "me" | "user";
};

async function requestJson<T>(pathname: string): Promise<T> {
  const response = await fetch(pathname, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | T
    | { detail?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string } | null)?.detail ?? "Request failed.",
    );
  }
  return payload as T;
}

export function UserCompletedTrainingsSection({
  userId,
  scope,
}: UserCompletedTrainingsSectionProps) {
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const endpoint =
          scope === "me"
            ? "/api/trainings/completed/me"
            : `/api/trainings/completed/users/${userId}`;
        const payload = await requestJson<TrainingRecord[]>(endpoint);
        if (!cancelled) {
          setTrainings(payload);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load completed trainings.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [scope, userId]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          Trainings
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Completed trainings where this user is listed as a participant.
        </p>
      </div>
      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4" />
            Completed Trainings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Loading completed trainings...
            </div>
          ) : trainings.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Training</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Training Date</TableHead>
                    <TableHead>Attachments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">
                        {training.title}
                      </TableCell>
                      <TableCell>{training.description ?? "N/A"}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateLabel(training.training_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {training.participants.find(
                          (participant) => participant.user_id === userId,
                        )?.attachments.length ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              No completed trainings found for this user.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
