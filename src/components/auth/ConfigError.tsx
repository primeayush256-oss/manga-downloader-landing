import { supabaseConfigError } from "../../lib/supabase";
import { AuthBanner } from "./AuthFormBits";

/**
 * Shown in place of an auth form when Supabase env vars are missing or
 * invalid. This makes a misconfiguration obvious instead of letting the
 * page fall back to any kind of fake/mock authentication.
 */
export default function ConfigError() {
  return (
    <>
      <AuthBanner tone="error">
        Authentication is not configured. {supabaseConfigError()}
      </AuthBanner>
      <p className="text-[12.5px] leading-relaxed text-content-dim">
        Set <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-soft">VITE_SUPABASE_URL</code>{" "}
        and{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-accent-soft">VITE_SUPABASE_ANON_KEY</code>{" "}
        in your environment, then reload. See <code className="font-mono text-[11px]">.env.example</code>.
      </p>
    </>
  );
}
