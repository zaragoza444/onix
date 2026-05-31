"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredToken, getStoredUser, type User } from "@/lib/api";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (getStoredToken()) setUser(getStoredUser());
  }, []);

  return (
    <header className="site-header">
      <Link href="/" className="logo">
        Shiva
      </Link>
      <nav>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard#api-hub">API Hub</Link>
            <span className="nav-user">{user.display_name || user.email}</span>
          </>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="btn-nav">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
