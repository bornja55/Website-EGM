// Plain-fetch wrappers, one per collection — no PocketBase SDK, matching the
// empire-website pattern. Server-side reads use POCKETBASE_URL (internal docker
// network); anything rendered as a public link uses PUBLIC_POCKETBASE_URL.

// NOTE: uses process.env, not import.meta.env — Vite statically inlines
// import.meta.env.* at build time, which would bake in whatever value (or lack
// of one) is present when `npm run build` runs inside the Docker image, and
// silently ignore the POCKETBASE_URL set at container runtime by
// docker-compose. Verified by building this file both ways and inspecting the
// compiled dist/ output before choosing this fix.
const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";

async function pbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PB_URL}/api/${path}`);
  if (!res.ok) {
    throw new Error(`PocketBase fetch failed (${res.status}): ${path}`);
  }
  return res.json();
}

export interface SiteSettings {
  phone: string;
  email: string;
  line_oa_url: string;
  address: string;
  hours: string;
  company_name_th: string;
  company_registration_no: string;
  facebook_url: string;
  google_maps_embed_url: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
}

export interface Workshop {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  event_date: string;
  price: number;
  seats_total: number;
  cover_image: string;
  line_link: string;
  is_active: boolean;
  tags: string[]; // added migration 5 — gallery tag-matching only, not mega-menu (courses-only there)
  // Migration 9 — one line of footnote copy under the summary stat row.
  summary_note?: string;
}

export interface Promotion {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  duration: string;
  schedule: string;
  image: string;
  valid_until: string;
  line_link: string;
  is_active: boolean;
  tags: string[]; // added migration 5 — gallery tag-matching only, not mega-menu (courses-only there)
  // Migration 9 — one line of footnote copy under the summary stat row.
  summary_note?: string;
}

// New in the course/promotion/workshop product-pages project — see
// COURSE_PAGES_PRD.md. The 9 real named courses, migrated out of
// `promotions` by pocketbase/migrate-courses.mjs (Phase 1).
export interface Course {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  price: number;
  duration: string;
  schedule: string;
  description: string;
  image: string;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  line_link: string;
  // Migration 9 — one line of footnote copy under the summary stat row.
  summary_note?: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  quote: string;
  source: string;
  rating: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Tutor {
  id: string;
  name: string;
  photo: string;
  education: string;
  credentials: string;
  subjects: string;
  sort_order: number;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const res = await pbFetch<{ items: SiteSettings[] }>(
    "collections/site_settings/records?perPage=1"
  );
  return res.items[0] ?? null;
}

export async function getServices(): Promise<Service[]> {
  const res = await pbFetch<{ items: Service[] }>(
    "collections/services/records?sort=sort_order&perPage=50"
  );
  return res.items;
}

export async function getActiveWorkshops(): Promise<Workshop[]> {
  const res = await pbFetch<{ items: Workshop[] }>(
    "collections/workshops/records?filter=" +
      encodeURIComponent("is_active=true") +
      "&sort=event_date&perPage=50"
  );
  return res.items;
}

// Fetch a single workshop by slug for /workshops/[slug] — deliberately not
// filtered by is_active, so a direct/shared link to a past workshop still
// resolves instead of 404ing (same reasoning as getCourse/getPromotion below).
export async function getWorkshop(slug: string): Promise<Workshop | null> {
  const res = await pbFetch<{ items: Workshop[] }>(
    "collections/workshops/records?filter=" +
      encodeURIComponent(`slug="${slug}"`) +
      "&perPage=1"
  );
  return res.items[0] ?? null;
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const res = await pbFetch<{ items: Promotion[] }>(
    "collections/promotions/records?filter=" +
      encodeURIComponent("is_active=true") +
      "&sort=-created&perPage=50"
  );
  return res.items;
}

// All promotions, active or not, for the /promotions index page — an
// expired-but-still-linked promo shouldn't 404, just not appear in the
// homepage's "active" callout.
export async function getPromotions(): Promise<Promotion[]> {
  const res = await pbFetch<{ items: Promotion[] }>(
    "collections/promotions/records?sort=-created&perPage=50"
  );
  return res.items;
}

export async function getPromotion(slug: string): Promise<Promotion | null> {
  const res = await pbFetch<{ items: Promotion[] }>(
    "collections/promotions/records?filter=" +
      encodeURIComponent(`slug="${slug}"`) +
      "&perPage=1"
  );
  return res.items[0] ?? null;
}

export async function getCourses(): Promise<Course[]> {
  const res = await pbFetch<{ items: Course[] }>(
    "collections/courses/records?filter=" +
      encodeURIComponent("is_active=true") +
      "&sort=sort_order&perPage=50"
  );
  return res.items;
}

export async function getCourse(slug: string): Promise<Course | null> {
  const res = await pbFetch<{ items: Course[] }>(
    "collections/courses/records?filter=" +
      encodeURIComponent(`slug="${slug}"`) +
      "&perPage=1"
  );
  return res.items[0] ?? null;
}

// Courses carrying a given tag, for the category index pages
// (/course/subject|grade|exam|format/[tag]).
//
// Filters in JS rather than with a PocketBase `tags~"..."` filter. PocketBase's
// filter parser mishandles "&" inside a quoted value: `tags~"TGAT & A-Level"`
// returns 0 rows while `tags~"TGAT"` returns 1, so the server-side version
// silently produced an empty category page for that one tag. Verified against
// the live API before changing this.
//
// Filtering here is also exact rather than substring — `~` would match "ป.1"
// inside a hypothetical "ป.10" — and it keeps tag values out of a query string
// entirely. The whole catalog is ~11 records and getCourses() already fetches
// all of them, so there is nothing to gain from pushing this to the server.
export async function getCoursesByTag(tag: string): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((c) => (c.tags || []).includes(tag));
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await pbFetch<{ items: Testimonial[] }>(
    "collections/testimonials/records?perPage=50"
  );
  return res.items;
}

export async function getFaq(): Promise<FaqItem[]> {
  const res = await pbFetch<{ items: FaqItem[] }>(
    "collections/faq/records?sort=sort_order&perPage=50"
  );
  return res.items;
}

export async function getTutors(): Promise<Tutor[]> {
  const res = await pbFetch<{ items: Tutor[] }>(
    "collections/tutors/records?sort=sort_order&perPage=50"
  );
  return res.items;
}

// --- Phase 1.5: story sections, gallery, reviews ---------------------------
// See COURSE_PAGES_PRD.md "Phase 1.5". `ItemType` matches the relation field
// name on course_sections/gallery_images/reviews (exactly one populated per
// record, by convention, not server-enforced except on `reviews`).
export type ItemType = "course" | "promotion" | "workshop";

export interface CourseSection {
  id: string;
  heading: string;
  body: string;
  image: string;
  sort_order: number;
  // "" = default full-width story block. "card" = a photo tile in a 2-up grid.
  // "accordion" = a collapsible row in a "Significant others."-style panel.
  // "text-card" = a compact copy-only card in a 3-up row (`image` unused).
  // Consecutive records sharing a non-empty layout render as ONE widget
  // (see migrations 6-8, and the grouping pass in ProductTabs.astro).
  layout?: "" | "card" | "accordion" | "text-card";
  // Only meaningful on the FIRST record of a run: the big heading printed
  // above the card row / accordion panel.
  group_heading?: string;
}

export async function getCourseSections(type: ItemType, id: string): Promise<CourseSection[]> {
  const res = await pbFetch<{ items: CourseSection[] }>(
    "collections/course_sections/records?filter=" +
      encodeURIComponent(`${type}="${id}"`) +
      "&sort=sort_order&perPage=50"
  );
  return res.items;
}

export interface GalleryImage {
  id: string;
  image: string;
  caption: string;
  sort_order: number;
}

// Item-specific pinned photos, explicit sort_order, rendered first.
export async function getPinnedGalleryImages(type: ItemType, id: string): Promise<GalleryImage[]> {
  const res = await pbFetch<{ items: GalleryImage[] }>(
    "collections/gallery_images/records?filter=" +
      encodeURIComponent(`${type}="${id}"`) +
      "&sort=sort_order&perPage=50"
  );
  return res.items;
}

// Tag-matched fill-in pool, rendered after the pinned set. CRITICAL #2 fix
// (COURSE_PAGES_PRD.md): excludes ANY photo with a relation set on any of the
// 3 fields, not just this item's own pinned photos — otherwise a photo pinned
// to course A would leak onto course B's gallery via a shared tag.
export async function getTagMatchedGalleryImages(tags: string[]): Promise<GalleryImage[]> {
  if (tags.length === 0) return [];
  const tagFilter = tags.map((t) => `tags~"${t}"`).join(" || ");
  const filter = `course="" && promotion="" && workshop="" && (${tagFilter})`;
  const res = await pbFetch<{ items: GalleryImage[] }>(
    "collections/gallery_images/records?filter=" + encodeURIComponent(filter) + "&sort=sort_order&perPage=50"
  );
  return res.items;
}

export interface Review {
  id: string;
  author_name: string;
  quote: string;
  rating: number;
  created: string;
}

// Public-facing: approved AND targeted at this specific item only.
export async function getApprovedReviews(type: ItemType, id: string): Promise<Review[]> {
  const res = await pbFetch<{ items: Review[] }>(
    "collections/reviews/records?filter=" +
      encodeURIComponent(`${type}="${id}" && is_approved=true`) +
      "&sort=-created&perPage=50"
  );
  return res.items;
}
