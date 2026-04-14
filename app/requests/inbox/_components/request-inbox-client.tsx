"use client";

import { Ban, Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SelectField } from "@/components/form-select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  OvertimeRequestRecord,
  OvertimeRequestStatus,
} from "@/lib/attendance";
import { overtimeStatusClass, overtimeStatusLabel } from "@/lib/attendance";
import {
  type LeaveRequestRecord,
  type LeaveRequestStatus,
  type LeaveReviewPayload,
  leaveStatusClass,
  leaveStatusLabel,
  leaveTypeLabel,
} from "@/lib/leave";
import type {
  CertificateAttendanceRequestRecord,
  OfficialBusinessRequestRecord,
  SpecialRequestStatus,
} from "@/lib/special-requests";
import {
  specialRequestStatusClass,
  specialRequestStatusLabel,
} from "@/lib/special-requests";
import { toast } from "@/lib/toast";
import { cn } from "@/utils/cn";

type RequestError = {
  detail?: string;
};

type RequestInboxClientProps = {
  currentUserId: string;
};

type FilterState = {
  type:
    | "all"
    | "leave"
    | "overtime"
    | "official_business"
    | "certificate_attendance";
  status: "all" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  year: string;
  month: string;
};

type UnifiedRow =
  | {
      kind: "leave";
      id: number;
      date: string;
      createdAt: string;
      status: LeaveRequestStatus;
      record: LeaveRequestRecord;
    }
  | {
      kind: "overtime";
      id: number;
      date: string;
      createdAt: string;
      status: OvertimeRequestStatus;
      record: OvertimeRequestRecord;
    }
  | {
      kind: "official_business";
      id: number;
      date: string;
      createdAt: string;
      status: SpecialRequestStatus;
      record: OfficialBusinessRequestRecord;
    }
  | {
      kind: "certificate_attendance";
      id: number;
      date: string;
      createdAt: string;
      status: SpecialRequestStatus;
      record: CertificateAttendanceRequestRecord;
    };

type RowAction = "approve" | "reject" | "cancel";

