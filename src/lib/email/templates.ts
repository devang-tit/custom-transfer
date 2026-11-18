/**
 * Transactional email templates. Pure functions (no DB) that return subject + HTML + plain text.
 * HTML is table-based with inline styles so it renders in Gmail, Outlook and Apple Mail.
 * Every piece of user/admin-supplied text goes through esc().
 */
import { ORDER_FLOW, statusMeta } from "@/lib/order-status";
import { formatDate, formatMoney } from "@/lib/format";
import type { AddressInput } from "@/lib/types";

export type EmailBrand = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  siteUrl: string;
  address: string;
};

export type EmailOrderItem = {
  name: string;
  variantLabel: string | null;
  quantity: number;
  total: number;
  image: string | null;
  productSlug: string | null;
  artworkStatus: string;
};

export type EmailOrder = {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  shippingMethodLabel: string;
  isPickup: boolean;
  address: AddressInput | null;
  items: EmailOrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  rushFee: number;
  codFee: number;
  tax: number;
  /** GST is already inside the prices (India B2C) */
  taxIncluded: boolean;
  total: number;
  isRush: boolean;
  /** razorpay | cod | demo */
  paymentMethod: string | null;
  paid: boolean;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
};

export type RenderedEmail = { subject: string; html: string; text: string };

// ---------- helpers ----------

const C = {
  ink: "#17151F",
  muted: "#6B6880",
  border: "#E8E6EF",
  bg: "#F4F3F8",
  card: "#FFFFFF",
  primary: "#5B3DF5",
  cyan: "#35C3E8",
  magenta: "#E9327A",
  yellow: "#F7CF3D",
  soft: "#F7F5FF",
};
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape + keep line breaks. */
function escMultiline(value: string): string {
  return esc(value).replace(/\r?\n/g, "<br>");
}

export function absoluteUrl(siteUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl.replace(/\/$/, "")}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function orderUrl(brand: EmailBrand, order: Pick<EmailOrder, "number" | "email">): string {
  return absoluteUrl(brand.siteUrl, `/track?order=${encodeURIComponent(order.number)}&email=${encodeURIComponent(order.email)}`);
}

const RASTER = /\.(png|jpe?g|gif|webp)(\?.*)?$/i;

function button(href: string, label: string, color = C.primary): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px"><tr><td style="border-radius:10px;background:${color}">
<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)}</a>
</td></tr></table>`;
}

function noteBox(title: string, body: string, accent = C.primary): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0"><tr>
<td style="background:${C.soft};border-left:4px solid ${accent};border-radius:8px;padding:14px 16px;font-family:${FONT}">
<div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${C.muted};margin-bottom:6px">${esc(title)}</div>
<div style="font-size:15px;line-height:1.55;color:${C.ink}">${body}</div>
</td></tr></table>`;
}

function sectionTitle(label: string): string {
  return `<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.muted};margin:28px 0 10px">${esc(label)}</div>`;
}

