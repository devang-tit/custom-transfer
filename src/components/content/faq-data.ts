export type FaqItem = { q: string; a: string };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const FAQ: FaqCategory[] = [
  {
    id: "ordering",
    title: "Ordering",
    items: [
      { q: "Is there a minimum order?", a: "No minimums on DTF transfers, gang sheets, UV DTF or custom apparel — order a single piece if you like. Screen print transfers have a 12-piece minimum because each color needs its own screen." },
      { q: "How do quantity discounts work?", a: "Discounts apply automatically per line item based on quantity: 10+ pieces save 10%, 25+ save 20%, 50+ save 30% and 100+ save 40% on most DTF transfers. Gang sheets and apparel have their own tiers shown on each product page and on our pricing page." },
      { q: "Can I change or cancel my order after placing it?", a: "Yes, as long as it hasn't entered production. Orders sit in artwork review for a short window after checkout — contact us right away with your order number and we'll update or cancel it. Once printing starts we can't make changes." },
      { q: "Do you offer wholesale or reseller pricing?", a: "Yes. Print shops and brands ordering regularly can apply for a wholesale account with deeper tiered pricing and invoice terms. Send us a note through the contact page with your business details." },
    ],
  },
  {
    id: "artwork",
    title: "Artwork & files",
    items: [
      { q: "What file types can I upload?", a: "PNG with a transparent background is best. We also accept JPG, WEBP, SVG and PDF. Avoid JPGs for anything that needs a transparent background — JPGs always print a solid background box." },
      { q: "What resolution should my artwork be?", a: "300 DPI at the final print size is ideal. 150 DPI is the minimum for acceptable results. Our uploader and gang sheet builder calculate DPI live and warn you if a file is likely to print soft or pixelated." },
      { q: "Will you check my artwork before printing?", a: "Every order passes through prepress review. We check resolution, transparency, thin lines and color issues. If something looks off we'll pause the order and email you before printing — you can see the status on your order page." },
      { q: "Can you print white or very fine details?", a: "Yes. DTF prints a white underbase so white ink and light colors show up on dark garments. Keep lines at least 0.5pt thick and text at least 6pt for crisp, durable results." },
      { q: "Do you remove backgrounds or fix artwork?", a: "Simple background removal is free on request — add a note at checkout. More involved clean-up or vectorizing can be quoted separately through the contact form." },
    ],
  },
  {
    id: "gang-sheets",
    title: "Gang sheets",
    items: [
      { q: "What is a gang sheet?", a: "A gang sheet is a single roll of DTF film, 22\" wide, that you fill with as many designs as fit. You pay for the sheet length, not the number of designs — it's the cheapest way to print lots of small logos or mixed designs." },
      { q: "How do I build a gang sheet?", a: "Open the Gang Sheet Builder, pick a sheet length, upload your designs and drag them into place — or hit Auto-pack and the builder nests them for you with safe spacing. It shows live DPI checks and the exact price before you add it to your cart." },
      { q: "How much space should I leave between designs?", a: "Leave at least 0.25\" (about 6mm) between designs so you can cut them apart cleanly. The builder's auto-pack uses safe spacing by default." },
      { q: "Can I upload a gang sheet I made myself?", a: "Yes — use the \"Upload a Print-Ready Gang Sheet\" product. Supply a transparent PNG, 22\" wide at 300 DPI, at the length you're ordering. We print it exactly as supplied." },
    ],
  },
  {
    id: "pressing",
    title: "Pressing",
    items: [
      { q: "What heat press settings should I use?", a: "For most fabrics: 150–160°C (300–315°F), medium-firm pressure, 10–15 seconds. Peel hot or cold, then do a 5-second second press with parchment or a teflon sheet on top for extra durability. Full details are in our Press Instructions guide." },
      { q: "Can I use a household iron?", a: "We don't recommend it. Irons can't apply even heat and pressure across the whole design, which leads to peeling. A heat press — even an entry-level one — gives far better, longer-lasting results." },
      { q: "What fabrics do DTF transfers work on?", a: "Cotton, polyester, poly-cotton blends, tri-blends, canvas, denim, fleece and many performance fabrics. For nylon and heat-sensitive materials, lower the temperature to around 135°C and test first." },
      { q: "How long do DTF transfers last?", a: "Pressed correctly, our transfers hold up to 50+ washes without cracking. Wash inside out in cold water and tumble dry low or hang dry for the longest life." },
      { q: "How should I store transfers before pressing?", a: "Keep them flat in a cool, dry place away from direct sunlight. Properly stored, unpressed DTF transfers last 6–12 months." },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    items: [
      { q: "How fast will my order ship?", a: "DTF transfers and gang sheets placed before 2 pm IST (Monday–Saturday) go into production the same day and usually ship within 24 hours. Apparel ships in 3–4 working days and screen print transfers in about 5. Delivery takes 2–6 days depending on your PIN code." },
      { q: "Do you offer free shipping?", a: "Yes — standard delivery is free on orders above ₹999 after discounts. Express delivery is available at checkout, and Cash on Delivery is available on most PIN codes." },
      { q: "Can I pick up my order locally?", a: "Yes. Choose Studio pickup at checkout and we'll email you as soon as your order is ready at our Ahmedabad studio." },
      { q: "How do I track my order?", a: "Signed-in customers can see live production status and tracking in their account. Guests can use the Track Order page with their order number and email." },
    ],
  },
  {
    id: "returns",
    title: "Returns & reprints",
    items: [
      { q: "What if there's a problem with my print?", a: "If a transfer arrives damaged or has a printing defect, contact us within 14 days with photos and your order number and we'll reprint it free of charge." },
      { q: "Can I return custom transfers?", a: "Because every order is printed to order, we can't accept returns for change of mind or artwork errors that were in the file you supplied. That's why we review every file before printing and flag issues first." },
      { q: "My transfer peeled after pressing — what happened?", a: "Peeling is almost always caused by too little pressure, too short a press time or a fabric coating. Check our troubleshooting guide, then reach out — we'll help diagnose the issue and make it right if it's on us." },
    ],
  },
];
