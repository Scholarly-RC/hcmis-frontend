"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
        must_change_password?: boolean;
      } | null;

      if (!response.ok) {
        setError(payload?.detail ?? "Unable to sign in.");
        return;
      }

      router.replace(
        payload?.must_change_password ? "/change-password" : "/dashboard",
      );
      router.refresh();
    } catch {
      setError("Unable to reach the authentication service.");
    }
  }

  return (
    <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription className="text-sm">
          Use your HCMIS account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@hcmis.org"
              disabled={isSubmitting}
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
                disabled={isSubmitting}
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsPasswordVisible((current) => !current)}
                disabled={isSubmitting}
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
              >
                {isPasswordVisible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full rounded-xl"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
