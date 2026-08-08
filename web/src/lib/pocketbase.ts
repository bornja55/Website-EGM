// Plain-fetch wrappers, one per collection — no PocketBase SDK, matching the
// empire-website pattern. Server-side reads use POCKETBASE_URL (internal docker
// network); anything rendered as a public link uses PUBLIC_POCKETBASE_URL.

const PB_URL = import.meta.env.POCKETBASE_URL || "http://127.0.0.1:8090";

async function pbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PB_URL}/api/${path}`);
  if (!res.ok) {
    throw new Error(`PocketBase fetch failed (${res.status}): ${path}`);
  }
  return res.json();
}

export interface SiteSettings {
  phone: string;
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
  sort_order: number;
}

export interface Workshop {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  price: number;
  seats_total: number;
  cover_image: string;
  line_link: string;
  is_active: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  price: number;
  valid_until: string;
  line_link: string;
  is_active: boolean;
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

export async function getActivePromotions(): Promise<Promotion[]> {
  const res = await pbFetch<{ items: Promotion[] }>(
    "collections/promotions/records?filter=" +
      encodeURIComponent("is_active=true") +
      "&sort=-created&perPage=50"
  );
  return res.items;
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
