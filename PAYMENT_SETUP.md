# Payment Setup — Razorpay Subscriptions

This landing page sells two **subscription** plans for the Manga Manhwa
Downloader extension, updating the **same** Supabase project the extension
uses (`kmvbqjlsiwhivxhmgdqt`). Payment is handled by **Razorpay Subscriptions**;
entitlement is written **server-side only**.

Production URL: `https://manga-downloader-landing.primeayush256.workers.dev`

> **This file contains no secrets** — only variable names, placeholders, and
> steps. Never commit real keys. Never paste secrets into chat.

Confirmed pricing (do not change):
- **Monthly ₹99/month** — 9900 paise
- **Yearly ₹999/year** — 99900 paise
- **Free tier** = exactly 20 page downloads per account (no time trial)

---

## Architecture at a glance

```
Pricing card (browser)  ──sends only {plan:"monthly"|"yearly"}──▶  POST /api/payments/create-subscription
                                                                       │  (server maps plan name → plan id, amount)
                                                                       ▼
                                                            Razorpay: create Subscription
                                                                       │  returns {subscription_id, key_id (public)}
        Razorpay Checkout (public Key ID + subscription_id)  ◀─────────┘
                    │ returns {payment_id, subscription_id, signature}
                    ▼
            POST /api/payments/verify
                    │  server: HMAC(payment_id|subscription_id, KEY_SECRET)
                    │  → verified? read live sub from Razorpay → apply_subscription_event RPC
                    ▼
        Razorpay ──webhook──▶ POST /api/webhooks/razorpay
                    │  server: HMAC(rawBody, WEBHOOK_SECRET) → idempotency insert → apply_subscription_event RPC
                    ▼
              Supabase user_entitlements  (subscription_status, cancel_at_period_end, …)
                    │
          cz_is_premium() derives premium state  ←  extension get_entitlement() reads same row
```

The webhook is the **authoritative** source of entitlement. `verify` gives the
user instant feedback but never grants premium on the browser's word — it only
proceeds after the server confirms the HMAC signature.

---

## Public vs secret — which is which

| Variable | Classification | Where it lives |
|----------|---------------|----------------|
| `RAZORPAY_KEY_ID` | **Public** — sent to Razorpay Checkout in the browser | Cloudflare Runtime Variable |
| `RAZORPAY_MONTHLY_PLAN_ID` | Config — server-only (never exposed to browser) | Cloudflare Runtime Variable or Secret |
| `RAZORPAY_YEARLY_PLAN_ID` | Config — server-only | Cloudflare Runtime Variable or Secret |
| `RAZORPAY_KEY_SECRET` | **Secret** — server HMAC verification only | Cloudflare **Secret** |
| `RAZORPAY_WEBHOOK_SECRET` | **Secret** — webhook HMAC verification only | Cloudflare **Secret** |
| `SUPABASE_URL` | Public — project URL | Cloudflare Runtime Variable |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — bypasses RLS, server only | Cloudflare **Secret** |
| `VITE_SUPABASE_URL` | Public — baked into frontend build | Cloudflare Build Variable |
| `VITE_SUPABASE_ANON_KEY` | Public anon key — baked into frontend build | Cloudflare Build Variable |

