"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { AuthUser } from "@/lib/auth";
import type {
  EvaluationDomainRecord,
  EvaluationRecord,
  QuestionnaireRecord,
  UserEvaluationAggregateRecord,
  UserEvaluationRecord,
} from "@/lib/performance-updates";
import { toast } from "@/lib/toast";

type RequestError = {
  detail?: string;
};

type CreateCycleFormState = {
  evaluateeId: string;
  questionnaireId: string;
  quarter: "FQ" | "SQ";
  year: string;
};

type WorkspaceView = "self" | "peer" | "hr_cycle";

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

function formatCycle(cycle: UserEvaluationRecord) {
  const quarter = cycle.quarter === "FQ" ? "First Quarter" : "Second Quarter";
  const evaluateeName =
    cycle.evaluatee && (cycle.evaluatee.first_name || cycle.evaluatee.last_name)
      ? `${cycle.evaluatee.first_name} ${cycle.evaluatee.last_name}`.trim()
      : `User #${cycle.evaluatee_id}`;
  return `${cycle.year} · ${quarter} · ${evaluateeName}`;
}

function getDomainTitle(domain: EvaluationDomainRecord, index: number) {
  if (domain.name && domain.name.trim().length > 0) {
    return domain.name;
  }
  if (domain.domain_name && domain.domain_name.trim().length > 0) {
    return domain.domain_name;
  }
  if (domain.domain_number) {
    return `Domain ${domain.domain_number}`;
  }
  return `Domain ${index + 1}`;
}

function cloneContentData(contentData: EvaluationDomainRecord[]) {
  return contentData.map((domain) => ({
    ...domain,
    questions: domain.questions.map((question) => ({ ...question })),
  }));
}

function getCycleStatusLabel(isFinalized: boolean) {
  return isFinalized ? "Open" : "Draft";
}

function getUserDisplayName(
  user: {
    first_name?: string;
    last_name?: string;
  } | null,
) {
  if (!user) {
    return null;
  }
  const value = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return value.length > 0 ? value : null;
}

