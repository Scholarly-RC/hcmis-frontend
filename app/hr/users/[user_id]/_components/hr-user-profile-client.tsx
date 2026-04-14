"use client";

import {
  ArrowLeft,
  CalendarDays,
  History,
  KeyRound,
  Loader2,
  PencilLine,
  Save,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  buildDisplayName,
  ResetPasswordDialog,
  requestJson,
  UserEditorDialog,
  type UserEditorPayload,
} from "@/app/dashboard/hr/users/_components/user-management-client";
import type { ShiftTemplateRecord } from "@/app/hr/shift-management/_components/shift-management-client";
import { ProfileDetailsSections } from "@/app/profile/_components/profile-details-sections";
import { ProfileHeader } from "@/app/profile/_components/profile-header";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { UserCompletedTrainingsSection } from "@/components/trainings/user-completed-trainings-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatEmploymentMovementActor,
  formatEmploymentMovementFieldLabel,
  formatEmploymentMovementValue,
} from "@/lib/employment-movements";
import type { PayrollPosition } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";

type UsersResponse = AuthUser[];
type DepartmentsResponse = AuthDepartment[];
type ResetPasswordResponse = {
  temporary_password: string;
};
type UserShiftPolicyResponse = {
  id: string;
  shifts: ShiftTemplateRecord[];
};
type UserEmploymentMovementRecord = {
  id: number;
  user_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_batch_id: string;
  changed_by: string | null;
  effective_date: string | null;
  changed_at: string;
};

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.length === 5 ? `${value}:00` : value;
  const parsed = new Date(`1970-01-01T${normalized}`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function buildShiftSummary(shift: ShiftTemplateRecord) {
  const parts = [
    shift.start_time,
    shift.end_time,
    shift.start_time_2,
    shift.end_time_2,
  ]
    .map(formatTime)
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return shift.description;
  }

  return `${shift.description} · ${parts.join(" - ")}`;
}

function buildInitials(user: AuthUser) {
  const firstInitial = user.first_name.trim().charAt(0);
  const lastInitial = user.last_name.trim().charAt(0);

  return `${firstInitial}${lastInitial}`.trim().toUpperCase() || "U";
}

function formatEmploymentMovementTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

type HrUserProfileClientProps = {
  currentUser: AuthUser;
  userId: string;
};

