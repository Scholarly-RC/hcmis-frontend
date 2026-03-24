"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { type Control, Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AuthUser } from "@/lib/auth";
import {
  CIVIL_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  type ProfileOption,
  RELIGION_OPTIONS,
} from "@/lib/profile-options";

const profileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string(),
  last_name: z.string().trim().min(1, "Last name is required."),
  gender: z.string(),
  education: z.string(),
  civil_status: z.string(),
  religion: z.string(),
  rank: z.string(),
  phone_number: z.string(),
  address: z.string(),
  date_of_birth: z.string(),
  date_of_hiring: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function toInputDate(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function createInitialValues(user: AuthUser): ProfileFormValues {
  return {
    first_name: user.first_name ?? "",
    middle_name: user.middle_name ?? "",
    last_name: user.last_name ?? "",
    gender: user.gender ?? "",
    education: user.education ?? "",
    civil_status: user.civil_status ?? "",
    religion: user.religion ?? "",
    rank: user.rank ?? "",
    phone_number: user.phone_number ?? "",
    address: user.address ?? "",
    date_of_birth: toInputDate(user.date_of_birth),
    date_of_hiring: toInputDate(user.date_of_hiring),
  };
}

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type TextFieldProps = {
  control: Control<ProfileFormValues>;
  id: keyof ProfileFormValues;
  label: string;
  type?: string;
  placeholder?: string;
};

function TextField({
  control,
  id,
  label,
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <Controller
      control={control}
      name={id}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            name={id}
            type={type}
            value={field.value}
            placeholder={placeholder}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            aria-invalid={fieldState.invalid ? "true" : "false"}
          />
          {fieldState.error ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

type SelectFieldProps = {
  control: Control<ProfileFormValues>;
  id: keyof ProfileFormValues;
  label: string;
  options: ProfileOption[];
  placeholder: string;
};

function SelectField({
  control,
  id,
  label,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <Controller
      control={control}
      name={id}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={id} name={id} className="h-10 w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position="popper">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

type TextAreaFieldProps = {
  control: Control<ProfileFormValues>;
  id: keyof ProfileFormValues;
  label: string;
  placeholder?: string;
  className?: string;
};

function TextAreaField({
  control,
  id,
  label,
  placeholder,
  className,
}: TextAreaFieldProps) {
  return (
    <Controller
      control={control}
      name={id}
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <Textarea
            id={id}
            name={id}
            value={field.value}
            placeholder={placeholder}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            className={className}
            aria-invalid={fieldState.invalid ? "true" : "false"}
          />
          {fieldState.error ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

type ProfileSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-background/60 shadow-sm shadow-black/5">
      <div className="space-y-1 px-5 pt-5">
        <h3 className="font-heading text-base font-medium tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </section>
  );
}

type ProfileEditFormProps = {
  user: AuthUser;
  onSaved?: () => void;
};

export function ProfileEditForm({ user, onSaved }: ProfileEditFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initialValues = createInitialValues(user);
  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  async function onSubmit(values: ProfileFormValues) {
    setSubmitError(null);

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: values.first_name.trim(),
          middle_name: toNullableText(values.middle_name),
          last_name: values.last_name.trim(),
          gender: toNullableText(values.gender),
          education: toNullableText(values.education),
          civil_status: toNullableText(values.civil_status),
          religion: toNullableText(values.religion),
          rank: toNullableText(values.rank),
          phone_number: toNullableText(values.phone_number),
          address: toNullableText(values.address),
          date_of_birth: toNullableText(values.date_of_birth),
          date_of_hiring: toNullableText(values.date_of_hiring),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.detail ?? "Unable to update profile.");
      }

      onSaved?.();
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to update profile.",
      );
    }
  }

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-4 pb-4">
        {submitError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}

        <ProfileSection
          title="Personal details"
          description="These fields identify the person behind the account."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              control={control}
              id="first_name"
              label="First name"
              placeholder="First name"
            />
            <TextField
              control={control}
              id="middle_name"
              label="Middle name"
              placeholder="Middle name"
            />
            <TextField
              control={control}
              id="last_name"
              label="Last name"
              placeholder="Last name"
            />
            <TextField
              control={control}
              id="date_of_birth"
              label="Date of birth"
              type="date"
            />
            <SelectField
              control={control}
              id="gender"
              label="Gender"
              options={GENDER_OPTIONS}
              placeholder="Choose gender..."
            />
            <SelectField
              control={control}
              id="civil_status"
              label="Civil status"
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Choose civil status..."
            />
            <SelectField
              control={control}
              id="religion"
              label="Religion"
              options={RELIGION_OPTIONS}
              placeholder="Choose religion..."
            />
            <SelectField
              control={control}
              id="education"
              label="Education"
              options={EDUCATION_OPTIONS}
              placeholder="Choose education..."
            />
          </div>
        </ProfileSection>

        <ProfileSection
          title="Contact details"
          description="Use this information for day-to-day communication."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              control={control}
              id="phone_number"
              label="Phone number"
              placeholder="Phone number"
            />
            <div className="space-y-2 md:col-span-2">
              <TextAreaField
                control={control}
                id="address"
                label="Address"
                placeholder="Home address"
                className="min-h-28"
              />
            </div>
          </div>
        </ProfileSection>

        <ProfileSection
          title="Employment details"
          description="The fields that describe your current assignment."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              control={control}
              id="rank"
              label="Rank"
              placeholder="Rank"
            />
            <TextField
              control={control}
              id="date_of_hiring"
              label="Date of hiring"
              type="date"
            />
          </div>
        </ProfileSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 border-t border-border/70 bg-background/95 px-5 py-3 shadow-[0_-12px_24px_-18px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