export function PerformanceEvaluationsClient({
  currentUser,
  isStaff,
}: {
  currentUser: AuthUser;
  isStaff: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [cycles, setCycles] = useState<UserEvaluationRecord[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [aggregate, setAggregate] =
    useState<UserEvaluationAggregateRecord | null>(null);

  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRecord[]>(
    [],
  );
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(
    isStaff ? "hr_cycle" : "self",
  );
  const [createCycleForm, setCreateCycleForm] = useState<CreateCycleFormState>({
    evaluateeId: "",
    questionnaireId: "",
    quarter: "FQ",
    year: String(new Date().getFullYear()),
  });

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId],
  );

  const myEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) => evaluation.evaluator_id === currentUser.id,
      ),
    [evaluations, currentUser.id],
  );
  const mySelfForms = useMemo(
    () =>
      myEvaluations.filter(
        (evaluation) => evaluation.evaluator_id === selectedCycle?.evaluatee_id,
      ),
    [myEvaluations, selectedCycle?.evaluatee_id],
  );
  const myPeerForms = useMemo(
    () =>
      myEvaluations.filter(
        (evaluation) => evaluation.evaluator_id !== selectedCycle?.evaluatee_id,
      ),
    [myEvaluations, selectedCycle?.evaluatee_id],
  );
  const mySelfEvaluation = useMemo(() => mySelfForms[0] ?? null, [mySelfForms]);
  const hasSelfForms = mySelfForms.length > 0;
  const hasPeerForms = myPeerForms.length > 0;
  const selfSubmittedCount = useMemo(
    () => mySelfForms.filter((item) => Boolean(item.date_submitted)).length,
    [mySelfForms],
  );
  const peerSubmittedCount = useMemo(
    () => myPeerForms.filter((item) => Boolean(item.date_submitted)).length,
    [myPeerForms],
  );
  const evaluateeName = useMemo(
    () => getUserDisplayName(selectedCycle?.evaluatee ?? null),
    [selectedCycle?.evaluatee],
  );

  const existingEvaluatorIds = useMemo(
    () => new Set(evaluations.map((evaluation) => evaluation.evaluator_id)),
    [evaluations],
  );

  const availableAssignmentUsers = useMemo(() => {
    if (!selectedCycle) {
      return [];
    }
    return users.filter(
      (user) =>
        user.id !== selectedCycle.evaluatee_id &&
        !existingEvaluatorIds.has(user.id),
    );
  }, [users, existingEvaluatorIds, selectedCycle]);
  const userNameById = useMemo(() => {
    const mapping = new Map<number, string>();
    for (const user of users) {
      const value = getUserDisplayName(user);
      if (value) {
        mapping.set(user.id, value);
      }
    }
    return mapping;
  }, [users]);

  const loadCycleDetails = useCallback(async (cycleId: number) => {
    const [cycleEvaluations, aggregateSummary] = await Promise.all([
      requestJson<EvaluationRecord[]>(
        `/api/performance/user-evaluations/${cycleId}/evaluations`,
      ),
      requestJson<UserEvaluationAggregateRecord>(
        `/api/performance/user-evaluations/${cycleId}/aggregate-summary`,
      ).catch(() => null),
    ]);
    setEvaluations(cycleEvaluations);
    setAggregate(aggregateSummary);
  }, []);

  const loadData = useCallback(
    async (showRefreshState: boolean) => {
      if (showRefreshState) {
        setRefreshing(true);
      }

      try {
        if (isStaff) {
          const [loadedCycles, loadedQuestionnaires, loadedUsers] =
            await Promise.all([
              requestJson<UserEvaluationRecord[]>(
                "/api/performance/user-evaluations",
              ),
              requestJson<QuestionnaireRecord[]>(
                "/api/performance/questionnaires",
              ),
              requestJson<AuthUser[]>(
                "/api/users?active_only=true&exclude_self=true",
              ),
            ]);

          setCycles(loadedCycles);
          setQuestionnaires(loadedQuestionnaires);
          setUsers(loadedUsers);

          const nextSelectedCycleId =
            selectedCycleId &&
            loadedCycles.some((cycle) => cycle.id === selectedCycleId)
              ? selectedCycleId
              : (loadedCycles[0]?.id ?? null);
          setSelectedCycleId(nextSelectedCycleId);

          if (nextSelectedCycleId) {
            await loadCycleDetails(nextSelectedCycleId);
          } else {
            setEvaluations([]);
            setAggregate(null);
          }
          return;
        }

        const [myCycles, myAssignments] = await Promise.all([
          requestJson<UserEvaluationRecord[]>(
            `/api/performance/user-evaluations?evaluatee_id=${currentUser.id}&is_finalized=true`,
          ),
          requestJson<EvaluationRecord[]>(
            `/api/performance/evaluations?evaluator_id=${currentUser.id}&is_submitted=false`,
          ),
        ]);

        const assignedCycleIds = new Set(
          myAssignments.map((evaluation) => evaluation.user_evaluation_id),
        );
        const assignedCycles = assignedCycleIds.size
          ? (
              await requestJson<UserEvaluationRecord[]>(
                "/api/performance/user-evaluations?is_finalized=true",
              )
            ).filter((cycle) => assignedCycleIds.has(cycle.id))
          : [];

        const mergedCycles = [...myCycles, ...assignedCycles].filter(
          (cycle, index, items) =>
            items.findIndex((item) => item.id === cycle.id) === index,
        );
        mergedCycles.sort(
          (a, b) => b.year - a.year || a.quarter.localeCompare(b.quarter),
        );

        setCycles(mergedCycles);

        const nextSelectedCycleId =
          selectedCycleId &&
          mergedCycles.some((cycle) => cycle.id === selectedCycleId)
            ? selectedCycleId
            : (mergedCycles[0]?.id ?? null);
        setSelectedCycleId(nextSelectedCycleId);

        if (nextSelectedCycleId) {
          await loadCycleDetails(nextSelectedCycleId);
        } else {
          setEvaluations([]);
          setAggregate(null);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load performance evaluations.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser.id, isStaff, loadCycleDetails, selectedCycleId],
  );

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  useEffect(() => {
    if (!selectedCycleId) {
      setEvaluations([]);
      setAggregate(null);
      return;
    }
    void loadCycleDetails(selectedCycleId);
  }, [loadCycleDetails, selectedCycleId]);

  useEffect(() => {
    if (isStaff && workspaceView === "hr_cycle") {
      return;
    }
    if (workspaceView === "self" && hasSelfForms) {
      return;
    }
    if (workspaceView === "peer" && hasPeerForms) {
      return;
    }
    if (hasSelfForms) {
      setWorkspaceView("self");
      return;
    }
    if (hasPeerForms) {
      setWorkspaceView("peer");
      return;
    }
    if (isStaff) {
      setWorkspaceView("hr_cycle");
      return;
    }
    setWorkspaceView("self");
  }, [hasPeerForms, hasSelfForms, isStaff, workspaceView]);

  function updateEvaluationQuestionRating(
    evaluationId: number,
    domainIndex: number,
    questionIndex: number,
    rating: string,
  ) {
    setEvaluations((current) =>
      current.map((evaluation) => {
        if (evaluation.id !== evaluationId) {
          return evaluation;
        }
        const nextContentData = cloneContentData(evaluation.content_data);
        const selectedDomain = nextContentData[domainIndex];
        if (!selectedDomain) {
          return evaluation;
        }
        const selectedQuestion = selectedDomain.questions[questionIndex];
        if (!selectedQuestion) {
          return evaluation;
        }
        selectedQuestion.rating = rating;
        return {
          ...evaluation,
          content_data: nextContentData,
        };
      }),
    );
  }

  function updateEvaluationText(
    evaluationId: number,
    key: "positive_feedback" | "improvement_suggestion",
    value: string,
  ) {
    setEvaluations((current) =>
      current.map((evaluation) =>
        evaluation.id === evaluationId
          ? {
              ...evaluation,
              [key]: value,
            }
          : evaluation,
      ),
    );
  }

  async function saveEvaluation(evaluation: EvaluationRecord) {
    setBusyKey(`save-${evaluation.id}`);
    try {
      await requestJson<EvaluationRecord>(
        `/api/performance/evaluations/${evaluation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            content_data: evaluation.content_data,
            positive_feedback: evaluation.positive_feedback,
            improvement_suggestion: evaluation.improvement_suggestion,
          }),
        },
      );
      toast.success("Evaluation draft saved.");
      if (selectedCycleId) {
        await loadCycleDetails(selectedCycleId);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save evaluation.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function submitEvaluation(evaluation: EvaluationRecord) {
    setBusyKey(`submit-${evaluation.id}`);
    try {
      await requestJson<EvaluationRecord>(
        `/api/performance/evaluations/${evaluation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            content_data: evaluation.content_data,
            positive_feedback: evaluation.positive_feedback,
            improvement_suggestion: evaluation.improvement_suggestion,
          }),
        },
      );
      await requestJson<EvaluationRecord>(
        `/api/performance/evaluations/${evaluation.id}/submit`,
        {
          method: "POST",
        },
      );
      toast.success("Evaluation submitted.");
      if (selectedCycleId) {
        await loadCycleDetails(selectedCycleId);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit evaluation.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function createCycle() {
    if (
      !createCycleForm.evaluateeId ||
      !createCycleForm.questionnaireId ||
      !createCycleForm.year
    ) {
      toast.error("Evaluatee, questionnaire, and year are required.");
      return;
    }

    setBusyKey("create-cycle");
    try {
      const created = await requestJson<UserEvaluationRecord>(
        "/api/performance/user-evaluations",
        {
          method: "POST",
          body: JSON.stringify({
            evaluatee_id: Number(createCycleForm.evaluateeId),
            questionnaire_id: Number(createCycleForm.questionnaireId),
            quarter: createCycleForm.quarter,
            year: Number(createCycleForm.year),
          }),
        },
      );
      toast.success("Evaluation cycle created.");
      await loadData(true);
      setSelectedCycleId(created.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create cycle.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function addAssignment() {
    if (!selectedCycleId || !assignmentUserId) {
      return;
    }
    setBusyKey("add-assignment");
    try {
      await requestJson<EvaluationRecord>(
        `/api/performance/user-evaluations/${selectedCycleId}/assignments`,
        {
          method: "POST",
          body: JSON.stringify({ evaluator_id: Number(assignmentUserId) }),
        },
      );
      setAssignmentUserId("");
      toast.success("Evaluator assigned.");
      await loadCycleDetails(selectedCycleId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to assign evaluator.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function removeAssignment(evaluatorId: number) {
    if (!selectedCycleId) {
      return;
    }
    setBusyKey(`remove-${evaluatorId}`);
    try {
      await requestJson(
        `/api/performance/user-evaluations/${selectedCycleId}/assignments/${evaluatorId}`,
        {
          method: "DELETE",
        },
      );
      toast.success("Evaluator unassigned.");
      await loadCycleDetails(selectedCycleId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove evaluator.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleFinalize() {
    if (!selectedCycleId) {
      return;
    }
    setBusyKey("toggle-finalize");
    try {
      await requestJson<UserEvaluationRecord>(
        `/api/performance/user-evaluations/${selectedCycleId}/finalize-toggle`,
        {
          method: "POST",
        },
      );
      toast.success("Cycle status updated.");
      await loadData(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update cycle finalization.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  function renderEvaluationList(
    items: EvaluationRecord[],
    emptyLabel: string,
    kind: "self" | "peer",
  ) {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return items.map((evaluation) => {
      const isSubmitted = Boolean(evaluation.date_submitted);
      const canEdit = !isSubmitted && Boolean(selectedCycle?.is_finalized);
      const requiresComments = kind === "peer";
      const evaluatorName = getUserDisplayName(evaluation.evaluator ?? null);
      return (
        <div key={evaluation.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {kind === "peer" && evaluatorName
                ? `${evaluatorName} · Evaluation #${evaluation.id}`
                : `Evaluation #${evaluation.id}`}
            </h4>
            <Badge variant={isSubmitted ? "secondary" : "outline"}>
              {isSubmitted
                ? "Submitted"
                : selectedCycle?.is_finalized
                  ? "Open"
                  : "Draft"}
            </Badge>
          </div>
          {evaluation.content_data.map((domain, domainIndex) => (
            <div
              key={`${evaluation.id}-domain-${domainIndex}`}
              className="space-y-2 rounded-md border border-border/70 p-3"
            >
              <div className="text-sm font-medium">
                {getDomainTitle(domain, domainIndex)}
              </div>
              {domain.questions.map((question, questionIndex) => (
                <div
                  key={`${evaluation.id}-question-${domainIndex}-${questionIndex}`}
                  className="grid gap-2 md:grid-cols-[1fr_120px]"
                >
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {question.indicator_number}
                    </span>{" "}
                    {question.indicator ?? ""}
                  </div>
                  <select
                    value={String(question.rating ?? "")}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateEvaluationQuestionRating(
                        evaluation.id,
                        domainIndex,
                        questionIndex,
                        event.target.value,
                      )
                    }
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">-</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              ))}
            </div>
          ))}
          {requiresComments ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Positive feedback</Label>
                <Textarea
                  rows={4}
                  disabled={!canEdit}
                  value={evaluation.positive_feedback ?? ""}
                  onChange={(event) =>
                    updateEvaluationText(
                      evaluation.id,
                      "positive_feedback",
                      event.target.value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Improvement suggestion</Label>
                <Textarea
                  rows={4}
                  disabled={!canEdit}
                  value={evaluation.improvement_suggestion ?? ""}
                  onChange={(event) =>
                    updateEvaluationText(
                      evaluation.id,
                      "improvement_suggestion",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          ) : null}
          {canEdit ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void saveEvaluation(evaluation)}
                disabled={busyKey === `save-${evaluation.id}`}
              >
                {busyKey === `save-${evaluation.id}` ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Save Draft
              </Button>
              <Button
                onClick={() => void submitEvaluation(evaluation)}
                disabled={busyKey === `submit-${evaluation.id}`}
              >
                {busyKey === `submit-${evaluation.id}` ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Submit
              </Button>
            </div>
          ) : null}
          <Separator />
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Performance Evaluations</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {cycles.length} cycle{cycles.length === 1 ? "" : "s"} available
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {isStaff ? (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle className="text-base">Create Evaluation Cycle</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="evaluatee">Evaluatee</Label>
              <select
                id="evaluatee"
                value={createCycleForm.evaluateeId}
                onChange={(event) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    evaluateeId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {[user.first_name, user.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionnaire">Questionnaire</Label>
              <select
                id="questionnaire"
                value={createCycleForm.questionnaireId}
                onChange={(event) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    questionnaireId: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select questionnaire</option>
                {questionnaires.map((questionnaire) => (
                  <option
                    key={questionnaire.id}
                    value={String(questionnaire.id)}
                  >
                    {questionnaire.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <select
                id="quarter"
                value={createCycleForm.quarter}
                onChange={(event) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    quarter: event.target.value as "FQ" | "SQ",
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="FQ">First Quarter</option>
                <option value="SQ">Second Quarter</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={createCycleForm.year}
                onChange={(event) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
                placeholder="2026"
              />
            </div>
            <div className="md:col-span-4">
              <Button
                onClick={() => void createCycle()}
                disabled={busyKey === "create-cycle"}
              >
                {busyKey === "create-cycle" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Create Cycle
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">Cycle Workspace</CardTitle>
          <select
            value={selectedCycleId ? String(selectedCycleId) : ""}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedCycleId(value ? Number(value) : null);
            }}
            className="h-10 w-full max-w-2xl rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select cycle</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={String(cycle.id)}>
                {formatCycle(cycle)}
              </option>
            ))}
          </select>
        </CardHeader>
      </Card>

      {selectedCycle ? (
        <>
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardContent className="flex flex-wrap gap-2 pt-6">
              <Button
                type="button"
                size="sm"
                variant={workspaceView === "self" ? "default" : "outline"}
                disabled={!hasSelfForms}
                onClick={() => setWorkspaceView("self")}
              >
                Self {selfSubmittedCount}/{mySelfForms.length}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={workspaceView === "peer" ? "default" : "outline"}
                disabled={!hasPeerForms}
                onClick={() => setWorkspaceView("peer")}
              >
                Peer {peerSubmittedCount}/{myPeerForms.length}
              </Button>
              {isStaff ? (
                <Button
                  type="button"
                  size="sm"
                  variant={workspaceView === "hr_cycle" ? "default" : "outline"}
                  onClick={() => setWorkspaceView("hr_cycle")}
                >
                  HR Cycle
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-base">Cycle Details</CardTitle>
              <Badge
                variant={selectedCycle.is_finalized ? "secondary" : "outline"}
              >
                {getCycleStatusLabel(selectedCycle.is_finalized)}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="text-sm text-muted-foreground">
                <div>
                  Evaluatee:{" "}
                  <span className="text-foreground">
                    {evaluateeName
                      ? `${evaluateeName} (#${selectedCycle.evaluatee_id})`
                      : `User #${selectedCycle.evaluatee_id}`}
                  </span>
                </div>
                <div>
                  Questionnaire ID:{" "}
                  <span className="text-foreground">
                    {selectedCycle.questionnaire_id}
                  </span>
                </div>
              </div>
              {isStaff ? (
                <div className="flex justify-start md:justify-end">
                  <Button
                    variant={
                      selectedCycle.is_finalized ? "destructive" : "default"
                    }
                    onClick={() => void toggleFinalize()}
                    disabled={busyKey === "toggle-finalize"}
                  >
                    {busyKey === "toggle-finalize" ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    {selectedCycle.is_finalized ? "Close Cycle" : "Open Cycle"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isStaff && workspaceView === "hr_cycle" ? (
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Evaluator Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row">
                  <select
                    value={assignmentUserId}
                    onChange={(event) =>
                      setAssignmentUserId(event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select evaluator</option>
                    {availableAssignmentUsers.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {[user.first_name, user.last_name]
                          .filter(Boolean)
                          .join(" ")}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => void addAssignment()}
                    disabled={!assignmentUserId || busyKey === "add-assignment"}
                  >
                    {busyKey === "add-assignment" ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Add Evaluator
                  </Button>
                </div>
                <div className="space-y-2">
                  {evaluations.map((evaluation) => {
                    const evaluatorName =
                      getUserDisplayName(evaluation.evaluator ?? null) ??
                      userNameById.get(evaluation.evaluator_id);
                    return (
                      <div
                        key={evaluation.id}
                        className="flex items-center justify-between rounded-md border border-border/70 p-3"
                      >
                        <div className="text-sm">
                          Evaluator:{" "}
                          {evaluatorName
                            ? `${evaluatorName} (#${evaluation.evaluator_id})`
                            : `User #${evaluation.evaluator_id}`}
                          {evaluation.evaluator_id ===
                          selectedCycle.evaluatee_id
                            ? " (Self)"
                            : ""}
                        </div>
                        {evaluation.evaluator_id !==
                        selectedCycle.evaluatee_id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void removeAssignment(evaluation.evaluator_id)
                            }
                            disabled={
                              busyKey === `remove-${evaluation.evaluator_id}`
                            }
                          >
                            {busyKey === `remove-${evaluation.evaluator_id}` ? (
                              <Loader2 className="mr-2 size-3 animate-spin" />
                            ) : null}
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {workspaceView === "self" ? (
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Self Evaluation ({selfSubmittedCount}/{mySelfForms.length}{" "}
                  submitted)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderEvaluationList(
                  mySelfForms,
                  "No self-evaluation form for this cycle.",
                  "self",
                )}
              </CardContent>
            </Card>
          ) : null}

          {workspaceView === "peer" ? (
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Peer Evaluation ({peerSubmittedCount}/{myPeerForms.length}{" "}
                  submitted)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderEvaluationList(
                  myPeerForms,
                  "No peer-evaluation forms assigned for this cycle.",
                  "peer",
                )}
              </CardContent>
            </Card>
          ) : null}

          {aggregate && workspaceView !== "peer" ? (
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-base">
                  Self vs Peer Summary ({aggregate.year} {aggregate.quarter})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border/70 p-3">
                    <div className="text-xs text-muted-foreground">
                      Overall Self Mean
                    </div>
                    <div className="text-lg font-semibold">
                      {aggregate.self_rating_overall_mean.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-md border border-border/70 p-3">
                    <div className="text-xs text-muted-foreground">
                      Overall Peer Mean
                    </div>
                    <div className="text-lg font-semibold">
                      {aggregate.peer_rating_overall_mean.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {aggregate.domains.map((domain) => (
                    <div
                      key={domain.domain_key}
                      className="grid grid-cols-3 gap-2 rounded-md border border-border/70 p-3 text-sm"
                    >
                      <div>{domain.domain_key}</div>
                      <div className="text-center">
                        Self: {domain.self_rating_mean.toFixed(2)}
                      </div>
                      <div className="text-right">
                        Peer: {domain.peer_rating_mean.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Peer Positive Feedback
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {aggregate.peer_positive_feedback.length > 0 ? (
                        aggregate.peer_positive_feedback.map((item) => (
                          <div key={item}>• {item}</div>
                        ))
                      ) : (
                        <div>No feedback yet.</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Peer Improvement Suggestions
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {aggregate.peer_improvement_suggestions.length > 0 ? (
                        aggregate.peer_improvement_suggestions.map((item) => (
                          <div key={item}>• {item}</div>
                        ))
                      ) : (
                        <div>No suggestions yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !isStaff &&
            selectedCycle.evaluatee_id === currentUser.id &&
            workspaceView === "self" ? (
            <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
              <CardContent className="py-8 text-sm text-muted-foreground">
                {mySelfEvaluation?.date_submitted
                  ? "Summary is not available yet."
                  : "Summary becomes visible after you submit your self-evaluation."}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
          <CardContent className="py-10 text-sm text-muted-foreground">
            No evaluation cycle available yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
