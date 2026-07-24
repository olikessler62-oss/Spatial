export type UserRole = "admin" | "client";

export type BillingPlan = "free" | "pro" | "team";

export type AccountStatus = "active" | "locked";

export interface ViewerProfile {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly plan: BillingPlan;
  readonly status: AccountStatus;
}

export interface ManagedAccount {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly plan: BillingPlan;
  readonly status: AccountStatus;
  readonly createdAt: string;
  readonly lockedAt: string | null;
}

export const PLATFORM_ADMIN_EMAIL = "oli.kessler62@gmail.com";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === PLATFORM_ADMIN_EMAIL;
}

export function planLabel(plan: BillingPlan): string {
  switch (plan) {
    case "pro":
      return "Pro";
    case "team":
      return "Team";
    default:
      return "Free";
  }
}

export function statusLabel(status: AccountStatus): string {
  return status === "locked" ? "Gesperrt" : "Aktiv";
}
