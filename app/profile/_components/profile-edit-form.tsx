"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";

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
import type { AuthUser } from "@/lib/auth";
import {
  CIVIL_STATUS_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  type ProfileOption,
  RELIGION_OPTIONS,
} from "@/lib/profile-options";

type ProfileFormState = {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  education: string;
  civil_status: string;
  religion: string;
  rank: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  date_of_hiring: string;
};

function toInputDate(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function createInitialState(user: AuthUser): ProfileFormState {
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

function hasFormChanges(current: ProfileFormState, initial: ProfileFormState) {
  return (Object.keys(initial) as Array<keyof ProfileFormState>).some(
    (field) => current[field] !== initial[field],
  );
}

type TextFieldProps = {
  id: keyof ProfileFormState;
  label: string;
  value: string;
  onChange: (field: keyof ProfileFormState, value: string) => void;
  type?: string;
  placeholder?: string;
};

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(id, event.target.value)}
      />
    </div>
  );
}

type SelectFieldProps = {
  id: keyof ProfileFormState;
  label: string;
  value: string;
  onChange: (field: keyof ProfileFormState, value: string) => void;
  options: ProfileOption[];
  placeholder: string;
};

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(id, nextValue)}
      >
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
    </div>
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
  const initialState = createInitialState(user);
  const [formState, setFormState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = hasFormChanges(formState, initialState);

  function updateField(field: keyof ProfileFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formState.first_name,
          middle_name: formState.middle_name || null,
          last_name: formState.last_name,
          gender: formState.gender || null,
          education: formState.education || null,
          civil_status: formState.civil_status || null,
          religion: formState.religion || null,
          rank: formState.rank || null,
          phone_number: formState.phone_number || null,
          address: formState.address || null,
          date_of_birth: formState.date_of_birth || null,
          date_of_hiring: formState.date_of_hiring || null,
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
    } catch {
      // Keep the modal focused on the form; the parent can re-open if needed.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
      <div className="space-y-4 pb-4">
        <ProfileSection
          title="Personal details"
          description="These fields identify the person behind the account."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              id="first_name"
              label="First name"
              value={formState.first_name}
              onChange={updateField}
              placeholder="First name"
            />
            <TextField
              id="middle_name"
              label="Middle name"
              value={formState.middle_name}
              onChange={updateField}
              placeholder="Middle name"
            />
            <TextField
              id="last_name"
              label="Last name"
              value={formState.last_name}
              onChange={updateField}
              placeholder="Last name"
            />
            <TextField
              id="date_of_birth"
              label="Date of birth"
              value={formState.date_of_birth}
              onChange={updateField}
              type="date"
            />
            <SelectField
              id="gender"
              label="Gender"
              value={formState.gender}
              onChange={updateField}
              options={GENDER_OPTIONS}
              placeholder="Choose gender..."
            />
            <SelectField
              id="civil_status"
              label="Civil status"
              value={formState.civil_status}
              onChange={updateField}
              options={CIVIL_STATUS_OPTIONS}
              placeholder="Choose civil status..."
            />
            <SelectField
              id="religion"
              label="Religion"
              value={formState.religion}
              onChange={updateField}
              options={RELIGION_OPTIONS}
              placeholder="Choose religion..."
            />
            <SelectField
              id="education"
              label="Education"
              value={formState.education}
              onChange={updateField}
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
              id="phone_number"
              label="Phone number"
              value={formState.phone_number}
              onChange={updateField}
              placeholder="Phone number"
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                name="address"
                value={formState.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Home address"
                className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
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
              id="rank"
              label="Rank"
              value={formState.rank}
              onChange={updateField}
              placeholder="Rank"
            />
            <TextField
              id="date_of_hiring"
              label="Date of hiring"
              value={formState.date_of_hiring}
              onChange={updateField}
              type="date"
            />
          </div>
        </ProfileSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 border-t border-border/70 bg-background/95 px-5 py-3 shadow-[0_-12px_24px_-18px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !isDirty}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
