// Shared "รูปแบบการเรียน" summary-row logic for the three product detail page
// types (course / promotion / workshop).
//
// Extracted from course/[slug].astro when the native-speaker template was
// rolled out to every item: promotions and workshops needed the identical
// stat row, and copying ~40 lines into each page would have meant three
// places to fix the next time the tag vocabulary or schedule format changes.
//
// Tag lists come from courseTags.ts — the single source of truth for what a
// tag means. This file briefly kept its own copies; they're derived now so a
// new grade or subject can't appear in the mega-menu but silently miss the
// stat row.

import { valuesInGroup } from "./courseTags";

export const GRADE_TAG_VALUES = valuesInGroup("grade");
export const SUBJECT_TAG_VALUES = valuesInGroup("subject");

export interface SummaryStat {
  label: string;
  value: string;
}

const dash = (v: string | null | undefined) => (v && v.length > 0 ? v : "-");
const baht = (price: number | null | undefined) =>
  price != null ? `${price.toLocaleString()} บาท` : "-";

/**
 * Split a freeform schedule string ("เสาร์-อาทิตย์ 10:00-12:00 น. (...)") into
 * its leading day phrase and first time range, so the stat row can show two
 * short cells instead of the whole sentence.
 *
 * Both halves are real substrings of the stored text, never invented. If a
 * schedule doesn't match this shape the whole string falls back into `day` and
 * `time` is left null rather than guessing — schedule strings are not
 * formatted consistently across items, which is why this is a regex over one
 * field and not two dedicated columns.
 */
export function splitSchedule(schedule: string | null | undefined) {
  if (!schedule) return { day: null as string | null, time: null as string | null };
  const match = schedule.match(/^([^\d]+?)\s*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*น?\.?)/);
  if (!match) return { day: schedule, time: null as string | null };
  return { day: match[1].trim(), time: match[2].trim() };
}

function tagsOfType(tags: string[] | null | undefined, allowed: string[]) {
  return (tags || []).filter((t) => allowed.includes(t));
}

/** Stat row for anything sold as a recurring class: courses and promotions. */
export function buildScheduleStats(item: {
  tags?: string[] | null;
  schedule?: string | null;
  price?: number | null;
}): SummaryStat[] {
  const { day, time } = splitSchedule(item.schedule);
  return [
    { label: "ระดับชั้น", value: dash(tagsOfType(item.tags, GRADE_TAG_VALUES).join(", ")) },
    { label: "วิชา", value: dash(tagsOfType(item.tags, SUBJECT_TAG_VALUES).join(", ")) },
    { label: "วัน", value: dash(day) },
    { label: "เวลาเรียน", value: dash(time) },
    { label: "ราคา", value: baht(item.price) },
  ];
}

/**
 * Stat row for workshops. Deliberately a DIFFERENT set of labels, not the
 * course row with blanks: a workshop is a one-off event, so it has a date and
 * a seat count and no weekly day/time. Cells with no data are dropped entirely
 * rather than shown as "-" — STEM Fun Lab ships with no date, price or seat
 * count this round (it runs occasionally, not annually), and a row of four
 * dashes would read as broken.
 */
export function buildWorkshopStats(item: {
  tags?: string[] | null;
  event_date?: string | null;
  price?: number | null;
  seats_total?: number | null;
}): SummaryStat[] {
  const stats: SummaryStat[] = [];
  const subjects = tagsOfType(item.tags, SUBJECT_TAG_VALUES).join(", ");
  const grades = tagsOfType(item.tags, GRADE_TAG_VALUES).join(", ");

  if (item.event_date) {
    stats.push({
      label: "วันที่จัด",
      value: new Date(item.event_date).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
  }
  if (grades) stats.push({ label: "ระดับชั้น", value: grades });
  if (subjects) stats.push({ label: "วิชา", value: subjects });
  if (item.seats_total) stats.push({ label: "จำนวนที่นั่ง", value: `${item.seats_total} ที่นั่ง` });
  if (item.price != null) stats.push({ label: "ราคา", value: baht(item.price) });

  return stats;
}
