import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Forgot password · Trim" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold">Forgot your password?</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