function mergeById<T extends { id: number }>(...lists: T[][]) {
  const map = new Map<number, T>();
  for (const list of lists) {
    for (const item of list) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

async function requestJson<T>(
  pathname: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function parseYearValue(value: string) {
  if (value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMonthValue(value: string) {
  if (value === "all") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
}

function rowKey(kind: UnifiedRow["kind"], id: number) {
  return `${kind}-${id}`;
}

function canRespondToLeave(
  item: LeaveRequestRecord,
  currentUserId: string,
  canReviewLeave: boolean,
) {
  if (!canReviewLeave || item.status !== "PENDING") {
    return false;
  }

  if (item.approver_pool.length === 0) {
    return true;
  }

  return item.approver_pool.some(
    (assignment) =>
      assignment.approver_id === currentUserId &&
      assignment.status === "PENDING",
  );
}

function canRespondToOvertime(
  item: OvertimeRequestRecord,
  currentUserId: string,
  canReviewOvertime: boolean,
) {
  if (!canReviewOvertime || item.status !== "PENDING") {
    return false;
  }

  return item.approver_pool.some(
    (assignment) =>
      assignment.approver_id === currentUserId &&
      assignment.status === "PENDING",
  );
}

function canRespondToSpecialRequest(
  item: OfficialBusinessRequestRecord | CertificateAttendanceRequestRecord,
  currentUserId: string,
  canReview: boolean,
) {
  if (!canReview || item.status !== "PENDING") {
    return false;
  }
  return item.approver_pool.some(
    (assignment) =>
      assignment.approver_id === currentUserId &&
      assignment.status === "PENDING",
  );
}

function actedByLabelForLeave(item: LeaveRequestRecord) {
  const actedAssignment = item.approver_pool.find(
    (assignment) => assignment.acted_at !== undefined,
  );
  if (!actedAssignment?.approver) {
    return "Pending";
  }
  return (
    `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim() ||
    actedAssignment.approver.email
  );
}

function actedByLabelForOvertime(item: OvertimeRequestRecord) {
  const actedAssignment = item.approver_pool.find(
    (assignment) => assignment.acted_at !== undefined,
  );
  if (actedAssignment?.approver) {
    return (
      `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim() ||
      actedAssignment.approver.email
    );
  }
  return "Pending";
}

function actedByLabelForSpecialRequest(
  item: OfficialBusinessRequestRecord | CertificateAttendanceRequestRecord,
) {
  const actedAssignment = item.approver_pool.find(
    (assignment) => assignment.acted_at !== null,
  );
  if (actedAssignment?.approver) {
    return (
      `${actedAssignment.approver.first_name} ${actedAssignment.approver.last_name}`.trim() ||
      actedAssignment.approver.email
    );
  }
  return "Pending";
}

function requesterLabelForLeave(
  item: LeaveRequestRecord,
  currentUserId: string,
) {
  if (item.user_id === currentUserId) {
    return "Me";
  }
  if (!item.user) {
    return `User #${item.user_id}`;
  }
  return (
    `${item.user.first_name} ${item.user.last_name}`.trim() || item.user.email
  );
}

function requesterLabelForOvertime(
  item: OvertimeRequestRecord,
  currentUserId: string,
) {
  if (item.user_id === currentUserId) {
    return "Me";
  }
  if (item.user_name && item.user_name.trim().length > 0) {
    return item.user_name;
  }
  return `User #${item.user_id}`;
}

function requesterLabelForSpecialRequest(
  item: OfficialBusinessRequestRecord | CertificateAttendanceRequestRecord,
  currentUserId: string,
) {
  if (item.user_id === currentUserId) {
    return "Me";
  }
  if (item.user_name && item.user_name.trim().length > 0) {
    return item.user_name;
  }
  return `User #${item.user_id}`;
}

export function RequestInboxClient({ currentUserId }: RequestInboxClientProps) {
  const canReviewLeave = true;
  const canReviewOvertime = true;

  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<
    OvertimeRequestRecord[]
  >([]);
  const [officialBusinessRequests, setOfficialBusinessRequests] = useState<
    OfficialBusinessRequestRecord[]
  >([]);
  const [certificateAttendanceRequests, setCertificateAttendanceRequests] =
    useState<CertificateAttendanceRequestRecord[]>([]);
  const [actionMap, setActionMap] = useState<
    Record<string, RowAction | undefined>
  >({});
  const [pendingApprovalLeaveId, setPendingApprovalLeaveId] = useState<
    number | null
  >(null);
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    status: "all",
    year: "all",
    month: "all",
  });

  useEffect(() => {
    void (async () => {
      try {
        const [
          myLeaveResponse,
          reviewLeaveResponse,
          myOvertimeResponse,
          reviewOvertimeResponse,
          myOfficialBusinessResponse,
          reviewOfficialBusinessResponse,
          myCertificateAttendanceResponse,
          reviewCertificateAttendanceResponse,
        ] = await Promise.all([
          requestJson<LeaveRequestRecord[]>("/api/leave/requests/me"),
          requestJson<LeaveRequestRecord[]>("/api/leave/requests/review"),
          requestJson<OvertimeRequestRecord[]>(
            "/api/attendance/overtime?scope=mine",
          ),
          requestJson<OvertimeRequestRecord[]>(
            "/api/attendance/overtime?scope=approvals",
          ),
          requestJson<OfficialBusinessRequestRecord[]>(
            "/api/official-business?scope=mine",
          ),
          requestJson<OfficialBusinessRequestRecord[]>(
            "/api/official-business?scope=approvals",
          ),
          requestJson<CertificateAttendanceRequestRecord[]>(
            "/api/certificate-attendance?scope=mine",
          ),
          requestJson<CertificateAttendanceRequestRecord[]>(
            "/api/certificate-attendance?scope=approvals",
          ),
        ]);

        setLeaveRequests(mergeById(myLeaveResponse, reviewLeaveResponse));
        setOvertimeRequests(
          mergeById(myOvertimeResponse, reviewOvertimeResponse),
        );
        setOfficialBusinessRequests(
          mergeById(myOfficialBusinessResponse, reviewOfficialBusinessResponse),
        );
        setCertificateAttendanceRequests(
          mergeById(
            myCertificateAttendanceResponse,
            reviewCertificateAttendanceResponse,
          ),
        );
      } catch {
        const [
          myLeaveResult,
          reviewLeaveResult,
          myOvertimeResult,
          reviewOvertimeResult,
          myOfficialBusinessResult,
          reviewOfficialBusinessResult,
          myCertificateAttendanceResult,
          reviewCertificateAttendanceResult,
        ] = await Promise.allSettled([
          requestJson<LeaveRequestRecord[]>("/api/leave/requests/me"),
          requestJson<LeaveRequestRecord[]>("/api/leave/requests/review"),
          requestJson<OvertimeRequestRecord[]>(
            "/api/attendance/overtime?scope=mine",
          ),
          requestJson<OvertimeRequestRecord[]>(
            "/api/attendance/overtime?scope=approvals",
          ),
          requestJson<OfficialBusinessRequestRecord[]>(
            "/api/official-business?scope=mine",
          ),
          requestJson<OfficialBusinessRequestRecord[]>(
            "/api/official-business?scope=approvals",
          ),
          requestJson<CertificateAttendanceRequestRecord[]>(
            "/api/certificate-attendance?scope=mine",
          ),
          requestJson<CertificateAttendanceRequestRecord[]>(
            "/api/certificate-attendance?scope=approvals",
          ),
        ]);

        const myLeave =
          myLeaveResult.status === "fulfilled" ? myLeaveResult.value : [];
        const reviewLeave =
          reviewLeaveResult.status === "fulfilled"
            ? reviewLeaveResult.value
            : [];
        const myOvertime =
          myOvertimeResult.status === "fulfilled" ? myOvertimeResult.value : [];
        const reviewOvertime =
          reviewOvertimeResult.status === "fulfilled"
            ? reviewOvertimeResult.value
            : [];
        const myOfficialBusiness =
          myOfficialBusinessResult.status === "fulfilled"
            ? myOfficialBusinessResult.value
            : [];
        const reviewOfficialBusiness =
          reviewOfficialBusinessResult.status === "fulfilled"
            ? reviewOfficialBusinessResult.value
            : [];
        const myCertificateAttendance =
          myCertificateAttendanceResult.status === "fulfilled"
            ? myCertificateAttendanceResult.value
            : [];
        const reviewCertificateAttendance =
          reviewCertificateAttendanceResult.status === "fulfilled"
            ? reviewCertificateAttendanceResult.value
            : [];

        setLeaveRequests(mergeById(myLeave, reviewLeave));
        setOvertimeRequests(mergeById(myOvertime, reviewOvertime));
        setOfficialBusinessRequests(
          mergeById(myOfficialBusiness, reviewOfficialBusiness),
        );
        setCertificateAttendanceRequests(
          mergeById(myCertificateAttendance, reviewCertificateAttendance),
        );

        if (
          myLeaveResult.status === "rejected" &&
          reviewLeaveResult.status === "rejected" &&
          myOvertimeResult.status === "rejected" &&
          reviewOvertimeResult.status === "rejected" &&
          myOfficialBusinessResult.status === "rejected" &&
          reviewOfficialBusinessResult.status === "rejected" &&
          myCertificateAttendanceResult.status === "rejected" &&
          reviewCertificateAttendanceResult.status === "rejected"
        ) {
          toast.error("Unable to load request inbox.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unifiedRows = useMemo(() => {
    const rows: UnifiedRow[] = [
      ...leaveRequests.map((item) => ({
        kind: "leave" as const,
        id: item.id,
        date: item.leave_date,
        createdAt: item.created_at,
        status: item.status,
        record: item,
      })),
      ...overtimeRequests.map((item) => ({
        kind: "overtime" as const,
        id: item.id,
        date: item.date,
        createdAt: item.created_at,
        status: item.status,
        record: item,
      })),
      ...officialBusinessRequests.map((item) => ({
        kind: "official_business" as const,
        id: item.id,
        date: item.date,
        createdAt: item.created_at,
        status: item.status,
        record: item,
      })),
      ...certificateAttendanceRequests.map((item) => ({
        kind: "certificate_attendance" as const,
        id: item.id,
        date: item.date,
        createdAt: item.created_at,
        status: item.status,
        record: item,
      })),
    ];

    rows.sort((a, b) => {
      const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDelta !== 0) {
        return dateDelta;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return rows;
  }, [
    leaveRequests,
    overtimeRequests,
    officialBusinessRequests,
    certificateAttendanceRequests,
  ]);

  const yearOptions = useMemo(() => {
    const values = new Set<number>();
    for (const row of unifiedRows) {
      const year = new Date(row.date).getUTCFullYear();
      if (Number.isFinite(year)) {
        values.add(year);
      }
    }
    return Array.from(values).sort((a, b) => b - a);
  }, [unifiedRows]);

  const filteredRows = useMemo(() => {
    const selectedYear = parseYearValue(filters.year);
    const selectedMonth = parseMonthValue(filters.month);

    return unifiedRows.filter((row) => {
      if (filters.type !== "all" && row.kind !== filters.type) {
        return false;
      }
      if (filters.status !== "all" && row.status !== filters.status) {
        return false;
      }

      const date = new Date(row.date);
      if (selectedYear !== null && date.getUTCFullYear() !== selectedYear) {
        return false;
      }
      if (selectedMonth !== null && date.getUTCMonth() + 1 !== selectedMonth) {
        return false;
      }

      return true;
    });
  }, [filters, unifiedRows]);

  async function respondToLeave(
    leaveId: number,
    response: "APPROVE" | "REJECT",
    approvalType?: "PAID" | "NON_PAID",
  ) {
    const key = rowKey("leave", leaveId);
    setActionMap((prev) => ({
      ...prev,
      [key]: response === "APPROVE" ? "approve" : "reject",
    }));
    try {
      const payload: LeaveReviewPayload = { response };
      if (response === "APPROVE" && approvalType) {
        payload.approval_type = approvalType;
      }
      const updated = await requestJson<LeaveRequestRecord>(
        `/api/leave/requests/${leaveId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
      setLeaveRequests((prev) =>
        prev.map((item) =>
          item.id === leaveId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Leave request approved."
          : "Leave request rejected.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update leave request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function respondToOvertime(
    overtimeId: number,
    response: "APPROVE" | "REJECT",
  ) {
    const key = rowKey("overtime", overtimeId);
    setActionMap((prev) => ({
      ...prev,
      [key]: response === "APPROVE" ? "approve" : "reject",
    }));
    try {
      const updated = await requestJson<OvertimeRequestRecord>(
        `/api/attendance/overtime/${overtimeId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ response }),
        },
      );
      setOvertimeRequests((prev) =>
        prev.map((item) =>
          item.id === overtimeId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Overtime request approved."
          : "Overtime request rejected.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update overtime request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function cancelLeave(leaveId: number) {
    const key = rowKey("leave", leaveId);
    setActionMap((prev) => ({ ...prev, [key]: "cancel" }));
    try {
      const updated = await requestJson<LeaveRequestRecord>(
        `/api/leave/requests/${leaveId}/cancel`,
        { method: "PATCH" },
      );
      setLeaveRequests((prev) =>
        prev.map((item) =>
          item.id === leaveId ? { ...item, ...updated } : item,
        ),
      );
      toast.success("Leave request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel leave request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function cancelOvertime(overtimeId: number) {
    const key = rowKey("overtime", overtimeId);
    setActionMap((prev) => ({ ...prev, [key]: "cancel" }));
    try {
      const updated = await requestJson<OvertimeRequestRecord>(
        `/api/attendance/overtime/${overtimeId}/cancel`,
        { method: "PATCH" },
      );
      setOvertimeRequests((prev) =>
        prev.map((item) =>
          item.id === overtimeId ? { ...item, ...updated } : item,
        ),
      );
      toast.success("Overtime request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel overtime request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function respondToOfficialBusiness(
    requestId: number,
    response: "APPROVE" | "REJECT",
  ) {
    const key = rowKey("official_business", requestId);
    setActionMap((prev) => ({
      ...prev,
      [key]: response === "APPROVE" ? "approve" : "reject",
    }));
    try {
      const updated = await requestJson<OfficialBusinessRequestRecord>(
        `/api/official-business/${requestId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ response }),
        },
      );
      setOfficialBusinessRequests((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Official business request approved."
          : "Official business request rejected.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update official business request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function cancelOfficialBusiness(requestId: number) {
    const key = rowKey("official_business", requestId);
    setActionMap((prev) => ({ ...prev, [key]: "cancel" }));
    try {
      const updated = await requestJson<OfficialBusinessRequestRecord>(
        `/api/official-business/${requestId}/cancel`,
        { method: "PATCH" },
      );
      setOfficialBusinessRequests((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, ...updated } : item,
        ),
      );
      toast.success("Official business request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel official business request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function respondToCertificateAttendance(
    requestId: number,
    response: "APPROVE" | "REJECT",
  ) {
    const key = rowKey("certificate_attendance", requestId);
    setActionMap((prev) => ({
      ...prev,
      [key]: response === "APPROVE" ? "approve" : "reject",
    }));
    try {
      const updated = await requestJson<CertificateAttendanceRequestRecord>(
        `/api/certificate-attendance/${requestId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ response }),
        },
      );
      setCertificateAttendanceRequests((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, ...updated } : item,
        ),
      );
      toast.success(
        response === "APPROVE"
          ? "Certificate attendance request approved."
          : "Certificate attendance request rejected.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update certificate attendance request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function cancelCertificateAttendance(requestId: number) {
    const key = rowKey("certificate_attendance", requestId);
    setActionMap((prev) => ({ ...prev, [key]: "cancel" }));
    try {
      const updated = await requestJson<CertificateAttendanceRequestRecord>(
        `/api/certificate-attendance/${requestId}/cancel`,
        { method: "PATCH" },
      );
      setCertificateAttendanceRequests((prev) =>
        prev.map((item) =>
          item.id === requestId ? { ...item, ...updated } : item,
        ),
      );
      toast.success("Certificate attendance request cancelled.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel certificate attendance request.",
      );
    } finally {
      setActionMap((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <div className="space-y-6">
      <Dialog
        open={pendingApprovalLeaveId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingApprovalLeaveId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave As</DialogTitle>
            <DialogDescription>
              Select whether this leave should be approved as paid or non-paid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (pendingApprovalLeaveId !== null) {
                  void respondToLeave(
                    pendingApprovalLeaveId,
                    "APPROVE",
                    "NON_PAID",
                  );
                  setPendingApprovalLeaveId(null);
                }
              }}
            >
              Approve As Non-Paid
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingApprovalLeaveId !== null) {
                  void respondToLeave(
                    pendingApprovalLeaveId,
                    "APPROVE",
                    "PAID",
                  );
                  setPendingApprovalLeaveId(null);
                }
              }}
            >
              Approve As Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5 sm:p-5">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Request Inbox
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review and track leave, overtime, official business, and certificate
            attendance requests from a single inbox.
          </p>
        </div>
      </section>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow requests by type, status, month, and year.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <SelectField
            id="request_type"
            label="Request Type"
            value={filters.type}
            onChange={(_, value) =>
              setFilters((prev) => ({
                ...prev,
                type: value as FilterState["type"],
              }))
            }
            options={[
              { value: "all", label: "All types" },
              { value: "leave", label: "Leave" },
              { value: "overtime", label: "Overtime" },
              { value: "official_business", label: "Official Business" },
              {
                value: "certificate_attendance",
                label: "Certificate Attendance",
              },
            ]}
            placeholder="Request Type"
          />
          <SelectField
            id="request_status"
            label="Status"
            value={filters.status}
            onChange={(_, value) =>
              setFilters((prev) => ({
                ...prev,
                status: value as FilterState["status"],
              }))
            }
            options={[
              { value: "all", label: "All statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            placeholder="Status"
          />
          <SelectField
            id="request_year"
            label="Year"
            value={filters.year}
            onChange={(_, value) =>
              setFilters((prev) => ({
                ...prev,
                year: value,
              }))
            }
            options={[
              { value: "all", label: "All years" },
              ...yearOptions.map((year) => ({
                value: year.toString(),
                label: year.toString(),
              })),
            ]}
            placeholder="Year"
          />
          <SelectField
            id="request_month"
            label="Month"
            value={filters.month}
            onChange={(_, value) =>
              setFilters((prev) => ({
                ...prev,
                month: value,
              }))
            }
            options={[
              { value: "all", label: "All months" },
              ...Array.from({ length: 12 }, (_, index) => ({
                value: (index + 1).toString(),
                label: new Date(2000, index, 1).toLocaleString("en-US", {
                  month: "long",
                }),
              })),
            ]}
            placeholder="Month"
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Requests</CardTitle>
          <CardDescription>
            Unified request list for leave, overtime, official business, and
            certificate attendance workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading request inbox...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approvals</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => {
                      const key = rowKey(row.kind, row.id);
                      const actionInProgress = actionMap[key];

                      if (row.kind === "leave") {
                        const item = row.record;
                        const canRespond = canRespondToLeave(
                          item,
                          currentUserId,
                          canReviewLeave,
                        );
                        const canCancel =
                          item.status === "PENDING" &&
                          item.user_id === currentUserId;

                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">Leave</Badge>
                                <p className="text-xs text-muted-foreground">
                                  {leaveTypeLabel(item.leave_type)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {requesterLabelForLeave(item, currentUserId)}
                            </TableCell>
                            <TableCell>{formatDate(item.leave_date)}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0 font-medium",
                                  leaveStatusClass(item.status),
                                )}
                              >
                                {leaveStatusLabel(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground">
                                Acted: {actedByLabelForLeave(item)}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                              {item.info || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2">
                                {canRespond ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        setPendingApprovalLeaveId(item.id)
                                      }
                                    >
                                      {actionInProgress === "approve" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <Check className="mr-2 size-4" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        void respondToLeave(item.id, "REJECT")
                                      }
                                    >
                                      {actionInProgress === "reject" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <X className="mr-2 size-4" />
                                      )}
                                      Reject
                                    </Button>
                                  </>
                                ) : null}
                                {canCancel ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={actionInProgress !== undefined}
                                    onClick={() => void cancelLeave(item.id)}
                                  >
                                    {actionInProgress === "cancel" ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <Ban className="mr-2 size-4" />
                                    )}
                                    Cancel
                                  </Button>
                                ) : null}
                                {!canRespond && !canCancel ? (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      if (row.kind === "official_business") {
                        const item = row.record;
                        const canRespond = canRespondToSpecialRequest(
                          item,
                          currentUserId,
                          true,
                        );
                        const canCancel =
                          item.status === "PENDING" &&
                          item.user_id === currentUserId;

                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <Badge variant="outline">Official Business</Badge>
                            </TableCell>
                            <TableCell>
                              {requesterLabelForSpecialRequest(
                                item,
                                currentUserId,
                              )}
                            </TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0 font-medium",
                                  specialRequestStatusClass(item.status),
                                )}
                              >
                                {specialRequestStatusLabel(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground">
                                Acted: {actedByLabelForSpecialRequest(item)}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                              {item.info?.trim() || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2">
                                {canRespond ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        void respondToOfficialBusiness(
                                          item.id,
                                          "APPROVE",
                                        )
                                      }
                                    >
                                      {actionInProgress === "approve" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <Check className="mr-2 size-4" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        void respondToOfficialBusiness(
                                          item.id,
                                          "REJECT",
                                        )
                                      }
                                    >
                                      {actionInProgress === "reject" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <X className="mr-2 size-4" />
                                      )}
                                      Reject
                                    </Button>
                                  </>
                                ) : null}
                                {canCancel ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={actionInProgress !== undefined}
                                    onClick={() =>
                                      void cancelOfficialBusiness(item.id)
                                    }
                                  >
                                    {actionInProgress === "cancel" ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <Ban className="mr-2 size-4" />
                                    )}
                                    Cancel
                                  </Button>
                                ) : null}
                                {!canRespond && !canCancel ? (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      if (row.kind === "certificate_attendance") {
                        const item = row.record;
                        const canRespond = canRespondToSpecialRequest(
                          item,
                          currentUserId,
                          true,
                        );
                        const canCancel =
                          item.status === "PENDING" &&
                          item.user_id === currentUserId;

                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <Badge variant="outline">
                                Certificate Attendance
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {requesterLabelForSpecialRequest(
                                item,
                                currentUserId,
                              )}
                            </TableCell>
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "border-0 font-medium",
                                  specialRequestStatusClass(item.status),
                                )}
                              >
                                {specialRequestStatusLabel(item.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs text-muted-foreground">
                                Acted: {actedByLabelForSpecialRequest(item)}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <p>
                                  Time: {item.time || "-"} | Punch:{" "}
                                  {item.punch || "-"}
                                </p>
                                <p>{item.info?.trim() || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex gap-2">
                                {canRespond ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        void respondToCertificateAttendance(
                                          item.id,
                                          "APPROVE",
                                        )
                                      }
                                    >
                                      {actionInProgress === "approve" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <Check className="mr-2 size-4" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={actionInProgress !== undefined}
                                      onClick={() =>
                                        void respondToCertificateAttendance(
                                          item.id,
                                          "REJECT",
                                        )
                                      }
                                    >
                                      {actionInProgress === "reject" ? (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                      ) : (
                                        <X className="mr-2 size-4" />
                                      )}
                                      Reject
                                    </Button>
                                  </>
                                ) : null}
                                {canCancel ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={actionInProgress !== undefined}
                                    onClick={() =>
                                      void cancelCertificateAttendance(item.id)
                                    }
                                  >
                                    {actionInProgress === "cancel" ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <Ban className="mr-2 size-4" />
                                    )}
                                    Cancel
                                  </Button>
                                ) : null}
                                {!canRespond && !canCancel ? (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      const item = row.record;
                      const canRespond = canRespondToOvertime(
                        item,
                        currentUserId,
                        canReviewOvertime,
                      );
                      const canCancel =
                        item.status === "PENDING" &&
                        item.user_id === currentUserId;

                      return (
                        <TableRow key={key}>
                          <TableCell>
                            <Badge variant="outline">Overtime</Badge>
                          </TableCell>
                          <TableCell>
                            {requesterLabelForOvertime(item, currentUserId)}
                          </TableCell>
                          <TableCell>{formatDate(item.date)}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "border-0 font-medium",
                                overtimeStatusClass(item.status),
                              )}
                            >
                              {overtimeStatusLabel(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">
                              Acted: {actedByLabelForOvertime(item)}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[18rem] whitespace-normal text-sm text-muted-foreground">
                            {item.info?.trim() || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              {canRespond ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={actionInProgress !== undefined}
                                    onClick={() =>
                                      void respondToOvertime(item.id, "APPROVE")
                                    }
                                  >
                                    {actionInProgress === "approve" ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <Check className="mr-2 size-4" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={actionInProgress !== undefined}
                                    onClick={() =>
                                      void respondToOvertime(item.id, "REJECT")
                                    }
                                  >
                                    {actionInProgress === "reject" ? (
                                      <Loader2 className="mr-2 size-4 animate-spin" />
                                    ) : (
                                      <X className="mr-2 size-4" />
                                    )}
                                    Reject
                                  </Button>
                                </>
                              ) : null}
                              {canCancel ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={actionInProgress !== undefined}
                                  onClick={() => void cancelOvertime(item.id)}
                                >
                                  {actionInProgress === "cancel" ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                  ) : (
                                    <Ban className="mr-2 size-4" />
                                  )}
                                  Cancel
                                </Button>
                              ) : null}
                              {!canRespond && !canCancel ? (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
