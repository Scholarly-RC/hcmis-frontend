"use client";

import {
  ArrowUpDown,
  Download,
  Loader2,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
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
import type { AuthUser } from "@/types/auth";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type RequestError = {
  detail?: string;
};

type SortKey = "resource_name" | "size_bytes" | "created_at";
type SortDirection = "asc" | "desc";

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

function formatUserLabel(user: AuthUser) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  if (fullName.length === 0) {
    return user.email;
  }
  return `${fullName} (${user.email})`;
}

function formatUploaderLabel(resource: SharedResourceRecord) {
  if (!resource.uploader) {
    return "Unknown uploader";
  }
  const fullName =
    `${resource.uploader.first_name} ${resource.uploader.last_name}`.trim();
  if (fullName.length === 0) {
    return resource.uploader.email;
  }
  return fullName;
}

function resourceMatchesSearch(
  resource: SharedResourceRecord,
  normalizedQuery: string,
) {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    resource.resource_name.toLowerCase().includes(normalizedQuery) ||
    resource.original_filename.toLowerCase().includes(normalizedQuery) ||
    (resource.description ?? "").toLowerCase().includes(normalizedQuery)
  );
}

export function SharedResourcesClient({
  currentUserId,
  canManageAll,
  title = "Shared Resources",
  pageDescription = "Upload files and maintain shared access resources.",
}: {
  currentUserId: string;
  canManageAll: boolean;
  title?: string;
  pageDescription?: string;
}) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] =
    useState<SharedResourceRecord | null>(null);
  const [resourceToManageAccess, setResourceToManageAccess] =
    useState<SharedResourceRecord | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [query, setQuery] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [resources, setResources] = useState<SharedResourceRecord[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [sharedUserIds, setSharedUserIds] = useState<string[]>([]);
  const [confidentialAccessUserIds, setConfidentialAccessUserIds] = useState<
    string[]
  >([]);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [resourceName, setResourceName] = useState("");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const deepLinkedResourceId = Number.parseInt(
    searchParams.get("resource_id") ?? "",
    10,
  );
  const hasDeepLinkedResource = resources.some(
    (resource) => resource.id === deepLinkedResourceId,
  );

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

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await requestJson<AuthUser[]>(
        "/api/performance/shared-resources/shareable-users",
      );
      setUsers(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load users.",
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!Number.isInteger(deepLinkedResourceId)) {
      return;
    }
    if (!hasDeepLinkedResource) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`shared-resource-row-${deepLinkedResourceId}`)
        ?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [deepLinkedResourceId, hasDeepLinkedResource]);

  function resetUploadForm() {
    setResourceName("");
    setDescription("");
    setIsConfidential(false);
    setFile(null);
    setSharedUserIds([]);
    setConfidentialAccessUserIds([]);
  }

  function openAccessDialog(resource: SharedResourceRecord) {
    setResourceToManageAccess(resource);
    setSharedUserIds(resource.shared_user_ids);
    setConfidentialAccessUserIds(resource.confidential_access_user_ids);
    setUserSearch("");
    setAccessDialogOpen(true);
  }

  function closeAccessDialog() {
    setAccessDialogOpen(false);
    setResourceToManageAccess(null);
    setUserSearch("");
    setSharedUserIds([]);
    setConfidentialAccessUserIds([]);
  }

  function toggleSharedUser(userId: string, checked: boolean) {
    setSharedUserIds((current) => {
      if (checked) {
        if (current.includes(userId)) {
          return current;
        }
        return [...current, userId];
      }
      return current.filter((value) => value !== userId);
    });

    if (!checked) {
      setConfidentialAccessUserIds((current) =>
        current.filter((value) => value !== userId),
      );
    }
  }

  function toggleConfidentialUser(userId: string, checked: boolean) {
    setConfidentialAccessUserIds((current) => {
      if (checked) {
        if (current.includes(userId)) {
          return current;
        }
        return [...current, userId];
      }
      return current.filter((value) => value !== userId);
    });
  }

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
      for (const userId of sharedUserIds) {
        formData.append("shared_user_ids", userId);
      }
      formData.append("is_confidential", String(isConfidential));
      if (isConfidential) {
        for (const userId of confidentialAccessUserIds) {
          formData.append("confidential_access_user_ids", userId);
        }
      }

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
      const createdResource = payload as SharedResourceRecord;

      resetUploadForm();
      setUploadDialogOpen(false);
      setResources((current) => {
        const next = current.filter(
          (resource) => resource.id !== createdResource.id,
        );
        if (!resourceMatchesSearch(createdResource, normalizedQuery)) {
          return next;
        }
        return [createdResource, ...next];
      });
      toast.success("Resource uploaded.");
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
      setResources((current) =>
        current.filter((item) => item.id !== resource.id),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete resource.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function saveAccessChanges() {
    if (!resourceToManageAccess) {
      return;
    }

    setSavingAccess(true);
    try {
      const updatedResource = await requestJson<SharedResourceRecord>(
        `/api/performance/shared-resources/${resourceToManageAccess.id}/access`,
        {
          method: "PUT",
          body: JSON.stringify({
            shared_user_ids: sharedUserIds,
            confidential_access_user_ids: confidentialAccessUserIds,
          }),
        },
      );

      setResources((current) =>
        current.map((resource) =>
          resource.id === updatedResource.id ? updatedResource : resource,
        ),
      );
      setResourceToManageAccess(updatedResource);
      closeAccessDialog();
      toast.success("Access updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update access.",
      );
    } finally {
      setSavingAccess(false);
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

  const filteredUsers = users.filter((user) =>
    formatUserLabel(user).toLowerCase().includes(normalizedUserSearch),
  );
  const uploadedResources = sortedResources.filter(
    (resource) => resource.uploader_id === currentUserId,
  );
  const sharedWithMeResources = sortedResources.filter(
    (resource) => resource.uploader_id !== currentUserId,
  );

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "resource_name" ? "asc" : "desc");
  }

  const hasSearchQuery = query.trim().length > 0;

  function renderResourcesTable(
    items: SharedResourceRecord[],
    emptyMessage: string,
    options: {
      showUploader: boolean;
    },
  ) {
    const { showUploader } = options;
    return (
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
            {showUploader ? <TableHead>Uploader</TableHead> : null}
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
                colSpan={showUploader ? 6 : 5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                Loading resources...
              </TableCell>
            </TableRow>
          ) : items.length > 0 ? (
            items.map((resource) => (
              <TableRow
                key={resource.id}
                id={`shared-resource-row-${resource.id}`}
                className={
                  resource.id === deepLinkedResourceId
                    ? "bg-primary/5 ring-1 ring-primary/20"
                    : undefined
                }
              >
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
                {showUploader ? (
                  <TableCell
                    className="max-w-48 truncate"
                    title={formatUploaderLabel(resource)}
                  >
                    {formatUploaderLabel(resource)}
                  </TableCell>
                ) : null}
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
                    <Button asChild type="button" variant="outline" size="sm">
                      <a
                        href={`/api/performance/shared-resources/${resource.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="mr-2 size-4" />
                        Download
                      </a>
                    </Button>
                    {canManageAll || resource.uploader_id === currentUserId ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openAccessDialog(resource)}
                        >
                          <Users className="mr-2 size-4" />
                          Manage Access
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
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={showUploader ? 6 : 5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <HrModulePageScaffold
      title={title}
      description={pageDescription}
      actions={
        <Button
          type="button"
          onClick={() => setUploadDialogOpen(true)}
          disabled={uploading}
        >
          <Upload className="mr-2 size-4" />
          Upload Resource
        </Button>
      }
    >
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadDialogOpen(open);
            if (!open) {
              resetUploadForm();
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
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
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.m4a,.aac,.ogg"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10 MB.
              </p>
            </div>
            <Label
              htmlFor="shared-resource-confidential"
              className="flex items-center gap-2 pt-1 text-sm"
            >
              <Checkbox
                id="shared-resource-confidential"
                checked={isConfidential}
                onCheckedChange={(next) => {
                  const checked = Boolean(next);
                  setIsConfidential(checked);
                  if (!checked) {
                    setConfidentialAccessUserIds([]);
                  }
                }}
              />
              <span>Mark as confidential</span>
            </Label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Shared With</Label>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                  {usersLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading users...
                    </p>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <Label
                        key={`upload-shared-${user.id}`}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Checkbox
                          checked={sharedUserIds.includes(user.id)}
                          onCheckedChange={(checked) =>
                            toggleSharedUser(user.id, Boolean(checked))
                          }
                        />
                        <span>{formatUserLabel(user)}</span>
                      </Label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No users available.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confidential Access</Label>
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                  {isConfidential ? (
                    sharedUserIds.length > 0 ? (
                      users
                        .filter((user) => sharedUserIds.includes(user.id))
                        .map((user) => (
                          <Label
                            key={`upload-confidential-${user.id}`}
                            className="flex items-start gap-3 text-sm"
                          >
                            <Checkbox
                              checked={confidentialAccessUserIds.includes(
                                user.id,
                              )}
                              onCheckedChange={(checked) =>
                                toggleConfidentialUser(
                                  user.id,
                                  Boolean(checked),
                                )
                              }
                            />
                            <span>{formatUserLabel(user)}</span>
                          </Label>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Select shared users first.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enable confidential mode to configure this list.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetUploadForm();
                setUploadDialogOpen(false);
              }}
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
        open={accessDialogOpen}
        onOpenChange={(open) => {
          if (!savingAccess) {
            if (open) {
              setAccessDialogOpen(true);
              return;
            }
            closeAccessDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Access</DialogTitle>
            <DialogDescription>
              {resourceToManageAccess
                ? `Set who can access ${resourceToManageAccess.resource_name}.`
                : "Set who can access this resource."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shared-resource-user-search">Search users</Label>
              <Input
                id="shared-resource-user-search"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name or email"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Shared With</Label>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
                  {usersLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading users...
                    </p>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <Label
                        key={`access-shared-${user.id}`}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Checkbox
                          checked={sharedUserIds.includes(user.id)}
                          onCheckedChange={(checked) =>
                            toggleSharedUser(user.id, Boolean(checked))
                          }
                        />
                        <span>{formatUserLabel(user)}</span>
                      </Label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No users found.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confidential Access</Label>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
                  {resourceToManageAccess?.is_confidential ? (
                    sharedUserIds.length > 0 ? (
                      filteredUsers
                        .filter((user) => sharedUserIds.includes(user.id))
                        .map((user) => (
                          <Label
                            key={`access-confidential-${user.id}`}
                            className="flex items-start gap-3 text-sm"
                          >
                            <Checkbox
                              checked={confidentialAccessUserIds.includes(
                                user.id,
                              )}
                              onCheckedChange={(checked) =>
                                toggleConfidentialUser(
                                  user.id,
                                  Boolean(checked),
                                )
                              }
                            />
                            <span>{formatUserLabel(user)}</span>
                          </Label>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add shared users first.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Confidential access is only available for confidential
                      resources.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => closeAccessDialog()}
              disabled={savingAccess}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveAccessChanges()}
              disabled={savingAccess || usersLoading}
            >
              {savingAccess ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Users className="mr-2 size-4" />
              )}
              Save Access
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
          {canManageAll ? (
            renderResourcesTable(
              sortedResources,
              hasSearchQuery
                ? "No results found for your search."
                : "No resources uploaded yet.",
              { showUploader: true },
            )
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    Uploaded By You
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Resources you own and can manage.
                  </p>
                </div>
                {renderResourcesTable(
                  uploadedResources,
                  hasSearchQuery
                    ? "No uploaded resources match your search."
                    : "You have not uploaded any resources yet.",
                  { showUploader: false },
                )}
              </section>

              <section className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    Shared With You
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Resources uploaded by others that you can access.
                  </p>
                </div>
                {renderResourcesTable(
                  sharedWithMeResources,
                  hasSearchQuery
                    ? "No shared resources match your search."
                    : "No resources have been shared with you yet.",
                  { showUploader: true },
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </HrModulePageScaffold>
  );
}
