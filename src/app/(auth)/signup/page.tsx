import { AuthForm } from "../auth-form";

export const metadata = { title: "Sign up · Trim" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold">Create your account</h1>
      <AuthForm mode="signup" />
    </>
  );
}
