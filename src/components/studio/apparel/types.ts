import type { ProductDTO } from "@/lib/products";
import type { StudioItem } from "@/components/studio/lib/geometry";
import type { Side } from "./garment";

export type ApparelDesignData = {
  productSlug: string;
  color: string;
  sides: Record<Side, StudioItem[]>;
  sizes?: Record<string, number>;
};

export type ApparelEditorProps = {
  products: ProductDTO[];
  initialProductSlug: string;
  initialColor: string | null;
  design: { id: string; name: string; owned: boolean; data: ApparelDesignData } | null;
  signedIn: boolean;
};
