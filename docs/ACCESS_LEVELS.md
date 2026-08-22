# Access levels

Every user of this application is authenticated; there is no anonymous surface.
What differs is what each one may change.

Today there are two levels — `admin` (writes everything) and `user` (writes
nothing) — and that is the wrong cut. It forces a choice between giving reception
staff the power to redefine the portfolio and pricing, or leaving them unable to
check a guest in. Neither is acceptable, so in practice everyone becomes an
admin and the distinction stops meaning anything.

The fix is to split along **what a job actually touches**, which is three
distinct jobs plus an observer.

---

## 1. The four roles

| Role | Owns | One-line test |
|---|---|---|
| **`admin`** | Users, configuration, the database itself | *"Who can lock someone out?"* |
| **`manager`** | The portfolio: listings, nightly rates, channels, commissions, metrics | *"Who decides what we sell and for how much?"* |
| **`reception`** | The day: reservations, arrivals, departures, guests, payments | *"Who is at the desk when a guest walks in?"* |
| **`viewer`** | Nothing — reads operational data | *"Who needs to see the calendar and change nothing?"* |

The roles are **cumulative in reach but not nested in kind**. A manager is not a
super-reception: it may create a reservation, because portfolio decisions and
day-to-day cover often land on the same person in a small operation, but it is
the *listing and rate* authority that defines the role. An admin is not a
super-manager either — see §4.

`viewer` is where today's read-only `users` land, unchanged. It exists so that
"give this person the calendar" does not require deciding which of the three
working roles they least resemble.

---

## 2. Permission matrix

`R` read · `W` create and edit · `D` delete · `—` no access

| Resource | admin | manager | reception | viewer |
|---|---|---|---|---|
| **Listings** | R W D | R W D | R | R |
| Listing `nightlyRate`, `minNights`, `maxAdults` | R W | R W | R | R |
| Listing `isActive` | R W | R W | — | R |
| **Channels** | R W D | R W D | R | R |
| Channel `commissionRate` | R W | R W | — | — |
| **Calendar links** | R W D | R W D | R | — |
| **Reservations** | R W D | R W D | R W | R |
| Reservation dates / listing / guest count | R W | R W | R W | R |
| Reservation `totalAmountDue` | R W | R W | R | R |
| Reservation `paidDate` | R W | R W | R W | R |
| Reservation `comment` | R W | R W | R W | R |
| Reservation status — lifecycle transitions | R W | R W | R W | R |
| Reservation status — **override** (L4) | R W | — | — | — |
| Reservation delete | D | D | — | — |
| **Guests** | R W D | R W D | R W | R |
| **Metrics** | R | R | — | — |
| **Users** | R W D | — | — | — |
| **Own profile and password** | R W | R W | R W | R W |

### The five lines that carry the design

- **`reception` may not price.** It writes dates, guest counts, comments,
  payments and status; it does not write `totalAmountDue`, `nightlyRate` or
  `commissionRate`. The desk records what happened; it does not decide what
  things cost. This is the whole reason `manager` exists.
- **`reception` may not delete.** A guest who never came becomes `NoShow`, a
  cancelled stay becomes `Cancelled` (lifecycle L6) — both stay in the register.
  Deletion is for data-entry errors, and correcting the register is a
  manager-or-above act.
- **Only `admin` overrides the lifecycle.** Rules L2 and L3 bind managers and
  reception alike. Reversing a terminal state is an admin act because it rewrites
  a statement someone already made.
- **Only `admin` touches users.** Not managers. A manager who can create admins
  can grant themselves anything, which collapses the whole matrix into one role.
- **Nobody but `admin` sees commission.** `commissionRate` is a supplier term,
  and metrics derived from it are a management view. Reception and viewers see
  gross amounts only.

---

## 3. Enforcement

The current design puts the boundary in the **route prefix** — everything under
`/api/admin/*` is a write and requires `isAdmin` — which is why no service
contains a role check. That trick stops working with four roles: the same
resource now has different writers for different fields.

The replacement, in order of preference:

1. **Permission, not role, at the route.** Routes declare
   `requires('reservation:write')`; the middleware resolves the caller's role to
   a permission set. Adding a role becomes a table entry, not a sweep through
   every route.
2. **Field-level checks in the service.** Where a role may write *some* fields of
   a resource (reception on a reservation), the service — not the route — rejects
   the fields the caller may not set. Services already take plain data, so this
   stays testable without HTTP.
3. **The client mirrors, never enforces.** Hiding a button is a courtesy to the
   user; the server refusing the request is the security boundary. Every hidden
   control must have a server rule behind it.

### Permission names

Grouped by resource so the matrix above maps one-to-one:

```
listing:read      listing:write      listing:delete
channel:read      channel:write      channel:delete
channel:commission
calendar-link:read  calendar-link:write  calendar-link:delete
reservation:read  reservation:write  reservation:delete
reservation:price
reservation:override-status
guest:read        guest:write        guest:delete
metrics:read
user:read         user:write         user:delete
profile:write
```

| Role | Permissions |
|---|---|
| `admin` | all |
| `manager` | all except `user:*` and `reservation:override-status` |
| `reception` | `*:read` except `metrics:read` and `channel:commission`; `reservation:write`, `guest:write`, `profile:write` |
| `viewer` | `listing:read`, `channel:read`, `reservation:read`, `guest:read`, `profile:write` |

---

## 4. What `admin` is *not*

`admin` is the account-and-database role. It holds every permission because
somebody must be able to unstick anything, not because it is the "senior"
business role — the person who decides nightly rates is a `manager`, and giving
them admin as a shortcut is how the current two-role system failed.

In a healthy deployment `admin` logs in rarely: to add a colleague, disable a
leaver, or correct a reservation that got into a state it should not be in.

---

## 5. Migration from the current two roles

| Today | Becomes | Note |
|---|---|---|
| `admin_users` entry | `admin` | Unchanged in power. Review afterwards: most should be `manager`. |
| `users` entry | `viewer` | Unchanged in power — still read-only. |

Both mappings preserve current behaviour exactly, so the migration cannot
lock anyone out or silently widen anyone's access. `manager` and `reception`
start empty and are assigned deliberately.

`settings.json` currently keys users by their two buckets
(`admin_users` / `users`). Four roles need a single collection with a `role`
field; the two buckets become the first two values.

---

## 6. Status

**This document is design, not implementation.** The code today still has only
`admin` and read-only `user`, enforced by route prefix, and
[DOMAIN.md](DOMAIN.md) §7 describes that as it stands. Nothing here is live
except the single rule the lifecycle already needs: status override is
admin-only.
