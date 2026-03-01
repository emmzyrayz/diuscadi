import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { SignupForm } from "../components/SignupForm";
import { AuthFooter } from "../components/Authfooter";

export default function SignupPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Join DIUSCADI"
        subtitle="Create your campus ecosystem account"
      />

      <SignupForm />

      <AuthFooter type="signup" />
    </AuthCard>
  );
}
