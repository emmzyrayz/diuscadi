import { AuthCard } from "../components/AuthCard";
import { AuthHeader } from "../components/AuthHeader";
import { VerifyEmailView } from "../components/VerifyemailView";

export default function VerifyPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Check Your Inbox"
        subtitle="A verification link has been dispatched to your campus email"
      />

      <VerifyEmailView />
    </AuthCard>
  );
}
