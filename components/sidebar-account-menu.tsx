"use client";

import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";

type SidebarAccountMenuProps = {
  displayName: string;
  email: string;
  profilePictureUrl?: string | null;
};

export function SidebarAccountMenu({
  displayName,
  email,
  profilePictureUrl,
}: SidebarAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const primaryText = displayName || email;
  const normalizedProfilePictureUrl = profilePictureUrl?.trim() || undefined;
  const profileImageSrc = normalizedProfilePictureUrl ?? "";
  const showProfileImage = Boolean(normalizedProfilePictureUrl) && !imageFailed;
  const initials = primaryText
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-start rounded-2xl border-border/70 bg-background/80 px-3 py-3 text-left shadow-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex w-full items-center gap-3">
            <Avatar className="size-10 shrink-0 rounded-full">
              {showProfileImage ? (
                <Image
                  src={profileImageSrc}
                  alt={`${primaryText} profile picture`}
                  width={40}
                  height={40}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {initials || "U"}
                </div>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Signed in as
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {primaryText}
              </p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open ? "rotate-180" : null,
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-2xl p-2"
      >
        <DropdownMenuItem asChild className="gap-2 rounded-xl px-3 py-2">
          <Link
            href="/profile"
            onClick={() => {
              setOpen(false);
            }}
          >
            <UserCircle2 className="size-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2 rounded-xl px-3 py-2"
          onSelect={(event) => {
            event.preventDefault();
            window.location.href = "/api/auth/logout";
            setOpen(false);
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
