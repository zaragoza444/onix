import Link from "next/link";

async function getPlatformInfo() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/api/v1/info`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const info = await getPlatformInfo();

  return (
    <main className="page">
      <section className="hero">
        <h1>Shiva Platform</h1>
        <p>
          Production-ready stack with JWT auth, PostgreSQL, Docker, and
          one-click deploy to Vercel and Railway.
        </p>
        <div className="hero-actions">
          <Link href="/register" className="btn-primary">
            Create account
          </Link>
          <Link href="/login" className="btn-secondary">
            Sign in
          </Link>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>API status</h2>
          {info ? (
            <pre>{JSON.stringify(info, null, 2)}</pre>
          ) : (
            <p className="muted">
              Backend offline — run <code>docker compose up</code>
            </p>
          )}
        </section>
        <section className="card">
          <h2>Stack</h2>
          <ul className="muted" style={{ listStyle: "none", lineHeight: 1.8 }}>
            <li>Python 3 · FastAPI · JWT</li>
            <li>PostgreSQL · SQLAlchemy</li>
            <li>Next.js · Vercel</li>
            <li>Docker · GitHub · Codespaces</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
