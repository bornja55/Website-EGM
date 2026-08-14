// One-off, IDEMPOTENT seed script — creates the 3 fixed `course_sections`
// records (เหมาะกับใคร / เรียนอะไรบ้าง / รูปแบบการเรียน) for every course,
// promotion, and workshop. See COURSE_PAGES_PRD.md "Phase 1.5" for the design
// and "Phase 1.5 content sourcing findings" for exactly where each fact below
// came from (old site product pages + real Facebook posts, cross-checked by
// date with Siraphob). Nothing here is invented — items with thinner source
// material still only use what was actually found, no filled-in guesses.
//
// Safe to re-run: skips any item that already has course_sections records.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node seed-course-sections.mjs

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
  return (await res.json()).token;
}

async function listAll(token, collection, filter) {
  const qs = filter ? `?filter=${encodeURIComponent(filter)}&perPage=200` : "?perPage=200";
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records${qs}`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).items;
}

async function create(token, collection, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`create ${collection} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

// The 3 fixed headings — copy-pasted identically per PRD "Phase 1.5", never
// re-typed per item.
const H1 = "เหมาะกับใคร";
const H2 = "เรียนอะไรบ้าง";
const H3 = "รูปแบบการเรียน";

// relationField: which of course_sections' 3 relation fields to populate.
const ITEMS = [
  {
    collection: "courses",
    slug: "exclusive-english-mentoring",
    relationField: "course",
    sections: [
      "นักเรียนที่ต้องการพัฒนาภาษาอังกฤษอย่างจริงจังช่วงปิดเทอม เตรียมสอบเข้าโรงเรียนที่มีการแข่งขันสูง (สวนกุหลาบ สามเสน เตรียมอุดมศึกษาพัฒนาการ ฯลฯ) และต้องการความใส่ใจแบบกลุ่มเล็ก",
      "หลักสูตรเข้มข้น 64 ชั่วโมง สอนโดยครูพี่แยมเอง มีสอบวัดระดับก่อนเริ่มเรียนเพื่อแยกห้องตามความสามารถ พร้อม Mock-up test ทุกเดือน รายงานวิเคราะห์ผลรายบุคคล และฟรีสัมภาษณ์ภาษาอังกฤษกับครูต่างชาติเดือนละครั้ง",
      "กลุ่มเล็กจำกัดเพียง 5 คน/คลาส เรียนทุกวันเสาร์ 10:00-15:00 น. รวม 64 ชั่วโมง ราคา 29,800 บาท",
    ],
  },
  {
    collection: "courses",
    slug: "native-speaker",
    relationField: "course",
    sections: [
      "นักเรียนที่มีพื้นฐานภาษาอังกฤษระดับหนึ่งแล้ว และต้องการเร่งสปีดผ่านการฝึกกับครูเจ้าของภาษาโดยตรง",
      "ครูไทยสอนแกรมม่า เขียน อ่าน ในชั่วโมงแรก ต่อด้วยครู Native สอนพูด ฟัง โต้ตอบ ในชั่วโมงถัดไป ครบทุกทักษะภาษาในคลาสเดียว",
      "ทุกวันเสาร์-อาทิตย์ 10:00-12:00 น. (ครูไทย 10:00-11:00 น., ครู Native 11:00-12:00 น.) ราคา 3,200 บาท/เดือน",
    ],
  },
  {
    collection: "courses",
    slug: "japanese",
    relationField: "course",
    sections: [
      "เด็กที่อยากลองหาความชอบและความถนัดของตัวเองผ่านภาษาที่สาม",
      "เริ่มตั้งแต่หัดเขียน คำศัพท์เบื้องต้น การแนะนำตัวเอง และฝึกการฟังผ่านการดูการ์ตูนภาษาญี่ปุ่น การเรียนภาษาที่สนุกสนานยังช่วยพัฒนาสมองซีกขวา (ส่วนควบคุมอารมณ์) และช่วยเรื่องความจำ/สมาธิไปพร้อมกัน",
      "หลักสูตรพื้นฐาน 10 ชั่วโมง ราคา 3,500 บาท เรียนได้ทุกวัย",
    ],
  },
  {
    collection: "courses",
    slug: "private-one-on-one",
    relationField: "course",
    sections: [
      "นักเรียนที่ต้องการเนื้อหาเฉพาะบุคคล ปรับตามเป้าหมายของตัวเอง ไม่ว่าจะเป็นวิชาภาษาอังกฤษ คณิตศาสตร์ หรือวิทยาศาสตร์",
      "สอนคำศัพท์พื้นฐาน แกรมม่า และกิจกรรมเสริม ฝึกคิดวิเคราะห์โจทย์คณิตศาสตร์ ฝึกสังเกต/ทดลองวิทยาศาสตร์ พร้อมช่วยติวการบ้าน เรียนรู้ผ่านเกมเพื่อความเข้าใจที่ลึกขึ้น",
      "เรียนตัวต่อตัวออนไลน์ เลือกได้ 2 แพ็กเกจ — 8 ชั่วโมง 3,500 บาท หรือ 30 ชั่วโมง 10,500 บาท รับชำระผ่านบัตรเครดิต",
    ],
  },
  {
    collection: "courses",
    slug: "entrance-exam-m1",
    relationField: "course",
    sections: [
      "นักเรียนที่เตรียมสอบเข้า ม.1 ทุกแผนการเรียน ทั้งห้องปกติ Intensive EP Gifted และ EISP ควรเริ่มเตรียมตัวล่วงหน้าอย่างน้อย 1 ปี",
      "ตะลุยโจทย์สอบเข้าครบ 3 วิชา (วิทยาศาสตร์ คณิตศาสตร์ อังกฤษ) ฝึกวิเคราะห์ข้อสอบเก่าจากโรงเรียนชื่อดัง เช่น สวนกุหลาบวิทยาลัย สวนกุหลาบนนท์ สามเสน สตรีวิทย์ หอวัง บดินทรเดชา สาธิต มศว. เตรียมอุดมศึกษาพัฒนาการ เครือจุฬาภรณ์ และโพธิสาร พร้อมเฉลยแบบละเอียดและเทคนิคทำข้อสอบให้ทันเวลา",
      "รวม 45 ชั่วโมง ราคา 4,500 บาท พร้อมเอกสาร ใช้ข้อสอบอัพเดททุกปีและข้อสอบเก่าย้อนหลัง 5 ปี",
    ],
  },
  {
    collection: "courses",
    slug: "tgat-a-level",
    relationField: "course",
    sections: [
      "นักเรียนที่เตรียมสอบ TGAT และ A-Level วิชาภาษาอังกฤษ แม้ไม่มีพื้นฐานมาก่อนก็เรียนได้",
      "ครอบคลุมทุก part ของข้อสอบ (Reading, Grammar, Conversation) พร้อมเทคนิคสแกนหาคำตอบโดยไม่ต้องอ่านทั้งเรื่อง และ Mock-up test จับเวลาจริงเพื่อฝึกบริหารเวลาในห้องสอบ",
      "เรียนครั้งละ 2 ชั่วโมง รวม 12 ชั่วโมง ราคา 3,500 บาท เรียนได้ทั้งออนไลน์และ Onsite",
    ],
  },
  {
    collection: "courses",
    slug: "grade-booster-weekend",
    relationField: "course",
    sections: [
      "นักเรียนระดับ ป.1-ป.6 ที่ต้องการเสริมพื้นฐาน 3 วิชาหลักในวันหยุดสุดสัปดาห์",
      "วิชา English สอนเสริมคำศัพท์ Reading Phonics Writing และอ่านจับใจความ, วิชา Math สอนอ่านโจทย์ word problems และคำศัพท์ที่ต้องใช้ตีโจทย์, วิชา Science สอนเนื้อหาตั้งแต่พื้นฐาน เช่น Human body, Animals, Plants, Digestive systems, Good habits, Living thing & Non-living thing",
      "ทุกวันเสาร์และอาทิตย์ 10:00-12:00 น. ราคา 2,000 บาท/เดือน รับชำระผ่านบัตรเครดิต",
    ],
  },
  {
    collection: "courses",
    slug: "grade-booster-weekday",
    relationField: "course",
    sections: [
      "เด็กใน EP, MEP, IEP Program, นักเรียนที่ต้องการปูพื้นฐานด้วยหนังสือ English Math Science ภาษาอังกฤษ, นักเรียนที่ต้องการเร่งสปีดความรู้ก่อนขึ้นประถมปลาย (เนื้อหาจะยากขึ้น) และนักเรียนที่อ่อนแกรมม่า/ตามครูในห้องไม่ทัน ต้องการทบทวนซ้ำพร้อมคำศัพท์เฉพาะที่ใช้ในห้องเรียน",
      "ครบ 3 วิชา วิทยาศาสตร์ คณิตศาสตร์ และภาษาอังกฤษ รับสมัคร ป.1-ป.6 พร้อมเอกสารประกอบการเรียนฟรี",
      "เรียนทุกวันจันทร์-ศุกร์ 16:00-19:00 น. เทอมละ 4,000 บาท รับชำระผ่านบัตรเครดิต",
    ],
  },
  {
    collection: "courses",
    slug: "physics-sunday",
    relationField: "course",
    sections: [
      "นักเรียน ม.4-ม.6 ที่ต้องการเรียนล่วงหน้าตามระดับชั้น เพื่อเพิ่มเกรดในโรงเรียนและปูพื้นฐานเตรียมสอบเข้ามหาวิทยาลัย",
      "ดูแลติวสอบกลางภาคและปลายภาคฟรี รวมถึงช่วยวางแผนเตรียมสอบเข้ามหาวิทยาลัย มีวิดีโอบันทึกการสอนให้ดูย้อนหลังสำหรับนักเรียนที่พลาดคาบเรียนสด",
      "เรียนทุกวันอาทิตย์ แยกตามชั้น — ม.4 09:00-10:30 น., ม.5 10:30-12:00 น., ม.6 13:00-14:30 น. (ตารางอาจปรับเล็กน้อยตามช่วงเปิด-ปิดเทอม) ราคา 6,000 บาท/18 ชั่วโมงต่อภาคเรียน เรียนที่ตลาดบางใหญ่",
    ],
  },
  {
    collection: "courses",
    slug: "genious-summer-intensive",
    relationField: "course",
    sections: [
      "เด็กอายุ 5-7 ขวบ ในช่วงปิดเทอมฤดูร้อน",
      "รอบเช้าเรียน Eng, Science, Math ส่วนรอบบ่ายฝึกทักษะการฟัง การโต้ตอบ การจดโน้ต และอ่านคำศัพท์ Phonetics",
      "จัดปีละครั้งช่วงเดือนเมษายน-พฤษภาคม เรียนวันจันทร์-ศุกร์ เลือกได้ 3 แบบ — รอบเช้า 9:00-12:00 น. 2,500 บาท, รอบบ่าย 13:00-15:00 น. 2,500 บาท, หรือเต็มวัน (รวมอาหารกลางวันและของว่าง) 5,500 บาท",
    ],
  },
  {
    collection: "courses",
    slug: "english-foundation",
    relationField: "course",
    sections: [
      "เด็กอายุ 8-11 ปี ที่ต้องการปูพื้นฐานภาษาอังกฤษ โดยเฉพาะเด็กที่ยังอ่อนภาษาอังกฤษ",
      "ฝึกการอ่านสะกดคำ เสริมคำศัพท์ที่เหมาะสมกับช่วงวัย ฝึกวิเคราะห์เนื้อเรื่องภาษาอังกฤษ พร้อมฟรีหนังสือเรียนมูลค่า 500 บาท",
      "เรียนทุกวันพุธและศุกร์ 17:00-18:00 น. รวม 8 ชั่วโมง/เดือน ราคา 2,400 บาท/เดือน หรือสมัคร 4 เดือนรวด (มิ.ย.-ก.ย.) ลด 15% เหลือ 8,160 บาท",
    ],
  },
  {
    collection: "promotions",
    slug: "online-1on1-990",
    relationField: "promotion",
    sections: [
      "ผู้ที่ต้องการเรียนภาษาอังกฤษแบบตัวต่อตัวออนไลน์ในราคาประหยัด ปรับเนื้อหาตามความต้องการเฉพาะบุคคล",
      "เน้นสอนตามความต้องการของนักเรียน ไม่ว่าจะเป็น conversation, phonics, การบ้าน, เรียนล่วงหน้า, ทบทวนเนื้อหา, สอนตามบทเรียนที่โรงเรียน หรือติวสอบเก็บคะแนน/กลางภาค/ปลายภาค",
      "เรียนผ่าน Google Meet ครั้งละ 1 ชั่วโมง สัปดาห์ละ 1 วัน มีตารางให้เลือก หยุด/ลาไม่ตัดชั่วโมง ลงชดเชยได้ภายในเดือน ราคา 990 บาท เรียนเต็ม 4 ชั่วโมง",
    ],
  },
  {
    collection: "workshops",
    slug: "insect-pinning-workshop",
    relationField: "workshop",
    sections: [
      "เด็กอายุ 7-12 ปี ในโซนบางใหญ่ที่ชอบกิจกรรมลงมือทำ",
      "กิจกรรมสตาฟแมลงเบื้องต้น เปิดประสบการณ์ให้เห็นความสวยงามและความสำคัญของแมลงชนิดต่างๆ ธรรมชาติวิทยา และสิ่งแวดล้อม พร้อมกิจกรรม Art & Craft เกี่ยวกับแมลง เสริมทักษะด้านศิลปะ พัฒนาอารมณ์และสมาธิ",
      "กิจกรรม 1 วัน อบรมโดยวิทยากรผู้เชี่ยวชาญจาก Wanghin Lab จำกัดเพียง 10 ที่ต่อรอบ ราคา 2,599 บาท/ท่าน",
    ],
  },
  {
    collection: "workshops",
    slug: "stem-fun-lab",
    relationField: "workshop",
    sections: [
      "เด็กที่สนใจวิทยาศาสตร์ วิศวกรรม และคณิตศาสตร์ ผ่านการลงมือทำ (Learning by Doing)",
      "กิจกรรมหลากหลาย เช่น Chemistry Fun (ทดลองสไลม์และยาสีฟันช้าง), Young Engineer (สร้างสะพานไม้ไอติมและโครงสร้างตึกจากหลอด), Nature Explorer (จัดสวนขวดแก้ว Terrarium เรียนวงจรชีวิตพืช), Physics in Action (ภูเขาไฟระเบิด เขาวงกตไฟฟ้าและไฟฟ้าสถิต) และ Creative Math ที่ปูพื้นฐานคณิตศาสตร์ให้สนุก",
      "จัดเป็นค่ายซัมเมอร์ 11 วันเต็ม เวลาเรียน 10:00-16:00 น. ราคา 5,500 บาท (ครั้งล่าสุดจัด 21 เม.ย.-8 พ.ค. 2569 — รอรอบใหม่ของปีถัดไปหรือช่วงปิดเทอมย่อย)",
    ],
  },
];

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  const [courses, promotions, workshops, existingSections] = await Promise.all([
    listAll(token, "courses"),
    listAll(token, "promotions"),
    listAll(token, "workshops"),
    listAll(token, "course_sections"),
  ]);
  const byCollection = { courses, promotions, workshops };

  let created = 0;
  let skipped = 0;

  for (const item of ITEMS) {
    const records = byCollection[item.collection];
    const rec = records.find((r) => r.slug === item.slug);
    if (!rec) {
      console.warn(`  ! ${item.collection}/"${item.slug}" not found — skipping.`);
      continue;
    }

    const alreadyHasSections = existingSections.some((s) => s[item.relationField] === rec.id);
    if (alreadyHasSections) {
      console.log(`  (course_sections for ${item.collection}/"${item.slug}" already exist, skipping)`);
      skipped++;
      continue;
    }

    const headings = [H1, H2, H3];
    for (let i = 0; i < 3; i++) {
      await create(token, "course_sections", {
        [item.relationField]: rec.id,
        heading: headings[i],
        body: `<p>${item.sections[i]}</p>`,
        image: null,
        sort_order: i + 1,
      });
    }
    console.log(`  + created 3 sections for ${item.collection}/"${item.slug}"`);
    created++;
  }

  console.log(`\nDone. ${created} items seeded, ${skipped} already had sections.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
