"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiHub } from "@/components/ApiHub";
import {
  fetchMe,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  type User,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const cached = getStoredUser();
    if (cached) setUser(cached);

    fetchMe()
      .then((u) => {
        setUser(u);
        setStoredUser(u);
      })
      .catch(() => {
        setStoredToken(null);
        setStoredUser(null);
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function signOut() {
    setStoredToken(null);
    setStoredUser(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="page">
        <p className="muted">Loading dashboard…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="page">
      <section className="hero" style={{ marginBottom: "2rem" }}>
        <h1>Dashboard</h1>
        <p>Hello, {user.display_name || user.email}.</p>
      </section>

      <div className="dashboard-stats">
        <div className="stat">
          <span>User ID</span>
          <strong>{user.id}</strong>
        </div>
        <div className="stat">
          <span>Email</span>
          <strong style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
            {user.email}
          </strong>
        </div>
        <div className="stat">
          <span>Member since</span>
          <strong>{new Date(user.created_at).toLocaleDateString()}</strong>
        </div>
      </div>

      <ApiHub />

      <section className="card" style={{ marginBottom: "1rem", marginTop: "1.5rem" }}>
        <h2>Session</h2>
        <p className="muted" style={{ marginBottom: "1rem" }}>
          JWT stored locally. API calls use Bearer token via{" "}
          <code>/api/v1/auth/me</code>.
        </p>
        <pre style={{ fontSize: "0.8rem", color: "var(--accent)" }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </section>

      <div className="hero-actions">
        <Link href="/" className="btn-secondary">
          Home
        </Link>
        <button type="button" className="btn-secondary" onClick={signOut}>
          Sign out
        </button>
      </div>
    </main>
  );
}
