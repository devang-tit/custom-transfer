# InkForge: Custom Transfers & Apparel Printing Store

A full-stack e-commerce platform for a custom DTF transfer and t-shirt printing business. It has a premium storefront, an online gang sheet builder, an apparel design studio, customer accounts and a full admin panel.

> **Rename the brand:** edit `src/config/site.ts` (name, contact, nav) and the store settings in **Admin → Settings**.

## Features

### Customer side
- **Storefront:** home page, shop with filters/sort/search, ⌘K product search, category mega-menu, dark mode.
- **Product configurator:**
  - transfers by size, with finishes (glitter/glow) and live quantity-tier pricing
  - artwork upload with a DPI print-quality check
  - apparel color, print locations and size × quantity matrix
- **Gang Sheet Builder:**
  - 22" wide sheets with inch rulers
  - multi-upload, drag/resize/rotate, per-item DPI warnings
  - auto-pack nesting, fit-sheet-to-designs, fill with copies
  - undo/redo and save/load designs
- **Design Studio:** a t-shirt/hoodie customizer with garment colors, front/back, image + text layers, a size matrix and live pricing.
- **Cart and checkout:**
  - cart drawer and cart page, coupons, free-shipping progress
  - multi-step checkout with rush production and shipping methods
  - Razorpay (UPI, RuPay/cards, netbanking, wallets), Cash on Delivery, or a built-in demo payment
  - built for India: ₹ prices with GST included, Indian states and PIN codes, +91 mobile numbers, IST times
- **Order tracking:** look up an order by number + email.
- **Order emails:** order confirmation, status updates (including a shipped email with a tracking link), artwork change requests and team updates.
- **Password reset by email:** single-use links that expire after 1 hour, plus a "your password was changed" security notice.
- **Customer account:**
  - dashboard, orders with timeline, artwork status and reorder
  - printable GST tax invoices (HSN, CGST/SGST or IGST, amount in words), saved designs, wishlist, addresses, profile and password
- **Content pages:** pricing tables (pulled live from the catalog), FAQ, contact form, about, heat-press instructions, legal pages.

### Admin panel (`/admin`)
- Dashboard: KPIs with period deltas, revenue chart, status mix, top products, a "needs attention" panel.
- Analytics.
- Orders:
  - status tabs, search, filters, bulk status updates, CSV export
  - order detail with artwork approval, status updates with customer notifications, tracking, internal notes
  - GST tax invoice and packing slip printing
- Production board: a drag-and-drop kanban (artwork review → production → QC → ready → shipped).
- Catalog: products (sizes, finishes, quantity tiers, apparel options, media, inventory, HSN code and GST rate), categories, review moderation.
- Customers: lifetime value, order history, roles.
- Coupons: percent, fixed and free shipping, with limits and schedules.
- Inbox for contact messages.
- Email notifications: per-email on/off toggles, a new-order alert for your team, a test-email button, an **Email log** with previews, and resend from any order.
- Store settings: GST (legal name, GSTIN, state, default rate, prices include GST), Cash on Delivery (fee, order limit), shipping methods, rush fee, free-shipping threshold, announcement bar.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide icons, Motion, Sonner |
| Data | Prisma 6 + PostgreSQL, with migrations in `prisma/migrations` |
| Files | Vercel Blob in production; local disk in development |
| Auth | JWT session cookie (jose) + bcrypt, role-based (CUSTOMER / STAFF / ADMIN), route protection in `src/proxy.ts` |
| Editors | Konva / react-konva |
| Charts | Recharts |
| Payments | Razorpay (optional), Cash on Delivery, or the built-in demo payment |

## Getting started

Requires **Node.js 20.9+** (22 recommended) and **PostgreSQL** (local or hosted).

```bash
cd inkforge
npm install
cp .env.example .env        # set AUTH_SECRET and DATABASE_URL (a local/dev Postgres)
createdb inkforge           # or create the database any other way
npm run setup               # applies migrations and loads demo data
npm run dev                 # http://localhost:3000
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@inkforge.test | Admin@12345 |
| Staff (production) | production@inkforge.test | Staff@12345 |
| Customer | customer@inkforge.test | Customer@123 |

Demo checkout card: `4242 4242 4242 4242`, any future expiry and any CVC.
Demo coupons: `WELCOME10`, `FREESHIP`, `BULK25`, `GANG15`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm run setup` | Apply migrations + seed demo data |
| `npm run db:migrate` | Create a migration after editing `schema.prisma` (dev database) |
| `npm run db:reset` | Wipe the dev database, re-apply migrations and re-seed |
| `npm run vercel-build` | What Vercel runs: migrate, seed if empty, build |
| `npm run db:studio` | Open Prisma Studio to browse data |

