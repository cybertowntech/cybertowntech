# Project conventions
- Public informational pages use dedicated TanStack leaf routes with page-specific metadata and the existing SiteNav/SiteFooter; this preserves direct links and consistent navigation.
- App media uploads use Lovable Assets JSON pointers; this keeps the repository free of uploaded binaries.
- WhatsApp enquiry URLs are built by the shared contact helper and checked with a small contact test; this keeps contact buttons consistent.
- Unapproved policy content and fictional case studies/testimonials must be visibly identified as drafts or illustrative examples; this prevents placeholder material from appearing as verified evidence.
- Product image surfaces use ProductImage and cart images are refreshed from the active catalog; this handles unavailable images and expiring storage links consistently.
- Cart discounts are allocated in integer cents through the shared pricing helper; this keeps order totals equal to the single gateway payment.