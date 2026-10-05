# Keneth Global — standalone application setup

## Runtime
React 19 (CRA/CRACO), FastAPI, MongoDB and the official Stripe Python SDK.
No platform SDK, LLM service, AI key, analytics script or visual-editing package is required by the application.
Existing product photos, gallery images and journal covers are bundled under `backend/static/products/`.
Certificates are bundled under `frontend/public/certificates/`. Include these directories when copying the project.
The database field `ai_image` is retained for compatibility; it now simply identifies a bundled image.

## Environment
Copy `backend/.env.example` and `frontend/.env.example` to their respective `.env` files in a new installation, then replace every placeholder.
On the existing installation, merge settings instead of overwriting any protected or working values.
Never commit real `.env` files, credentials or MongoDB backups.

Backend:
```dotenv
MONGO_URL=<your-existing-mongodb-connection-string>
DB_NAME=<your-existing-database-name>
JWT_SECRET=<your-secure-random-secret>
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-secure-admin-password>
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PUBLIC_BASE_URL=https://yourdomain.com
STRIPE_API_KEY=<your-stripe-test-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-signing-secret>
```

Frontend:
```dotenv
REACT_APP_BACKEND_URL=https://yourdomain.com
```

- Keep the existing MongoDB URI/database name when retaining the existing catalog, accounts, orders and video settings.
- `REACT_APP_BACKEND_URL` is the public backend **origin, without `/api`**. The frontend already adds that prefix.
- `PUBLIC_BASE_URL` is the storefront's public origin, without a path; the server uses it for Stripe return URLs. Client-supplied origins are ignored.
- List trusted frontend origins in `CORS_ORIGINS`. Bearer-token API requests do not require credentialed CORS.
- Generate a JWT secret: `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- Match admin environment credentials to the intended seeded account. The existing seed code synchronizes that account's password on startup; keep these values secure and intentional.
- Existing preview-only environment keys and workspace infrastructure can remain in the managed preview; they are not needed in a standalone production environment.

## Install and build
Use Python 3.11 and a supported Node LTS release. From the project root:
```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements.txt
(cd frontend && yarn install --frozen-lockfile && yarn build)
```

Serve `frontend/build/` with SPA fallback to `index.html`, and route `/api/*` to FastAPI. Do not strip `/api` when proxying.
Preserve the `/api/static/*` route for product images. Expose the site and webhook using HTTPS.
In this workspace the existing supervisor runs backend port 8001 and frontend port 3000; do not change these ports or launch duplicate services.
Outside this workspace, the backend application module is `server:app`, with `backend/` as working directory; configure it in your process manager.
Frontend environment changes require a rebuild.

## Stripe — test mode only in this version
- Set `STRIPE_API_KEY` to a valid direct Stripe test secret (`sk_test_…` or suitably permitted `rk_test_…`) in your server environment. No frontend Stripe key is needed.
- Create a test-mode Stripe webhook for `https://yourdomain.com/api/webhook/stripe` (use the API origin if separate).
- Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.
- Put that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. This variable is **now used** by the official SDK's raw-body signature verification.
- The old shared placeholder is not a valid direct Stripe credential. No working direct Stripe key or endpoint signing secret was available during this migration.
- Checkout returns an explicit HTTP 503 until both secrets are configured. It does not fabricate a session or silently accept unsigned events.
- The application intentionally accepts test keys only. Live payments are not enabled by this migration.
- Prices, delivery (€12 below a €120 product subtotal; otherwise free) and optional €5 gift wrap are calculated server-side in EUR cents to match the cart. Signed events validate amount, currency and order reference, and apply paid state atomically.
- Successful redirects and an unpaid `complete` session do not mark orders paid. Duplicate events cannot reapply or downgrade an already-paid order.

## Verification before accepting orders
1. `/api/health` returns HTTP 200 and JSON `{"status":"ok","db":true}`.
2. Verify all four houses, product/gallery images, both certificate PDFs and admin login.
3. Add a product to cart. Until payment secrets are configured, confirm a clear payment-configuration error and no false success.
4. With real Stripe test settings configured, create a hosted test checkout, pay with Stripe's test card and verify a signed webhook changes the matching order to paid.
5. Replay the webhook; confirm no duplicate payment update. Alter the signature/body; confirm rejection.
6. Set the company video under Admin → Homepage if desired. Video embedding requires no AI service.

## Remaining product limitations
AI image generation/regeneration was intentionally removed; all existing images remain available.
The newsletter form is still inactive. Inventory guarding and customer confirmation emails remain future work.