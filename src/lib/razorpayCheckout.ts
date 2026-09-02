/**
 * Loads the Razorpay Checkout script on demand and opens it.
 *
 * The browser only ever handles PUBLIC data here — the Razorpay Key ID and a
 * subscription id created server-side. No secret is present in the client.
 */

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayCheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutSuccess) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loadPromise: Promise<boolean> | null = null;

/** Injects checkout.js once; resolves true when window.Razorpay is available. */
export function loadRazorpayCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.Razorpay));
      existing.addEventListener("error", () => resolve(false));
      if (window.Razorpay) resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => {
      loadPromise = null; // allow a later retry
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface OpenCheckoutArgs {
  keyId: string;
  subscriptionId: string;
  email: string | null;
  onSuccess: (payload: RazorpayCheckoutSuccess) => void;
  onDismiss: () => void;
}

/**
 * Opens Razorpay Checkout for a subscription. Returns false if the script
 * could not be loaded (offline / blocked), so the caller can show an error.
 */
export async function openRazorpayCheckout(
  args: OpenCheckoutArgs
): Promise<boolean> {
  const ready = await loadRazorpayCheckout();
  if (!ready || !window.Razorpay) return false;

  const rzp = new window.Razorpay({
    key: args.keyId,
    subscription_id: args.subscriptionId,
    name: "Manga Manhwa Downloader",
    description: "Unlimited downloads subscription",
    prefill: args.email ? { email: args.email } : undefined,
    theme: { color: "#3fa2ff" },
    handler: (response) => args.onSuccess(response),
    modal: { ondismiss: () => args.onDismiss() },
  });

  rzp.on("payment.failed", () => args.onDismiss());
  rzp.open();
  return true;
}

export type { RazorpayCheckoutSuccess };
