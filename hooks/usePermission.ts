"use client";

import type { UserRole } from "@prisma/client";
import { useCurrentUser } from "./useCurrentUser";

// Role hierarchy for permission checks.
const rolePermissions: Record<UserRole, UserRole[]> = {
  ADMIN: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"],
  MANAGER: ["MANAGER"],
  PROCUREMENT_OFFICER: ["PROCUREMENT_OFFICER"],
  VENDOR: ["VENDOR"],
};

// Returns whether the current user has any of the specified roles.
// Used for conditional rendering of action buttons in UI.
export function usePermission(requiredRoles: UserRole[]): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  const allowedRoles = rolePermissions[user.role] ?? [];
  return requiredRoles.some((role) => allowedRoles.includes(role));
}

// Convenience: check if current user is Admin
export function useIsAdmin(): boolean {
  return usePermission(["ADMIN"]);
}

// Convenience: check if current user can manage procurement
export function useCanProcure(): boolean {
  return usePermission(["ADMIN", "PROCUREMENT_OFFICER"]);
}

// Convenience: check if current user can approve
export function useCanApprove(): boolean {
  return usePermission(["ADMIN", "MANAGER"]);
}
