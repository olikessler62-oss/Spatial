"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/get-viewer";
import { isPlatformAdminEmail } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const LONG_BAN = "876600h";

export async function setAccountLockState(formData: FormData) {
  const adminViewer = await getViewer();

  if (!adminViewer) {
    redirect("/login");
  }

  if (adminViewer.role !== "admin") {
    redirect("/app/overview-1");
  }

  const accountId = formData.get("accountId")?.toString().trim() ?? "";
  const nextStatus = formData.get("status")?.toString().trim();

  if (!accountId || (nextStatus !== "active" && nextStatus !== "locked")) {
    throw new Error("Ungültige Anfrage.");
  }

  if (accountId === adminViewer.id) {
    throw new Error("Du kannst dein eigenes Konto nicht sperren.");
  }

  const admin = createAdminClient();

  const { data: profiles, error: listError } = await admin.rpc(
    "admin_list_account_profiles",
  );

  if (listError) {
    throw new Error(listError.message);
  }

  const target = (profiles ?? []).find(
    (profile: { id: string }) => profile.id === accountId,
  ) as
    | { id: string; email: string; role: string; status: string }
    | undefined;

  if (!target) {
    throw new Error("Konto nicht gefunden.");
  }

  if (isPlatformAdminEmail(target.email) || target.role === "admin") {
    throw new Error("Admin-Konten können nicht gesperrt werden.");
  }

  if (nextStatus === "locked") {
    const { error: banError } = await admin.auth.admin.updateUserById(
      accountId,
      { ban_duration: LONG_BAN },
    );

    if (banError) {
      throw new Error(banError.message);
    }
  } else {
    const { error: unbanError } = await admin.auth.admin.updateUserById(
      accountId,
      { ban_duration: "none" },
    );

    if (unbanError) {
      throw new Error(unbanError.message);
    }
  }

  const { error: updateError } = await admin.rpc("admin_set_account_status", {
    p_account_id: accountId,
    p_status: nextStatus,
    p_actor_id: adminViewer.id,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/app/admin/accounts");
}
