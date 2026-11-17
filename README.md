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
  - Stripe Checkout, or a built-in demo payment
- **Order tracking:** look up an order by number + email.
- **Order emails:** order confirmation, status updates (including a shipped email with a tracking link), artwork change requests and team updates.
- **Customer account:**
  - dashboard, orders with timeline, artwork status and reorder
  - printable invoices, saved designs, wishlist, addresses, profile and password
- **Content pages:** pricing tables (pulled live from the catalog), FAQ, contact form, about, heat-press instructions, legal pages.

### Admin panel (`/admin`)
- Dashboard: KPIs with period deltas, revenue chart, status mix, top products, a "needs attention" panel.
- Analytics.
- Orders:
  - status tabs, search, filters, bulk status updates, CSV export
  - order detail with artwork approval, status updates with customer notifications, tracking, internal notes
  - invoice and packing slip printing
- Production board: a drag-and-drop kanban (artwork review → production → QC → ready → shipped).
- Catalog: products (sizes, finishes, quantity tiers, apparel options, media, inventory), categories, review moderation.
- Customers: lifetime value, order history, roles.
- Coupons: percent, fixed and free shipping, with limits and schedules.
- Inbox for contact messages.
- Email notifications: per-email on/off toggles, a new-order alert for your team, a test-email button, an **Email log** with previews, and resend from any order.
- Store settings: tax, shipping methods, rush fee, free-shipping threshold, announcement bar.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide icons, Motion, Sonner |
| Data | Prisma 6. SQLite by default, so switching to PostgreSQL or MySQL is a one-line change |
| Auth | JWT session cookie (jose) + bcrypt, role-based (CUSTOMER / STAFF / ADMIN), route protection in `src/proxy.ts` |
| Editors | Konva / react-konva |
| Charts | Recharts |
| Payments | Stripe Checkout (optional) or the built-in demo payment |

## Getting started

Requires **Node.js 20.9+** (22 recommended).

```bash
cd inkforge
npm install
cp .env.example .env        # then set AUTH_SECRET to a long random string
npm run setup               # creates the database and loads demo data
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
| `npm run setup` | Create tables + seed demo data |
| `npm run db:reset` | Wipe the database and re-seed |
| `npm run db:studio` | Open Prisma Studio to browse data |

## Configuration

### Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Database connection (default `file:./dev.db`, SQLite) |
| `AUTH_SECRET` | Secret used to sign session cookies. **Required**, at least 16 characters |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site (used for metadata and Stripe redirects) |
| `STRIPE_SECRET_KEY` | Optional. Enables real Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional. Verifies Stripe webhooks at `/api/stripe/webhook` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Optional. SMTP server for order emails. Without `SMTP_HOST`, emails go to the dev outbox |
| `EMAIL_FROM` | Sender, e.g. `InkForge <orders@your-domain.com>` |

### Switch to PostgreSQL or MySQL
1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `"postgresql"` or `"mysql"`.
2. Set `DATABASE_URL`, for example `postgresql://user:pass@localhost:5432/inkforge`.
3. Run `npm run setup`.

### Enable Stripe
1. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Point a Stripe webhook at `https://your-domain/api/stripe/webhook` for the `checkout.session.completed` event.

Without a key, checkout uses the demo payment form.

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
| Order confirmation | Payment succeeds (demo card, Stripe webhook, or admin "Mark paid") | Customer |
| New order alert | Same moment; marked `[RUSH]` for rush orders | Your team (alert email or support email) |
| Status update | Staff change status with "notify customer" on, for the statuses you pick in Settings. Shipped includes the tracking link | Customer |
| Artwork changes | Prepress marks artwork "needs changes", with the note | Customer |
| Team update | Staff post an order note marked visible to the customer | Customer |

**How it behaves**
- Status emails wait 10 seconds and are skipped if the status changed again, so an Undo on the production board never emails the customer.
- Replies go to your support email.
- Every attempt (sent, outbox or failed, with the error) appears in **Admin → Email log** and on the order page, where you can preview it or **Resend**.
- **No SMTP configured (development):** emails are saved to `storage/emails/*.html` and the Email log instead of being sent.

### Uploaded files
Customer artwork and design previews are saved to `storage/uploads/` and served from `/uploads/...`. In production, put `storage/` on a persistent volume. For multi-server deployments, swap `src/app/api/upload/route.ts` for S3 or R2.

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
    api/             upload, search, stripe webhook, admin CSV export
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
All prices are integer cents. `src/lib/pricing.ts` is shared by the browser, for live previews, and the server, for the authoritative total. Checkout re-prices every line from the database, so tampered client prices are ignored.

### Order lifecycle
`PENDING → ARTWORK_REVIEW → IN_PRODUCTION → QUALITY_CHECK → READY → SHIPPED → DELIVERED`, plus `CANCELLED` / `REFUNDED`. Each change writes an `OrderEvent`. Events marked visible appear on the customer's order timeline and tracking page.

## Known limitations / next steps

- **Print files:** orders store a preview PNG plus the full design layout (positions in inches + source image URLs) for gang sheets and studio designs. A server-side job that renders the 300 DPI print-ready file from that layout is the natural next step for prepress.
- **Email:** order emails are sent (see above). Password-reset emails and contact-form auto-replies aren't built yet: forgot-password is demo-only, and inbox replies open your mail app.
- **Refunds:** refund and cancel in admin update the order only; they don't call Stripe.
- **Gang sheet packing** uses bounding boxes (rectangles), not true shape nesting. PDF uploads can be ordered as files but not placed on the canvas.
- **Postgres:** admin search relies on SQLite's case-insensitive `contains`. On Postgres, add `mode: "insensitive"` to those Prisma filters.
