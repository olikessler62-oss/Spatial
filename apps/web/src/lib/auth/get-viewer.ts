import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isPlatformAdminEmail,
  type AccountStatus,
  type BillingPlan,
  type UserRole,
  type ViewerProfile,
} from "@/lib/auth/roles";

function asRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "client";
}

function asPlan(value: unknown): BillingPlan {
  if (value === "pro" || value === "team") {
    return value;
  }

  return "free";
}

function asStatus(value: unknown): AccountStatus {
  return value === "locked" ? "locked" : "active";
}

export async function getViewer(): Promise<ViewerProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const email = user.email ?? "";

  const { data: rows, error } = await supabase.rpc("get_my_account_profile");

  if (error) {
    throw new Error(error.message);
  }

  const profile = Array.isArray(rows) ? rows[0] : rows;

  if (profile) {
    if (asStatus(profile.status) === "locked") {
      await supabase.auth.signOut();
      return null;
    }

    const role = isPlatformAdminEmail(profile.email ?? email)
      ? "admin"
      : asRole(profile.role);

    if (role === "admin" && profile.role !== "admin") {
      const admin = createAdminClient();
      const { error: promoteError } = await admin.rpc(
        "admin_promote_platform_admin",
        {
          p_id: user.id,
          p_email: email,
        },
      );

      if (promoteError) {
        throw new Error(promoteError.message);
      }
    }

    return {
      id: profile.id,
      email: profile.email || email,
      role,
      plan: asPlan(profile.plan),
      status: "active",
    };
  }

  // Profile missing (legacy session) — ensure row exists.
  const role: UserRole = isPlatformAdminEmail(email) ? "admin" : "client";
  const admin = createAdminClient();

  const { error: ensureError } = await admin.rpc("ensure_account_profile", {
    p_id: user.id,
    p_email: email,
    p_role: role,
    p_plan: "free",
  });

  if (ensureError) {
    throw new Error(ensureError.message);
  }

  return {
    id: user.id,
    email,
    role,
    plan: "free",
    status: "active",
  };
}

export async function requireAdmin(): Promise<ViewerProfile> {
  const viewer = await getViewer();

  if (!viewer) {
    throw new Error("UNAUTHENTICATED");
  }

  if (viewer.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return viewer;
}
