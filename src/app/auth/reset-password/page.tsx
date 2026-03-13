import { Suspense } from "react";
import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { ResetPasswordForm } from "../components/ResetpasswordForm";
import { AuthFooter } from "../components/Authfooter";

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Reset Password"
        subtitle="Set a new secure password for your account"
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
      <AuthFooter type="reset" />
    </AuthCard>
  );
}