## Configuration

### Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. On Vercel it's provided by the Postgres integration |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for uploads. Set automatically when a Blob store is connected; leave empty locally |
| `SEED_ADMIN_PASSWORD` | Admin password for the first seed of a remote database (demo passwords only work locally) |
| `AUTH_SECRET` | Secret used to sign session cookies. **Required**, at least 16 characters |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (used for metadata and email links) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Optional. Enable Razorpay online payments. Without them, checkout offers a demo payment |
| `RAZORPAY_WEBHOOK_SECRET` | Optional but recommended. Verifies Razorpay webhooks at `/api/razorpay/webhook` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Optional. SMTP server for order emails. Without `SMTP_HOST`, emails go to the dev outbox |
| `EMAIL_FROM` | Sender, e.g. `InkForge <orders@your-domain.com>` |

### Deploying to Vercel
The project builds with `npm run vercel-build`, which does four things in order:
1. Generates the Prisma client.
2. Applies migrations (`prisma migrate deploy`).
3. Seeds the demo store, but only when the database is empty. The seed never touches a database that already has users.
4. Runs `next build`.

You need these on the Vercel project:
- **Database:** a Postgres integration, which provides `DATABASE_URL`.
- **Uploads:** a connected Blob store, which provides `BLOB_READ_WRITE_TOKEN`.
- **Sign-in:** `AUTH_SECRET`.
- **Links:** `NEXT_PUBLIC_SITE_URL`, your production URL.
- **First seed:** `SEED_ADMIN_PASSWORD`. Delete it after the first deploy.

On a remote database, the demo staff and customer accounts get random passwords, and the login page hides the demo-accounts box. To show that box on a demo site, set `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true`.

**Schema changes:** edit `prisma/schema.prisma`, run `npm run db:migrate -- --name what-changed` against your dev database, then commit the new migration folder. The next deploy applies it.

**Resetting demo data on a live database:** when the demo data changes shape, `prisma/seed.ts` bumps `DATA_VERSION` (currently `india-v1`). Setting `RESET_DEMO_DATA` to that value on Vercel (Production) makes the next deploy **wipe all data** and reload the demo store, once: the seed then records the version and skips on later deploys. Remove the variable afterwards.

**Never point your local `.env` at the live database.** `npm run db:reset` wipes whatever `DATABASE_URL` points to.

### Payments (Razorpay + Cash on Delivery)
1. In the Razorpay Dashboard, open **Account & Settings → API Keys** and generate a key pair. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on Vercel (Production), then redeploy. Use `rzp_test_…` keys first; switch to `rzp_live_…` after KYC.
2. Open **Webhooks → Add new webhook**:
   - URL: `https://<your-site>/api/razorpay/webhook`
   - Secret: any long random string; save the same value as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `order.paid`, `payment.failed`
3. **Admin → Settings → Payments** shows whether Razorpay (test/live) and the webhook are configured.

How a payment works: checkout creates the order and a Razorpay order, then opens Razorpay Checkout. When the customer pays, the browser sends the signed result back and the server verifies the signature before marking the order paid. The webhook marks it paid too, so a closed tab never loses a payment. Both paths are idempotent.

**Cash on Delivery** is on by default, with a ₹49 fee and a ₹10,000 order limit. Change or turn it off in **Admin → Settings → Payments**. COD orders are confirmed right away and stay "Unpaid" until you mark them paid after delivery.

### GST
Prices are entered **including GST** (B2C). Each product can carry an HSN code and its own GST rate (for example 5% for apparel, 18% for transfers); otherwise the default rate applies. Shipping, rush and COD fees use the "charges" GST rate. Invoices split the tax into **CGST + SGST** when the delivery state matches your store state, and **IGST** otherwise. Customers can add a GSTIN at checkout for input tax credit.

Fill in **Admin → Settings → GST & invoices** (legal name, GSTIN, state) before going live. The invoice is titled "Tax invoice" once a GSTIN is set. Check the rates and HSN codes with your CA.

### Email notifications
Order emails are sent through any SMTP provider, for example Gmail, Amazon SES, Resend, Postmark or Mailgun. Set them up in `.env`:

```bash
SMTP_HOST="smtp.resend.com"   # or smtp.gmail.com, email-smtp.us-east-1.amazonaws.com, …
SMTP_PORT="465"
SMTP_SECURE="true"            # true for port 465, false for 587
SMTP_USER="resend"
SMTP_PASS="your-api-key-or-app-password"
EMAIL_FROM="InkForge <orders@your-domain.com>"
```

