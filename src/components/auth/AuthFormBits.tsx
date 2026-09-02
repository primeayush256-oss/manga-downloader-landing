import {
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Small presentational building blocks shared by all auth forms, styled to
 * match the extension's glass/route-blue form controls.
 */

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Field-level error message; also flips aria-invalid. */
  error?: string | null;
}

/** A labelled text/email/password input with inline error support. */
export function Field({ id, label, error, className, ...rest }: FieldProps) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.5px] text-content-faint"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-[10px] border bg-white/[0.045] px-3 py-2.5 text-[13.5px] text-content transition-[border-color,background-color,box-shadow] duration-200 ease-ease placeholder:text-content-faint focus:outline-none ${
          error
            ? "border-bad focus:border-bad"
            : "border-hair-soft focus:border-accent focus:bg-white/[0.07]"
        } ${className ?? ""}`}
        {...rest}
      />
      {error && (
        <p id={describedBy} className="mt-1.5 text-[11.5px] text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

/** A password field with a show/hide reveal toggle. */
export function PasswordField({
  id,
  label,
  error,
  autoComplete = "current-password",
  ...rest
}: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.5px] text-content-faint"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={revealed ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-[10px] border bg-white/[0.045] px-3 py-2.5 pr-11 text-[13.5px] text-content transition-[border-color,background-color,box-shadow] duration-200 ease-ease placeholder:text-content-faint focus:outline-none ${
            error
              ? "border-bad focus:border-bad"
              : "border-hair-soft focus:border-accent focus:bg-white/[0.07]"
          }`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-pressed={revealed}
          aria-label={revealed ? "Hide password" : "Show password"}
          title={revealed ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-content-faint transition-colors duration-200 ease-ease hover:bg-white/[0.06] hover:text-content-dim"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
            {revealed && <path d="M3 3l18 18" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
      {error && (
        <p id={describedBy} className="mt-1.5 text-[11.5px] text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

type BannerTone = "error" | "success" | "info";

/** A status banner for form-level messages. Announced to assistive tech. */
export function AuthBanner({
  tone,
  children,
}: {
  tone: BannerTone;
  children: ReactNode;
}) {
  const toneClasses: Record<BannerTone, string> = {
    error: "border-bad/40 bg-bad/[0.12] text-[#ffd6d6]",
    success: "border-good/40 bg-good/[0.12] text-[#cdf7e6]",
    info: "border-accent/40 bg-accent/[0.12] text-[#d6ecff]",
  };
  return (
    <p
      role="status"
      aria-live="polite"
      className={`mb-4 rounded-[11px] border px-3.5 py-2.5 text-[12.5px] leading-relaxed ${toneClasses[tone]}`}
    >
      {children}
    </p>
  );
}

/** Full-width accent submit button with a loading state. */
export function SubmitButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="btn-accent mt-1 w-full py-2.5 disabled:cursor-progress disabled:opacity-70"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full border-2 border-white/35 border-t-white motion-safe:animate-spin"
            aria-hidden="true"
          />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