export function HrUserProfileClient({
  currentUser,
  userId,
}: HrUserProfileClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UsersResponse>([]);
  const [departments, setDepartments] = useState<DepartmentsResponse>([]);
  const [positions, setPositions] = useState<PayrollPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AuthUser | null>(
    null,
  );
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplateRecord[]>(
    [],
  );
  const [selectedShiftIds, setSelectedShiftIds] = useState<number[]>([]);
  const [isLoadingShiftPolicy, setIsLoadingShiftPolicy] = useState(false);
  const [isSavingShiftPolicy, setIsSavingShiftPolicy] = useState(false);
  const [shiftPolicyError, setShiftPolicyError] = useState<string | null>(null);
  const [employmentMovements, setEmploymentMovements] = useState<
    UserEmploymentMovementRecord[]
  >([]);
  const [isLoadingEmploymentMovements, setIsLoadingEmploymentMovements] =
    useState(false);
  const [employmentMovementsError, setEmploymentMovementsError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedUsers, loadedDepartments, loadedPositions] =
          await Promise.all([
            requestJson<UsersResponse>("/api/users?include_superusers=true"),
            requestJson<DepartmentsResponse>("/api/departments"),
            requestJson<PayrollPosition[]>("/api/payroll/positions"),
          ]);

        if (cancelled) {
          return;
        }

        setUsers(loadedUsers);
        setDepartments(loadedDepartments);
        setPositions(loadedPositions);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }

        const message =
          err instanceof Error ? err.message : "Unable to load user profile.";
        setError(message);
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
  }, [router]);

  const user = useMemo(
    () => users.find((item) => item.id === userId) ?? null,
    [users, userId],
  );

  const availableApprovers = useMemo(
    () => users.filter((item) => item.id !== userId),
    [users, userId],
  );

  useEffect(() => {
    if (!user) {
      setShiftTemplates([]);
      setSelectedShiftIds([]);
      setShiftPolicyError(null);
      return;
    }

    let cancelled = false;
    const targetUserId = user.id;

    async function loadShiftPolicyData() {
      setIsLoadingShiftPolicy(true);
      setShiftPolicyError(null);

      try {
        const [loadedPolicy, loadedTemplates] = await Promise.all([
          requestJson<UserShiftPolicyResponse>(
            `/api/attendance/users/${targetUserId}/shift-policy`,
          ),
          requestJson<ShiftTemplateRecord[]>("/api/attendance/shift-templates"),
        ]);

        if (cancelled) {
          return;
        }

        setShiftTemplates(loadedTemplates);
        setSelectedShiftIds(loadedPolicy.shifts.map((shift) => shift.id));
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unable to load user shift templates.";
        setShiftPolicyError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingShiftPolicy(false);
        }
      }
    }

    void loadShiftPolicyData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEmploymentMovements([]);
      setEmploymentMovementsError(null);
      setIsLoadingEmploymentMovements(false);
      return;
    }

    let cancelled = false;
    const targetUserId = user.id;

    async function loadEmploymentMovements() {
      setIsLoadingEmploymentMovements(true);
      setEmploymentMovementsError(null);

      try {
        const response = await requestJson<UserEmploymentMovementRecord[]>(
          `/api/users/${targetUserId}/employment-movements`,
        );
        if (cancelled) {
          return;
        }
        setEmploymentMovements(response);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load employment movements.";
        setEmploymentMovementsError(message);
      } finally {
        if (!cancelled) {
          setIsLoadingEmploymentMovements(false);
        }
      }
    }

    void loadEmploymentMovements();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSaveUser(payload: UserEditorPayload) {
    if (!user) {
      throw new Error("User is not available.");
    }

    try {
      const response = await requestJson<AuthUser>(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setUsers((current) =>
        current.map((item) => (item.id === response.id ? response : item)),
      );
      toast.success("User profile updated.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        err instanceof Error ? err.message : "Unable to update user profile.";
      toast.error(message);
      throw err;
    }
  }

  async function toggleUserStatus() {
    if (!user) {
      return;
    }

    if (user.id === currentUser.id && user.is_active) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      const response = await requestJson<AuthUser>(
        `/api/users/${user.id}/toggle-status`,
        {
          method: "POST",
        },
      );

      setUsers((current) =>
        current.map((item) => (item.id === response.id ? response : item)),
      );
      toast.success(
        response.is_active ? "User activated." : "User deactivated.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }

      const message =
        err instanceof Error ? err.message : "Unable to update user status.";
      toast.error(message);
    }
  }

  function openResetPasswordDialog() {
    if (!user) {
      return;
    }

    setResetPasswordUser(user);
    setResetPasswordOpen(true);
  }

  function closeResetPasswordDialog(nextOpen: boolean) {
    setResetPasswordOpen(nextOpen);
    if (!nextOpen) {
      setResetPasswordUser(null);
    }
  }

  async function handleResetPassword(): Promise<string> {
    if (!user) {
      throw new Error("No user selected.");
    }

    try {
      const response = await requestJson<ResetPasswordResponse>(
        `/api/users/${user.id}/reset-password`,
        {
          method: "POST",
        },
      );
      toast.success("Temporary password generated.");
      return response.temporary_password;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        throw err;
      }

      throw err instanceof Error
        ? err
        : new Error("Unable to reset user password.");
    }
  }

  function toggleShiftTemplate(shiftId: number, checked: boolean) {
    setSelectedShiftIds((current) => {
      if (checked) {
        return current.includes(shiftId) ? current : [...current, shiftId];
      }
      return current.filter((item) => item !== shiftId);
    });
  }

  async function saveUserShiftPolicy() {
    if (!user) {
      return;
    }

    setIsSavingShiftPolicy(true);
    setShiftPolicyError(null);

    try {
      const response = await requestJson<UserShiftPolicyResponse>(
        `/api/attendance/users/${user.id}/shift-policy`,
        {
          method: "PATCH",
          body: JSON.stringify({
            shift_ids: selectedShiftIds,
          }),
        },
      );
      setSelectedShiftIds(response.shifts.map((shift) => shift.id));
      toast.success("User shift template policy saved.");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save user shift template policy.";
      setShiftPolicyError(message);
      toast.error(message);
    } finally {
      setIsSavingShiftPolicy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
        <Button asChild type="button" variant="outline">
          <Link href="/hr/users">
            <ArrowLeft className="size-4" />
            Back To Users
          </Link>
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          User not found.
        </div>
        <Button asChild type="button" variant="outline">
          <Link href="/hr/users">
            <ArrowLeft className="size-4" />
            Back To Users
          </Link>
        </Button>
      </div>
    );
  }

  const displayName = buildDisplayName(user) || user.email || "User Profile";
  const initials = buildInitials(user);
  const shiftManagementHref = "/hr/shift-management";

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="outline">
          <Link href="/hr/users">
            <ArrowLeft className="size-4" />
            Back To Users
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditorOpen(true)}
          >
            <PencilLine className="size-4" />
            Edit Profile
          </Button>
        </div>
      </section>

      <ProfileHeader
        user={user}
        displayName={displayName}
        initials={initials}
        canEditPhoto={false}
      />

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Profile details
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Read-only information from this user profile record.
          </p>
        </div>
        <ProfileDetailsSections user={user} />
      </section>

      <UserCompletedTrainingsSection userId={user.id} scope="user" />

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Shift Template Selection
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Assign and update shift templates directly for this user.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="text-base">Shift Templates</CardTitle>
              <Button asChild type="button" variant="outline">
                <Link href={shiftManagementHref}>
                  <CalendarDays className="size-4" />
                  Open Shift Management
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingShiftPolicy ? (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-border/70 bg-muted/20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : shiftPolicyError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {shiftPolicyError}
              </div>
            ) : shiftTemplates.length > 0 ? (
              <>
                <div className="space-y-2">
                  {shiftTemplates.map((shift) => {
                    const checked = selectedShiftIds.includes(shift.id);
                    return (
                      <Label
                        key={shift.id}
                        htmlFor={`user-shift-template-${shift.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 hover:bg-muted/30"
                      >
                        <Checkbox
                          id={`user-shift-template-${shift.id}`}
                          checked={checked}
                          onCheckedChange={(next) =>
                            toggleShiftTemplate(shift.id, next === true)
                          }
                        />
                        <span className="space-y-1">
                          <span className="block text-sm font-medium text-foreground">
                            {shift.description}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {buildShiftSummary(shift)}
                          </span>
                        </span>
                      </Label>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void saveUserShiftPolicy()}
                    disabled={isSavingShiftPolicy}
                  >
                    <Save className="size-4" />
                    {isSavingShiftPolicy ? "Saving..." : "Save Shift Templates"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                No shift templates available. Create templates in Shift
                Management first.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Employment Movement History
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Read-only audit trail of employment detail changes.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Employment Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEmploymentMovements ? (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-border/70 bg-muted/20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : employmentMovementsError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {employmentMovementsError}
              </div>
            ) : employmentMovements.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Changed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employmentMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatEmploymentMovementTime(movement.changed_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatEmploymentMovementFieldLabel(
                            movement.field_name,
                          )}
                        </TableCell>
                        <TableCell>
                          {formatEmploymentMovementValue(
                            movement.field_name,
                            movement.old_value,
                            {
                              departments,
                              positions,
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          {formatEmploymentMovementValue(
                            movement.field_name,
                            movement.new_value,
                            {
                              departments,
                              positions,
                            },
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {movement.effective_date ?? "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatEmploymentMovementActor(
                            movement.changed_by,
                            users,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                No employment movement records yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            Security
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Admin actions for account access and credential recovery.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle className="text-base">Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" onClick={openResetPasswordDialog}>
              <KeyRound className="size-4" />
              Reset Password
            </Button>
            <ConfirmationModal
              trigger={
                <Button
                  type="button"
                  variant={user.is_active ? "destructive" : "secondary"}
                >
                  <Shield className="size-4" />
                  {user.is_active ? "Deactivate User" : "Activate User"}
                </Button>
              }
              title={
                user.is_active
                  ? `Deactivate ${displayName}?`
                  : `Activate ${displayName}?`
              }
              description={
                user.is_active
                  ? "The account will lose access until an administrator reactivates it."
                  : "The account will regain access after activation."
              }
              confirmLabel={user.is_active ? "Deactivate" : "Activate"}
              confirmVariant={user.is_active ? "destructive" : "default"}
              onConfirm={toggleUserStatus}
            />
          </CardContent>
        </Card>
      </section>

      <UserEditorDialog
        key={`edit-user-${user.id}`}
        open={editorOpen}
        mode="edit"
        user={user}
        departments={departments}
        positions={positions}
        users={availableApprovers}
        onOpenChange={setEditorOpen}
        onSubmit={handleSaveUser}
      />

      <ResetPasswordDialog
        open={resetPasswordOpen}
        user={resetPasswordUser}
        onOpenChange={closeResetPasswordDialog}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
