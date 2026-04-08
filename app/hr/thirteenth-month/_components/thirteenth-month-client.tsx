"use client";

import { Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  requestJson,
  type ThirteenthMonthAdjustmentType,
  type ThirteenthMonthPayout,
  toNumber,
} from "@/lib/payroll";
import { toast } from "@/lib/toast";
import type { AuthUser } from "@/types/auth";

type AdjustmentForm = {
  type: ThirteenthMonthAdjustmentType;
  label: string;
  amount: string;
  reason: string;
};

function currentYear() {
  return new Date().getFullYear();
}

function buildYearOptions() {
  const now = currentYear();
  return Array.from({ length: 6 }, (_, index) => String(now - 2 + index));
}

function formatCurrency(value: string | number | null | undefined) {
  return toNumber(value).toFixed(2);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function ThirteenthMonthClient() {
  const [year, setYear] = useState(String(currentYear()));
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [payouts, setPayouts] = useState<ThirteenthMonthPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activePayoutId, setActivePayoutId] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>({
    type: "DEDUCT",
    label: "",
    amount: "",
    reason: "",
  });
  const [generating, setGenerating] = useState(false);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [releasingPayoutId, setReleasingPayoutId] = useState<number | null>(
    null,
  );
  const [removingAdjustmentId, setRemovingAdjustmentId] = useState<
    number | null
  >(null);

  const yearOptions = useMemo(() => buildYearOptions(), []);
  const activePayout = useMemo(
    () => payouts.find((item) => item.id === activePayoutId) ?? null,
    [activePayoutId, payouts],
  );

  const getEmployeeName = useCallback(
    (item: ThirteenthMonthPayout) => {
      const user =
        item.user ?? users.find((entry) => entry.id === item.user_id) ?? null;
      if (!user) {
        return item.user_id;
      }
      return (
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
        user.email
      );
    },
    [users],
  );

  const loadPayouts = useCallback(async (targetYear: string) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ year: targetYear });
      const data = await requestJson<ThirteenthMonthPayout[]>(
        `/api/payroll/thirteenth-month?${query.toString()}`,
      );
      setPayouts(data);
      if (data.length > 0) {
        setActivePayoutId((current) => current ?? data[0].id);
      } else {
        setActivePayoutId(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load 13th month payouts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const userList = await requestJson<AuthUser[]>(
          "/api/users?active_only=true",
        );
        setUsers(userList);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to load users.",
        );
      } finally {
        await loadPayouts(String(currentYear()));
      }
    }
    void initialize();
  }, [loadPayouts]);

  const filteredPayouts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return payouts;
    }
    return payouts.filter((item) =>
      getEmployeeName(item).toLowerCase().includes(normalized),
    );
  }, [getEmployeeName, payouts, search]);

  async function handleGenerate() {
    try {
      setGenerating(true);
      await requestJson<ThirteenthMonthPayout[]>(
        "/api/payroll/thirteenth-month/generate",
        {
          method: "POST",
          body: JSON.stringify({ year: Number(year) }),
        },
      );
      toast.success("13th month payouts generated.");
      await loadPayouts(year);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to generate payouts.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleRelease(payoutId: number) {
    try {
      setReleasingPayoutId(payoutId);
      await requestJson<ThirteenthMonthPayout>(
        `/api/payroll/thirteenth-month/${payoutId}/release`,
        {
          method: "POST",
        },
      );
      toast.success("Payout released.");
      await loadPayouts(year);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to release payout.",
      );
    } finally {
      setReleasingPayoutId(null);
    }
  }

  async function handleAddAdjustment() {
    if (!activePayout) {
      toast.error("Select a payout first.");
      return;
    }
    const amount = Number(adjustmentForm.amount);
    if (
      !adjustmentForm.label.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error("Provide a valid label and amount.");
      return;
    }
    try {
      setSavingAdjustment(true);
      await requestJson<ThirteenthMonthPayout>(
        `/api/payroll/thirteenth-month/${activePayout.id}/adjustments`,
        {
          method: "POST",
          body: JSON.stringify({
            type: adjustmentForm.type,
            label: adjustmentForm.label.trim(),
            amount: amount.toFixed(2),
            reason: adjustmentForm.reason.trim() || null,
          }),
        },
      );
      setAdjustmentForm({ type: "DEDUCT", label: "", amount: "", reason: "" });
      toast.success("Adjustment saved.");
      await loadPayouts(year);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save adjustment.",
      );
    } finally {
      setSavingAdjustment(false);
    }
  }

  async function handleRemoveAdjustment(adjustmentId: number) {
    try {
      setRemovingAdjustmentId(adjustmentId);
      await requestJson<ThirteenthMonthPayout>(
        `/api/payroll/thirteenth-month/adjustments/${adjustmentId}`,
        {
          method: "DELETE",
        },
      );
      toast.success("Adjustment removed.");
      await loadPayouts(year);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove adjustment.",
      );
    } finally {
      setRemovingAdjustmentId(null);
    }
  }

  function openManageDialog(payoutId: number) {
    setActivePayoutId(payoutId);
    setAdjustmentForm({ type: "DEDUCT", label: "", amount: "", reason: "" });
    setManageOpen(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>13th Month Payouts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[160px_minmax(280px,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={year}
              onValueChange={(value) => {
                setYear(value);
                void loadPayouts(value);
              }}
            >
              <SelectTrigger id="year" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Search Employee</Label>
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type Employee Name"
              className="h-10 w-full"
            />
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button
              variant="outline"
              onClick={() => void loadPayouts(year)}
              disabled={loading}
              className="h-10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="h-10"
            >
              <Send className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </CardContent>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Adjustments</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>Loading payouts...</TableCell>
                </TableRow>
              ) : filteredPayouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    No payouts found. Generate first for {year}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayouts.map((item) => {
                  const employeeName = getEmployeeName(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{employeeName}</TableCell>
                      <TableCell>{formatCurrency(item.gross_amount)}</TableCell>
                      <TableCell>
                        {item.adjustments.length} Item
                        {item.adjustments.length === 1 ? "" : "s"}
                      </TableCell>
                      <TableCell>{formatCurrency(item.net_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "RELEASED" ? "default" : "secondary"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openManageDialog(item.id)}
                          >
                            {item.status === "RELEASED" ? "View" : "Manage"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleRelease(item.id)}
                            disabled={
                              item.status === "RELEASED" ||
                              releasingPayoutId === item.id
                            }
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Release
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage 13th Month Adjustments</DialogTitle>
            <DialogDescription>
              {activePayout
                ? `${getEmployeeName(activePayout)} • ${activePayout.year}`
                : "Select a payout to continue."}
            </DialogDescription>
          </DialogHeader>
          {!activePayout ? (
            <p className="text-sm text-muted-foreground">No payout selected.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Status: {activePayout.status} · Release date:{" "}
                {formatDateTime(activePayout.released_at)}
              </p>
              <div className="grid gap-3 md:grid-cols-[160px_minmax(220px,1fr)_180px_minmax(220px,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="adjustment-type">Type</Label>
                  <Select
                    value={adjustmentForm.type}
                    onValueChange={(value) =>
                      setAdjustmentForm((current) => ({
                        ...current,
                        type: value as ThirteenthMonthAdjustmentType,
                      }))
                    }
                  >
                    <SelectTrigger id="adjustment-type" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEDUCT">Deduct</SelectItem>
                      <SelectItem value="ADD">Add</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustment-label">Label</Label>
                  <Input
                    id="adjustment-label"
                    value={adjustmentForm.label}
                    onChange={(event) =>
                      setAdjustmentForm((current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                    placeholder="Gov Loan"
                    className="h-10 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustment-amount">Amount</Label>
                  <Input
                    id="adjustment-amount"
                    value={adjustmentForm.amount}
                    onChange={(event) =>
                      setAdjustmentForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="500.00"
                    className="h-10 w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustment-reason">Reason</Label>
                  <Input
                    id="adjustment-reason"
                    value={adjustmentForm.reason}
                    onChange={(event) =>
                      setAdjustmentForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="h-10 w-full"
                  />
                </div>
              </div>
              <Button
                onClick={() => void handleAddAdjustment()}
                disabled={
                  savingAdjustment || activePayout.status === "RELEASED"
                }
                className="h-10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Adjustment
              </Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePayout.adjustments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>No adjustments yet.</TableCell>
                    </TableRow>
                  ) : (
                    activePayout.adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell>{adjustment.type}</TableCell>
                        <TableCell>{adjustment.label}</TableCell>
                        <TableCell>
                          {formatCurrency(adjustment.amount)}
                        </TableCell>
                        <TableCell>{adjustment.reason || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void handleRemoveAdjustment(adjustment.id)
                            }
                            disabled={
                              removingAdjustmentId === adjustment.id ||
                              activePayout.status === "RELEASED"
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
