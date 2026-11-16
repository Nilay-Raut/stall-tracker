import { AuthHeading } from "@/components/feature/auth/AuthHeading";
import { ForgotForm } from "@/components/feature/auth/ForgotForm";
import { msg } from "@/i18n/translate";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <>
      <AuthHeading
        title={msg("Forgot password")}
        note={msg("Use your recovery PIN to set a new password.")}
      />
      <ForgotForm />
    </>
  );
}
