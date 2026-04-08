"use client";

import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMINISTRATOR_QUESTIONNAIRE_CODE,
  EMPLOYEE_QUESTIONNAIRE_CODE,
} from "@/constants/performance";
import type {
  EvaluationDomainRecord,
  EvaluationRecord,
  QuestionnaireRecord,
  UserEvaluationAggregateRecord,
  UserEvaluationRecord,
} from "@/lib/performance-updates";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type RequestError = {
  detail?:
    | string
    | {
        loc?: Array<string | number>;
        msg?: string;
      }[];
};

function getRequestErrorMessage(payload: RequestError | null) {
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const firstDetail = detail[0];
    if (firstDetail?.msg && firstDetail.msg.trim().length > 0) {
      return firstDetail.msg;
    }
  }
  return "Request failed.";
}

type CreateCycleFormState = {
  evaluateeId: string;
  questionnaireId: string;
  quarter: "FQ" | "SQ";
  year: string;
};

type WorkspaceView = "self" | "peer" | "hr_cycle";
type StaffPanel = "assignments" | "summary";

type EvaluationProgress = {
  answered: number;
  total: number;
};

type UnansweredQuestion = {
  domainIndex: number;
  questionIndex: number;
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
    throw new Error(getRequestErrorMessage(payload as RequestError | null));
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

function compareCycleRecency(a: UserEvaluationRecord, b: UserEvaluationRecord) {
  if (a.year !== b.year) {
    return b.year - a.year;
  }
  const quarterRank: Record<UserEvaluationRecord["quarter"], number> = {
    FQ: 1,
    SQ: 2,
  };
  return quarterRank[b.quarter] - quarterRank[a.quarter];
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

function getDomainKey(domain: EvaluationDomainRecord, index: number) {
  if (domain.domain_number) {
    return String(domain.domain_number);
  }
  if (domain.domain_name && domain.domain_name.trim().length > 0) {
    return domain.domain_name;
  }
  return `domain_${index + 1}`;
}

function getDomainSummaryLabel(domain: EvaluationDomainRecord, index: number) {
  const domainNumber = domain.domain_number
    ? String(domain.domain_number).trim()
    : "";
  const domainName =
    domain.domain_name && domain.domain_name.trim().length > 0
      ? domain.domain_name.trim()
      : domain.name && domain.name.trim().length > 0
        ? domain.name.trim()
        : "";

  if (domainNumber && domainName) {
    return `Domain ${domainNumber} - ${domainName}`;
  }
  if (domainNumber) {
    return `Domain ${domainNumber}`;
  }
  if (domainName) {
    return domainName;
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

function isEmployeeRole(role: string | null) {
  const normalized = (role ?? "EMP").trim().toUpperCase();
  return normalized === "" || normalized === "EMP";
}

function normalizeRating(rating: string | number | null) {
  if (rating === null || rating === undefined) {
    return "";
  }
  return String(rating).trim();
}

function getEvaluationProgress(
  evaluation: EvaluationRecord,
): EvaluationProgress {
  return evaluation.content_data.reduce<EvaluationProgress>(
    (progress, domain) => {
      for (const question of domain.questions) {
        progress.total += 1;
        if (normalizeRating(question.rating).length > 0) {
          progress.answered += 1;
        }
      }
      return progress;
    },
    { answered: 0, total: 0 },
  );
}

function getDomainProgress(domain: EvaluationDomainRecord) {
  const total = domain.questions.length;
  const answered = domain.questions.filter(
    (question) => normalizeRating(question.rating).length > 0,
  ).length;
  return { answered, total };
}

function findFirstUnansweredQuestion(
  evaluation: EvaluationRecord,
): UnansweredQuestion | null {
  for (const [domainIndex, domain] of evaluation.content_data.entries()) {
    for (const [questionIndex, question] of domain.questions.entries()) {
      if (normalizeRating(question.rating).length === 0) {
        return { domainIndex, questionIndex };
      }
    }
  }
  return null;
}

function getQuestionRowId(
  evaluationId: number,
  domainIndex: number,
  questionIndex: number,
) {
  return `evaluation-${evaluationId}-question-${domainIndex}-${questionIndex}`;
}

function parsePositiveInt(value: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function PerformanceEvaluationsClient({
  currentUser,
  isStaff,
}: {
  currentUser: AuthUser;
  isStaff: boolean;
}) {
  const searchParams = useSearchParams();
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
  const [openDomainByEvaluation, setOpenDomainByEvaluation] = useState<
    Record<number, string>
  >({});
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(
    isStaff ? "hr_cycle" : "self",
  );
  const [createCycleForm, setCreateCycleForm] = useState<CreateCycleFormState>({
    evaluateeId: "",
    questionnaireId: "",
    quarter: "FQ",
    year: String(new Date().getFullYear()),
  });
  const [selectedEvaluateeId, setSelectedEvaluateeId] = useState("");
  const [staffPanel, setStaffPanel] = useState<StaffPanel>("assignments");
  const [isCreateCycleDialogOpen, setIsCreateCycleDialogOpen] = useState(false);
  const [highlightedCycleId, setHighlightedCycleId] = useState<number | null>(
    null,
  );
  const appliedDeepLinkCycleIdRef = useRef<number | null>(null);
  const deepLinkedCycleId = parsePositiveInt(searchParams.get("cycle_id"));

  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId],
  );
  const filteredStaffCycles = useMemo(() => {
    if (!selectedEvaluateeId) {
      return [];
    }
    return [...cycles]
      .filter((cycle) => cycle.evaluatee_id === selectedEvaluateeId)
      .sort(compareCycleRecency);
  }, [cycles, selectedEvaluateeId]);

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
  const staffSelfEvaluations = useMemo(
    () =>
      selectedCycle
        ? evaluations.filter(
            (evaluation) =>
              evaluation.evaluator_id === selectedCycle.evaluatee_id,
          )
        : [],
    [evaluations, selectedCycle],
  );
  const staffPeerEvaluations = useMemo(
    () =>
      selectedCycle
        ? evaluations.filter(
            (evaluation) =>
              evaluation.evaluator_id !== selectedCycle.evaluatee_id,
          )
        : [],
    [evaluations, selectedCycle],
  );
  const staffSelfSubmittedCount = useMemo(
    () =>
      staffSelfEvaluations.filter((evaluation) =>
        Boolean(evaluation.date_submitted),
      ).length,
    [staffSelfEvaluations],
  );
  const staffPeerSubmittedCount = useMemo(
    () =>
      staffPeerEvaluations.filter((evaluation) =>
        Boolean(evaluation.date_submitted),
      ).length,
    [staffPeerEvaluations],
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
    const mapping = new Map<string, string>();
    for (const user of users) {
      const value = getUserDisplayName(user);
      if (value) {
        mapping.set(user.id, value);
      }
    }
    return mapping;
  }, [users]);

  const summaryDomainLabelByKey = useMemo(() => {
    const mapping = new Map<string, string>();
    for (const evaluation of evaluations) {
      for (const [index, domain] of evaluation.content_data.entries()) {
        const domainKey = getDomainKey(domain, index);
        if (mapping.has(domainKey)) {
          continue;
        }
        mapping.set(domainKey, getDomainSummaryLabel(domain, index));
      }
    }
    return mapping;
  }, [evaluations]);

  const questionnaireIdByCode = useMemo(() => {
    const mapping = new Map<string, string>();
    for (const questionnaire of questionnaires) {
      mapping.set(questionnaire.code.toUpperCase(), String(questionnaire.id));
    }
    return mapping;
  }, [questionnaires]);

  const selectedCreateCycleUser = useMemo(
    () =>
      users.find((user) => String(user.id) === createCycleForm.evaluateeId) ??
      null,
    [createCycleForm.evaluateeId, users],
  );

  const autoQuestionnaireIdForSelectedUser = useMemo(() => {
    if (!selectedCreateCycleUser) {
      return "";
    }
    const expectedCode = isEmployeeRole(selectedCreateCycleUser.role)
      ? EMPLOYEE_QUESTIONNAIRE_CODE
      : ADMINISTRATOR_QUESTIONNAIRE_CODE;
    return questionnaireIdByCode.get(expectedCode) ?? "";
  }, [questionnaireIdByCode, selectedCreateCycleUser]);

  const effectiveCreateCycleQuestionnaireId =
    createCycleForm.questionnaireId || autoQuestionnaireIdForSelectedUser;
  const selectedCreateCycleQuestionnaire =
    questionnaires.find(
      (questionnaire) =>
        String(questionnaire.id) === effectiveCreateCycleQuestionnaireId,
    ) ?? null;

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
              : null;
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

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    if (users.length === 0) {
      setSelectedEvaluateeId("");
      return;
    }
    const exists = users.some(
      (user) => String(user.id) === selectedEvaluateeId,
    );
    if (exists) {
      return;
    }
    const preferredEvaluateeId = selectedCycle
      ? String(selectedCycle.evaluatee_id)
      : String(users[0].id);
    setSelectedEvaluateeId(preferredEvaluateeId);
  }, [isStaff, selectedCycle, selectedEvaluateeId, users]);

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    if (!selectedEvaluateeId) {
      setSelectedCycleId(null);
      return;
    }
    const selectedCycleMatchesEvaluatee =
      selectedCycle &&
      String(selectedCycle.evaluatee_id) === selectedEvaluateeId;
    if (selectedCycleMatchesEvaluatee) {
      return;
    }
    setSelectedCycleId(filteredStaffCycles[0]?.id ?? null);
  }, [filteredStaffCycles, isStaff, selectedCycle, selectedEvaluateeId]);

  useEffect(() => {
    if (!isStaff || !selectedEvaluateeId) {
      return;
    }
    setCreateCycleForm((current) => {
      if (current.evaluateeId === selectedEvaluateeId) {
        return current;
      }
      return {
        ...current,
        evaluateeId: selectedEvaluateeId,
      };
    });
  }, [isStaff, selectedEvaluateeId]);

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    setCreateCycleForm((current) => {
      if (current.questionnaireId === autoQuestionnaireIdForSelectedUser) {
        return current;
      }
      return {
        ...current,
        questionnaireId: autoQuestionnaireIdForSelectedUser,
      };
    });
  }, [autoQuestionnaireIdForSelectedUser, isStaff]);

  useEffect(() => {
    if (!deepLinkedCycleId || cycles.length === 0) {
      return;
    }
    const targetCycle = cycles.find((cycle) => cycle.id === deepLinkedCycleId);
    if (!targetCycle) {
      return;
    }
    if (appliedDeepLinkCycleIdRef.current === deepLinkedCycleId) {
      return;
    }
    appliedDeepLinkCycleIdRef.current = deepLinkedCycleId;
    if (isStaff) {
      setSelectedEvaluateeId(String(targetCycle.evaluatee_id));
    }
    setSelectedCycleId(targetCycle.id);
    setHighlightedCycleId(targetCycle.id);
    requestAnimationFrame(() => {
      document
        .getElementById("cycle-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = window.setTimeout(() => {
      setHighlightedCycleId((current) =>
        current === targetCycle.id ? null : current,
      );
    }, 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [cycles, deepLinkedCycleId, isStaff]);

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
    const firstUnanswered = findFirstUnansweredQuestion(evaluation);
    if (firstUnanswered) {
      const targetDomainKey = getDomainKey(
        evaluation.content_data[firstUnanswered.domainIndex] ?? {
          questions: [],
        },
        firstUnanswered.domainIndex,
      );
      setOpenDomainByEvaluation((current) => ({
        ...current,
        [evaluation.id]: targetDomainKey,
      }));
      requestAnimationFrame(() => {
        document
          .getElementById(
            getQuestionRowId(
              evaluation.id,
              firstUnanswered.domainIndex,
              firstUnanswered.questionIndex,
            ),
          )
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      toast.error("Please answer all questions before submitting.");
      return;
    }

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
    if (!createCycleForm.evaluateeId || !createCycleForm.year) {
      toast.error("Evaluatee and year are required.");
      return;
    }

    if (!effectiveCreateCycleQuestionnaireId) {
      toast.error(
        "No matching questionnaire is available for the selected user's role.",
      );
      return;
    }

    setBusyKey("create-cycle");
    try {
      const created = await requestJson<UserEvaluationRecord>(
        "/api/performance/user-evaluations",
        {
          method: "POST",
          body: JSON.stringify({
            evaluatee_id: createCycleForm.evaluateeId,
            questionnaire_id: Number(effectiveCreateCycleQuestionnaireId),
            quarter: createCycleForm.quarter,
            year: Number(createCycleForm.year),
          }),
        },
      );
      toast.success("Evaluation cycle created.");
      await loadData(true);
      setSelectedCycleId(created.id);
      setStaffPanel("assignments");
      setIsCreateCycleDialogOpen(false);
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
          body: JSON.stringify({ evaluator_id: assignmentUserId }),
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

  async function removeAssignment(evaluatorId: string) {
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
      const progress = getEvaluationProgress(evaluation);
      const unresolvedCount = progress.total - progress.answered;
      const completionPercent =
        progress.total > 0
          ? Math.round((progress.answered / progress.total) * 100)
          : 0;
      const activeDomainKey = openDomainByEvaluation[evaluation.id] ?? "";
      return (
        <div key={evaluation.id} className="space-y-4">
          <div className="sticky top-2 z-10 rounded-lg border border-border/80 bg-background/90 p-3 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">
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
                <p className="text-xs text-muted-foreground">
                  {progress.answered}/{progress.total} answered (
                  {completionPercent}%)
                  {unresolvedCount > 0
                    ? ` · ${unresolvedCount} unanswered`
                    : ""}
                </p>
              </div>
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
                    disabled={
                      busyKey === `submit-${evaluation.id}` ||
                      unresolvedCount > 0
                    }
                  >
                    {busyKey === `submit-${evaluation.id}` ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          {evaluation.content_data.map((domain, domainIndex) => {
            const domainProgress = getDomainProgress(domain);
            return (
              <Collapsible
                key={`${evaluation.id}-domain-${domainIndex}`}
                open={activeDomainKey === getDomainKey(domain, domainIndex)}
                onOpenChange={(nextOpen) => {
                  setOpenDomainByEvaluation((current) => ({
                    ...current,
                    [evaluation.id]: nextOpen
                      ? getDomainKey(domain, domainIndex)
                      : "",
                  }));
                }}
              >
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex h-auto w-full items-center justify-between rounded-none px-3 py-3 hover:bg-muted/40"
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {getDomainTitle(domain, domainIndex)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {domainProgress.answered}/{domainProgress.total}{" "}
                          answered
                        </p>
                      </div>
                      <ChevronDown
                        className={`size-4 transition-transform ${
                          activeDomainKey === getDomainKey(domain, domainIndex)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border/70">
                    <div className="space-y-2 p-3">
                      {domain.questions.map((question, questionIndex) => {
                        const normalizedRating = normalizeRating(
                          question.rating,
                        );
                        const hasRating = normalizedRating.length > 0;
                        return (
                          <div
                            id={getQuestionRowId(
                              evaluation.id,
                              domainIndex,
                              questionIndex,
                            )}
                            key={`${evaluation.id}-question-${domainIndex}-${questionIndex}`}
                            className={`rounded-md border p-2 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-3 ${
                              !hasRating && canEdit
                                ? "border-amber-300/70 bg-amber-50/40"
                                : "border-border/70"
                            }`}
                          >
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">
                                {question.indicator_number}
                              </span>{" "}
                              {question.indicator ?? ""}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1 md:mt-0 md:justify-end">
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  normalizedRating === ""
                                    ? "default"
                                    : "outline"
                                }
                                className="h-8 min-w-8 px-2"
                                disabled={!canEdit}
                                onClick={() =>
                                  updateEvaluationQuestionRating(
                                    evaluation.id,
                                    domainIndex,
                                    questionIndex,
                                    "",
                                  )
                                }
                              >
                                -
                              </Button>
                              {["1", "2", "3", "4", "5"].map((value) => (
                                <Button
                                  key={`${evaluation.id}-${domainIndex}-${questionIndex}-${value}`}
                                  type="button"
                                  size="sm"
                                  variant={
                                    normalizedRating === value
                                      ? "default"
                                      : "outline"
                                  }
                                  className="h-8 min-w-8 px-2"
                                  disabled={!canEdit}
                                  onClick={() =>
                                    updateEvaluationQuestionRating(
                                      evaluation.id,
                                      domainIndex,
                                      questionIndex,
                                      value,
                                    )
                                  }
                                >
                                  {value}
                                </Button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
          {requiresComments ? (
            <div className="space-y-2 rounded-lg border border-border/70 p-3">
              <div className="text-sm font-medium">Peer Comments</div>
              <p className="text-xs text-muted-foreground">
                Summarize strengths and concrete improvement areas.
              </p>
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

  if (isStaff) {
    return (
      <div className="flex w-full flex-col gap-6">
        <Card
          className={
            selectedCycleId && highlightedCycleId === selectedCycleId
              ? "border-border/70 bg-card/85 shadow-lg shadow-black/5 ring-1 ring-primary/40"
              : "border-border/70 bg-card/85 shadow-lg shadow-black/5"
          }
        >
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Performance Evaluations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Focus on one cycle with assignments and summary in one place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dialog
                open={isCreateCycleDialogOpen}
                onOpenChange={setIsCreateCycleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>New Cycle</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create Evaluation Cycle</DialogTitle>
                    <DialogDescription>
                      Pick evaluatee, quarter, and year. Questionnaire is
                      auto-selected.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="evaluatee">Evaluatee</Label>
                      <Select
                        value={createCycleForm.evaluateeId || "__none__"}
                        onValueChange={(value) =>
                          setCreateCycleForm((current) => ({
                            ...current,
                            evaluateeId: value === "__none__" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger id="evaluatee" className="h-10 w-full">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select user</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Questionnaire</Label>
                      <div className="flex min-h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-foreground">
                        {selectedCreateCycleQuestionnaire?.title ??
                          "No questionnaire available for this user's role."}
                      </div>
                    </div>
                    {!effectiveCreateCycleQuestionnaireId ? (
                      <p className="text-sm text-destructive">
                        No questionnaire is configured for the selected user's
                        role.
                      </p>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="quarter">Quarter</Label>
                      <Select
                        value={createCycleForm.quarter}
                        onValueChange={(value: "FQ" | "SQ") =>
                          setCreateCycleForm((current) => ({
                            ...current,
                            quarter: value,
                          }))
                        }
                      >
                        <SelectTrigger id="quarter" className="h-10 w-full">
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FQ">First Quarter</SelectItem>
                          <SelectItem value="SQ">Second Quarter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={createCycleForm.year}
                        onChange={(event) =>
                          setCreateCycleForm((current) => ({
                            ...current,
                            year: event.target.value,
                          }))
                        }
                        placeholder="2026"
                        min={1900}
                        step={1}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateCycleDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void createCycle()}
                      disabled={busyKey === "create-cycle"}
                    >
                      {busyKey === "create-cycle" ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Create Cycle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="evaluatee-filter">Evaluatee</Label>
              <Select
                value={selectedEvaluateeId || "__none__"}
                onValueChange={(value) =>
                  setSelectedEvaluateeId(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger
                  id="evaluatee-filter"
                  className="h-10 w-full max-w-2xl"
                >
                  <SelectValue placeholder="Select evaluatee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select evaluatee</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {[user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-workspace">Cycle Workspace</Label>
              <Select
                value={selectedCycleId ? String(selectedCycleId) : "__none__"}
                onValueChange={(value) =>
                  setSelectedCycleId(
                    value === "__none__" ? null : Number(value),
                  )
                }
              >
                <SelectTrigger
                  id="cycle-workspace"
                  className="h-10 w-full max-w-2xl"
                >
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select cycle</SelectItem>
                  {filteredStaffCycles.map((cycle) => (
                    <SelectItem key={cycle.id} value={String(cycle.id)}>
                      {formatCycle(cycle)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={staffPanel === "assignments" ? "default" : "outline"}
                  onClick={() => setStaffPanel("assignments")}
                  disabled={!selectedCycle}
                >
                  Assignments
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={staffPanel === "summary" ? "default" : "outline"}
                  onClick={() => setStaffPanel("summary")}
                  disabled={!selectedCycle}
                >
                  Summary
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {selectedCycle ? (
                  <Badge
                    variant={
                      selectedCycle.is_finalized ? "secondary" : "outline"
                    }
                  >
                    {getCycleStatusLabel(selectedCycle.is_finalized)}
                  </Badge>
                ) : null}
                {selectedCycle ? (
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
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCycle ? (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base">
                {staffPanel === "assignments"
                  ? "Evaluator Assignments"
                  : "Cycle Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffPanel === "assignments" ? (
                <>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Select
                      value={assignmentUserId || "__none__"}
                      onValueChange={(value) =>
                        setAssignmentUserId(value === "__none__" ? "" : value)
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select evaluator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          Select evaluator
                        </SelectItem>
                        {availableAssignmentUsers.map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {[user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => void addAssignment()}
                      disabled={
                        !assignmentUserId || busyKey === "add-assignment"
                      }
                    >
                      {busyKey === "add-assignment" ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Add Evaluator
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Self {staffSelfSubmittedCount}/
                      {staffSelfEvaluations.length}
                    </Badge>
                    <Badge variant="outline">
                      Peer {staffPeerSubmittedCount}/
                      {staffPeerEvaluations.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {evaluations.length > 0 ? (
                      evaluations.map((evaluation) => {
                        const evaluatorName =
                          getUserDisplayName(evaluation.evaluator ?? null) ??
                          userNameById.get(evaluation.evaluator_id);
                        return (
                          <div
                            key={evaluation.id}
                            className="flex items-center justify-between rounded-md border border-border/70 p-3"
                          >
                            <div className="text-sm">
                              {evaluatorName ?? "Unnamed User"}
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
                                  busyKey ===
                                  `remove-${evaluation.evaluator_id}`
                                }
                              >
                                {busyKey ===
                                `remove-${evaluation.evaluator_id}` ? (
                                  <Loader2 className="mr-2 size-3 animate-spin" />
                                ) : null}
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No evaluators assigned yet.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border/70 p-3">
                      <div className="text-xs text-muted-foreground">
                        Self forms
                      </div>
                      <div className="text-lg font-semibold">
                        {staffSelfSubmittedCount}/{staffSelfEvaluations.length}
                      </div>
                    </div>
                    <div className="rounded-md border border-border/70 p-3">
                      <div className="text-xs text-muted-foreground">
                        Peer forms
                      </div>
                      <div className="text-lg font-semibold">
                        {staffPeerSubmittedCount}/{staffPeerEvaluations.length}
                      </div>
                    </div>
                    <div className="rounded-md border border-border/70 p-3">
                      <div className="text-xs text-muted-foreground">
                        Status
                      </div>
                      <div className="text-lg font-semibold">
                        {getCycleStatusLabel(selectedCycle.is_finalized)}
                      </div>
                    </div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" className="px-0">
                        <ChevronDown className="mr-2 size-4" />
                        Show Details
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4">
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          Evaluatee:{" "}
                          <span className="text-foreground">
                            {evaluateeName ?? "Unnamed User"}
                          </span>
                        </div>
                        <div>
                          Questionnaire ID:{" "}
                          <span className="text-foreground">
                            {selectedCycle.questionnaire_id}
                          </span>
                        </div>
                      </div>
                      {aggregate ? (
                        <>
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
                          <div className="rounded-md border border-border/70">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Domain</TableHead>
                                  <TableHead className="text-right">
                                    Self
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Peer
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {aggregate.domains.map((domain) => (
                                  <TableRow key={domain.domain_key}>
                                    <TableCell>
                                      {summaryDomainLabelByKey.get(
                                        domain.domain_key,
                                      ) ?? domain.domain_key}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {domain.self_rating_mean.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {domain.peer_rating_mean.toFixed(2)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Summary metrics are not available yet.
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
            <CardContent className="py-10 text-sm text-muted-foreground">
              {selectedEvaluateeId
                ? "No cycles available for the selected user. Create a new cycle."
                : "Select an evaluatee to view cycles."}
            </CardContent>
          </Card>
        )}
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
              <Select
                value={createCycleForm.evaluateeId || "__none__"}
                onValueChange={(value) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    evaluateeId: value === "__none__" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="evaluatee" className="h-10 w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select user</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {[user.first_name, user.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Questionnaire</Label>
              <div className="flex min-h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-foreground">
                {selectedCreateCycleQuestionnaire?.title ??
                  "No questionnaire available for this user's role."}
              </div>
            </div>
            {!effectiveCreateCycleQuestionnaireId ? (
              <p className="text-sm text-destructive">
                No questionnaire is configured for the selected user's role.
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select
                value={createCycleForm.quarter}
                onValueChange={(value: "FQ" | "SQ") =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    quarter: value,
                  }))
                }
              >
                <SelectTrigger id="quarter" className="h-10 w-full">
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FQ">First Quarter</SelectItem>
                  <SelectItem value="SQ">Second Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={createCycleForm.year}
                onChange={(event) =>
                  setCreateCycleForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
                placeholder="2026"
                min={1900}
                step={1}
                className="h-10"
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
          <Select
            value={selectedCycleId ? String(selectedCycleId) : "__none__"}
            onValueChange={(value) =>
              setSelectedCycleId(value === "__none__" ? null : Number(value))
            }
          >
            <SelectTrigger
              id="cycle-workspace"
              className="h-10 w-full max-w-2xl"
            >
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select cycle</SelectItem>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={String(cycle.id)}>
                  {formatCycle(cycle)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    {evaluateeName ?? "Unnamed User"}
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
                  <Select
                    value={assignmentUserId || "__none__"}
                    onValueChange={(value) =>
                      setAssignmentUserId(value === "__none__" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select evaluator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select evaluator</SelectItem>
                      {availableAssignmentUsers.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          Evaluator: {evaluatorName ?? "Unnamed User"}
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
                <div className="rounded-md border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead className="text-right">Self</TableHead>
                        <TableHead className="text-right">Peer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregate.domains.map((domain) => (
                        <TableRow key={domain.domain_key}>
                          <TableCell>
                            {summaryDomainLabelByKey.get(domain.domain_key) ??
                              domain.domain_key}
                          </TableCell>
                          <TableCell className="text-right">
                            {domain.self_rating_mean.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {domain.peer_rating_mean.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
