"use client";

import {
  ArrowUpDown,
  Download,
  Loader2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { SharedResourceRecord } from "@/lib/shared-resources";
import { toast } from "@/lib/toast";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type RequestError = {
  detail?: string;
};

async function requestJson<T>(pathname: string, init: RequestInit = {}) {
  const response = await fetch(pathname, {
    ...init,
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SortKey = "resource_name" | "size_bytes" | "created_at";
type SortDirection = "asc" | "desc";

export function SharedResourcesClient() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] =
    useState<SharedResourceRecord | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<SharedResourceRecord[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const path =
        query.trim().length > 0
          ? `/api/performance/shared-resources?search=${encodeURIComponent(query.trim())}`
          : "/api/performance/shared-resources";
      const data = await requestJson<SharedResourceRecord[]>(path);
      setResources(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load resources.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  async function uploadResource() {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File is too large. Maximum supported size is 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("uploaded_file", file);
      if (resourceName.trim().length > 0) {
        formData.append("resource_name", resourceName.trim());
      }
      if (description.trim().length > 0) {
        formData.append("description", description.trim());
      }
      formData.append("is_confidential", String(isConfidential));

      const response = await fetch("/api/performance/shared-resources/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | SharedResourceRecord
        | RequestError
        | null;

      if (!response.ok) {
        throw new Error(
          (payload as RequestError | null)?.detail ?? "Upload failed.",
        );
      }

      setResourceName("");
      setDescription("");
      setIsConfidential(false);
      setFile(null);
      setUploadDialogOpen(false);
      toast.success("Resource uploaded.");
      await loadResources();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload resource.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteResource(resource: SharedResourceRecord) {
    if (
      resource.is_confidential &&
      deleteConfirmName.trim() !== resource.resource_name
    ) {
      toast.error("Please enter the exact resource name to confirm deletion.");
      return;
    }

    setDeletingId(resource.id);
    try {
      const response = await fetch(
        `/api/performance/shared-resources/${resource.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => null)) as RequestError | null;
        throw new Error(payload?.detail ?? "Delete failed.");
      }
      toast.success("Resource deleted.");
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      setDeleteConfirmName("");
      await loadResources();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete resource.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const sortedResources = [...resources].sort((left, right) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortKey === "size_bytes") {
      return (left.size_bytes - right.size_bytes) * direction;
    }
    if (sortKey === "created_at") {
      return (
        (new Date(left.created_at).getTime() -
          new Date(right.created_at).getTime()) *
        direction
      );
    }
    return left.resource_name.localeCompare(right.resource_name) * direction;
  });

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "resource_name" ? "asc" : "desc");
  }

  const hasSearchQuery = query.trim().length > 0;

  return (
    <HrModulePageScaffold
      title="Shared Resources Management"
      description="Upload files and maintain shared access resources for teams."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setUploadDialogOpen(true)}
            disabled={uploading}
          >
            <Upload className="mr-2 size-4" />
            Upload Resource
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadResources()}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      }
    >
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadDialogOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Resource</DialogTitle>
            <DialogDescription>
              Add a file to shared resources for team access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="shared-resource-name"
                className="text-sm font-medium text-foreground"
              >
                Resource name
              </Label>
              <Input
                id="shared-resource-name"
                value={resourceName}
                placeholder="Optional"
                onChange={(event) => setResourceName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="shared-resource-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </Label>
              <Textarea
                id="shared-resource-description"
                value={description}
                placeholder="Optional"
                className="min-h-24"
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="shared-resource-file"
                className="text-sm font-medium text-foreground"
              >
                File
              </Label>
              <Input
                id="shared-resource-file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: PDF, DOCX, TXT. Maximum file size: 10 MB.
              </p>
            </div>
            <Label
              htmlFor="shared-resource-confidential"
              className="flex items-center gap-2 pt-1 text-sm"
            >
              <Checkbox
                id="shared-resource-confidential"
                checked={isConfidential}
                onCheckedChange={(next) => setIsConfidential(Boolean(next))}
              />
              <span>Mark as confidential</span>
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void uploadResource()}
              disabled={uploading || !file}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deletingId) {
            setDeleteDialogOpen(open);
            if (!open) {
              setResourceToDelete(null);
              setDeleteConfirmName("");
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete resource</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {resourceToDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are deleting{" "}
                <span className="font-medium text-foreground">
                  {resourceToDelete.resource_name}
                </span>
                .
              </p>
              {resourceToDelete.is_confidential ? (
                <Label className="space-y-1 text-sm" htmlFor="delete-confirm">
                  <span className="text-muted-foreground">
                    Enter the exact resource name to confirm
                  </span>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmName}
                    onChange={(event) =>
                      setDeleteConfirmName(event.target.value)
                    }
                    placeholder={resourceToDelete.resource_name}
                  />
                </Label>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={Boolean(deletingId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                resourceToDelete
                  ? void deleteResource(resourceToDelete)
                  : undefined
              }
              disabled={
                Boolean(deletingId) ||
                !resourceToDelete ||
                (resourceToDelete.is_confidential &&
                  deleteConfirmName.trim() !== resourceToDelete.resource_name)
              }
            >
              {deletingId ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadResources()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              Search
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    className="-ml-3 h-8 px-3"
                    onClick={() => toggleSort("resource_name")}
                  >
                    Name
                    <ArrowUpDown className="ml-2 size-4" />
                  </Button>
                </TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    className="ml-auto h-8 px-3"
                    onClick={() => toggleSort("size_bytes")}
                  >
                    Size
                    <ArrowUpDown className="ml-2 size-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    className="-ml-3 h-8 px-3"
                    onClick={() => toggleSort("created_at")}
                  >
                    Created
                    <ArrowUpDown className="ml-2 size-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Loading resources...
                  </TableCell>
                </TableRow>
              ) : sortedResources.length > 0 ? (
                sortedResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="max-w-64 truncate font-medium"
                            title={resource.resource_name}
                          >
                            {resource.resource_name}
                          </div>
                          {resource.is_confidential ? (
                            <Badge variant="outline">Confidential</Badge>
                          ) : null}
                        </div>
                        {resource.description ? (
                          <div
                            className="max-w-80 truncate text-xs text-muted-foreground"
                            title={resource.description}
                          >
                            {resource.description}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-52 truncate"
                      title={resource.original_filename}
                    >
                      {resource.original_filename}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatSize(resource.size_bytes)}
                    </TableCell>
                    <TableCell>{formatDateTime(resource.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          <a
                            href={`/api/performance/shared-resources/${resource.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="mr-2 size-4" />
                            Download
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setResourceToDelete(resource);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={Boolean(deletingId)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {hasSearchQuery
                      ? "No results found for your search."
                      : "No resources uploaded yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </HrModulePageScaffold>
  );
}
