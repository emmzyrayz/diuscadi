import { Suspense } from "react";
import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { VerifyEmailView } from "../components/VerifyemailView";

// VerifyEmailView calls useSearchParams() — requires Suspense in App Router
export default function VerifyPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Verify Account"
        subtitle="Use your code or the link we sent to your email and phone"
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          </div>
        }
      >
        <VerifyEmailView />
      </Suspense>
    </AuthCard>
  );
}
