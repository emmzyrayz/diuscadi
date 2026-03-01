import { AuthCard } from "./components/AuthCard";
import { AuthHeader } from "./components/AuthHeader";
import { SigninForm } from "./components/SigninForm";
import { AuthFooter } from "./components/Authfooter";

export default function SigninPage() {
  return (
    <AuthCard>
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to your DIUSCADI vault"
      />

      <SigninForm />

      <AuthFooter type="signin" />
    </AuthCard>
  );
}
