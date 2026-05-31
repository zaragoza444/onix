import { AuthPanel } from "@/components/AuthPanel";

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <h1>Get started</h1>
      <p>Create your Shiva account in seconds.</p>
      <AuthPanel initialMode="register" />
    </main>
  );
}
