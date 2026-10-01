import { AuthForm } from "../auth-form";

export const metadata = { title: "Log in · Trim" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold">Log in</h1>
      <AuthForm mode="login" />
    </>
  );
}
