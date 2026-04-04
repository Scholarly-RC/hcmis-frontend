"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

type ChangePasswordFormValues = {
  current_password?: string;
  new_password: string;
  confirm_password: string;
};

function buildChangePasswordSchema(forceChange: boolean) {
  if (forceChange) {
    return z
      .object({
        current_password: z.string().optional(),
        new_password: z
          .string()
          .min(8, "Password must be at least 8 characters long."),
        confirm_password: z.string().min(1, "Confirm your new password."),
      })
      .superRefine((values, context) => {
        if (values.new_password !== values.confirm_password) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["confirm_password"],
            message: "Password confirmation does not match.",
          });
        }
      });
  }

  return z
    .object({
      current_password: z.string().min(1, "Enter your current password."),
      new_password: z
        .string()
        .min(8, "Password must be at least 8 characters long."),
      confirm_password: z.string().min(1, "Confirm your new password."),
    })
    .superRefine((values, context) => {
      if (values.new_password === values.current_password) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["new_password"],
          message: "New password must be different from current password.",
        });
      }

      if (values.new_password !== values.confirm_password) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirm_password"],
          message: "Password confirmation does not match.",
        });
      }
    });
}

export function ChangePasswordForm({
  forceChange = false,
  redirectToDashboard = true,
}: {
  forceChange?: boolean;
  redirectToDashboard?: boolean;
}) {
  const router = useRouter();
  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(buildChangePasswordSchema(forceChange)),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setSubmitError(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(values.current_password
            ? { current_password: values.current_password }
            : {}),
          new_password: values.new_password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setSubmitError(payload?.detail ?? "Unable to update your password.");
        return;
      }

      toast.success("Password updated successfully.");
      reset();
      if (redirectToDashboard) {
        router.replace("/dashboard");
      }
      router.refresh();
    } catch {
      setSubmitError("Unable to reach the authentication service.");
    }
  }

  return (
    <Card className="w-full border-border/70 bg-card/95 shadow-xl shadow-black/5">
      <CardHeader className="space-y-2">
        <CardTitle>
          {forceChange ? "Set a new password" : "Change password"}
        </CardTitle>
        <CardDescription>
          {forceChange
            ? "Your temporary password must be changed before continuing."
            : "Update your password to keep your account secure."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {!forceChange ? (
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={isCurrentVisible ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  disabled={isSubmitting}
                  {...register("current_password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setIsCurrentVisible((current) => !current)}
                  disabled={isSubmitting}
                  aria-label={
                    isCurrentVisible
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {isCurrentVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              {errors.current_password ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.current_password.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={isNewVisible ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                disabled={isSubmitting}
                {...register("new_password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsNewVisible((current) => !current)}
                disabled={isSubmitting}
                aria-label={
                  isNewVisible ? "Hide new password" : "Show new password"
                }
              >
                {isNewVisible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {errors.new_password ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.new_password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={isConfirmVisible ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                disabled={isSubmitting}
                {...register("confirm_password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsConfirmVisible((current) => !current)}
                disabled={isSubmitting}
                aria-label={
                  isConfirmVisible
                    ? "Hide password confirmation"
                    : "Show password confirmation"
                }
              >
                {isConfirmVisible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {errors.confirm_password ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.confirm_password.message}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <KeyRound className="size-4" />
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
          {forceChange ? (
            <Button type="button" variant="ghost" asChild>
              <a href="/api/auth/logout">
                <LogIn className="size-4" />
                Sign In As Different Account
              </a>
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
