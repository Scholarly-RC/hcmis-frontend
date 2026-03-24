"use client";

import { PencilLine, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ProfileEditForm } from "@/app/profile/_components/profile-edit-form";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";

type ProfileEditModalProps = {
  user: AuthUser;
};

export function ProfileEditModal({ user }: ProfileEditModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <PencilLine className="size-4" />
        Edit profile
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close edit profile modal"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            className="relative z-10 flex h-[min(90vh,56rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-background shadow-2xl"
          >
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
        </div>
      ) : null}
    </>
  );
}
