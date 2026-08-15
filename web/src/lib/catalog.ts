// Normalises the three sellable things — courses, promotions, workshops — into
// one shape so a single grid can list them together.
//
// /course used to show `courses` only, but the mega-menu offers all three, so
// anyone arriving at the catalog from the menu found a page that was missing
// what the menu had just advertised. They stay separate COLLECTIONS (different
// fields, different lifecycles — see COURSE_PAGES_PRD.md) and separate URL
// spaces; this is a view-layer join, not a data model change.

import type { Course, Promotion, Workshop } from "./pocketbase";

export interface CatalogItem {
  href: string;
  title: string;
  tagline: string;
  image: string;
  price: number | null;
  /** Corner label. Absent for plain courses — the unlabelled card is the norm. */
  badge?: string;
  /** Subject/grade/exam/format tags — courses only. Promotion/workshop tags
      exist in PocketBase too, but are a gallery-image matching pool (see
      pocketbase.ts's migration 5 comment), not this same category vocabulary,
      so they're deliberately left off here rather than mixed in. Drives the
      /course search+filter bar (course/index.astro). */
  tags?: string[];
}

export function courseToItem(c: Course): CatalogItem {
  return {
    href: `/course/${c.slug}`,
    title: c.title,
    tagline: c.tagline,
    image: c.image,
    price: c.price ?? null,
    // Migration 10 — opt-in, unlike promotion/workshop's hardcoded label
    // below: most courses have none, and CourseGrid only widens a tile when
    // this is truthy, so an un-flagged course renders exactly as before.
    badge: c.badge || undefined,
    tags: c.tags || [],
  };
}

export function promotionToItem(p: Promotion): CatalogItem {
  return {
    href: `/promotions/${p.slug}`,
    title: p.title,
    tagline: p.tagline,
    image: p.image,
    price: p.price ?? null,
    badge: "โปรโมชั่น",
  };
}

export function workshopToItem(w: Workshop): CatalogItem {
  return {
    href: `/workshops/${w.slug}`,
    title: w.title,
    tagline: w.tagline,
    image: w.cover_image,
    price: w.price ?? null,
    // Badged for the same reason promotions are: these cards link OUT of
    // /course/* into /workshops/*, and a one-off event priced per seat is not
    // the same purchase as a monthly class. An unlabelled card would hide both.
    badge: "Workshop",
  };
}

/**
 * Catalog order: promotions, then courses, then workshops.
 *
 * Promotions lead because they are the time-limited offer — the thing that
 * stops being true if it's buried. Workshops trail because they're one-off
 * events, not the standing catalog a visitor came to browse.
 */
export function buildCatalog(
  promotions: Promotion[],
  courses: Course[],
  workshops: Workshop[]
): CatalogItem[] {
  return [
    ...promotions.map(promotionToItem),
    ...courses.map(courseToItem),
    ...workshops.map(workshopToItem),
  ];
}
