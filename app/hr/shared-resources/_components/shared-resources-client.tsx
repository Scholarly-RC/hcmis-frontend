"use client";

import { Download, Loader2, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HrModulePageScaffold } from "@/components/hr/module-scaffold";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

export function SharedResourcesClient() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<SharedResourceRecord[]>([]);

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

  async function deleteResource(resourceId: number) {
    setDeletingId(resourceId);
    try {
      const response = await fetch(
        `/api/performance/shared-resources/${resourceId}`,
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
      await loadResources();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete resource.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <HrModulePageScaffold
      title="Shared Resources Management"
      description="Upload files and maintain shared access resources for teams."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadResources()}
          disabled={loading}
        >
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Refresh
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5">
          <h2 className="text-lg font-semibold tracking-tight">
            Upload Resource
          </h2>
          <label htmlFor="shared-resource-name" className="space-y-1 text-sm">
            <span className="text-muted-foreground">
              Resource name (optional)
            </span>
            <Input
              id="shared-resource-name"
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
            />
          </label>
          <label
            htmlFor="shared-resource-description"
            className="space-y-1 text-sm"
          >
            <span className="text-muted-foreground">
              Description (optional)
            </span>
            <Textarea
              id="shared-resource-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label htmlFor="shared-resource-file" className="space-y-1 text-sm">
            <span className="text-muted-foreground">File</span>
            <Input
              id="shared-resource-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label
            htmlFor="shared-resource-confidential"
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id="shared-resource-confidential"
              checked={isConfidential}
              onCheckedChange={(next) => setIsConfidential(Boolean(next))}
            />
            <span>Mark as confidential</span>
          </label>
          <Button
            type="button"
            onClick={() => void uploadResource()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Upload
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/85 p-4 shadow-lg shadow-black/5">
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
            >
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {resource.resource_name}
                        </div>
                        {resource.description ? (
                          <div className="text-xs text-muted-foreground">
                            {resource.description}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{resource.original_filename}</TableCell>
                    <TableCell>{formatSize(resource.size_bytes)}</TableCell>
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
                          onClick={() => void deleteResource(resource.id)}
                          disabled={deletingId === resource.id}
                        >
                          {deletingId === resource.id ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 size-4" />
                          )}
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
                    className="text-sm text-muted-foreground"
                  >
                    No resources found.
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
