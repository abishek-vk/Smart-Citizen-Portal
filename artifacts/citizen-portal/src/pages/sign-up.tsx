import { SignUp } from "@clerk/react";
import { AuthShell } from "@/components/auth-shell";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Free for every resident. Takes less than a minute.">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{ elements: { header: "!hidden" } }}
      />
    </AuthShell>
  );
}
