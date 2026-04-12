"use client";

import { ArrowLeft, Loader2, RefreshCw, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  UserEditorDialog,
  type UserEditorInitialValues,
  type UserEditorPayload,
} from "@/app/dashboard/hr/users/_components/user-management-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PayrollPosition } from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthDepartment, AuthUser } from "@/types/auth";

type BridgeCommandsResponse = {
  commands: BridgeCommandRead[];
};

type BridgeReconcileRow = {
  key: string;
  biometric_uid: number | null;
  app_user_id: string | null;
  app_name: string | null;
  biometric_name: string | null;
  present_in_app: boolean;
  present_in_biometric: boolean;
};

type BridgeReconcileResponse = {
  site_code: string;
  device_id: string;
  rows: BridgeReconcileRow[];
};
type DepartmentsResponse = AuthDepartment[];

type BridgeCommandRead = {
  command_id: number;
  site_code: string;
  device_id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  message: string | null;
  created_at: string;
  dispatched_at: string | null;
  executed_at: string | null;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      (payload as { detail?: string } | null)?.detail ?? "Request failed.",
      response.status,
    );
  }

  return payload as T;
}

type LoadSyncResult = {
  latestScanCommand: BridgeCommandRead | null;
};

export function BiometricSyncClient() {
  const router = useRouter();
  const [syncSiteCode, setSyncSiteCode] = useState("MAIN");
  const [syncDeviceId, setSyncDeviceId] = useState("zk-main-1");
  const [departments, setDepartments] = useState<DepartmentsResponse>([]);
  const [positions, setPositions] = useState<PayrollPosition[]>([]);
  const [isScanningUsers, setIsScanningUsers] = useState(false);
  const [isPollingScanCommand, setIsPollingScanCommand] = useState(false);
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState(false);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [createUserInitialValues, setCreateUserInitialValues] =
    useState<UserEditorInitialValues | null>(null);
  const [latestScanCommand, setLatestScanCommand] =
    useState<BridgeCommandRead | null>(null);
  const [reconcileRows, setReconcileRows] = useState<BridgeReconcileRow[]>([]);

  const loadSyncStatusAndRows = useCallback(
    async (
      siteCode: string,
      deviceId: string,
      options: { showLoading?: boolean } = {},
    ): Promise<LoadSyncResult> => {
      const { showLoading = true } = options;
      if (!siteCode.trim() || !deviceId.trim()) {
        setLatestScanCommand(null);
        setReconcileRows([]);
        setSyncStatusError(null);
        return { latestScanCommand: null };
      }

      if (showLoading) {
        setIsLoadingSyncStatus(true);
      }
      setSyncStatusError(null);
      try {
        const query = new URLSearchParams({
          site_code: siteCode.trim(),
          device_id: deviceId.trim(),
          limit: "10",
        });
        const payload = await requestJson<BridgeCommandsResponse>(
          `/api/attendance/bridge/commands/history?${query.toString()}`,
        );
        const reconcilePayload = await requestJson<BridgeReconcileResponse>(
          `/api/attendance/bridge/reconcile?${query.toString()}`,
        );
        const latest = payload.commands.find(
          (command) => command.type === "scan_users",
        );
        setLatestScanCommand(latest ?? null);
        setReconcileRows(reconcilePayload.rows);
        return { latestScanCommand: latest ?? null };
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return { latestScanCommand: null };
        }
        setSyncStatusError(
          err instanceof Error ? err.message : "Unable to load sync status.",
        );
        return { latestScanCommand: null };
      } finally {
        if (showLoading) {
          setIsLoadingSyncStatus(false);
        }
      }
    },
    [router],
  );

  useEffect(() => {
    void loadSyncStatusAndRows(syncSiteCode, syncDeviceId);
  }, [syncSiteCode, syncDeviceId, loadSyncStatusAndRows]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [loadedDepartments, loadedPositions] = await Promise.all([
          requestJson<DepartmentsResponse>("/api/departments"),
          requestJson<PayrollPosition[]>("/api/payroll/positions"),
        ]);
        if (!cancelled) {
          setDepartments(loadedDepartments);
          setPositions(loadedPositions);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Unable to load departments.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function triggerScanUsers() {
    const siteCode = syncSiteCode.trim();
    const deviceId = syncDeviceId.trim();
    if (!siteCode || !deviceId) {
      toast.error("Site code and device ID are required.");
      return;
    }

    setIsScanningUsers(true);
    try {
      const command = await requestJson<BridgeCommandRead>(
        "/api/attendance/bridge/commands/scan-users",
        {
          method: "POST",
          body: JSON.stringify({
            site_code: siteCode,
            device_id: deviceId,
          }),
        },
      );
      setLatestScanCommand(command);
      setSyncStatusError(null);
      toast.success("Sync command queued.");
      setIsPollingScanCommand(true);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
        const result = await loadSyncStatusAndRows(siteCode, deviceId, {
          showLoading: false,
        });
        const latest = result.latestScanCommand;
        const status = latest?.status;
        if (status === "done" || status === "failed") {
          break;
        }
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to queue sync command.";
      toast.error(message);
    } finally {
      setIsScanningUsers(false);
      setIsPollingScanCommand(false);
    }
  }

  function getCommandStatusLabel(command: BridgeCommandRead | null) {
    if (!command) {
      return "No sync command yet";
    }
    switch (command.status) {
      case "queued":
        return "Queued";
      case "dispatched":
        return "In progress";
      case "done":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return command.status;
    }
  }

  function parseBiometricName(name: string | null) {
    const normalized = (name ?? "").trim();
    if (!normalized) {
      return { firstName: "", lastName: "" };
    }
    const parts = normalized.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
    };
  }

  function openCreateUserDialog(row: BridgeReconcileRow) {
    if (!row.present_in_biometric || row.present_in_app) {
      return;
    }
    const { firstName, lastName } = parseBiometricName(row.biometric_name);
    setCreateUserInitialValues({
      first_name: firstName,
      last_name: lastName,
      biometric_uid: row.biometric_uid?.toString() ?? "",
    });
    setIsCreateUserDialogOpen(true);
  }

  async function handleCreateUser(payload: UserEditorPayload) {
    try {
      await requestJson<AuthUser>("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("User created from biometric record.");
      setIsCreateUserDialogOpen(false);
      setCreateUserInitialValues(null);
      await loadSyncStatusAndRows(syncSiteCode, syncDeviceId, {
        showLoading: false,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Unable to create user.";
      toast.error(message);
      throw err;
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Biometric Sync
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Compare app users against biometric records and queue user sync from
            this screen.
          </p>
        </div>

        <Button asChild type="button" variant="outline">
          <Link href="/hr/users">
            <ArrowLeft className="size-4" />
            Back to User Management
          </Link>
        </Button>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/80 p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          App vs Biometric Sync
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            aria-label="Site code"
            value={syncSiteCode}
            onChange={(event) => setSyncSiteCode(event.target.value)}
            placeholder="Site code"
          />
          <Input
            aria-label="Device ID"
            value={syncDeviceId}
            onChange={(event) => setSyncDeviceId(event.target.value)}
            placeholder="Device ID"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSyncStatusError(null);
              void loadSyncStatusAndRows(syncSiteCode, syncDeviceId);
            }}
            disabled={
              isLoadingSyncStatus || isScanningUsers || isPollingScanCommand
            }
          >
            {isLoadingSyncStatus ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh Sync
          </Button>
          <Button
            type="button"
            onClick={triggerScanUsers}
            disabled={isScanningUsers || isPollingScanCommand}
          >
            {isScanningUsers || isPollingScanCommand ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Sync Biometric Users
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Status:</span>
          <Badge variant="outline">
            {getCommandStatusLabel(latestScanCommand)}
          </Badge>
          {latestScanCommand?.created_at ? (
            <span>
              Last queued{" "}
              {new Date(latestScanCommand.created_at).toLocaleString()}
            </span>
          ) : null}
        </div>
        {latestScanCommand?.message ? (
          <p className="text-xs text-muted-foreground">
            {latestScanCommand.message}
          </p>
        ) : null}
        {isPollingScanCommand ? (
          <p className="text-xs text-muted-foreground">
            Sync in progress, waiting for agent result...
          </p>
        ) : null}
        {syncStatusError ? (
          <p className="text-xs text-destructive">{syncStatusError}</p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/95 backdrop-blur">
            <TableRow className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground hover:bg-transparent">
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                UID
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                App
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Biometric
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                App name
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium">
                Biometric name
              </TableHead>
              <TableHead className="border-b border-border/70 px-4 py-3 font-medium text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background">
            {isLoadingSyncStatus ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-4 text-sm text-muted-foreground"
                >
                  Loading biometric sync records...
                </TableCell>
              </TableRow>
            ) : reconcileRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-4 text-sm text-muted-foreground"
                >
                  No biometric sync rows yet. Click "Sync biometric users"
                  first.
                </TableCell>
              </TableRow>
            ) : (
              reconcileRows.map((row) => (
                <TableRow key={row.key} className="group">
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-sm">
                    {row.biometric_uid ?? "-"}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-sm">
                    {row.present_in_app ? "✔" : ""}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-sm">
                    {row.present_in_biometric ? "✔" : ""}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-sm">
                    {row.app_name ?? ""}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-sm">
                    {row.biometric_name ?? ""}
                  </TableCell>
                  <TableCell className="border-b border-border/60 px-4 py-3 align-top text-right text-sm">
                    {row.present_in_biometric && !row.present_in_app ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openCreateUserDialog(row)}
                      >
                        <UserPlus className="size-4" />
                        Create App User
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <UserEditorDialog
        key={`create-${createUserInitialValues?.biometric_uid ?? "blank"}`}
        open={isCreateUserDialogOpen}
        mode="create"
        user={null}
        initialValues={createUserInitialValues ?? undefined}
        departments={departments}
        positions={positions}
        users={[]}
        onOpenChange={(open) => {
          setIsCreateUserDialogOpen(open);
          if (!open) {
            setCreateUserInitialValues(null);
          }
        }}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}
