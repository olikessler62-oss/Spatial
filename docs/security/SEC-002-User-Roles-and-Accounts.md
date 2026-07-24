# SEC-002 — User Roles and Accounts

**Status:** Draft  
**Version:** 0.1  
**Date:** 2026-07-20  
**Related:** ADR-003, ADR-004, SEC-001, ADR-002

---

## 1. Current state

| Capability | Status |
|------------|--------|
| Public landing (`/`) | Guest entry; signed-in users redirect to `/app` |
| Guest access (no account) | Free baseline via „Kostenlos starten“ → `/app` |
| Register (`/register`) | Magic Link for now; password signup later |
| Sign in (`/login`) | Email + password (primary), Magic Link optional |
| Sign out | Top bar when authenticated |
| Self-service account deletion | `/app/account` |
| Admin account list | `/app/admin/accounts` |
| Admin lock / unlock | Profile `status` + Auth ban |
| Application roles | `admin` \| `client` |
| Billing / paid plans | Placeholder only (`free` \| `pro` \| `team`) |
| Billing address / name | Not yet |

### Access split

| Mode | Available |
|------|-----------|
| Guest | Übersicht, Layouts/Formen ansehen, Experiment-Demo, Analysekontext |
| Registered (`client`, active) | + speichern, Analyse starten, Analysen, Konto |
| Locked account | No sign-in / session cleared |
| Admin | + Administration, Konten, Ziehungen |

---

## 2. Roles

| Role | Meaning |
|------|---------|
| `admin` | Platform administration (e.g. Administration menu) |
| `client` | Standard product user |

Initial admin identity: `oli.kessler62@gmail.com`  
All other users receive `client` unless promoted.

Storage: `security.profiles` (`id` → `auth.users.id`, `email`, `role`, `plan`, `status`).

`status`: `active` (default) \| `locked` (admin). Locked accounts are banned in Auth and cannot keep a session.

---

## 3. Account lifecycle

1. User registers (`/register`, currently Magic Link) or signs in (`/login` with password or Magic Link)  
2. Supabase Auth creates/uses `auth.users`  
3. Trigger `security.handle_new_user` upserts `security.profiles`  
4. User may sign out or delete account (cascade removes profile)

Guests use `/` → `/app` without an account. `/login` is only for existing accounts.

---

## 4. Billing (future)

`profiles.plan` reserves:

- `free` — default  
- `pro` — paid individual (later)  
- `team` — paid workspace (later)

No payment provider is wired yet. Role (`admin`/`client`) stays independent of plan.

---

## 5. UI rules

- Navigation **Administration** is visible only when `role = admin`  
- Route `/app/admin` redirects non-admins to `/app`  
- `/app/admin/accounts` lists all profiles with plan + lock controls  
- `/app/account` shows email, role, plan; actions: Abmelden, Konto löschen  
- Billing address / personal data: deferred
