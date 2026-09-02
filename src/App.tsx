import AmbientBackdrop from "./components/AmbientBackdrop";
import Header from "./components/Header";
import Hero from "./components/Hero";
import TrustSection from "./components/TrustSection";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import PlaceholderPage from "./pages/PlaceholderPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

/** Real auth screens, backed by Supabase. */
const AUTH_ROUTES: Record<string, () => JSX.Element> = {
  "/login": LoginPage,
  "/signup": SignupPage,
  "/forgot-password": ForgotPasswordPage,
  "/reset-password": ResetPasswordPage,
};

/** Static informational routes that remain placeholders for now. */
const PLACEHOLDER_ROUTES: Record<string, { title: string; note: string }> = {
  "/privacy": {
    title: "Privacy Policy",
    note: "Our privacy policy is being finalized and will be published here shortly.",
  },
  "/terms": {
    title: "Terms of Service",
    note: "Our terms of service are being finalized and will be published here shortly.",
  },
};

function LandingPage() {
  return (
    <>
      <AmbientBackdrop />
      <Header />
      <main>
        <Hero />
        <TrustSection />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  const AuthPage = AUTH_ROUTES[path];
  if (AuthPage) {
    return <AuthPage />;
  }

  const placeholder = PLACEHOLDER_ROUTES[path];
  if (placeholder) {
    return <PlaceholderPage title={placeholder.title} note={placeholder.note} />;
  }

  return <LandingPage />;
}
