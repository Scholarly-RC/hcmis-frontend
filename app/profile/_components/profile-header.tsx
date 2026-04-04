"use client";

import { Camera, Check, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/types/auth";

type ProfileHeaderProps = {
  user: AuthUser;
  displayName: string;
  initials: string;
};

export function ProfileHeader({
  user,
  displayName,
  initials,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedProfilePictureUrl = user.profile_picture_url?.trim() || null;
  const profileImageSrc = normalizedProfilePictureUrl ?? "";
  const showProfileImage = Boolean(normalizedProfilePictureUrl) && !imageFailed;

  function resetEditor() {
    setSelectedPhoto(null);
    setIsEditingPhoto(false);
    setFeedback(null);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }
    if (!selectedPhoto) {
      setFeedback("Please select an image file first.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("uploaded_file", selectedPhoto);

      const response = await fetch("/api/profile/me/photo", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!response.ok) {
        setFeedback(payload?.detail ?? "Unable to update profile picture.");
        return;
      }

      setFeedback("Profile picture updated.");
      setIsEditingPhoto(false);
      setImageFailed(false);
      router.refresh();
    } catch {
      setFeedback("Unable to reach the profile service.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-lg shadow-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border/70 bg-muted/70 shadow-sm shadow-black/10 sm:size-24">
          {showProfileImage ? (
            <Image
              src={profileImageSrc}
              alt={displayName}
              fill
              sizes="96px"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-foreground/80 text-2xl font-semibold text-primary-foreground">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {displayName}
          </h1>

          <div className="mt-3">
            {isEditingPhoto ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setSelectedPhoto(event.target.files?.[0] ?? null)
                    }
                  />
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !selectedPhoto}
                  >
                    <Check className="size-4" />
                    {isSaving ? "Saving..." : "Save Photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetEditor}
                    disabled={isSaving}
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Upload a JPG, PNG, GIF, WEBP, or BMP file.
                </p>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsEditingPhoto(true)}
              >
                <Camera className="size-4" />
                Change Photo
              </Button>
            )}
          </div>

          {feedback ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {feedback}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
