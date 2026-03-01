import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { ForgotPasswordForm } from "../components/ForgotpasswordForm";
import { AuthFooter } from "../components/Authfooter";

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Recover Access"
        subtitle="We'll send a secure reset link to your campus email"
      />

      <ForgotPasswordForm />

      <AuthFooter type="forgot" />
    </AuthCard>
  );
}