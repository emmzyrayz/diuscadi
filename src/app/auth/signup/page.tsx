import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { SignupForm } from "../components/SignupForm";
import { AuthFooter } from "../components/Authfooter";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Join DIUSCADI"
        subtitle="Create your campus ecosystem account"
      />
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
      <AuthFooter type="signup" />
    </AuthCard>
  );
}