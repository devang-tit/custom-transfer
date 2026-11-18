import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { DEFAULT_SETTINGS, DEFAULT_TIERS, computeTotals, priceLine } from "../src/lib/pricing";
import { appDatabaseUrl } from "../src/lib/database-url";
import type { LineSelection, PriceTier, ProductOptions, PricingProduct } from "../src/lib/types";

// App queries go through the pooler when available (the direct URL is kept for migrations).
const db = new PrismaClient({ datasourceUrl: appDatabaseUrl() });

// Deterministic PRNG so demo data is stable between resets.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));

const img = (f: string) => `/images/products/${f}`;
const J = (v: unknown) => JSON.stringify(v);

const transferFinishes = [
  { id: "standard", label: "Standard", price: 0, description: "Vivid full-color DTF" },
  { id: "glitter", label: "Glitter", price: 1500, description: "Sparkle flake top layer" },
  { id: "glow", label: "Glow in the dark", price: 2000, description: "Charges in light, glows green" },
];
const sq = (w: number, h: number, price: number) => ({ id: `${w}x${h}`, label: `${w}" × ${h}"`, width: w, height: h, price });
const gang = (h: number, price: number) => ({ id: `22x${h}`, label: `22" × ${h}"`, width: 22, height: h, price });

const apparelSizes = [
  { size: "XS", upcharge: 0 },
  { size: "S", upcharge: 0 },
  { size: "M", upcharge: 0 },
  { size: "L", upcharge: 0 },
  { size: "XL", upcharge: 0 },
  { size: "2XL", upcharge: 4000 },
  { size: "3XL", upcharge: 6000 },
];
const printLocations = [
  { id: "front", label: "Full front", price: 12000 },
  { id: "back", label: "Full back", price: 12000 },
  { id: "left-chest", label: "Left chest", price: 6000 },
  { id: "sleeve", label: "Sleeve", price: 5000 },
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
  hsnCode: string;
  gstRate: number;
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
    hsnCode: "4908",
    gstRate: 18,
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Upload any design and pick a size. Vibrant, stretchy, wash-tested transfers ready to press.",
    description:
      "Our flagship direct-to-film transfers are printed on premium PET film with eco-friendly water-based inks and a hot-melt adhesive powder. They press onto cotton, polyester, blends, canvas, denim and more — light or dark garments, no weeding required.\n\nEvery transfer is cured and quality-checked before shipping. Simply press at 150–160°C (300–315°F) for 10–15 seconds with medium pressure, then peel hot or cold.",
    images: [img("dtf-transfers.svg"), img("tee-white.svg"), img("tee-black.svg")],
    basePrice: 2500,
    options: {
      requiresArtwork: true,
      sizes: [sq(3, 3, 2500), sq(4, 4, 3500), sq(5, 5, 4900), sq(6, 6, 6500), sq(8, 8, 9900), sq(10, 10, 13900), sq(11, 11, 15900), sq(12, 12, 18900), sq(12, 17, 24900)],
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
    hsnCode: "4908",
    gstRate: 18,
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Small-format transfers perfect for logos, pocket prints, hats and sleeves.",
    description:
      "Built for brands and uniform programs. Left chest transfers keep fine detail crisp at small sizes and press perfectly on polos, hats, totes and sleeves.",
    images: [img("dtf-left-chest.svg"), img("tee-oversized.svg")],
    basePrice: 1500,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 1500), sq(3, 3, 2200), sq(3.5, 3.5, 2800), sq(4, 4, 3200)], finishes: transferFinishes.slice(0, 2) },
    tiers: DEFAULT_TIERS,
    features: ["Crisp detail down to 0.5pt lines", "Great for hats & polos", "Bulk pricing from 10 pcs"],
    turnaround: "Ships in 24 hours",
  },
  {
    name: "Glitter DTF Transfers",
    slug: "glitter-dtf-transfers",
    sku: "DTF-GLT",
    hsnCode: "4908",
    gstRate: 18,
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Full-color prints with a dazzling glitter top coat. Built to turn heads.",
    description: "A sparkle flake layer is fused over your full-color print, giving every design a premium shimmer that survives the wash.",
    images: [img("dtf-glitter.svg"), img("tee-black.svg")],
    basePrice: 5500,
    compareAtPrice: 6900,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 5500), sq(6, 6, 9500), sq(8, 8, 13500), sq(10, 10, 17900), sq(12, 12, 22900)] },
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
    hsnCode: "4908",
    gstRate: 18,
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Charges in light and glows vivid green in the dark. Perfect for events & Halloween.",
    description: "Luminous pigment layered behind your print for a design that pops by day and glows at night.",
    images: [img("dtf-glow.svg")],
    basePrice: 6500,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 6500), sq(6, 6, 10900), sq(8, 8, 14900), sq(10, 10, 19900), sq(12, 12, 25900)] },
    tiers: DEFAULT_TIERS,
    features: ["Glows up to 4 hours", "Full-color daytime print", "Great for events"],
    turnaround: "Ships in 48 hours",
  },
  {
    name: "Neck Label Transfers",
    slug: "neck-label-transfers",
    sku: "DTF-NECK",
    hsnCode: "4908",
    gstRate: 18,
    type: "DTF_TRANSFER",
    category: "dtf-transfers",
    shortDescription: "Tagless neck labels for your clothing brand — size, care and logo in one press.",
    description: "Ditch scratchy tags. Brand-ready neck labels printed with fine detail and a soft, flexible hand.",
    images: [img("dtf-neck-label.svg")],
    basePrice: 900,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 900), { id: "3x2", label: '3" × 2"', width: 3, height: 2, price: 1200 }, sq(3, 3, 1500)] },
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
    hsnCode: "4908",
    gstRate: 18,
    type: "GANG_SHEET",
    category: "gang-sheets",
    shortDescription: "Pack unlimited designs onto one 22\" wide sheet. Build it online with auto-nesting or upload your file.",
    description:
      "The most cost-effective way to print DTF. Arrange as many designs as fit on a 22\" wide sheet — mix sizes, colors and logos freely. Use our online builder with smart auto-pack and DPI checks, or upload a print-ready 300 DPI transparent PNG.",
    images: [img("gang-sheet.svg"), img("dtf-transfers.svg")],
    basePrice: 19900,
    options: {
      requiresArtwork: true,
      sizes: [gang(12, 19900), gang(24, 34900), gang(36, 49900), gang(48, 64900), gang(60, 79900), gang(84, 109900), gang(120, 149900), gang(180, 219900), gang(240, 289900)],
    },
    tiers: gangTiers,
    features: ["Unlimited designs per sheet", "Smart auto-pack builder", "Live DPI quality check", "Same-day production before 2 pm IST"],
    badge: "Most popular",
    turnaround: "Same-day production",
    featured: true,
  },
  {
    name: "Upload a Print-Ready Gang Sheet",
    slug: "upload-gang-sheet",
    sku: "GANG-UPL",
    hsnCode: "4908",
    gstRate: 18,
    type: "GANG_SHEET",
    category: "gang-sheets",
    shortDescription: "Already have a 22\" wide print-ready file? Upload it and we print it exactly as-is.",
    description: "For designers with a finished layout. Upload a transparent PNG at 300 DPI, 22\" wide. We print it as supplied with no changes.",
    images: [img("gang-sheet-upload.svg")],
    basePrice: 19900,
    options: {
      requiresArtwork: true,
      sizes: [gang(12, 19900), gang(24, 34900), gang(36, 49900), gang(48, 64900), gang(60, 79900), gang(84, 109900), gang(120, 149900), gang(180, 219900), gang(240, 289900)],
    },
    tiers: gangTiers,
    features: ["Printed exactly as supplied", "Transparent PNG at 300 DPI", "Up to 22\" × 240\""],
    turnaround: "Same-day production",
  },
  {
    name: "UV DTF Gang Sheet",
    slug: "uv-dtf-gang-sheet",
    sku: "GANG-UV",
    hsnCode: "4908",
    gstRate: 18,
    type: "UV_DTF",
    category: "gang-sheets",
    shortDescription: "Gang your UV DTF decals for tumblers, glass and hard goods on one sheet.",
    description: "Waterproof, scratch-resistant UV DTF decals with a raised, glossy finish. Apply by hand — no heat press required.",
    images: [img("uv-dtf-gang-sheet.svg"), img("uv-cup-wrap.svg")],
    basePrice: 39900,
    options: { requiresArtwork: true, sizes: [gang(12, 39900), gang(24, 69900), gang(36, 99900), gang(48, 124900), gang(60, 149900)] },
    tiers: gangTiers,
    features: ["Dishwasher-safe (top rack)", "Raised glossy texture", "Sticks to glass, metal, wood"],
    turnaround: "Ships in 48 hours",
    featured: true,
  },
  {
    name: "UV DTF Stickers",
    slug: "uv-dtf-stickers",
    sku: "UV-STK",
    hsnCode: "4908",
    gstRate: 18,
    type: "UV_DTF",
    category: "uv-dtf",
    shortDescription: "Rub-on decals that bond to almost any hard surface — waterproof and scratch resistant.",
    description: "Perfect for tumblers, laptops, phone cases, signage and packaging. Peel, place, rub and reveal.",
    images: [img("uv-dtf-stickers.svg"), img("uv-cup-wrap.svg")],
    basePrice: 2000,
    options: { requiresArtwork: true, sizes: [sq(2, 2, 2000), sq(3, 3, 3000), sq(4, 4, 4500), sq(5, 5, 6000), sq(6, 6, 7500)] },
    tiers: DEFAULT_TIERS,
    features: ["No heat press needed", "Waterproof & UV resistant", "Raised glossy finish"],
    turnaround: "Ships in 48 hours",
  },
  {
    name: "UV DTF Cup Wraps",
    slug: "uv-dtf-cup-wraps",
    sku: "UV-WRAP",
    hsnCode: "4908",
    gstRate: 18,
    type: "UV_DTF",
    category: "uv-dtf",
    shortDescription: "Full wraps sized for 16oz glass cans and 20oz / 40oz tumblers.",
    description: "Sized-to-fit wraps with alignment marks for a seamless finish on popular cups.",
    images: [img("uv-cup-wrap.svg")],
    basePrice: 9900,
    options: {
      requiresArtwork: true,
      sizes: [
        { id: "16oz", label: "16oz glass can (9.5\" × 4.3\")", width: 9.5, height: 4.3, price: 9900 },
        { id: "20oz", label: "20oz tumbler (9.3\" × 8.2\")", width: 9.3, height: 8.2, price: 13900 },
        { id: "40oz", label: "40oz tumbler (11\" × 7.5\")", width: 11, height: 7.5, price: 15900 },
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
    hsnCode: "4908",
    gstRate: 18,
    type: "SCREEN_PRINT",
    category: "screen-print-transfers",
    shortDescription: "Classic plastisol transfers for large runs. 1–3 spot colors, unbeatable price at volume.",
    description: "Ideal for teams, events and merch drops. Choose up to 3 spot colors and press with a classic, durable screen print feel.",
    images: [img("screen-print.svg")],
    basePrice: 1800,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 1800), sq(8, 8, 2800), sq(11, 11, 3800), sq(12, 14, 4800)] },
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
    hsnCode: "4908",
    gstRate: 18,
    type: "SCREEN_PRINT",
    category: "screen-print-transfers",
    shortDescription: "Raised 3D puff ink that expands under heat for a bold, textured look.",
    description: "On-trend puff print with dimensional texture. Best for bold logos and lettering.",
    images: [img("screen-print-puff.svg")],
    basePrice: 2800,
    options: { requiresArtwork: true, sizes: [sq(4, 4, 2800), sq(8, 8, 4200), sq(11, 11, 5500)] },
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
    hsnCode: "6109",
    gstRate: 5,
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "220 GSM combed-cotton tee, printed & pressed by us. Design it in the studio.",
    description: "A structured, boxy-fit heavyweight tee with a premium hand feel. We print your design with DTF and press it in-house, then fold and bag every piece.",
    images: [img("tee-white.svg"), img("tee-black.svg")],
    basePrice: 34900,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["220 GSM 100% combed cotton", "Pre-shrunk, garment-dyed look", "Printed & pressed in-house", "No minimums"],
    badge: "Best seller",
    turnaround: "Ships in 3 business days",
    featured: true,
  },
  {
    name: "Oversized Boxy Tee",
    slug: "oversized-boxy-tee",
    sku: "APP-TEE-OS",
    hsnCode: "6109",
    gstRate: 5,
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Drop-shoulder streetwear fit in a 240 GSM cotton jersey.",
    description: "A modern oversized silhouette with a dropped shoulder and thick ribbed collar — made for merch drops.",
    images: [img("tee-oversized.svg")],
    basePrice: 44900,
    options: { colors: colors.filter((c) => ["White", "Black", "Sand", "Forest", "Heather Grey"].includes(c.name)), apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["240 GSM cotton jersey", "Drop shoulder fit", "Thick ribbed collar"],
    badge: "New",
    turnaround: "Ships in 3 business days",
  },
  {
    name: "Classic Pullover Hoodie",
    slug: "classic-pullover-hoodie",
    sku: "APP-HOOD",
    hsnCode: "6110",
    gstRate: 5,
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Cozy 300 GSM fleece hoodie with kangaroo pocket. Custom printed front & back.",
    description: "Midweight brushed fleece with a lined hood, matching drawcords and kangaroo pocket.",
    images: [img("hoodie.svg")],
    basePrice: 89900,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["300 GSM brushed fleece", "Lined hood", "Kangaroo pocket"],
    turnaround: "Ships in 4 business days",
    featured: true,
  },
  {
    name: "Everyday Crewneck Sweatshirt",
    slug: "everyday-crewneck",
    sku: "APP-CREW",
    hsnCode: "6110",
    gstRate: 5,
    type: "APPAREL",
    category: "custom-apparel",
    shortDescription: "Soft fleece crewneck that holds a print beautifully.",
    description: "A versatile 8oz fleece crewneck with ribbed cuffs and waistband.",
    images: [img("crewneck.svg")],
    basePrice: 69900,
    options: { colors, apparelSizes, printLocations, requiresArtwork: false },
    tiers: apparelTiers,
    features: ["270 GSM fleece", "Ribbed cuffs & hem", "Unisex fit"],
    turnaround: "Ships in 4 business days",
  },
  {
    name: "Teflon Sheets (3-Pack)",
    slug: "teflon-sheets-3-pack",
    sku: "SUP-PTFE",
    hsnCode: "3920",
    gstRate: 18,
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Reusable 16\" × 20\" PTFE sheets protect your prints and press.",
    description: "Non-stick, heat-resistant sheets for clean, even pressing.",
    images: [img("supplies-teflon.svg")],
    basePrice: 44900,
    options: { sizes: [{ id: "pack", label: "3-pack · 16\" × 20\"", width: 16, height: 20, price: 44900 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }, { minQty: 3, discountPct: 10 }],
    features: ["Reusable hundreds of times", "Up to 260°C", "Non-stick"],
    stock: 120,
  },
  {
    name: "Heat Press Pillow 15\" × 15\"",
    slug: "heat-press-pillow",
    sku: "SUP-PILLOW",
    hsnCode: "9404",
    gstRate: 18,
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Even out pressure over seams, zippers and buttons.",
    description: "A dense foam pillow wrapped in heat-resistant fabric for perfect pressure on uneven garments.",
    images: [img("supplies-pillow.svg")],
    basePrice: 69900,
    options: { sizes: [{ id: "15x15", label: '15" × 15"', width: 15, height: 15, price: 69900 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }],
    features: ["Heat resistant to 450°F", "Fixes seam pressure issues"],
    stock: 38,
  },
  {
    name: "Heat Resistant Tape",
    slug: "heat-resistant-tape",
    sku: "SUP-TAPE",
    hsnCode: "3919",
    gstRate: 18,
    type: "SUPPLIES",
    category: "supplies",
    shortDescription: "Keeps transfers exactly where you put them. Leaves no residue.",
    description: "10mm × 33m roll of polyimide tape.",
    images: [img("supplies-tape.svg")],
    basePrice: 24900,
    options: { sizes: [{ id: "roll", label: "10mm × 33m roll", width: 0.4, height: 1300, price: 24900 }], requiresArtwork: false },
    tiers: [{ minQty: 1, discountPct: 0 }, { minQty: 5, discountPct: 15 }],
    features: ["No residue", "Heat resistant"],
    stock: 4,
  },
];

const firstNames = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Neha", "Arjun", "Kavya", "Ishaan", "Diya", "Kabir", "Meera", "Aditya", "Riya", "Siddharth", "Tanvi", "Yash", "Sneha", "Harsh", "Pooja", "Nikhil", "Aisha", "Varun", "Simran", "Karan", "Divya"];
const lastNames = ["Shah", "Patel", "Mehta", "Iyer", "Singh", "Gupta", "Reddy", "Nair", "Joshi", "Desai", "Malhotra", "Pillai", "Kulkarni", "Sharma", "Rao", "Bhatt", "Agarwal", "Menon"];
const companies = ["Rangrez Prints", "Surat Tee Co.", "Bandra Merch House", "Pink City Apparel", "Chai & Cotton", "Deccan Sports Club", "Kochi Craft Studio", null, null, null, null];
const cities = [
  ["Ahmedabad", "Gujarat", "380009"], ["Surat", "Gujarat", "395007"], ["Mumbai", "Maharashtra", "400050"], ["Pune", "Maharashtra", "411001"],
  ["Bengaluru", "Karnataka", "560034"], ["Chennai", "Tamil Nadu", "600017"], ["Hyderabad", "Telangana", "500081"], ["New Delhi", "Delhi", "110017"],
  ["Jaipur", "Rajasthan", "302001"], ["Kolkata", "West Bengal", "700019"], ["Kochi", "Kerala", "682016"], ["Lucknow", "Uttar Pradesh", "226010"],
] as const;
const streets = ["MG Road", "CG Road", "Linking Road", "Park Street", "Anna Salai", "Koramangala 5th Block", "Banjara Hills Road No. 12", "Sector 17", "FC Road", "Civil Lines"];

const reviewTexts: [number, string, string][] = [
  [5, "Colors are insane", "Printed a full gang sheet for our merch drop and the colors came out brighter than my screen. Pressed 60 shirts, zero lifting."],
  [5, "Fastest turnaround I've found", "Ordered at 11am, shipped the same day. The builder's auto-pack saved me so much film."],
  [5, "Super soft hand", "These transfers feel like part of the shirt. Customers keep asking if it's screen printed."],
  [4, "Great quality, small learning curve", "Took me one test press to dial in my settings, after that every single one was perfect."],
  [5, "Wash test passed", "Washed my test tee 40 times. Still looks brand new, no cracking."],
  [4, "Love the DPI checker", "The builder warned me one of my logos was low-res before I ordered. Saved me a reprint."],
  [5, "Our go-to print partner", "We run a small boutique and order weekly. Consistent quality and the support team is great."],
  [3, "Good, shipping was slow", "Prints are great but standard delivery took 6 days to Guwahati. Will choose express next time."],
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

/**
 * Bump when the demo data changes shape (e.g. "india-v1": amounts became INR paise with GST).
 * A deploy with RESET_DEMO_DATA set to this value replaces existing data once; the marker row
 * written at the end of the seed stops it from ever running again for the same version.
 */
const DATA_VERSION = "india-v1";
const DATA_VERSION_KEY = "dataVersion";

async function main() {
  const onlyIfEmpty = process.argv.includes("--if-empty");
  if (onlyIfEmpty) {
    const existing = await db.user.count();
    if (existing > 0) {
      const requested = process.env.RESET_DEMO_DATA?.trim() === DATA_VERSION;
      const marker = await db.setting.findUnique({ where: { key: DATA_VERSION_KEY } });
      if (!requested || marker?.value === J(DATA_VERSION)) {
        console.log(`Seed skipped: database already has ${existing} user(s)${requested ? ` and is on ${DATA_VERSION}` : ""}.`);
        return;
      }
      console.log(`RESET_DEMO_DATA=${DATA_VERSION}: replacing existing data with the ${DATA_VERSION} demo store (runs once).`);
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
      name: "Riya Shah",
      role: "CUSTOMER",
      passwordHash: await bcrypt.hash(pw.customer, 10),
      company: "Riya's Print Studio",
      phone: "+91 98250 12345",
      marketingOptIn: true,
      addresses: {
        create: [
          { label: "Studio", name: "Riya Shah", company: "Riya's Print Studio", line1: "B-204, Shivalik Business Centre", line2: "Near Rajpath Club, SG Highway", city: "Ahmedabad", state: "Gujarat", zip: "380054", country: "IN", phone: "+91 98250 12345", isDefault: true },
          { label: "Home", name: "Riya Shah", line1: "12, Shanti Kunj Society", line2: "Satellite Road", city: "Ahmedabad", state: "Gujarat", zip: "380015", country: "IN", phone: "+91 98250 12345" },
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
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
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
      { code: "FREESHIP", description: "Free standard delivery on orders above ₹499", type: "FREE_SHIPPING", value: 0, minSubtotal: 49900, usedCount: 112 },
      { code: "BULK250", description: "₹250 off orders above ₹2,500", type: "FIXED", value: 25000, minSubtotal: 250000, usedCount: 17, maxUses: 500 },
      { code: "GANG15", description: "15% off orders above ₹999", type: "PERCENT", value: 15, minSubtotal: 99900, usedCount: 9, expiresAt: new Date(now + 20 * 86400000) },
      { code: "DIWALI20", description: "Diwali festive sale (expired)", type: "PERCENT", value: 20, minSubtotal: 0, usedCount: 204, active: false, expiresAt: new Date(now - 20 * 86400000) },
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
    SHIPPED: "Shipped via Delhivery",
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
      hsnCode: string; gstRate: number;
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
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
      });
    }
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const coupon = rand() < 0.22 ? pick(coupons.filter((c) => c.active)) : null;
    const shippingMethod = pick(["standard", "standard", "standard", "express", "pickup"]);
    const isRush = rand() < 0.12;
    const cod = status !== "PENDING" && subtotal <= DEFAULT_SETTINGS.codMaxOrder * 0.85 && rand() < 0.35;
    const totals = computeTotals({
      subtotal,
      settings: DEFAULT_SETTINGS,
      shippingMethodId: shippingMethod,
      coupon,
      rush: isRush,
      cod,
      lines: items.map((it) => ({ amount: it.total, gstRate: it.gstRate })),
    });
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
        phone: `+91 9${between(1000, 9999)} ${between(10000, 99999)}`,
        status,
        paymentStatus: status === "REFUNDED" ? "REFUNDED" : cod ? (status === "DELIVERED" ? "PAID" : "UNPAID") : paid ? "PAID" : "UNPAID",
        paymentMethod: cod ? "cod" : paid ? "razorpay" : null,
        shippingMethod,
        shippingAddress: J({ name: customer.name, line1: `${between(1, 400)}, ${pick(streets)}`, city, state, zip, country: "IN" }),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        rushFee: totals.rushFee,
        codFee: totals.codFee,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        isRush,
        carrier: ["SHIPPED", "DELIVERED"].includes(status) ? "Delhivery" : null,
        trackingNumber: ["SHIPPED", "DELIVERED"].includes(status) ? `${between(1000000, 9999999)}${between(100000, 999999)}` : null,
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
      { name: "Karan Malhotra", email: "karan@deccansports.example", subject: "Bulk pricing for 400 jerseys", message: "Hi! We need 400 transfers for our club jerseys (numbers + names). Can you share a quote with a 2-week turnaround to Hyderabad?", createdAt: new Date(now - 2 * 3600000) },
      { name: "Meera Pillai", email: "meera@kochicraft.example", subject: "Press settings for nylon?", message: "Do your DTF transfers work on nylon windbreakers? If yes, what temperature should I use?", createdAt: new Date(now - 26 * 3600000) },
      { name: "Yash Agarwal", email: "yash@example.com", subject: "Wholesale account with GST invoice", message: "I run a print shop in Jaipur and would like to open a wholesale account with GST invoices. What are the requirements?", status: "READ", createdAt: new Date(now - 3 * 86400000) },
      { name: "Sneha Menon", email: "sneha@example.com", subject: "Order IF-10012 question", message: "Can I add one more 22x24 sheet to my order before it ships?", status: "REPLIED", createdAt: new Date(now - 9 * 86400000) },
    ],
  });
  await db.newsletterSubscriber.createMany({
    data: customers.filter((c) => c.marketingOptIn).map((c) => ({ email: c.email, createdAt: c.createdAt })),
  });

  await db.setting.upsert({ where: { key: DATA_VERSION_KEY }, create: { key: DATA_VERSION_KEY, value: J(DATA_VERSION) }, update: { value: J(DATA_VERSION) } });
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
