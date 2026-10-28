import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider, useLanguage } from "@/components/language-provider"
import { clerkTamil } from "@/lib/translations-ta"

// Pages
import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import CitizenDashboard from "@/pages/dashboard";
import Complaints from "@/pages/complaints";
import Taxes from "@/pages/taxes";
import Certificates from "@/pages/certificates";
import Garbage from "@/pages/garbage";
import Parking from "@/pages/parking";
import Transport from "@/pages/transport";
import Parks from "@/pages/parks";
import Libraries from "@/pages/libraries";
import Payments from "@/pages/payments";
import Notifications from "@/pages/notifications";
import AIAssistant from "@/pages/ai-assistant";
import Feedback from "@/pages/feedback";
import ProfilePage from "@/pages/profile";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminComplaints from "@/pages/admin/complaints";
import AdminCitizens from "@/pages/admin/citizens";
import AdminCertificates from "@/pages/admin/certificates";
import AdminReports from "@/pages/admin/reports";
import AdminAuditLogs from "@/pages/admin/audit-logs";

import NotFound from "@/pages/not-found";

import { MainLayout } from "@/components/layout/main-layout";
import { BrandMark } from "@/components/brand";
import { useGetProfile, setAuthTokenGetter, getGetProfileQueryKey } from "@workspace/api-client-react";

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL?.trim() || undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(244 60% 26%)",
    colorPrimaryForeground: "hsl(0 0% 100%)",
    colorForeground: "hsl(244 45% 12%)",
    colorMutedForeground: "hsl(240 6% 38%)",
    colorDanger: "hsl(0 72% 51%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(244 45% 12%)",
    colorNeutral: "hsl(240 5% 88%)",
    fontFamily: "'Inter', sans-serif",
    fontFamilyButtons: "'Inter', sans-serif",
    borderRadius: "0.9rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background rounded-[20px] w-[440px] max-w-full overflow-hidden border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    socialButtonsBlockButtonText: "!font-semibold !text-foreground !opacity-100",
    socialButtonsBlockButton: "border border-border shadow-xs hover:bg-accent transition-colors",
    formButtonPrimary: "!shadow-none !rounded-full",
    footerPages: "!hidden",
    devModeBadge: "!hidden",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  const { isSignedIn } = useUser();
  const { data: profile } = useGetProfile({ query: { enabled: !!isSignedIn, queryKey: getGetProfileQueryKey() } });

  if (isSignedIn) {
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <LandingPage />;
}

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { isLoaded, isSignedIn } = useUser()
  const { data: profile, isLoading } = useGetProfile({ query: { enabled: !!isSignedIn, queryKey: getGetProfileQueryKey() } })

  if (!isLoaded || (isSignedIn && isLoading)) return <div className="min-h-screen bg-background flex items-center justify-center"><BrandMark className="h-10 w-10 animate-pulse" /></div>
  
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />
  }

  if (adminOnly && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Redirect to="/dashboard" />
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  )
}

function ClerkAuthTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  return (
    <ClerkProvider
      localization={language === "ta" ? clerkTamil : undefined}
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkAuthTokenSync />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Citizen Routes */}
            <Route path="/dashboard"><ProtectedRoute component={CitizenDashboard} /></Route>
            <Route path="/complaints"><ProtectedRoute component={Complaints} /></Route>
            <Route path="/taxes"><ProtectedRoute component={Taxes} /></Route>
            <Route path="/certificates"><ProtectedRoute component={Certificates} /></Route>
            <Route path="/garbage"><ProtectedRoute component={Garbage} /></Route>
            <Route path="/parking"><ProtectedRoute component={Parking} /></Route>
            <Route path="/transport"><ProtectedRoute component={Transport} /></Route>
            <Route path="/parks"><ProtectedRoute component={Parks} /></Route>
            <Route path="/libraries"><ProtectedRoute component={Libraries} /></Route>
            <Route path="/payments"><ProtectedRoute component={Payments} /></Route>
            <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
            <Route path="/ai-assistant"><ProtectedRoute component={AIAssistant} /></Route>
            <Route path="/feedback"><ProtectedRoute component={Feedback} /></Route>
            <Route path="/profile"><ProtectedRoute component={ProfilePage} /></Route>

            {/* Admin Routes */}
            <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
            <Route path="/admin/complaints"><ProtectedRoute component={AdminComplaints} adminOnly /></Route>
            <Route path="/admin/citizens"><ProtectedRoute component={AdminCitizens} adminOnly /></Route>
            <Route path="/admin/certificates"><ProtectedRoute component={AdminCertificates} adminOnly /></Route>
            <Route path="/admin/reports"><ProtectedRoute component={AdminReports} adminOnly /></Route>
            <Route path="/admin/audit-logs"><ProtectedRoute component={AdminAuditLogs} adminOnly /></Route>
            
            <Route component={NotFound} />
          </Switch>
            <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      {/* Above ClerkProvider so Clerk's sign-in forms can follow the chosen language */}
      <LanguageProvider>
        <ClerkProviderWithRoutes />
      </LanguageProvider>
    </WouterRouter>
  );
}

export default App;
