import { AuthHeading } from "@/components/feature/auth/AuthHeading";
import { RegisterForm } from "@/components/feature/auth/RegisterForm";
import { msg } from "@/i18n/translate";

export const metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title={msg("Create your account")} note={msg("One account for your shop.")} />
      <RegisterForm />
    </>
  );
}
