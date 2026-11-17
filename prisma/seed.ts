import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { DEFAULT_SETTINGS, DEFAULT_TIERS, computeTotals, priceLine } from "../src/lib/pricing";
import type { LineSelection, PriceTier, ProductOptions, PricingProduct } from "../src/lib/types";

const db = new PrismaClient();

// Deterministic PRNG so demo data is stable between resets.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));

const img = (f: string) => `/images/products/${f}`;
const J = (v: unknown) => JSON.stringify(v);

const transferFinishes = [
  { id: "standard", label: "Standard", price: 0, description: "Vivid full-color DTF" },
  { id: "glitter", label: "Glitter", price: 100, description: "Sparkle flake top layer" },
  { id: "glow", label: "Glow in the dark", price: 150, description: "Charges in light, glows green" },
];
const sq = (w: number, h: number, price: number) => ({ id: `${w}x${h}`, label: `${w}" × ${h}"`, width: w, height: h, price });
const gang = (h: number, price: number) => ({ id: `22x${h}`, label: `22" × ${h}"`, width: 22, height: h, price });

const apparelSizes = [
  { size: "XS", upcharge: 0 },
  { size: "S", upcharge: 0 },
  { size: "M", upcharge: 0 },
  { size: "L", upcharge: 0 },
  { size: "XL", upcharge: 0 },
  { size: "2XL", upcharge: 200 },
  { size: "3XL", upcharge: 300 },
];
const printLocations = [
  { id: "front", label: "Full front", price: 550 },
  { id: "back", label: "Full back", price: 550 },
  { id: "left-chest", label: "Left chest", price: 350 },
  { id: "sleeve", label: "Sleeve", price: 300 },
];
const colors = [
  { name: "White", hex: "#F7F7F5" },
  { name: "Black", hex: "#1C1C22" },
  { name: "Heather Grey", hex: "#A9ABB2" },
  { name: "Navy", hex: "#1F2A4A" },
  { name: "Royal", hex: "#2F55C9" },
  { name: "Forest", hex: "#24483A" },
  { name: "Maroon", hex: "#6A1F2E" },
  { name: "Sand", hex: "#D9C7A7" },
];
const gangTiers: PriceTier[] = [
  { minQty: 1, discountPct: 0 },
  { minQty: 3, discountPct: 5 },
  { minQty: 5, discountPct: 10 },
  { minQty: 10, discountPct: 15 },
];
const apparelTiers: PriceTier[] = [
  { minQty: 1, discountPct: 0 },
  { minQty: 12, discountPct: 10 },
  { minQty: 24, discountPct: 15 },
  { minQty: 48, discountPct: 20 },
  { minQty: 100, discountPct: 25 },
];

type SeedProduct = {
  name: string;
  slug: string;
  sku: string;
  type: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  basePrice: number;
  compareAtPrice?: number;
  options: ProductOptions;
  tiers: PriceTier[];
  features: string[];
  badge?: string;
  turnaround?: string;
  stock?: number;
  featured?: boolean;
};

const categories = [
  { name: "DTF Transfers", slug: "dtf-transfers", description: "Full-color direct-to-film transfers in any size. Press onto cotton, poly, blends and more.", image: img("dtf-transfers.svg") },
  { name: "Gang Sheets", slug: "gang-sheets", description: "Pack as many designs as you like onto a 22\" wide sheet. Build online or upload a print-ready file.", image: img("gang-sheet.svg") },
  { name: "UV DTF", slug: "uv-dtf", description: "Peel-and-stick UV DTF decals for tumblers, glass, metal, wood and more. No heat press needed.", image: img("uv-dtf-stickers.svg") },
  { name: "Screen Print Transfers", slug: "screen-print-transfers", description: "Plastisol screen print transfers for high-volume runs with a classic hand feel.", image: img("screen-print.svg") },
  { name: "Custom Apparel", slug: "custom-apparel", description: "Premium blanks printed and pressed for you. Tees, hoodies and crewnecks with no minimums.", image: img("tee-black.svg") },
  { name: "Supplies", slug: "supplies", description: "Pressing essentials: teflon sheets, pillows, heat tape and more.", image: img("supplies-pillow.svg") },
];

