import { SignIn } from "@clerk/react";
import { AuthShell } from "@/components/auth-shell";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{ elements: { header: "!hidden" } }}
      />
    </AuthShell>
  );
}
