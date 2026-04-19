"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "../../../components/admin/AdminNav";
import { getAdminUsers } from "../../../lib/api";
import { hasValidSession, onAuthChange } from "../../../lib/auth";

const USERS_PATH = "/admin/users";

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object") {
    return toNumber(value.amount ?? value.value ?? value.total ?? value.price ?? value.cost ?? 0);
  }
  return 0;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatus(value) {
  return value ? String(value) : "Inactive";
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasValidSession()) {
      router.replace(`${"/admin/login"}?next=${encodeURIComponent(USERS_PATH)}`);
      return undefined;
    }

    setIsReady(true);
    const unsubscribe = onAuthChange(() => {
      if (!hasValidSession()) {
        router.replace(`${"/admin/login"}?next=${encodeURIComponent(USERS_PATH)}`);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [router]);

  useEffect(() => {
    if (!isReady) return undefined;

    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await getAdminUsers();
        const payload = response?.data ?? response ?? {};
        const list = Array.isArray(payload.users)
          ? payload.users
          : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];

        if (!cancelled) {
          setUsers(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load users.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  const normalizedUsers = useMemo(() => {
    return users.map((user, index) => {
      const planType = user?.planType ?? user?.subscription?.planType ?? user?.plan?.type ?? "Free";
      const planExpiry = user?.planExpiry ?? user?.subscription?.endDate ?? user?.subscription?.expiryDate ?? null;
      const role = user?.role ?? "user";
      const isActive = Boolean(
        user?.subscription?.premium ||
          (planType && String(planType).toLowerCase() !== "free") ||
          (planExpiry && !Number.isNaN(new Date(planExpiry).getTime()) && new Date(planExpiry) > new Date())
      );

      return {
        id: user?.id ?? user?._id ?? user?.userId ?? `${user?.email ?? "user"}-${user?.createdAt ?? index}`,
        name: user?.name ?? user?.fullName ?? "Unnamed user",
        email: user?.email ?? "—",
        role,
        planType,
        planExpiry,
        status: isActive ? "Active" : "Inactive",
        createdAt: user?.createdAt ?? user?.subscription?.startDate ?? null,
        revenue: toNumber(user?.revenue ?? user?.subscription?.amount ?? 0),
      };
    });
  }, [users]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Checking admin session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Admin management</p>
          <div className="mt-2">
            <h1 className="text-3xl font-semibold text-slate-900">Users</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review account roles, plans, and expiry information.
            </p>
          </div>
        </div>

        <AdminNav />

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Total records</p>
              <p className="text-2xl font-semibold text-slate-900">{loading ? "—" : normalizedUsers.length}</p>
            </div>
            <div className="text-sm text-slate-500">Showing recent user summaries from the admin API.</div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : normalizedUsers.length > 0 ? (
                  normalizedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">{user.name}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.role}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.planType}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{getStatus(user.status)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(user.planExpiry)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}