function progress(status: string): string {
  const steps = ORDER_FLOW.filter((s) => s !== "PENDING");
  const current = steps.indexOf(status as (typeof steps)[number]);
  if (current < 0) return "";
  const cells = steps
    .map((s, i) => {
      const done = i <= current;
      return `<td align="center" valign="top" style="padding:0 2px;width:${Math.floor(100 / steps.length)}%">
<div style="height:6px;border-radius:3px;background:${done ? C.primary : C.border}"></div>
<div style="font-family:${FONT};font-size:11px;line-height:1.3;margin-top:7px;color:${i === current ? C.ink : C.muted};font-weight:${i === current ? 700 : 500}">${esc(statusMeta(s).label)}</div>
</td>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0"><tr>${cells}</tr></table>`;
}

function itemsTable(brand: EmailBrand, items: EmailOrderItem[]): string {
  const rows = items
    .map((it) => {
      const img =
        it.image && RASTER.test(it.image)
          ? `<img src="${esc(absoluteUrl(brand.siteUrl, it.image))}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:8px;object-fit:cover;background:${C.bg}">`
          : `<div style="width:56px;height:56px;border-radius:8px;background:linear-gradient(135deg,${C.cyan},${C.primary},${C.magenta});font-family:${FONT};font-size:20px;font-weight:700;line-height:56px;text-align:center;color:#fff">${esc(it.name.charAt(0).toUpperCase())}</div>`;
      return `<tr>
<td width="68" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.border}">${img}</td>
<td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${FONT}">
<div style="font-size:15px;font-weight:600;color:${C.ink}">${esc(it.name)}</div>
${it.variantLabel ? `<div style="font-size:13px;color:${C.muted};margin-top:2px">${esc(it.variantLabel)}</div>` : ""}
<div style="font-size:13px;color:${C.muted};margin-top:2px">Qty ${it.quantity}</div>
</td>
<td valign="top" align="right" style="padding:10px 0 10px 12px;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:15px;font-weight:600;color:${C.ink};white-space:nowrap">${formatMoney(it.total)}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`;
}

function totalsTable(o: EmailOrder): string {
  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-family:${FONT};font-size:${strong ? 16 : 14}px;color:${strong ? C.ink : C.muted};font-weight:${strong ? 700 : 400}">${esc(label)}</td>
<td align="right" style="padding:4px 0;font-family:${FONT};font-size:${strong ? 16 : 14}px;color:${C.ink};font-weight:${strong ? 700 : 500};white-space:nowrap">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">
${line("Subtotal", formatMoney(o.subtotal))}
${o.discount ? line(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `−${formatMoney(o.discount)}`) : ""}
${line(`Shipping · ${o.shippingMethodLabel}`, o.shipping ? formatMoney(o.shipping) : "Free")}
${o.rushFee ? line("Rush production", formatMoney(o.rushFee)) : ""}
${o.codFee ? line("Cash on Delivery fee", formatMoney(o.codFee)) : ""}
${o.taxIncluded ? "" : line("GST", formatMoney(o.tax))}
<tr><td colspan="2" style="padding-top:6px;border-bottom:1px solid ${C.border}"></td></tr>
${line(o.paymentMethod === "cod" && !o.paid ? "Total (pay on delivery)" : "Total", formatMoney(o.total), true)}
${o.taxIncluded && o.tax ? `<tr><td colspan="2" align="right" style="padding-top:2px;font-family:${FONT};font-size:12px;color:${C.muted}">Includes ${formatMoney(o.tax)} GST</td></tr>` : ""}
</table>`;
}

function addressBlock(o: EmailOrder): string {
  if (o.isPickup) {
    return `<div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${C.ink}">Studio pickup<br><span style="color:${C.muted}">We'll email you when it's ready.</span></div>`;
  }
  const a = o.address;
  if (!a) return "";
  const lines = [a.name, a.company, a.line1, a.line2, `${a.city}, ${a.state} – ${a.zip}`, a.country === "IN" ? "India" : a.country, a.phone].filter(Boolean).map((l) => esc(l));
  return `<div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${C.ink}">${lines.join("<br>")}</div>`;
}

function trackingBlock(o: EmailOrder): string {
  if (!o.trackingNumber) return "";
  const label = `${o.carrier ? `${esc(o.carrier)} · ` : ""}<span style="font-family:Menlo,Consolas,monospace">${esc(o.trackingNumber)}</span>`;
  const link = o.trackingUrl ? `<br><a href="${esc(o.trackingUrl)}" style="color:${C.primary};font-weight:600;text-decoration:none">Track package →</a>` : "";
  return noteBox("Tracking", `${label}${link}`, C.cyan);
}

function layout(opts: { brand: EmailBrand; preheader: string; eyebrow?: string; title: string; body: string; footerNote?: string }): string {
  const { brand } = opts;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only">
<title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td style="padding:0 4px 18px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="width:34px;height:34px;border-radius:9px;background:${C.ink};text-align:center;vertical-align:middle;font-size:0;line-height:0">
      <span style="display:inline-block;width:9px;height:9px;border-radius:9px;background:${C.cyan};margin:0 1px"></span><span style="display:inline-block;width:9px;height:9px;border-radius:9px;background:${C.magenta};margin:0 1px"></span><span style="display:inline-block;width:9px;height:9px;border-radius:9px;background:${C.yellow};margin:0 1px"></span>
    </td>
    <td style="padding-left:10px;font-family:${FONT};font-size:19px;font-weight:800;letter-spacing:-.02em;color:${C.ink}">${esc(brand.storeName)}</td>
  </tr></table>
</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;overflow:hidden">
  <div style="height:5px;background:linear-gradient(90deg,${C.cyan},${C.primary},${C.magenta},${C.yellow});background-color:${C.primary}"></div>
  <div style="padding:30px 30px 34px">
    ${opts.eyebrow ? `<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.primary};margin-bottom:8px">${esc(opts.eyebrow)}</div>` : ""}
    <h1 style="margin:0;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-.02em;color:${C.ink}">${esc(opts.title)}</h1>
    ${opts.body}
  </div>
</td></tr>
<tr><td style="padding:22px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};text-align:center">
  ${opts.footerNote ? `${opts.footerNote}<br>` : ""}
  Questions? Reply to this email or contact <a href="mailto:${esc(brand.supportEmail)}" style="color:${C.muted}">${esc(brand.supportEmail)}</a> · ${esc(brand.supportPhone)}<br>
  ${esc(brand.storeName)} · ${esc(brand.address)}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function p(text: string): string {
  return `<p style="margin:14px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink}">${text}</p>`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function textFooter(brand: EmailBrand): string {
  return `\n\nQuestions? Reply to this email or contact ${brand.supportEmail} · ${brand.supportPhone}\n${brand.storeName} · ${brand.address}`;
}

function textItems(o: EmailOrder): string {
  return o.items.map((i) => `- ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""} × ${i.quantity} — ${formatMoney(i.total)}`).join("\n");
}

function textTotals(o: EmailOrder): string {
  return [
    `Subtotal: ${formatMoney(o.subtotal)}`,
    o.discount ? `Discount${o.couponCode ? ` (${o.couponCode})` : ""}: -${formatMoney(o.discount)}` : null,
    `Shipping (${o.shippingMethodLabel}): ${o.shipping ? formatMoney(o.shipping) : "Free"}`,
    o.rushFee ? `Rush production: ${formatMoney(o.rushFee)}` : null,
    o.codFee ? `Cash on Delivery fee: ${formatMoney(o.codFee)}` : null,
    o.taxIncluded ? null : `GST: ${formatMoney(o.tax)}`,
    `Total: ${formatMoney(o.total)}${o.taxIncluded && o.tax ? ` (includes ${formatMoney(o.tax)} GST)` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------- templates ----------

export function orderConfirmationEmail(o: EmailOrder, brand: EmailBrand): RenderedEmail {
  const needsReview = o.status === "ARTWORK_REVIEW";
  const url = orderUrl(brand, o);
  const next = needsReview
    ? "Our prepress team will check your artwork for print quality (usually within a few hours). If anything needs a tweak we'll email you; otherwise it goes straight to print."
    : "Your order is queued for production. We'll email you again when it ships.";
  const cod = o.paymentMethod === "cod" && !o.paid;
  const greeting = cod
    ? `thanks for your order! It's confirmed and we're getting started. You'll pay <strong>${esc(formatMoney(o.total))}</strong> in cash or UPI when it's delivered.`
    : "thanks for your order! We've received your payment and we're getting started.";
  const body = `
${p(`Hi ${esc(firstName(o.customerName))}, ${greeting}`)}
${progress(o.status)}
${button(url, "View your order")}
${cod ? noteBox("Cash on Delivery", `Please keep ${esc(formatMoney(o.total))} ready for the delivery partner.`, C.yellow) : ""}
${o.isRush ? noteBox("Rush production", "Your order is flagged for rush production and moves to the front of the queue.", C.magenta) : ""}
${noteBox("What happens next", esc(next))}
${sectionTitle(`Order ${o.number} · ${formatDate(o.createdAt)}`)}
${itemsTable(brand, o.items)}
${totalsTable(o)}
${sectionTitle(o.isPickup ? "Pickup" : "Shipping to")}
${addressBlock(o)}
${o.notes ? noteBox("Your notes", escMultiline(o.notes), C.yellow) : ""}`;
  return {
    subject: `Order confirmed · ${o.number}`,
    html: layout({ brand, preheader: `Thanks for your order! ${o.items.length} item${o.items.length === 1 ? "" : "s"} · ${formatMoney(o.total)}`, eyebrow: "Order confirmed", title: "Thanks — we're on it!", body }),
    text: `Hi ${firstName(o.customerName)}, thanks for your order!${cod ? ` You'll pay ${formatMoney(o.total)} on delivery.` : ""}\n\nOrder ${o.number} (${formatDate(o.createdAt)})\n\n${textItems(o)}\n\n${textTotals(o)}\n\nWhat happens next: ${next}\n\nView your order: ${url}${textFooter(brand)}`,
  };
}

type StatusCopy = { subject: string; title: string; intro: string };

function statusCopy(status: string, o: EmailOrder): StatusCopy {
  switch (status) {
    case "ARTWORK_REVIEW":
      return { subject: "Your artwork is in review", title: "Your artwork is in review", intro: "Our prepress team is checking every file for print quality. We'll let you know if anything needs a tweak." };
    case "IN_PRODUCTION":
      return { subject: "Your order is printing", title: "Your order is on the press", intro: "Your artwork is approved and your order is printing on our production line right now." };
    case "QUALITY_CHECK":
      return { subject: "Final quality check", title: "Final quality check", intro: "Your prints are cured and getting a final hand inspection before packing." };
    case "READY":
      return o.isPickup
        ? { subject: "Ready for pickup", title: "Your order is ready for pickup", intro: `Your order is packed and waiting for you at our studio. Just mention order number ${o.number} at pickup.` }
        : { subject: "Packed and ready to ship", title: "Packed and ready to ship", intro: "Your order is boxed up and waiting for carrier pickup." };
    case "SHIPPED":
      return { subject: "Your order has shipped", title: "Your order is on the way", intro: "Good news, your package has left our studio." };
    case "DELIVERED":
      return {
        subject: "Your order was delivered",
        title: "Delivered. Happy pressing!",
        intro: "Your order was delivered. For DTF transfers, press at 150–160°C (300–315°F) for 10–15 seconds with medium pressure, then peel hot or cold.",
      };
    case "CANCELLED":
      return { subject: "Your order was cancelled", title: "Your order was cancelled", intro: "Your order has been cancelled. If you were charged, the refund goes back to your original payment method." };
    case "REFUNDED":
      return { subject: "Your refund is on its way", title: "Your refund is on its way", intro: "We've issued a refund to your original payment method. It usually reaches your UPI, card or bank account within 5–7 working days." };
    default:
      return { subject: `Order update: ${statusMeta(status).label}`, title: statusMeta(status).label, intro: statusMeta(status).description };
  }
}

export function orderStatusEmail(o: EmailOrder, brand: EmailBrand, opts: { status: string; message?: string | null }): RenderedEmail {
  const copy = statusCopy(opts.status, o);
  const url = orderUrl(brand, o);
  const reviewSlug = o.items.find((i) => i.productSlug)?.productSlug;
  const reviewUrl = opts.status === "DELIVERED" && reviewSlug ? absoluteUrl(brand.siteUrl, `/products/${reviewSlug}#reviews`) : null;
  const body = `
${p(`Hi ${esc(firstName(o.customerName))}, ${esc(copy.intro)}`)}
${progress(opts.status)}
${opts.status === "SHIPPED" ? trackingBlock(o) : ""}
${opts.message ? noteBox("A note from our team", escMultiline(opts.message)) : ""}
${button(opts.status === "SHIPPED" && o.trackingUrl ? o.trackingUrl : url, opts.status === "SHIPPED" && o.trackingUrl ? "Track your package" : "View your order")}
${reviewUrl ? p(`Loved your prints? <a href="${esc(reviewUrl)}" style="color:${C.primary};font-weight:600">Leave a quick review</a>. It helps other makers find us.`) : ""}
${sectionTitle(`Order ${o.number}`)}
${itemsTable(brand, o.items)}`;
  return {
    subject: `${copy.subject} · ${o.number}`,
    html: layout({ brand, preheader: copy.intro, eyebrow: `Order ${o.number}`, title: copy.title, body }),
    text: `Hi ${firstName(o.customerName)}, ${copy.intro}${opts.message ? `\n\nA note from our team: ${opts.message}` : ""}${
      opts.status === "SHIPPED" && o.trackingNumber ? `\n\nTracking: ${o.carrier ?? ""} ${o.trackingNumber}${o.trackingUrl ? `\n${o.trackingUrl}` : ""}` : ""
    }\n\nOrder ${o.number}\n${textItems(o)}\n\nView your order: ${url}${textFooter(brand)}`,
  };
}

export function artworkChangesEmail(o: EmailOrder, brand: EmailBrand, opts: { itemName: string; note: string }): RenderedEmail {
  const contactUrl = absoluteUrl(brand.siteUrl, `/contact?order=${encodeURIComponent(o.number)}`);
  const body = `
${p(`Hi ${esc(firstName(o.customerName))}, our prepress team reviewed the artwork for <strong>${esc(opts.itemName)}</strong> and it needs a small change before we can print it. Your order is on hold until we hear back.`)}
${noteBox("What needs to change", escMultiline(opts.note), C.magenta)}
${p("Reply to this email with an updated file (a transparent PNG at 300 DPI works best), or send it through our contact form. We'll get it printing as soon as it's in.")}
${button(contactUrl, "Send updated artwork", C.magenta)}
${p(`<a href="${esc(orderUrl(brand, o))}" style="color:${C.primary};font-weight:600">View order ${esc(o.number)}</a>`)}`;
  return {
    subject: `Action needed: artwork changes for ${o.number}`,
    html: layout({ brand, preheader: `Your artwork for ${opts.itemName} needs a quick change before printing.`, eyebrow: "Action needed", title: "Your artwork needs a quick change", body }),
    text: `Hi ${firstName(o.customerName)}, the artwork for ${opts.itemName} (order ${o.number}) needs a change before we can print it.\n\nWhat needs to change:\n${opts.note}\n\nReply to this email with an updated file, or use ${contactUrl}${textFooter(brand)}`,
  };
}

export function orderUpdateEmail(o: EmailOrder, brand: EmailBrand, opts: { message: string; author: string }): RenderedEmail {
  const body = `
${p(`Hi ${esc(firstName(o.customerName))}, there's an update on order <strong>${esc(o.number)}</strong>:`)}
${noteBox(`From ${opts.author}`, escMultiline(opts.message))}
${button(orderUrl(brand, o), "View your order")}`;
  return {
    subject: `Update on your order ${o.number}`,
    html: layout({ brand, preheader: opts.message.slice(0, 120), eyebrow: `Order ${o.number}`, title: "An update on your order", body }),
    text: `Hi ${firstName(o.customerName)}, there's an update on order ${o.number}:\n\n${opts.message}\n— ${opts.author}\n\nView your order: ${orderUrl(brand, o)}${textFooter(brand)}`,
  };
}

export function adminNewOrderEmail(o: EmailOrder, brand: EmailBrand, opts: { adminUrl: string }): RenderedEmail {
  const artwork = o.items.filter((i) => i.artworkStatus === "PENDING").length;
  const body = `
${p(`<strong>${esc(o.customerName)}</strong> (<a href="mailto:${esc(o.email)}" style="color:${C.primary}">${esc(o.email)}</a>${o.phone ? ` · ${esc(o.phone)}` : ""}) placed an order for <strong>${formatMoney(o.total)}</strong>.`)}
${o.isRush ? noteBox("Rush order", "The customer paid for rush production. Prioritize this one.", C.magenta) : ""}
${artwork ? noteBox("Artwork review", `${artwork} item${artwork === 1 ? "" : "s"} waiting for prepress review.`, C.yellow) : ""}
${o.notes ? noteBox("Customer notes", escMultiline(o.notes)) : ""}
${button(opts.adminUrl, "Open in admin")}
${sectionTitle(`Order ${o.number} · ${o.shippingMethodLabel}`)}
${itemsTable(brand, o.items)}
${totalsTable(o)}
${sectionTitle(o.isPickup ? "Pickup" : "Ship to")}
${addressBlock(o)}`;
  return {
    subject: `${o.isRush ? "[RUSH] " : ""}New order ${o.number} · ${formatMoney(o.total)} · ${o.customerName}`,
    html: layout({ brand, preheader: `${o.items.length} item${o.items.length === 1 ? "" : "s"} · ${o.shippingMethodLabel}`, eyebrow: "New order", title: `New order ${o.number}`, body, footerNote: "You get this because new-order alerts are on in Admin → Settings." }),
    text: `New order ${o.number} from ${o.customerName} <${o.email}> · ${formatMoney(o.total)}${o.isRush ? " · RUSH" : ""}\n\n${textItems(o)}\n\n${textTotals(o)}\n\nOpen in admin: ${opts.adminUrl}`,
  };
}

export function testEmail(brand: EmailBrand, opts: { mode: string }): RenderedEmail {
  const body = `
${p(`This is a test email from <strong>${esc(brand.storeName)}</strong>. If you can read this, order notifications are working.`)}
${noteBox("Delivery", esc(opts.mode))}
${button(absoluteUrl(brand.siteUrl, "/admin/settings"), "Back to settings")}`;
  return {
    subject: `Test email from ${brand.storeName}`,
    html: layout({ brand, preheader: "Your email notifications are set up.", eyebrow: "Test", title: "Email is working 🎉", body }),
    text: `This is a test email from ${brand.storeName}. Delivery: ${opts.mode}`,
  };
}

export function passwordResetEmail(brand: EmailBrand, opts: { name: string; url: string; minutes: number }): RenderedEmail {
  const body = `
${p(`Hi ${esc(firstName(opts.name))}, we got a request to reset the password for your ${esc(brand.storeName)} account.`)}
${button(opts.url, "Choose a new password")}
${p(`This link works once and expires in ${opts.minutes} minutes.`)}
${noteBox("Didn't ask for this?", "You can safely ignore this email. Your password won't change unless you open the link and choose a new one.", C.cyan)}
<p style="margin:20px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};word-break:break-all">If the button doesn't work, paste this link into your browser:<br><a href="${esc(opts.url)}" style="color:${C.primary}">${esc(opts.url)}</a></p>`;
  return {
    subject: `Reset your ${brand.storeName} password`,
    html: layout({ brand, preheader: `Use this link within ${opts.minutes} minutes to choose a new password.`, eyebrow: "Account security", title: "Reset your password", body }),
    text: `Hi ${firstName(opts.name)}, we got a request to reset your ${brand.storeName} password.\n\nChoose a new password (link expires in ${opts.minutes} minutes, works once):\n${opts.url}\n\nDidn't ask for this? Ignore this email. Your password won't change.${textFooter(brand)}`,
  };
}

export function passwordChangedEmail(brand: EmailBrand, opts: { name: string; when: Date; via: "reset" | "account"; forgotUrl: string }): RenderedEmail {
  // dateStyle/timeStyle can't be combined with timeZoneName, so spell the fields out.
  const when = opts.when.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const how = opts.via === "reset" ? "using a password reset link" : "from your account settings";
  const body = `
${p(`Hi ${esc(firstName(opts.name))}, the password for your ${esc(brand.storeName)} account was changed ${how} on <strong>${esc(when)}</strong>.`)}
${p("For your security, you've been signed out on your other devices.")}
${noteBox("Wasn't you?", `Reset your password right away and contact us at <a href="mailto:${esc(brand.supportEmail)}" style="color:${C.primary}">${esc(brand.supportEmail)}</a>.`, C.magenta)}
${button(opts.forgotUrl, "Reset password", C.magenta)}`;
  return {
    subject: `Your ${brand.storeName} password was changed`,
    html: layout({ brand, preheader: "If this wasn't you, reset your password now.", eyebrow: "Account security", title: "Your password was changed", body }),
    text: `Hi ${firstName(opts.name)}, the password for your ${brand.storeName} account was changed ${how} on ${when}. You've been signed out on other devices.\n\nWasn't you? Reset it now: ${opts.forgotUrl} and contact ${brand.supportEmail}.${textFooter(brand)}`,
  };
}

export const EMAIL_TEMPLATE_LABELS: Record<string, string> = {
  order_confirmation: "Order confirmation",
  order_status: "Status update",
  artwork_changes: "Artwork changes",
  order_update: "Team update",
  admin_new_order: "New order alert",
  password_reset: "Password reset",
  password_changed: "Password changed",
  test: "Test email",
};
