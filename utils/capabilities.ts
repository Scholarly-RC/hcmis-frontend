import { CAP_ACCESS_HR_WORKSPACE } from "@/constants/capabilities";
import type { AuthUser } from "@/types/auth";

export function can(
  user: Pick<AuthUser, "capabilities"> | null | undefined,
  capability: string,
) {
  return Boolean(user?.capabilities?.includes(capability));
}

export function canAny(
  user: Pick<AuthUser, "capabilities"> | null | undefined,
  capabilities: string[],
) {
  return capabilities.some((capability) => can(user, capability));
}

export function isStaff(
  user: Pick<AuthUser, "capabilities"> | null | undefined,
) {
  return can(user, CAP_ACCESS_HR_WORKSPACE);
}
