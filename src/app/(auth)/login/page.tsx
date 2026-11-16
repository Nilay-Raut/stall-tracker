import { AuthHeading } from "@/components/feature/auth/AuthHeading";
import { LoginForm } from "@/components/feature/auth/LoginForm";
import { msg } from "@/i18n/translate";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title={msg("Log in")} />
      <LoginForm />
    </>
  );
}
