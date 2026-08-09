// One-time content seed. Idempotent-ish — re-running creates duplicates, doesn't
// upsert. Run after the first `pocketbase superuser upsert`.
//
// Usage: source .credentials && node seed.mjs

const PB_URL = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.SUPERUSER_EMAIL;
const PASS = process.env.SUPERUSER_PASS;

async function authAdmin() {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`admin auth failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token;
}

async function create(token, collection, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    console.error(`  ! failed to seed ${collection}:`, await res.text());
    return;
  }
  console.log(`  + ${collection}: ${record.title || record.question || record.name || "ok"}`);
}

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS (source .credentials first).");
    process.exit(1);
  }
  const token = await authAdmin();

  console.log("Seeding site_settings...");
  await create(token, "site_settings", {
    phone: "098 579 5693",
    line_oa_url: "https://lin.ee/REPLACE_WITH_SANDBOX_OA",
    address: "62/35 ซอยบางใหญ่ซิตี้ 9 เสาธงหิน บางบัวทอง นนทบุรี 11140",
    hours: "เปิดทุกวัน",
    company_name_th: "บริษัท อิงลิช เมเนีย จำกัด",
    company_registration_no: "0125568032059",
    facebook_url: "https://www.facebook.com/englishmaniaofficial",
    // Basic Maps embed by address text — no API key needed. Swap for a
    // pinned place-ID embed later if the address ever proves ambiguous.
    google_maps_embed_url: "https://www.google.com/maps?q=" + encodeURIComponent("62/35 ซอยบางใหญ่ซิตี้ 9 เสาธงหิน บางบัวทอง นนทบุรี 11140") + "&output=embed",
  });

  console.log("Seeding services...");
  const services = [
    { title: "เช่าห้องสอน/ประชุม", description: "ห้องเรียนคุณภาพสูง แอร์ กระดานอัจฉริยะ โสตทัศนูปกรณ์ครบ", sort_order: 1 },
    { title: "เรียนกลุ่มที่สถาบัน", description: "หลักสูตรออกแบบโดยผู้เชี่ยวชาญ เรียนร่วมกับเพื่อนๆ", sort_order: 2 },
    { title: "เรียนพิเศษตัวต่อตัว", description: "ปรับให้เข้ากับรูปแบบการเรียนรู้และเป้าหมายของเด็กแต่ละคน", sort_order: 3 },
    { title: "เรียนออนไลน์", description: "ยืดหยุ่นเรื่องเวลา/สถานที่ ผ่าน Google Meet", sort_order: 4 },
  ];
  for (const s of services) await create(token, "services", s);

  console.log("Seeding a sample promotion (from FB)...");
  await create(token, "promotions", {
    title: "เรียนภาษาอังกฤษ Online ตัวต่อตัว 4 ชั่วโมงเต็ม",
    description: "990 บาท จำนวนจำกัด เรียนผ่าน Google Meet ครั้งละ 1 ชม. สัปดาห์ละ 1 วัน",
    price: 990,
    line_link: "https://lin.ee/REPLACE_WITH_SANDBOX_OA",
    is_active: true,
  });

  console.log("Seeding FAQ...");
  await create(token, "faq", {
    question: "เดินทางมาเรียนที่สถาบันสะดวกไหม?",
    answer: "เดินทางสะดวกด้วย MRT ตลาดบางใหญ่ ตรงข้ามเซ็นทรัลเวสเกต",
    sort_order: 1,
  });

  console.log("Done. Remember: replace REPLACE_WITH_SANDBOX_OA with the real sandbox LINE OA link before testing the booking flow.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
