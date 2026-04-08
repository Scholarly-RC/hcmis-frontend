"use client";

import { PencilLine } from "lucide-react";
import { useState } from "react";

import { ProfileEditForm } from "@/app/profile/_components/profile-edit-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AuthUser } from "@/types/auth";

type ProfileEditModalProps = {
  user: AuthUser;
};

export function ProfileEditModal({ user }: ProfileEditModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilLine className="size-4" />
          Edit Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="!max-w-5xl flex h-[min(90vh,56rem)] w-[min(96vw,64rem)] flex-col gap-1 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-4">
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal, contact, and employment details without
            leaving the profile page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <ProfileEditForm
            user={user}
            onCancel={() => setOpen(false)}
            onSaved={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
