import { type NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, updateCurrentUserProfile } from "@/lib/auth-server";
import type { AuthUserProfileUpdate } from "@/types/auth";

type ProfileUpdateRequestBody = {
  first_name?: unknown;
  last_name?: unknown;
  middle_name?: unknown;
  gender?: unknown;
  highest_education_level?: unknown;
  highest_education_program?: unknown;
  civil_status?: unknown;
  religion?: unknown;
  phone_number?: unknown;
  address?: unknown;
  date_of_birth?: unknown;
  date_of_hiring?: unknown;
  profile_picture_url?: unknown;
};

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePayload(
  body: ProfileUpdateRequestBody,
): AuthUserProfileUpdate {
  return {
    first_name: normalizeString(body.first_name),
    last_name: normalizeString(body.last_name),
    middle_name: normalizeNullableString(body.middle_name),
    gender: normalizeNullableString(body.gender),
    highest_education_level: normalizeNullableString(
      body.highest_education_level,
    ),
    highest_education_program: normalizeNullableString(
      body.highest_education_program,
    ),
    civil_status: normalizeNullableString(body.civil_status),
    religion: normalizeNullableString(body.religion),
    phone_number: normalizeNullableString(body.phone_number),
    address: normalizeNullableString(body.address),
    date_of_birth: normalizeNullableString(body.date_of_birth),
    date_of_hiring: normalizeNullableString(body.date_of_hiring),
    profile_picture_url: normalizeNullableString(body.profile_picture_url),
  };
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "You must be signed in to update your profile." },
      { status: 401 },
    );
  }

  let body: ProfileUpdateRequestBody;

  try {
    body = (await request.json()) as ProfileUpdateRequestBody;
  } catch {
    return NextResponse.json(
      { detail: "Invalid profile update request." },
      { status: 400 },
    );
  }

  try {
    const user = await updateCurrentUserProfile(token, normalizePayload(body));
    return NextResponse.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update profile.";

    return NextResponse.json(
      { detail: message },
      { status: message === "Could not validate credentials." ? 401 : 502 },
    );
  }
}
