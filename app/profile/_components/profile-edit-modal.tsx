"use client";

import { PencilLine, X } from "lucide-react";
import { useState } from "react";

import { ProfileEditForm } from "@/app/profile/_components/profile-edit-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { AuthUser } from "@/lib/auth";

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
          Edit profile
        </Button>
      </DialogTrigger>

      <DialogContent
        className="h-[min(90vh,56rem)] w-[min(96vw,72rem)] max-w-none overflow-hidden rounded-3xl border border-border/70 bg-background p-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Profile editor
              </p>
              <h2
                id="profile-edit-title"
                className="font-heading text-2xl font-semibold tracking-tight text-foreground"
              >
                Edit profile
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close profile editor"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0">
            <ProfileEditForm user={user} onSaved={() => setOpen(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
