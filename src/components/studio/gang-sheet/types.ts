import type { ProductDTO } from "@/lib/products";
import type { StudioItem } from "@/components/studio/lib/geometry";

export type LibraryAsset = { url: string; name: string; width: number; height: number; type: string };

export type GangDesignData = {
  productSlug: string;
  sizeId: string;
  quantity?: number;
  items: StudioItem[];
  library?: LibraryAsset[];
};

export type GangProductOption = { slug: string; name: string; type: string };

export type GangEditorProps = {
  product: ProductDTO;
  products: GangProductOption[];
  initialSizeId: string;
  design: { id: string; name: string; owned: boolean; data: GangDesignData } | null;
  signedIn: boolean;
};

export const SAMPLE_ART: LibraryAsset[] = [
  { url: "/images/studio-samples/sunset.svg", name: "Golden hour", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/good-vibes.svg", name: "Good vibes", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/flower.svg", name: "Happy flower", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/star-badge.svg", name: "Star badge", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/bolt.svg", name: "Bolt", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/heart.svg", name: "Heart", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/mountain.svg", name: "Mountain", width: 1200, height: 1200, type: "image/svg+xml" },
  { url: "/images/studio-samples/wave.svg", name: "Wave", width: 1200, height: 840, type: "image/svg+xml" },
];