Then open **Admin → Settings → Email notifications** and click **Send test**.

**What gets sent**

| Email | When | Recipient |
| --- | --- | --- |
| Order confirmation | Payment succeeds (Razorpay, demo payment or admin "Mark paid"), or a COD order is placed | Customer |
| New order alert | Same moment; marked `[RUSH]` for rush orders | Your team (alert email or support email) |
| Status update | Staff change status with "notify customer" on, for the statuses you pick in Settings. Shipped includes the tracking link | Customer |
| Artwork changes | Prepress marks artwork "needs changes", with the note | Customer |
| Team update | Staff post an order note marked visible to the customer | Customer |
| Password reset | Customer uses "Forgot password?" | Customer |
| Password changed | Password reset or changed in the account settings | Customer |

**How it behaves**
- Status emails wait 10 seconds and are skipped if the status changed again, so an Undo on the production board never emails the customer.
- Replies go to your support email.
- Every attempt (sent, outbox or failed, with the error) appears in **Admin → Email log** and on the order page, where you can preview it or **Resend**.
- **No SMTP configured (development):** emails are saved to `storage/emails/*.html` and the Email log instead of being sent.

### Password reset
1. **Request:** "Forgot password?" on the login page emails a reset link to `/reset-password?token=…`.
2. **The link:** it works once and expires after 1 hour. Requesting a new link cancels older ones. Each account can request at most 3 links per hour.
3. **What's stored:** only a SHA-256 hash of the token. The Email log keeps a copy with the link redacted, so staff can't use it. In dev outbox mode, the working link is in the `storage/emails/` file.
4. **The form's reply:** it's the same whether or not an account exists, so it can't be used to find out which emails are registered.
5. **After a reset:** the user is signed in, every other device is signed out, and a "your password was changed" email is sent. Changing the password from the account page does the same, but keeps the current device signed in.

The password reset and password changed emails are always on. They aren't controlled by the notification toggles.

### Uploaded files
Customer artwork, design previews and product images go through `/api/upload`. With `BLOB_READ_WRITE_TOKEN` set (on Vercel), they're stored in Vercel Blob and referenced by their public Blob URL. Without it (local development), they're saved to `storage/uploads/` and served from `/uploads/...`.

## Project structure

```
prisma/              schema.prisma, seed.ts (demo data)
public/images/       product art + garment mockups (SVG)
src/
  app/
    (store)/         storefront: home, shop, products, cart, checkout, track, account, content pages
    (studio)/        gang-sheet-builder, design-studio (full-screen editors)
    (auth)/          login, register, forgot-password
    admin/           admin panel
    api/             upload, search, Razorpay webhook, admin CSV export
    uploads/         serves uploaded files
  components/
    ui/              shadcn/ui primitives
    shared/          status badges, order timeline, file dropzone, ratings…
    store/ studio/ admin/ account/ auth/ content/
  config/site.ts     brand + navigation
  lib/               db, auth, pricing engine, settings, order statuses, types
  stores/cart.ts     client cart (zustand, persisted)
  proxy.ts           route protection for /account and /admin
```

### Pricing engine
All prices are integer paise (₹1 = 100) and include GST by default. `src/lib/pricing.ts` is shared by the browser, for live previews, and the server, for the authoritative total. Checkout re-prices every line from the database, so tampered client prices are ignored.

### Order lifecycle
`PENDING → ARTWORK_REVIEW → IN_PRODUCTION → QUALITY_CHECK → READY → SHIPPED → DELIVERED`, plus `CANCELLED` / `REFUNDED`. Each change writes an `OrderEvent`. Events marked visible appear on the customer's order timeline and tracking page.

## Known limitations / next steps

- **Print files:** orders store a preview PNG plus the full design layout (positions in inches + source image URLs) for gang sheets and studio designs. A server-side job that renders the 300 DPI print-ready file from that layout is the natural next step for prepress.
- **Email:** order and password emails are sent (see above). Contact-form auto-replies aren't built yet, and inbox replies open your mail app.
- **Refunds:** refund and cancel in admin update the order only; issue the money back from the Razorpay Dashboard.
- **Shipping rates:** delivery is a flat rate per method. Courier APIs (Shiprocket, Delhivery) for live rates, PIN-code serviceability and AWB generation are not integrated yet.
- **Gang sheet packing** uses bounding boxes (rectangles), not true shape nesting. PDF uploads can be ordered as files but not placed on the canvas.
