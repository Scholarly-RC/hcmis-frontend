"use client";

import { Check, Loader2, X } from "lucide-react";
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ButtonVariant = ComponentProps<typeof Button>["variant"];

type ConfirmationModalProps = {
  trigger: ReactElement;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationModal({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
}: ConfirmationModalProps) {
  const [open, setOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    if (isConfirming) {
      return;
    }

    setIsConfirming(true);

    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Keep the dialog open so the caller can surface the failure.
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-0 p-0">
        <DialogHeader className="gap-2 border-b px-4 py-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description ? (
          <div className="border-b px-4 py-3">
            <DialogDescription>{description}</DialogDescription>
          </div>
        ) : null}
        <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t-0 bg-muted/30 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isConfirming}
          >
            <X className="size-4" />
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {isConfirming ? "Please Wait..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
