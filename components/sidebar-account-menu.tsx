"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SidebarAccountMenuProps = {
  displayName: string;
  email: string;
};

export function SidebarAccountMenu({
  displayName,
  email,
}: SidebarAccountMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-start rounded-2xl border-border/70 bg-background/70 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Signed in as
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {displayName || email}
              </p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
            <ChevronDown
              className={cn(
                "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
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
