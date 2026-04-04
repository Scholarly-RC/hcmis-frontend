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
  CardFooter,
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
    <Card className="w-full max-w-md border-border/80 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-card)_97%,white)_0%,color-mix(in_oklab,var(--color-muted)_40%,white)_100%)] py-0 shadow-[0_30px_70px_-40px_color-mix(in_oklab,var(--color-primary)_40%,transparent)] backdrop-blur">
      <CardHeader className="space-y-2 border-b border-border/60 pb-5 pt-5">
        <CardTitle className="text-3xl tracking-tight">Sign In</CardTitle>
        <CardDescription className="text-sm">
          Use your HCMIS account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@hcmis.org"
              className="h-10 rounded-xl border-border/80 bg-muted/30 text-base transition-all duration-200 focus-visible:border-primary/30 focus-visible:ring-primary/20 md:text-sm"
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
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10 rounded-xl border-border/80 bg-muted/30 pr-11 text-base transition-all duration-200 focus-visible:border-primary/30 focus-visible:ring-primary/20 md:text-sm"
                disabled={isSubmitting}
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-muted active:-translate-y-1/2"
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
            className="h-11 w-full rounded-xl bg-[linear-gradient(135deg,var(--color-primary),color-mix(in_oklab,var(--color-primary)_68%,white))] text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-200 hover:-translate-y-0.5"
            size="lg"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between border-t border-border/60 bg-transparent px-4 py-3 text-xs text-muted-foreground">
        <span>Need help? Contact IT support.</span>
        <span>v1.0</span>
      </CardFooter>
    </Card>
  );
}
