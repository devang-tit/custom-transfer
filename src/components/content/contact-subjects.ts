export const CONTACT_SUBJECTS = [
  "Order question",
  "Artwork help",
  "Bulk / wholesale quote",
  "Pressing help",
  "Account",
  "Something else",
] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];
