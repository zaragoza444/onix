import { AuthPanel } from "@/components/AuthPanel";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <h1>Welcome back</h1>
      <p>Sign in to your Shiva account.</p>
      <AuthPanel initialMode="login" />
    </main>
  );
}
