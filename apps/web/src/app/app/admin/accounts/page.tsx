import Link from "next/link";

import { setAccountLockState } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminPage } from "@/lib/auth/require-admin-page";
import {
  isPlatformAdminEmail,
  planLabel,
  statusLabel,
  type AccountStatus,
  type BillingPlan,
  type UserRole,
} from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

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

export default async function AdminAccountsPage() {
  const viewer = await requireAdminPage();
  const admin = createAdminClient();

  const { data: profiles, error } = await admin.rpc(
    "admin_list_account_profiles",
  );

  if (error) {
    throw new Error(error.message);
  }

  type AccountRow = {
    id: string;
    email: string;
    role: UserRole;
    plan: BillingPlan;
    status: AccountStatus;
    createdAt: string;
    lockedAt: string | null;
  };

  const accounts: AccountRow[] = ((profiles ?? []) as Array<{
    id: string;
    email: string;
    role: string;
    plan: string;
    status: string;
    created_at: string;
    locked_at: string | null;
  }>).map((profile) => ({
    id: profile.id,
    email: profile.email || "—",
    role: asRole(profile.role),
    plan: asPlan(profile.plan),
    status: asStatus(profile.status),
    createdAt: profile.created_at,
    lockedAt: profile.locked_at ?? null,
  }));

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Administration</p>
          <h1>Konten</h1>
          <p>
            Registrierte Konten verwalten. Sperren blockiert Anmeldung und
            Zugriff. Rechnungsdaten folgen später.
          </p>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/admin"
        >
          Zurück
        </Link>
      </header>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <h2>Keine Konten</h2>
          <p>Es sind noch keine registrierten Konten vorhanden.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Zahlplan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registriert</TableHead>
                <TableHead className="text-right">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const isSelf = account.id === viewer.id;
                const isProtectedAdmin =
                  isPlatformAdminEmail(account.email)
                  || account.role === "admin";
                const canModerate = !isSelf && !isProtectedAdmin;

                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.email}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (du)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{account.role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {planLabel(account.plan)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          account.status === "locked"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {statusLabel(account.status)}
                      </Badge>
                      {account.status === "locked" && account.lockedAt ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          seit{" "}
                          {new Date(account.lockedAt).toLocaleString("de-DE")}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {new Date(account.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      {canModerate ? (
                        <form action={setAccountLockState}>
                          <input
                            type="hidden"
                            name="accountId"
                            value={account.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              account.status === "locked" ? "active" : "locked"
                            }
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant={
                              account.status === "locked"
                                ? "default"
                                : "outline"
                            }
                          >
                            {account.status === "locked"
                              ? "Freischalten"
                              : "Sperren"}
                          </Button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          geschützt
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