`RAZORPAY_KEY_ID` is the **only** Razorpay credential that reaches the browser
(via the server's `create-subscription` response). It is the public key, which
Razorpay Checkout requires. Every other credential stays server-side.

---

## Step 1 — Razorpay Test Mode (do this first)

1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch
   to **Test Mode** (toggle, top-right).
2. **Settings → API Keys → Generate Test Key**. Copy the **Key ID**
   (`rzp_test_…`) and **Key Secret**. The secret is shown once — store it in
   your password manager, not in this repo.
3. Set `RAZORPAY_KEY_ID = rzp_test_<your-test-id>` in Cloudflare (Step 4).

> Complete all testing in Test Mode before switching to the Live Key ID.

---

## Step 2 — Create the Monthly plan (Test Mode)

**Subscriptions → Plans → + Create Plan**:

| Field | Value |
|-------|-------|
| Billing frequency | Monthly |
| Interval | 1 |
| Amount | ₹99 (9900 paise) |
| Currency | INR |
| Description | `Manga Manhwa Downloader — Monthly` |

Copy the resulting **Plan ID** (`plan_…`).

---

## Step 3 — Create the Yearly plan (Test Mode)

**Subscriptions → Plans → + Create Plan**:

| Field | Value |
|-------|-------|
| Billing frequency | Yearly |
| Interval | 1 |
| Amount | ₹999 (99900 paise) |
| Currency | INR |
| Description | `Manga Manhwa Downloader — Yearly` |

Copy the resulting **Plan ID** (`plan_…`).

> Plans are created in the Razorpay Dashboard — no script creates them, because
> doing so would require the Key Secret in a runnable file.

---

## Step 4 — Configure Cloudflare Workers runtime variables

Go to **Cloudflare Dashboard → Workers & Pages → manga-downloader-landing →
Settings → Variables and Secrets**.

### Runtime Variables (not secret, but server-only — do NOT use VITE_*)

| Variable | Value |
|----------|-------|
| `RAZORPAY_KEY_ID` | `rzp_test_…` (Test) or `rzp_live_…` (Live) |
| `SUPABASE_URL` | `https://kmvbqjlsiwhivxhmgdqt.supabase.co` |

### Runtime Secrets (encrypted, set as "Secret" type)

| Secret | Where to get it |
|--------|----------------|
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_MONTHLY_PLAN_ID` | Plan ID from Step 2 |
| `RAZORPAY_YEARLY_PLAN_ID` | Plan ID from Step 3 |
| `RAZORPAY_WEBHOOK_SECRET` | Set when creating the webhook (Step 5) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project → Settings → API → `service_role` |

> **Do not put these into `.env`, `wrangler.toml`, source code, or Git.**
> The `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` Build Variables are
> separate — they are already configured and must not be confused with the
> server-side variables above.

---

## Step 5 — Configure the webhook (Test Mode)

1. **Razorpay Dashboard → Settings → Webhooks → + Add New Webhook** (in Test Mode).
2. **Webhook URL:**
   ```
   https://manga-downloader-landing.primeayush256.workers.dev/api/webhooks/razorpay
   ```
3. **Secret:** generate a strong random string (32+ characters). Enter it here
   AND save it as `RAZORPAY_WEBHOOK_SECRET` in Cloudflare (Step 4). Never
   commit this value.
4. **Active events** — subscribe to all of these:
   - `subscription.authenticated`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.paused`
   - `subscription.resumed`

---

## Step 6 — Apply the Supabase migration

The Razorpay subscription write path requires two SECURITY DEFINER functions
and a webhook idempotency table in the Supabase project. Apply the migration:

```bash
cd "E:\APP\Landing page\manga downloader landing page"
supabase db push
```

Migration file:
```
supabase/migrations/20260902090000_razorpay_subscriptions.sql
```

**Important:** the foundation migration (`20260901120000_monetization_foundation.sql`)
from the Chrome extension's Supabase project must already be applied. It creates
`user_entitlements`, `cz_is_premium`, and the free-page reservation system that
this migration builds on. If it isn't in the project's migration history, apply it
from `E:\APP\MANGA DOWNLOADER\supabase\migrations\` **without** modifying any
extension source files.

---

## Step 7 — Local development

```bash
# 1. Copy the secret template and fill in Test Mode values
cp .dev.vars.example .dev.vars
# (edit .dev.vars — fill in rzp_test_ credentials, test plan IDs, webhook secret)

# 2. Build the frontend
npm run build

# 3. Run the local Worker (serves dist/ + /api/* routes with .dev.vars secrets)
npx wrangler pages dev
```

For Razorpay to deliver webhooks to your local machine, expose the dev server
via a tunnel:

```bash
cloudflared tunnel --url http://localhost:8788
# Use the generated HTTPS URL as the temporary webhook URL in Razorpay Dashboard
```

`npm run dev` (Vite only) serves the UI without the Worker API — use
`wrangler pages dev` for end-to-end local testing.

---

## Step 8 — Test payment procedure

1. Open the site and sign in with a Supabase account.
2. Go to **Pricing** and click **Get monthly** or **Get yearly**.
3. Razorpay Checkout opens (Test Mode).
4. Use a Razorpay test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: any future date
   - CVV: any 3 digits
   - OTP: `1234` (Razorpay test OTP)
5. On success, the page calls `POST /api/payments/verify`. After the server
   verifies the HMAC signature, **"Unlimited access is active"** is displayed.
6. Within a few seconds, Razorpay fires the `subscription.activated` /
   `subscription.charged` webhook to the production URL.
7. The webhook handler verifies the signature, inserts an idempotency row, and
   calls `apply_subscription_event` to persist premium status.

---

## Step 9 — How entitlement works

- `user_entitlements` holds `subscription_status`, `subscription_plan`,
  `current_period_start/end`, `cancel_at_period_end`, and the Razorpay IDs.
- Premium = `subscription_status = 'active'` OR `(status = 'cancelled' AND
  cancel_at_period_end = true AND current_period_end > now())`.
- `past_due` (payment failed, retrying) and `expired`/`completed` are **not
  premium**.
- On **cancel at period end**: premium remains active until `current_period_end`.
  After that date `cz_is_premium` returns false — no manual intervention needed.
- The Chrome extension reads the same `user_entitlements` row via
  `get_entitlement()`. After a successful payment, the user refreshes the
  extension to see unlimited access immediately.

---

## Step 10 — Signature verification details

### Subscription checkout (POST /api/payments/verify)

```
HMAC_SHA256(
  key   = RAZORPAY_KEY_SECRET,
  input = razorpay_payment_id + "|" + razorpay_subscription_id
)
=== razorpay_signature (constant-time comparison)
```

### Webhook (POST /api/webhooks/razorpay)

```
HMAC_SHA256(
  key   = RAZORPAY_WEBHOOK_SECRET,
  input = raw request body bytes (never re-serialized)
)
=== X-Razorpay-Signature header (constant-time comparison)
```

Both use `crypto.subtle` (Web Crypto) — available on Cloudflare Workers and
Node 18+. Both use a bitwise-XOR constant-time comparison to avoid timing
side-channels.

---

## Step 11 — Switching to Live Mode

**Do not switch to Live Mode until Test Mode end-to-end testing is complete.**

When ready:

1. Switch the Razorpay Dashboard to **Live Mode**.
2. Re-create both plans (Monthly ₹99, Yearly ₹999) in Live Mode exactly as in
   Steps 2–3. Copy the new Live Plan IDs.
3. Create a new Live Mode webhook pointing to the same production URL, with a
   new fresh webhook secret.
4. In Cloudflare Dashboard, update these **Runtime Variables/Secrets**:

   | Variable/Secret | Live value |
   |-----------------|-----------|
   | `RAZORPAY_KEY_ID` | `rzp_live_TLkyT5t1fpLSOZ` |
   | `RAZORPAY_KEY_SECRET` | Live Key Secret (from Razorpay Dashboard) |
   | `RAZORPAY_MONTHLY_PLAN_ID` | Live monthly plan ID |
   | `RAZORPAY_YEARLY_PLAN_ID` | Live yearly plan ID |
   | `RAZORPAY_WEBHOOK_SECRET` | New live webhook secret |

5. Trigger a Cloudflare redeploy (push a commit or use the dashboard Retry).
6. Verify with a real card using a small test charge if Razorpay provides a
   live test path, or proceed carefully with a real ₹1 charge that you
   immediately cancel.
7. Rotate the Test Mode secrets if they were ever exposed.

> The `RAZORPAY_KEY_ID = rzp_live_TLkyT5t1fpLSOZ` value is the Live public Key
> ID. It is safe to use as a runtime variable — it only identifies your Razorpay
> account to Checkout and carries no privileges. The **Live Key Secret** is what
> must remain exclusively in Cloudflare Secrets, never in source code or chat.

---

## Step 12 — Security checklist

- [ ] No `RAZORPAY_KEY_SECRET` in source code, `.env`, or Git
- [ ] No `RAZORPAY_WEBHOOK_SECRET` in source code, `.env`, or Git
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in source code, `.env`, or Git
- [ ] No `RAZORPAY_MONTHLY_PLAN_ID` / `RAZORPAY_YEARLY_PLAN_ID` in client bundle
- [ ] `RAZORPAY_KEY_ID` is the only Razorpay value the browser receives
- [ ] `RAZORPAY_KEY_ID` reaches the browser via server response, not Vite build
- [ ] Webhook signature verified over raw body before any parsing
- [ ] Webhook idempotency via unique `event_id` in `razorpay_webhook_events`
- [ ] User identity resolved from verified JWT, never from request body
- [ ] Plan ID and price controlled entirely server-side
- [ ] Premium derived by SQL `cz_is_premium`, never a stored boolean

---

## Deployment notes

- LIVE Razorpay subscription plans, webhook, and Cloudflare runtime
  variables/secrets are configured. This section is documentation only and has
  no effect on application behavior; it exists to record that a fresh
  production deployment was triggered so the Worker picks up the newly-saved
  runtime configuration.
