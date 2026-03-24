"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-left transition-colors hover:bg-muted/50"
        aria-expanded={open}
        aria-haspopup="menu"
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
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account actions"
          className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-2xl border border-border/70 bg-card p-2 shadow-xl shadow-black/10"
        >
          <form action="/api/auth/logout" method="post">
            <Button
              type="submit"
              variant="destructive"
              className="w-full justify-start gap-2 rounded-xl"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
