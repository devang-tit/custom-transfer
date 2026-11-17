/**
 * URLs we accept for customer artwork, design previews and product media:
 * local files (/uploads/…, /images/…) or files in a Vercel Blob public store.
 */
const LOCAL_ASSET = /^\/(uploads|images)\/[\w\-./]+$/;
const BLOB_ASSET = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w\-./%]+$/i;

export function isAllowedAssetUrl(url: string): boolean {
  return !url.includes("..") && (LOCAL_ASSET.test(url) || BLOB_ASSET.test(url));
}