const products: SeedProduct[] = [
  {
    name: "Custom DTF Transfers by Size",
    slug: "custom-dtf-transfers",
    sku: "DTF-SIZE",
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Upload any design and pick a size. Vibrant, stretchy, wash-tested transfers ready to press.",
    description:
      "Our flagship direct-to-film transfers are printed on premium PET film with eco-friendly water-based inks and a hot-melt adhesive powder. They press onto cotton, polyester, blends, canvas, denim and more — light or dark garments, no weeding required.\n\nEvery transfer is cured and quality-checked before shipping. Simply press at 300–315°F for 10–15 seconds with medium pressure, then peel hot or cold.",
    images: [img("dtf-transfers.svg"), img("tee-white.svg"), img("tee-black.svg")],
    basePrice: 149,
    options: {
      requiresArtwork: true,
      sizes: [sq(3, 3, 149), sq(4, 4, 199), sq(5, 5, 279), sq(6, 6, 349), sq(8, 8, 499), sq(10, 10, 649), sq(11, 11, 749), sq(12, 12, 899), sq(12, 17, 1199)],
      finishes: transferFinishes,
    },
    tiers: DEFAULT_TIERS,
    features: ["Prints on light & dark fabrics", "No weeding, no cutting", "50+ wash durability", "Hot or cold peel"],
    badge: "Best seller",
    turnaround: "Ships in 24 hours",
    featured: true,
  },
  {
    name: "Left Chest & Pocket Transfers",
    slug: "left-chest-dtf-transfers",
    sku: "DTF-LC",
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Small-format transfers perfect for logos, pocket prints, hats and sleeves.",
    description:
      "Built for brands and uniform programs. Left chest transfers keep fine detail crisp at small sizes and press perfectly on polos, hats, totes and sleeves.",
    images: [img("dtf-left-chest.svg"), img("tee-oversized.svg")],
    basePrice: 89,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 89), sq(3, 3, 119), sq(3.5, 3.5, 139), sq(4, 4, 159)], finishes: transferFinishes.slice(0, 2) },
    tiers: DEFAULT_TIERS,
    features: ["Crisp detail down to 0.5pt lines", "Great for hats & polos", "Bulk pricing from 10 pcs"],
    turnaround: "Ships in 24 hours",
  },
  {
    name: "Glitter DTF Transfers",
    slug: "glitter-dtf-transfers",
    sku: "DTF-GLT",
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Full-color prints with a dazzling glitter top coat. Built to turn heads.",
    description: "A sparkle flake layer is fused over your full-color print, giving every design a premium shimmer that survives the wash.",
    images: [img("dtf-glitter.svg"), img("tee-black.svg")],
    basePrice: 249,
    compareAtPrice: 299,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 249), sq(6, 6, 449), sq(8, 8, 599), sq(10, 10, 799), sq(12, 12, 1049)] },
    tiers: DEFAULT_TIERS,
    features: ["Holographic sparkle finish", "Soft, flexible hand", "Works on cotton & poly"],
    badge: "New",
    turnaround: "Ships in 48 hours",
    featured: true,
  },
  {
    name: "Glow-in-the-Dark DTF Transfers",
    slug: "glow-dtf-transfers",
    sku: "DTF-GLW",
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Charges in light and glows vivid green in the dark. Perfect for events & Halloween.",
    description: "Luminous pigment layered behind your print for a design that pops by day and glows at night.",
    images: [img("dtf-glow.svg")],
    basePrice: 299,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 299), sq(6, 6, 499), sq(8, 8, 649), sq(10, 10, 849), sq(12, 12, 1099)] },
    tiers: DEFAULT_TIERS,
    features: ["Glows up to 4 hours", "Full-color daytime print", "Great for events"],
    turnaround: "Ships in 48 hours",
  },
  {
    name: "Neck Label Transfers",
    slug: "neck-label-transfers",
    sku: "DTF-NECK",
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Tagless neck labels for your clothing brand — size, care and logo in one press.",
    description: "Ditch scratchy tags. Brand-ready neck labels printed with fine detail and a soft, flexible hand.",
    images: [img("dtf-neck-label.svg")],
    basePrice: 59,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 59), { id: "3x2", label: '3" × 2"', width: 3, height: 2, price: 69 }, sq(3, 3, 79)] },
    tiers: [
      { minQty: 1, discountPct: 0 },
      { minQty: 50, discountPct: 15 },
      { minQty: 100, discountPct: 25 },
      { minQty: 250, discountPct: 35 },
    ],
    features: ["Tagless comfort", "Great for private label", "Min. order 25 recommended"],
    turnaround: "Ships in 24 hours",
  },
  {
    name: "DTF Gang Sheet Builder",
    slug: "dtf-gang-sheet",
    sku: "GANG-DTF",
    type: "GANG_SHEET",
    category: "gang-sheets",
    shortDescription: "Pack unlimited designs onto one 22\" wide sheet. Build it online with auto-nesting or upload your file.",
    description:
      "The most cost-effective way to print DTF. Arrange as many designs as fit on a 22\" wide sheet — mix sizes, colors and logos freely. Use our online builder with smart auto-pack and DPI checks, or upload a print-ready 300 DPI transparent PNG.",
    images: [img("gang-sheet.svg"), img("dtf-transfers.svg")],
    basePrice: 699,
    options: {
      requiresArtwork: true,
      sizes: [gang(12, 699), gang(24, 1199), gang(36, 1699), gang(48, 2199), gang(60, 2699), gang(84, 3699), gang(120, 4999), gang(180, 7299), gang(240, 9499)],
    },
    tiers: gangTiers,
    features: ["Unlimited designs per sheet", "Smart auto-pack builder", "Live DPI quality check", "Same-day production before 2pm"],
    badge: "Most popular",
    turnaround: "Same-day production",
    featured: true,
  },
  {
    name: "Upload a Print-Ready Gang Sheet",
    slug: "upload-gang-sheet",
    sku: "GANG-UPL",
    type: "GANG_SHEET",
    category: "gang-sheets",
    shortDescription: "Already have a 22\" wide print-ready file? Upload it and we print it exactly as-is.",
    description: "For designers with a finished layout. Upload a transparent PNG at 300 DPI, 22\" wide. We print it as supplied with no changes.",
    images: [img("gang-sheet-upload.svg")],
    basePrice: 699,
    options: {
      requiresArtwork: true,
      sizes: [gang(12, 699), gang(24, 1199), gang(36, 1699), gang(48, 2199), gang(60, 2699), gang(84, 3699), gang(120, 4999), gang(180, 7299), gang(240, 9499)],
    },
    tiers: gangTiers,
    features: ["Printed exactly as supplied", "Transparent PNG at 300 DPI", "Up to 22\" × 240\""],
    turnaround: "Same-day production",
  },
  {
    name: "UV DTF Gang Sheet",
    slug: "uv-dtf-gang-sheet",
    sku: "GANG-UV",
    type: "UV_DTF",
    category: "gang-sheets",
    shortDescription: "Gang your UV DTF decals for tumblers, glass and hard goods on one sheet.",
    description: "Waterproof, scratch-resistant UV DTF decals with a raised, glossy finish. Apply by hand — no heat press required.",
    images: [img("uv-dtf-gang-sheet.svg"), img("uv-cup-wrap.svg")],
    basePrice: 1299,
    options: { requiresArtwork: true, sizes: [gang(12, 1299), gang(24, 2299), gang(36, 3199), gang(48, 3999), gang(60, 4799)] },
    tiers: gangTiers,
    features: ["Dishwasher-safe (top rack)", "Raised glossy texture", "Sticks to glass, metal, wood"],
    turnaround: "Ships in 48 hours",
    featured: true,
  },
  {
    name: "UV DTF Stickers",
    slug: "uv-dtf-stickers",
    sku: "UV-STK",
    type: "UV_DTF",
    category: "uv-dtf",
    shortDescription: "Rub-on decals that bond to almost any hard surface — waterproof and scratch resistant.",
    description: "Perfect for tumblers, laptops, phone cases, signage and packaging. Peel, place, rub and reveal.",
    images: [img("uv-dtf-stickers.svg"), img("uv-cup-wrap.svg")],
    basePrice: 129,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 129), sq(3, 3, 179), sq(4, 4, 249), sq(5, 5, 329), sq(6, 6, 399)] },
    tiers: DEFAULT_TIERS,
    features: ["No heat press needed", "Waterproof & UV resistant", "Raised glossy finish"],
    turnaround: "Ships in 48 hours",
  },
  {
    name: "UV DTF Cup Wraps",
    slug: "uv-dtf-cup-wraps",
    sku: "UV-WRAP",
    type: "UV_DTF",
    category: "uv-dtf",
    shortDescription: "Full wraps sized for 16oz glass cans and 20oz / 40oz tumblers.",
    description: "Sized-to-fit wraps with alignment marks for a seamless finish on popular cups.",
    images: [img("uv-cup-wrap.svg")],
    basePrice: 499,
    options: {
      requiresArtwork: true,
      sizes: [
        { id: "16oz", label: "16oz glass can (9.5\" × 4.3\")", width: 9.5, height: 4.3, price: 499 },
        { id: "20oz", label: "20oz tumbler (9.3\" × 8.2\")", width: 9.3, height: 8.2, price: 699 },
        { id: "40oz", label: "40oz tumbler (11\" × 7.5\")", width: 11, height: 7.5, price: 799 },
      ],
    },
    tiers: DEFAULT_TIERS,
    features: ["Pre-sized templates", "Alignment marks included", "Top-rack dishwasher safe"],
    turnaround: "Ships in 48 hours",
  },
  {
    name: "Screen Print Transfers — Plastisol",
    slug: "screen-print-transfers",
    sku: "SP-PLAST",
    type: "SCREEN_PRINT",
    category: "screen-print-transfers",
    shortDescription: "Classic plastisol transfers for large runs. 1–3 spot colors, unbeatable price at volume.",
    description: "Ideal for teams, events and merch drops. Choose up to 3 spot colors and press with a classic, durable screen print feel.",
    images: [img("screen-print.svg")],
    basePrice: 99,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 99), sq(8, 8, 149), sq(11, 11, 199), sq(12, 14, 249)] },
    tiers: [
      { minQty: 12, discountPct: 0 },
      { minQty: 50, discountPct: 20 },
      { minQty: 100, discountPct: 35 },
      { minQty: 250, discountPct: 50 },
    ],
    features: ["Minimum 12 pieces", "Up to 3 spot colors", "Classic screen print hand"],
    turnaround: "Ships in 5 business days",
  },
  {
    name: "Puff Screen Print Transfers",
    slug: "puff-screen-print-transfers",
    sku: "SP-PUFF",
    type: "SCREEN_PRINT",
    category: "screen-print-transfers",
    shortDescription: "Raised 3D puff ink that expands under heat for a bold, textured look.",
    description: "On-trend puff print with dimensional texture. Best for bold logos and lettering.",
    images: [img("screen-print-puff.svg")],
    basePrice: 149,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 149), sq(8, 8, 219), sq(11, 11, 289)] },
    tiers: [
      { minQty: 12, discountPct: 0 },
      { minQty: 50, discountPct: 20 },
      { minQty: 100, discountPct: 30 },
    ],
    features: ["3D raised texture", "Minimum 12 pieces", "1 spot color"],
    badge: "Trending",
    turnaround: "Ships in 5 business days",
  },
  {
    name: "Premium Heavyweight Tee",
    slug: "premium-heavyweight-tee",
    sku: "APP-TEE-HW",
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "6.5oz ring-spun cotton tee, printed & pressed by us. Design it in the studio.",
    description: "A structured, boxy-fit heavyweight tee with a premium hand feel. We print your design with DTF and press it in-house, then fold and bag every piece.",
    images: [img("tee-white.svg"), img("tee-black.svg")],
    basePrice: 999,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["6.5oz 100% ring-spun cotton", "Pre-shrunk, garment-dyed look", "Printed & pressed in-house", "No minimums"],
    badge: "Best seller",
    turnaround: "Ships in 3 business days",
    featured: true,
  },
  {
    name: "Oversized Boxy Tee",
    slug: "oversized-boxy-tee",
    sku: "APP-TEE-OS",
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Drop-shoulder streetwear fit in a 7oz cotton jersey.",
    description: "A modern oversized silhouette with a dropped shoulder and thick ribbed collar — made for merch drops.",
    images: [img("tee-oversized.svg")],
    basePrice: 1399,
    options: { colors: colors.filter((c) => ["White", "Black", "Sand", "Forest", "Heather Grey"].includes(c.name)), apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["7oz cotton jersey", "Drop shoulder fit", "Thick ribbed collar"],
    badge: "New",
    turnaround: "Ships in 3 business days",
  },
  {
    name: "Classic Pullover Hoodie",
    slug: "classic-pullover-hoodie",
    sku: "APP-HOOD",
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Cozy 9oz fleece hoodie with kangaroo pocket. Custom printed front & back.",
    description: "Midweight brushed fleece with a lined hood, matching drawcords and kangaroo pocket.",
    images: [img("hoodie.svg")],
    basePrice: 2499,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["9oz brushed fleece", "Lined hood", "Kangaroo pocket"],
    turnaround: "Ships in 4 business days",
    featured: true,
  },
  {
    name: "Everyday Crewneck Sweatshirt",
    slug: "everyday-crewneck",
    sku: "APP-CREW",
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Soft fleece crewneck that holds a print beautifully.",
    description: "A versatile 8oz fleece crewneck with ribbed cuffs and waistband.",
    images: [img("crewneck.svg")],
    basePrice: 1999,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["8oz fleece", "Ribbed cuffs & hem", "Unisex fit"],
    turnaround: "Ships in 4 business days",
  },
  {
    name: "Teflon Sheets (3-Pack)",
    slug: "teflon-sheets-3-pack",
    sku: "SUP-PTFE",
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Reusable 16\" × 20\" PTFE sheets protect your prints and press.",
    description: "Non-stick, heat-resistant sheets for clean, even pressing.",
    images: [img("supplies-teflon.svg")],
    basePrice: 1299,
    options: { sizes: [{ id: "pack", label: "3-pack · 16\" × 20\"", width: 16, height: 20, price: 1299 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }, { minQty: 3, discountPct: 10 }],
    features: ["Reusable hundreds of times", "Up to 500°F", "Non-stick"],
    stock: 120,
  },
  {
    name: "Heat Press Pillow 15\" × 15\"",
    slug: "heat-press-pillow",
    sku: "SUP-PILLOW",
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Even out pressure over seams, zippers and buttons.",
    description: "A dense foam pillow wrapped in heat-resistant fabric for perfect pressure on uneven garments.",
    images: [img("supplies-pillow.svg")],
    basePrice: 1899,
    options: { sizes: [{ id: "15x15", label: '15" × 15"', width: 15, height: 15, price: 1899 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }],
    features: ["Heat resistant to 450°F", "Fixes seam pressure issues"],
    stock: 38,
  },
  {
    name: "Heat Resistant Tape",
    slug: "heat-resistant-tape",
    sku: "SUP-TAPE",
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Keeps transfers exactly where you put them. Leaves no residue.",
    description: "10mm × 33m roll of polyimide tape.",
    images: [img("supplies-tape.svg")],
    basePrice: 699,
    options: { sizes: [{ id: "roll", label: "10mm × 33m roll", width: 0.4, height: 1300, price: 699 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }, { minQty: 5, discountPct: 15 }],
    features: ["No residue", "Heat resistant"],
    stock: 4,
  },
];

const firstNames = ["Ava", "Liam", "Mia", "Noah", "Zoe", "Ethan", "Chloe", "Lucas", "Maya", "Leo", "Aria", "Jonah", "Priya", "Diego", "Sofia", "Marcus", "Hana", "Omar", "Ivy", "Caleb", "Nina", "Theo", "Layla", "Andre", "Ruby", "Kai"];
const lastNames = ["Carter", "Nguyen", "Patel", "Rivera", "Brooks", "Kim", "Okafor", "Silva", "Bennett", "Hughes", "Reyes", "Shah", "Foster", "Ward", "Lopez", "Grant", "Price", "Hayes"];
const companies = ["Bold Thread Co.", "Northside Athletics", "Lucky Ink Studio", "Wildflower Boutique", "Peak Supply", "Ridge Runners FC", "Sunday Club", null, null, null, null];
const cities = [
  ["Austin", "TX", "78701"], ["Denver", "CO", "80202"], ["Nashville", "TN", "37203"], ["Phoenix", "AZ", "85004"], ["Portland", "OR", "97205"],
  ["Atlanta", "GA", "30303"], ["Chicago", "IL", "60607"], ["Miami", "FL", "33130"], ["Seattle", "WA", "98101"], ["Brooklyn", "NY", "11211"],
] as const;
const streets = ["Maple Ave", "Oak St", "Sunset Blvd", "Market St", "Pine Rd", "Cedar Ln", "River Dr", "Elm St"];

const reviewTexts: [number, string, string][] = [
  [5, "Colors are insane", "Printed a full gang sheet for our merch drop and the colors came out brighter than my screen. Pressed 60 shirts, zero lifting."],
  [5, "Fastest turnaround I've found", "Ordered at 11am, shipped the same day. The builder's auto-pack saved me so much film."],
  [5, "Super soft hand", "These transfers feel like part of the shirt. Customers keep asking if it's screen printed."],
  [4, "Great quality, small learning curve", "Took me one test press to dial in my settings, after that every single one was perfect."],
  [5, "Wash test passed", "Washed my test tee 40 times. Still looks brand new, no cracking."],
  [4, "Love the DPI checker", "The builder warned me one of my logos was low-res before I ordered. Saved me a reprint."],
  [5, "Our go-to print partner", "We run a small boutique and order weekly. Consistent quality and the support team is great."],
  [3, "Good, shipping was slow", "Prints are great but standard shipping took 6 days to Oregon. Will choose express next time."],
  [5, "Glitter is next level", "The glitter finish photographs beautifully. Sold out our whole run in a weekend."],
  [5, "Perfect for team uniforms", "Ordered 48 hoodies with names on the back. Everything was correct and packed by size."],
];

/**
 * Demo passwords are only used for local databases. On any remote database (e.g. Vercel
 * Postgres) the admin password must come from SEED_ADMIN_PASSWORD, and the demo staff/customer
 * accounts get random passwords unless SEED_STAFF_PASSWORD / SEED_CUSTOMER_PASSWORD are set.
 */
function resolvePasswords() {
  const url = process.env.DATABASE_URL ?? "";
  const local = url.startsWith("file:") || /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
  const random = () => randomBytes(24).toString("base64url");
  if (local) {
    return { local, admin: "Admin@12345", staff: "Staff@12345", customer: "Customer@123" };
  }
  const admin = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (admin.length < 12) {
    throw new Error("Refusing to seed a remote database without SEED_ADMIN_PASSWORD (12+ characters).");
  }
  return { local, admin, staff: process.env.SEED_STAFF_PASSWORD || random(), customer: process.env.SEED_CUSTOMER_PASSWORD || random() };
}

async function main() {
  const onlyIfEmpty = process.argv.includes("--if-empty");
  if (onlyIfEmpty) {
    const existing = await db.user.count();
    if (existing > 0) {
      console.log(`Seed skipped: database already has ${existing} user(s).`);
      return;
    }
  }
  const pw = resolvePasswords();
  console.log("Resetting data…");
  await db.$transaction([
    db.emailLog.deleteMany(),
    db.passwordResetToken.deleteMany(),
    db.orderEvent.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.review.deleteMany(),
    db.wishlistItem.deleteMany(),
    db.savedDesign.deleteMany(),
    db.address.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.coupon.deleteMany(),
    db.user.deleteMany(),
    db.setting.deleteMany(),
    db.newsletterSubscriber.deleteMany(),
    db.contactMessage.deleteMany(),
  ]);

  await db.setting.create({ data: { key: "store", value: J(DEFAULT_SETTINGS) } });

  console.log("Users…");
  const admin = await db.user.create({
    data: { email: "admin@inkforge.test", name: "Jordan Admin", role: "ADMIN", passwordHash: await bcrypt.hash(pw.admin, 10), company: "InkForge" },
  });
  await db.user.create({
    data: { email: "production@inkforge.test", name: "Sam Production", role: "STAFF", passwordHash: await bcrypt.hash(pw.staff, 10), company: "InkForge" },
  });
  const demo = await db.user.create({
    data: {
      email: "customer@inkforge.test",
      name: "Riley Customer",
      role: "CUSTOMER",
      passwordHash: await bcrypt.hash(pw.customer, 10),
      company: "Riley's Print Shop",
      phone: "(512) 555-0199",
      marketingOptIn: true,
      addresses: {
        create: [
          { label: "Studio", name: "Riley Customer", company: "Riley's Print Shop", line1: "418 Congress Ave", line2: "Unit 2", city: "Austin", state: "TX", zip: "78701", country: "US", phone: "(512) 555-0199", isDefault: true },
          { label: "Home", name: "Riley Customer", line1: "77 Lakeview Dr", city: "Round Rock", state: "TX", zip: "78664", country: "US" },
        ],
      },
    },
  });

  const customerHash = await bcrypt.hash(pw.customer, 10);
  const customers = [demo];
  for (let i = 0; i < 34; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const created = new Date(Date.now() - between(5, 200) * 86400000);
    customers.push(
      await db.user.create({
        data: {
          email: `${first}.${last}${i}@example.com`.toLowerCase(),
          name: `${first} ${last}`,
          passwordHash: customerHash,
          company: pick(companies),
          marketingOptIn: rand() > 0.5,
          createdAt: created,
        },
      })
    );
  }

  console.log("Catalog…");
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const row = await db.category.create({ data: { ...c, sortOrder: i } });
    catIds[c.slug] = row.id;
  }
  const productRows: { id: string; p: SeedProduct }[] = [];
  for (const [i, p] of products.entries()) {
    const row = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        type: p.type,
        categoryId: catIds[p.category],
        shortDescription: p.shortDescription,
        description: p.description,
        images: J(p.images),
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice ?? null,
        options: J(p.options),
        tiers: J(p.tiers),
        features: J(p.features),
        badge: p.badge ?? null,
        turnaround: p.turnaround ?? null,
        stock: p.stock ?? null,
        featured: !!p.featured,
        sortOrder: i,
        createdAt: new Date(Date.now() - (products.length - i) * 86400000 * 6),
      },
    });
    productRows.push({ id: row.id, p });
  }

  console.log("Reviews…");
  for (const { id, p } of productRows) {
    const n = p.type === "SUPPLIES" ? between(1, 3) : between(3, 8);
    for (let i = 0; i < n; i++) {
      const [rating, title, body] = pick(reviewTexts);
      const u = pick(customers);
      await db.review.create({
        data: {
          productId: id,
          userId: u.id,
          name: u.name,
          rating,
          title,
          body,
          status: rand() > 0.12 ? "APPROVED" : "PENDING",
          createdAt: new Date(Date.now() - between(1, 150) * 86400000),
        },
      });
    }
  }

  console.log("Coupons…");
  const now = Date.now();
  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", description: "10% off your first order", type: "PERCENT", value: 10, minSubtotal: 0, usedCount: 38 },
      { code: "FREESHIP", description: "Free standard shipping", type: "FREE_SHIPPING", value: 0, minSubtotal: 3000, usedCount: 112 },
      { code: "BULK25", description: "$25 off orders over $200", type: "FIXED", value: 2500, minSubtotal: 20000, usedCount: 17, maxUses: 500 },
      { code: "GANG15", description: "15% off gang sheets", type: "PERCENT", value: 15, minSubtotal: 5000, usedCount: 9, expiresAt: new Date(now + 20 * 86400000) },
      { code: "SUMMER20", description: "Summer sale (expired)", type: "PERCENT", value: 20, minSubtotal: 0, usedCount: 204, active: false, expiresAt: new Date(now - 60 * 86400000) },
    ],
  });

  console.log("Orders…");
  const statusesByAge = (days: number) => {
    if (days > 20) return rand() > 0.06 ? "DELIVERED" : pick(["CANCELLED", "REFUNDED"]);
    if (days > 10) return pick(["DELIVERED", "DELIVERED", "SHIPPED"]);
    if (days > 4) return pick(["SHIPPED", "SHIPPED", "READY", "DELIVERED"]);
    if (days > 1) return pick(["IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED"]);
    return pick(["ARTWORK_REVIEW", "ARTWORK_REVIEW", "IN_PRODUCTION", "PENDING"]);
  };
  const flow = ["PENDING", "ARTWORK_REVIEW", "IN_PRODUCTION", "QUALITY_CHECK", "READY", "SHIPPED", "DELIVERED"];
  const eventMsg: Record<string, string> = {
    PENDING: "Order placed",
    ARTWORK_REVIEW: "Payment received — artwork sent to prepress review",
    IN_PRODUCTION: "Artwork approved and queued for printing",
    QUALITY_CHECK: "Printed and cured — quality check in progress",
    READY: "Packed and ready for carrier pickup",
    SHIPPED: "Shipped via UPS Ground",
    DELIVERED: "Delivered",
    CANCELLED: "Order cancelled at customer request",
    REFUNDED: "Payment refunded",
  };

  const coupons = await db.coupon.findMany();
  let orderNo = 10000;
  const TOTAL_ORDERS = 160;
  for (let i = 0; i < TOTAL_ORDERS; i++) {
    // Skew toward recent days so charts trend upward.
    const days = Math.floor(Math.pow(rand(), 1.6) * 120);
    const createdAt = new Date(now - days * 86400000 - between(0, 86000) * 1000);
    const customer = i < 6 ? demo : pick(customers);
    const guest = rand() < 0.15 && customer.id !== demo.id;
    const status = i < 6 ? (["IN_PRODUCTION", "SHIPPED", "DELIVERED", "DELIVERED", "ARTWORK_REVIEW", "DELIVERED"] as const)[i] : statusesByAge(days);

    const lineCount = between(1, 3);
    const items: {
      productId: string; name: string; type: string; image: string; variantLabel: string; selection: string;
      quantity: number; unitPrice: number; total: number; artworkUrl: string | null; artworkStatus: string;
    }[] = [];
    for (let l = 0; l < lineCount; l++) {
      const { id, p } = rand() < 0.4 ? productRows[5]! : pick(productRows);
      const pp: PricingProduct = { id, type: p.type, basePrice: p.basePrice, options: p.options, tiers: p.tiers };
      let sel: LineSelection;
      if (p.type === "APPAREL") {
        const sizes: Record<string, number> = {};
        for (const s of ["S", "M", "L", "XL", "2XL"]) if (rand() > 0.35) sizes[s] = between(1, 12);
        if (!Object.keys(sizes).length) sizes.M = 3;
        sel = {
          color: pick(p.options.colors ?? colors).name,
          apparelSizes: sizes,
          printLocations: rand() > 0.5 ? ["front", "back"] : ["front"],
          quantity: Object.values(sizes).reduce((a, b) => a + b, 0),
        };
      } else {
        const size = pick(p.options.sizes ?? []);
        const qty = p.type === "GANG_SHEET" || p.type === "UV_DTF" && size.width === 22 ? between(1, 4) : p.type === "SCREEN_PRINT" ? pick([12, 24, 50, 100]) : p.type === "SUPPLIES" ? between(1, 3) : pick([5, 10, 12, 25, 50, 100]);
        sel = { sizeId: size?.id, quantity: qty };
      }
      const price = priceLine(pp, sel);
      const art = p.options.requiresArtwork ? p.images[0]! : null;
      items.push({
        productId: id,
        name: p.name,
        type: p.type,
        image: p.images[0]!,
        variantLabel: price.variantLabel,
        selection: J(sel),
        quantity: price.quantity,
        unitPrice: price.unitPrice,
        total: price.total,
        artworkUrl: art,
        artworkStatus: art ? (status === "ARTWORK_REVIEW" || status === "PENDING" ? "PENDING" : "APPROVED") : "APPROVED",
      });
    }
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const coupon = rand() < 0.22 ? pick(coupons.filter((c) => c.active)) : null;
    const shippingMethod = pick(["standard", "standard", "standard", "express", "overnight", "pickup"]);
    const isRush = rand() < 0.12;
    const totals = computeTotals({ subtotal, settings: DEFAULT_SETTINGS, shippingMethodId: shippingMethod, coupon, rush: isRush });
    const [city, state, zip] = pick(cities);
    const paid = status !== "PENDING";
    const idx = flow.indexOf(status);
    const reached = idx >= 0 ? flow.slice(0, idx + 1) : ["PENDING", "ARTWORK_REVIEW", status];
    orderNo += 1;
    await db.order.create({
      data: {
        number: `IF-${orderNo}`,
        userId: guest ? null : customer.id,
        email: customer.email,
        customerName: customer.name,
        phone: rand() > 0.5 ? `(555) 01${between(10, 99)}-${between(1000, 9999)}` : null,
        status,
        paymentStatus: status === "REFUNDED" ? "REFUNDED" : paid ? "PAID" : "UNPAID",
        paymentMethod: paid ? pick(["card", "card", "card", "paypal"]) : null,
        shippingMethod,
        shippingAddress: J({ name: customer.name, line1: `${between(100, 9999)} ${pick(streets)}`, city, state, zip, country: "US" }),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        rushFee: totals.rushFee,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        isRush,
        carrier: ["SHIPPED", "DELIVERED"].includes(status) ? "UPS" : null,
        trackingNumber: ["SHIPPED", "DELIVERED"].includes(status) ? `1Z${between(100000, 999999)}${between(1000000, 9999999)}` : null,
        notes: rand() < 0.15 ? pick(["Please match Pantone 185C as close as possible.", "Need these by Friday for an event!", "Mirror the back print please.", "Pack by size if possible."]) : null,
        createdAt,
        updatedAt: new Date(Math.min(now, createdAt.getTime() + reached.length * 7 * 3600000)),
        items: { create: items },
        events: {
          create: reached.map((s, k) => ({
            status: s,
            message: eventMsg[s] ?? s,
            author: k === 0 ? "customer" : "system",
            createdAt: new Date(Math.min(now, createdAt.getTime() + k * 7 * 3600000)),
          })),
        },
      },
    });
  }

  console.log("Designs, wishlist, inbox…");
  await db.savedDesign.create({
    data: {
      userId: demo.id,
      name: "Spring merch drop — 22×60",
      kind: "GANG_SHEET",
      widthIn: 22,
      heightIn: 60,
      previewUrl: img("gang-sheet.svg"),
      data: J({ sheetHeight: 60, items: [] }),
    },
  });
  await db.savedDesign.create({
    data: {
      userId: demo.id,
      name: "Team tee — front logo",
      kind: "APPAREL",
      previewUrl: img("tee-black.svg"),
      data: J({ productSlug: "premium-heavyweight-tee", color: "Black", sides: { front: [], back: [] } }),
    },
  });
  for (const slug of ["glitter-dtf-transfers", "classic-pullover-hoodie", "uv-dtf-gang-sheet"]) {
    const p = productRows.find((r) => r.p.slug === slug)!;
    await db.wishlistItem.create({ data: { userId: demo.id, productId: p.id } });
  }
  await db.contactMessage.createMany({
    data: [
      { name: "Marcus Grant", email: "marcus@ridgerunners.example", subject: "Bulk pricing for 400 jerseys", message: "Hi! We need 400 transfers for our club jerseys (numbers + names). Can you do a custom quote with a 2 week turnaround?", createdAt: new Date(now - 2 * 3600000) },
      { name: "Hana Kim", email: "hana@wildflower.example", subject: "Press settings for nylon?", message: "Do your DTF transfers work on nylon windbreakers? If yes, what temperature should I use?", createdAt: new Date(now - 26 * 3600000) },
      { name: "Diego Silva", email: "diego@example.com", subject: "Wholesale account", message: "I run a print shop in Phoenix and would like to open a wholesale account. What are the requirements?", status: "READ", createdAt: new Date(now - 3 * 86400000) },
      { name: "Ivy Brooks", email: "ivy@example.com", subject: "Order IF-10012 question", message: "Can I add one more 22x24 sheet to my order before it ships?", status: "REPLIED", createdAt: new Date(now - 9 * 86400000) },
    ],
  });
  await db.newsletterSubscriber.createMany({
    data: customers.filter((c) => c.marketingOptIn).map((c) => ({ email: c.email, createdAt: c.createdAt })),
  });

  console.log(`\n✔ Seeded ${products.length} products, ${customers.length} customers, ${TOTAL_ORDERS} orders.`);
  if (pw.local) {
    console.log("  Admin:    admin@inkforge.test / Admin@12345");
    console.log("  Staff:    production@inkforge.test / Staff@12345");
    console.log("  Customer: customer@inkforge.test / Customer@123");
  } else {
    // Never print real passwords (build logs are shared).
    console.log("  Admin:    admin@inkforge.test (password from SEED_ADMIN_PASSWORD)");
  }
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
