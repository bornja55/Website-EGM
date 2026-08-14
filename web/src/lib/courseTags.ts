// SINGLE SOURCE OF TRUTH for what a course tag MEANS.
//
// PocketBase's `select` field type has no notion of "tag group" — it just
// stores a flat list of allowed strings (see pb_migrations/4 and /5). Which
// column a tag belongs under in the mega-menu, how it's labelled, and how it
// appears in a URL all have to live in application code, and they have to live
// TOGETHER: three separate lists would drift the first time a tag is added.
//
// Anything that needs to reason about tags imports from here — the mega-menu,
// the category index pages, and summaryStats.ts.
//
// URL-safety policy (COURSE_PAGES_PRD.md): Thai script and periods are legal,
// unencoded URL path characters, so `/course/grade/ป.6` needs no slugification.
// ONLY tags containing genuinely unsafe/reserved characters — a space or `&`,
// which today means just "TGAT & A-Level" — get a `slug`. One rule, applied to
// the exceptions, rather than slugifying everything into unreadable URLs.

export type TagGroup = "subject" | "grade" | "exam" | "format";

export interface TagDef {
  /** The exact value stored in PocketBase. Never change without a migration. */
  value: string;
  group: TagGroup;
  /** Overrides the URL segment. Omit when `value` is already URL-safe. */
  slug?: string;
}

export const TAGS: TagDef[] = [
  // รายวิชา
  { value: "ภาษาอังกฤษ", group: "subject" },
  { value: "คณิตศาสตร์", group: "subject" },
  { value: "วิทยาศาสตร์", group: "subject" },
  { value: "ภาษาญี่ปุ่น", group: "subject" },

  // ชั้นปี — fine-grained per a course's real coverage, not banded. A course
  // spanning อ.3-ป.6 carries every one of those grades individually.
  { value: "อ.3", group: "grade" },
  { value: "ป.1", group: "grade" },
  { value: "ป.2", group: "grade" },
  { value: "ป.3", group: "grade" },
  { value: "ป.4", group: "grade" },
  { value: "ป.5", group: "grade" },
  { value: "ป.6", group: "grade" },
  { value: "ม.1", group: "grade" },
  { value: "ม.2", group: "grade" },
  { value: "ม.3", group: "grade" },
  { value: "ม.4", group: "grade" },
  { value: "ม.5", group: "grade" },
  { value: "ม.6", group: "grade" },

  // ติวสอบ — only real, existing exam-prep courses.
  { value: "ติวสอบเข้า ม.1", group: "exam", slug: "entrance-m1" }, // has a space
  { value: "TGAT & A-Level", group: "exam", slug: "tgat-a-level" }, // space + "&"

  // รูปแบบ — cuts across subjects.
  { value: "ตัวต่อตัว", group: "format" },
];

/** Column headings for the mega-menu, in display order. */
export const GROUP_LABELS: Record<TagGroup, string> = {
  subject: "รายวิชา",
  grade: "ชั้นปี",
  exam: "ติวสอบ",
  format: "รูปแบบ",
};

export const GROUP_ORDER: TagGroup[] = ["subject", "grade", "exam", "format"];

const BY_VALUE = new Map(TAGS.map((t) => [t.value, t]));

export function tagSlug(value: string): string {
  return BY_VALUE.get(value)?.slug ?? value;
}

/** Resolve a URL segment back to its stored tag value. */
export function tagFromSlug(group: TagGroup, slug: string): string | null {
  const decoded = decodeURIComponent(slug);
  const match = TAGS.find((t) => t.group === group && (t.slug ?? t.value) === decoded);
  return match?.value ?? null;
}

export function tagHref(value: string): string {
  const def = BY_VALUE.get(value);
  if (!def) return "/course";
  return `/course/${def.group}/${encodeURIComponent(def.slug ?? def.value)}`;
}

export function tagsInGroup(group: TagGroup): TagDef[] {
  return TAGS.filter((t) => t.group === group);
}

export function valuesInGroup(group: TagGroup): string[] {
  return tagsInGroup(group).map((t) => t.value);
}

/**
 * Group headings + their tags, keeping ONLY tags that at least one real course
 * carries. Per the PRD a column with no real content is omitted entirely
 * rather than rendered empty — the menu is a map of what exists, not of the
 * vocabulary.
 */
export function buildMenuGroups(courses: { tags?: string[] | null }[]) {
  const used = new Set(courses.flatMap((c) => c.tags || []));
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    tags: tagsInGroup(group)
      .filter((t) => used.has(t.value))
      .map((t) => ({ value: t.value, href: tagHref(t.value) })),
  })).filter((g) => g.tags.length > 0);
}
