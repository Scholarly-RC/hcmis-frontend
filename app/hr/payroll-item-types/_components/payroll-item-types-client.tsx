"use client";

import { Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  HrFormSectionScaffold,
  HrListSectionScaffold,
  HrModulePageScaffold,
} from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { type PayrollItemType, requestJson } from "@/lib/payroll";
import { toast } from "@/lib/toast";

type PayrollItemTypeForm = {
  code: string;
  name: string;
  category: "earning" | "deduction";
  behavior: "variable" | "fixed" | "formula";
  taxable: "true" | "false";
  is_active: "true" | "false";
  display_order: string;
};

const emptyForm: PayrollItemTypeForm = {
  code: "",
  name: "",
  category: "earning",
  behavior: "variable",
  taxable: "false",
  is_active: "true",
  display_order: "0",
};

export function PayrollItemTypesClient() {
  const [itemTypes, setItemTypes] = useState<PayrollItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItemTypeId, setEditingItemTypeId] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState<PayrollItemTypeForm>(emptyForm);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requestJson<PayrollItemType[]>(
        "/api/payroll/item-types",
      );
      setItemTypes(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load payroll item types.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function resetForm() {
    setEditingItemTypeId(null);
    setForm(emptyForm);
  }

  function startEdit(itemType: PayrollItemType) {
    setEditingItemTypeId(itemType.id);
    setForm({
      code: itemType.code,
      name: itemType.name,
      category: itemType.category,
      behavior: itemType.behavior,
      taxable: itemType.taxable ? "true" : "false",
      is_active: itemType.is_active ? "true" : "false",
      display_order: String(itemType.display_order),
    });
  }

  async function submit() {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category,
      behavior: form.behavior,
      taxable: form.taxable === "true",
      is_active: form.is_active === "true",
      display_order: Number(form.display_order || "0"),
    };

    if (!payload.code || !payload.name) {
      toast.error("Code and name are required.");
      return;
    }

    try {
      setSaving(true);
      if (editingItemTypeId) {
        await requestJson<PayrollItemType>(
          `/api/payroll/item-types/${editingItemTypeId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        toast.success("Payroll item type updated.");
      } else {
        await requestJson<PayrollItemType>("/api/payroll/item-types", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Payroll item type created.");
      }
      resetForm();
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save payroll item type.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(itemType: PayrollItemType) {
    try {
      await requestJson<PayrollItemType>(
        `/api/payroll/item-types/${itemType.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            code: itemType.code,
            name: itemType.name,
            category: itemType.category,
            behavior: itemType.behavior,
            taxable: itemType.taxable,
            is_active: false,
            display_order: itemType.display_order,
          }),
        },
      );
      toast.success(`${itemType.name} deactivated.`);
      await reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to deactivate payroll item type.",
      );
    }
  }

  return (
    <HrModulePageScaffold
      title="Payroll Item Types"
      description="Define the earning and deduction types that payroll staff can use when encoding variable payroll run inputs."
      actions={
        <Button variant="outline" onClick={() => void reload()}>
          <RefreshCw className="size-4" />
          Refresh Data
        </Button>
      }
    >
      <HrFormSectionScaffold
        title="Item Definition"
        description="Create a new payroll item type or update an existing one. Variable behavior is the standard choice for payroll run inputs."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              placeholder="OVERTIME"
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Overtime"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value: "earning" | "deduction") =>
                setForm((current) => ({ ...current, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="earning">earning</SelectItem>
                <SelectItem value="deduction">deduction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Behavior</Label>
            <Select
              value={form.behavior}
              onValueChange={(value: "variable" | "fixed" | "formula") =>
                setForm((current) => ({ ...current, behavior: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="variable">variable</SelectItem>
                <SelectItem value="fixed">fixed</SelectItem>
                <SelectItem value="formula">formula</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Taxable</Label>
            <Select
              value={form.taxable}
              onValueChange={(value: "true" | "false") =>
                setForm((current) => ({ ...current, taxable: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">true</SelectItem>
                <SelectItem value="false">false</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.is_active}
              onValueChange={(value: "true" | "false") =>
                setForm((current) => ({ ...current, is_active: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">active</SelectItem>
                <SelectItem value="false">inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Display Order</Label>
            <Input
              type="number"
              min="0"
              value={form.display_order}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  display_order: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void submit()} disabled={saving}>
            {editingItemTypeId ? (
              <Save className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editingItemTypeId ? "Save Changes" : "Add Item Type"}
          </Button>
          {editingItemTypeId ? (
            <Button variant="outline" onClick={resetForm} disabled={saving}>
              <RefreshCw className="size-4" />
              Cancel Edit
            </Button>
          ) : null}
        </div>
      </HrFormSectionScaffold>

      <HrListSectionScaffold
        title="Configured Item Types"
        description="Keep the catalog clean so payroll run input entry stays consistent."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Behavior</TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>Loading payroll item types...</TableCell>
              </TableRow>
            ) : itemTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  No payroll item types configured yet.
                </TableCell>
              </TableRow>
            ) : (
              itemTypes.map((itemType) => (
                <TableRow key={itemType.id}>
                  <TableCell>{itemType.code}</TableCell>
                  <TableCell>{itemType.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        itemType.category === "earning"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {itemType.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{itemType.behavior}</TableCell>
                  <TableCell>{itemType.taxable ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {itemType.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>{itemType.display_order}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(itemType)}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    {itemType.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void deactivate(itemType)}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </HrListSectionScaffold>
    </HrModulePageScaffold>
  );
}
