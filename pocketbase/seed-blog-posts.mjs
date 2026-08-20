// One-off, IDEMPOTENT seed script — populates the previously-empty
// blog_posts collection with the first 3 real articles, per Siraphob's
// go-ahead (2026-08-18) to prioritize evergreen knowledge content over
// verbatim Facebook promo reposts (see project memory / this session's
// FB content survey).
//
// All facts referenced in the article bodies are REAL, pulled live from
// this PocketBase instance this session (not fabricated):
//   - workshops/"insect-pinning-workshop": event_date 2026-08-22, price
//     2599, seats_total 10, instructor "Wanghin Lab", ages 7-12 — from
//     the live record, via workshops?filter=slug="insect-pinning-workshop"
//   - courses/"entrance-exam-m1": duration "45 ชม.", price 4500, and the
//     "ข้อสอบเก่าย้อนหลัง 5 ปี" detail — from summary_note on the live record
// IMPORTANT: the insect-pinning-workshop event_date (2026-08-22) is in
// the FUTURE relative to when this was written (2026-08-18) — this is
// deliberately framed as a "what to expect / how to prepare" preview
// article, NOT a recap of a past session, even though it reuses real
// photos from a previous occurrence of the same recurring workshop
// (sourced from FB, see seed-gallery-images.mjs's own sourcing note).
//
// Images: all real files already in web/public/images/ (no placeholders).
//
// Content bodies demonstrate the 3 apple.com/support-style content
// modules documented in blog/[slug].astro's style block comment
// (.content-split / .content-explore / .content-highlights) — this is
// the reference/first real usage of all three in production content.
//
// Safe to re-run: skips any post whose slug already exists.
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node seed-blog-posts.mjs

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

async function findOne(token, collection, filter) {
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`,
    { headers: { Authorization: token } }
  );
  if (!res.ok) throw new Error(`list ${collection} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.items[0] || null;
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

// --- posts -------------------------------------------------------------

const POSTS = [
  {
    title: "สรุปหลักแกรมม่าเบื้องต้น ป.4-6 ที่ต้องรู้ก่อนสอบเข้า ม.1",
    slug: "grammar-summary-p4-6-before-m1-exam",
    excerpt:
      "รวมหลักแกรมม่าที่เจอบ่อยที่สุดในข้อสอบเข้า ม.1 อธิบายง่ายๆ พร้อมตัวอย่างประโยคที่ใช้ได้จริง",
    cover_image: "/images/classroom.jpg",
    published_at: "2026-08-08 00:00:00.000Z",
    content: `
<p>เด็กๆ ที่เตรียมสอบเข้า ม.1 มักเจอโจทย์แกรมม่าซ้ำกันแทบทุกปี บทความนี้รวบรวมหลักแกรมม่าที่ออกสอบบ่อยที่สุด อธิบายแบบเข้าใจง่าย ไม่ต้องท่องจำเยอะ พร้อมตัวอย่างประโยคที่ใช้ได้จริง</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>Present Perfect ใช้เมื่อไหร่</h3>
    <p>โครงสร้าง Subject + have/has + V3 ใช้พูดถึงเหตุการณ์ที่เริ่มในอดีตแต่ยังเกี่ยวข้องกับปัจจุบัน หรือเพิ่งเกิดขึ้นโดยไม่ระบุเวลาที่ชัดเจน เช่น "I have already finished my homework." สังเกตคำสัญญาณอย่าง already, yet, just, ever, never — เจอคำเหล่านี้ในโจทย์ให้นึกถึง Present Perfect ไว้ก่อน</p>
  </div>
  <div class="content-split-media">
    <img src="/images/classroom.jpg" alt="นักเรียนกำลังทำแบบฝึกหัดแกรมม่าในห้องเรียน English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>Present Simple vs Present Continuous</h3>
    <p>Present Simple ใช้กับสิ่งที่ทำเป็นประจำหรือความจริงทั่วไป ส่วน Present Continuous ใช้กับสิ่งที่กำลังทำอยู่ตอนนี้ จุดที่เด็กสับสนบ่อยที่สุดคือกริยาที่แสดงความรู้สึกหรือความคิด เช่น like, want, know, understand ปกติแล้วกริยากลุ่มนี้จะไม่ใช้รูป -ing แม้จะพูดถึงตอนนี้ก็ตาม</p>
  </div>
  <div class="content-split-media">
    <img src="/images/services-tutoring.jpg" alt="ครูสอนพิเศษกำลังอธิบายไวยากรณ์ภาษาอังกฤษให้นักเรียน" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-writing-01.jpg" alt="นักเรียนฝึกเขียนประโยคภาษาอังกฤษ" />
    </div>
    <h4>ฝึกแต่งประโยคเองทุกวัน</h4>
    <p>วันละ 2-3 ประโยคต่อ tense ช่วยให้จำโครงสร้างได้แม่นกว่าท่องจำกฎเฉยๆ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-teens-01.jpg" alt="บรรยากาศคลาสติวสอบเข้า ม.1 ที่ English Mania" />
    </div>
    <h4>ตะลุยโจทย์แบบจับเวลา</h4>
    <p>คลาสติวสอบเข้า ม.1 ที่ English Mania เน้นกลุ่มเล็ก ฝึกทำโจทย์จับเวลาให้คุ้นชินกับสนามสอบจริง</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปประเด็นสำคัญก่อนเข้าห้องสอบ</h3>
    <p>อ่านทวนหลักแกรมม่าในบทความนี้ให้ครบ แล้วลองทำโจทย์ตัวอย่างซ้ำจนคล่อง ไม่ต้องท่องจำทุกกฎ แค่จำ "สัญญาณคำ" ที่บอกว่าโจทย์ต้องการ tense ไหน เช่น already/yet บอก Present Perfect, now บอก Present Continuous</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>เด็กมักผสม Present Perfect กับ Past Simple สลับกัน เมื่อโจทย์มีคำระบุเวลาชัดเจน เช่น yesterday, last week, in 2020 ต้องใช้ Past Simple เท่านั้น ห้ามใช้ have/has</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">💡</span>
      <h3>เคล็ดลับ</h3>
      <p>ขีดเส้นใต้คำสัญญาณเวลาทุกครั้งก่อนตอบโจทย์</p>
    </div>
  </div>
</div>

<p>อยากได้แบบฝึกหัดเพิ่มเติมและตะลุยโจทย์แบบจับเวลาจริง คอร์สสอบเข้า ม.1 ของ English Mania รวม 45 ชั่วโมง ครบทุกวิชา พร้อมข้อสอบเก่าย้อนหลัง 5 ปี</p>
`.trim(),
  },
  {
    title: "Insect Pinning Workshop เด็กจะได้เรียนอะไรบ้าง เตรียมตัวยังไงก่อนไป",
    slug: "insect-pinning-workshop-what-to-expect",
    excerpt:
      "พาไปดูเวิร์กช็อปสตาฟแมลงเพื่อเด็ก 7-12 ปี รอบ 22 สิงหาคมนี้ สอนโดยวิทยากรจาก Wanghin Lab ที่นั่งจำกัดเพียง 10 ที่",
    cover_image: "/images/workshops/insect-pinning-specimen.jpg",
    published_at: "2026-08-15 00:00:00.000Z",
    content: `
<p>Insect Pinning Workshop เวิร์กช็อปวิทยาศาสตร์แมลงสำหรับเด็ก 7-12 ปี รอบล่าสุดจัดวันที่ 22 สิงหาคม 2569 อบรมโดยวิทยากรจาก Wanghin Lab เรียนรู้ผ่านภาษาอังกฤษ ที่นั่งจำกัดเพียง 10 ที่ต่อรอบ บทความนี้พาไปดูว่าเด็กจะได้เรียนอะไรบ้าง และควรเตรียมตัวยังไง</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>เด็กจะได้เรียนอะไรบ้าง</h3>
    <p>กิจกรรมหลักคือการสตาฟแมลงจริง (insect pinning) ตั้งแต่การจัดท่าทาง ปักหมุด ไปจนถึงจัดเก็บในกล่องสเปคิเมนอย่างถูกวิธี เด็กจะได้เรียนรู้ทั้งทักษะทางวิทยาศาสตร์และคำศัพท์ภาษาอังกฤษที่เกี่ยวข้องไปพร้อมกัน</p>
  </div>
  <div class="content-split-media">
    <img src="/images/workshops/insect-pinning-craft.jpg" alt="เด็กกำลังลงมือสตาฟแมลงในกิจกรรม Insect Pinning Workshop" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>ทำไมต้องลงมือทำเอง ไม่ใช่แค่ดูรูป</h3>
    <p>การได้จับชิ้นงานจริงช่วยฝึกกล้ามเนื้อมัดเล็ก สมาธิ และความละเอียดรอบคอบ ซึ่งเป็นทักษะที่หาไม่ได้จากการดูวิดีโอหรืออ่านหนังสือเพียงอย่างเดียว วิทยากรจาก Wanghin Lab จะดูแลใกล้ชิดตลอดกิจกรรมเพื่อความปลอดภัย</p>
  </div>
  <div class="content-split-media">
    <img src="/images/workshops/insect-pinning-specimen.jpg" alt="กล่องสเปคิเมนแมลงที่จัดเก็บเรียบร้อยจากกิจกรรม" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/insect-class-01.jpg" alt="บรรยากาศห้องเรียนกิจกรรม Insect Pinning Workshop รอบก่อนหน้า" />
    </div>
    <h4>บรรยากาศห้องเรียนจริง</h4>
    <p>กลุ่มเล็กไม่เกิน 10 คน วิทยากรดูแลทั่วถึงทุกโต๊ะ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/insect-craft-01.jpg" alt="เด็กกำลังตั้งใจทำกิจกรรมสตาฟแมลง" />
    </div>
    <h4>ลงมือทำทุกขั้นตอนเอง</h4>
    <p>ตั้งแต่จัดท่าทางแมลงไปจนถึงเขียนป้ายชื่อสเปคิเมน</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปก่อนสมัครเข้าร่วม</h3>
    <p>วันที่ 22 สิงหาคม 2569 ราคา 2,599 บาทต่อท่าน กิจกรรม 1 วัน จำกัดเพียง 10 ที่นั่งต่อรอบ สอนผ่านภาษาอังกฤษ เหมาะสำหรับเด็กอายุ 7-12 ปี</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ควรเตรียมตัวมาแบบไหน</h3>
      <p>แต่งกายสบายๆ เผื่อเปื้อนได้ ไม่จำเป็นต้องมีพื้นฐานวิทยาศาสตร์มาก่อน วิทยากรจะสอนตั้งแต่ขั้นพื้นฐาน</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🔬</span>
      <h3>เหมาะกับใคร</h3>
      <p>เด็กที่ชอบธรรมชาติ สัตว์ หรืออยากลองกิจกรรมแนว STEM</p>
    </div>
  </div>
</div>

<p>ที่นั่งจำกัดเพียง 10 ที่ต่อรอบ สนใจจองที่ผ่าน LINE ก่อนที่นั่งเต็ม</p>
`.trim(),
  },
  {
    title: "เตรียมสอบเข้า ม.1 ห้อง EP ต้องทำอะไรบ้าง เช็กลิสต์ฉบับผู้ปกครอง",
    slug: "prepare-for-m1-entrance-exam-checklist",
    excerpt:
      "เช็กลิสต์เตรียมตัวสำหรับผู้ปกครองและนักเรียนที่วางแผนสอบเข้า ม.1 ทั้งห้องปกติและห้อง EP",
    cover_image: "/images/courses/entrance-exam-m1.jpg",
    published_at: "2026-08-01 00:00:00.000Z",
    content: `
<p>การสอบเข้า ม.1 ไม่ได้วัดแค่ความรู้วิชาการ แต่รวมถึงการเตรียมตัวด้านการจัดการเวลาและสภาพจิตใจด้วย บทความนี้รวบรวมเช็กลิสต์ที่ผู้ปกครองและนักเรียนควรเตรียมก่อนสอบเข้า ม.1 ทั้งห้องเรียนปกติและห้อง EP</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>เตรียมเนื้อหาวิชาการให้ครบ</h3>
    <p>คอร์สสอบเข้า ม.1 ของ English Mania รวม 45 ชั่วโมง ครบทุกวิชาที่ออกสอบ พร้อมเอกสารประกอบและข้อสอบเก่าย้อนหลัง 5 ปี ช่วยให้เห็นแนวข้อสอบจริงก่อนลงสนามสอบ</p>
  </div>
  <div class="content-split-media">
    <img src="/images/courses/entrance-exam-m1.jpg" alt="เอกสารและตำราติวสอบเข้า ม.1" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>ฝึกทำข้อสอบแบบจับเวลาให้คุ้นเคย</h3>
    <p>สนามสอบจริงมีเวลาจำกัด การฝึกทำโจทย์แบบจับเวลาสม่ำเสมอช่วยลดความตื่นเต้นและฝึกการบริหารเวลาทำข้อสอบ ควรเริ่มฝึกอย่างน้อย 2-3 เดือนก่อนสอบจริง</p>
  </div>
  <div class="content-split-media">
    <img src="/images/services-tutoring.jpg" alt="นักเรียนกำลังฝึกทำข้อสอบแบบจับเวลา" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/classroom.jpg" alt="บรรยากาศห้องเรียนติวสอบเข้า ม.1 กลุ่มเล็ก" />
    </div>
    <h4>จัดตารางอ่านหนังสือล่วงหน้า</h4>
    <p>แบ่งเวลาให้ครบทุกวิชา ไม่ทิ้งวิชาใดวิชาหนึ่งไว้ท้ายสุด</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-lowtable-01.jpg" alt="เด็กกำลังทบทวนบทเรียนก่อนสอบ" />
    </div>
    <h4>เตรียมสภาพจิตใจให้พร้อม</h4>
    <p>พักผ่อนให้เพียงพอ ไม่หักโหมอ่านหนังสือดึกก่อนวันสอบ</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>เช็กลิสต์ก่อนสอบเข้า ม.1</h3>
    <p>ทบทวนเนื้อหาให้ครบทุกวิชา ฝึกทำข้อสอบเก่าแบบจับเวลา เตรียมเอกสารสมัครสอบให้พร้อมล่วงหน้า และพักผ่อนให้เพียงพอก่อนวันสอบจริง ไม่ว่าจะสมัครห้องเรียนปกติหรือห้อง EP หลักการเตรียมตัวก็ไม่ต่างกันมาก</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>อย่าเพิ่งเปลี่ยนวิธีอ่านหนังสือใกล้วันสอบ ให้ใช้วิธีที่ฝึกซ้อมมาแล้วเท่านั้น เพื่อลดความเสี่ยงจากความไม่คุ้นเคย</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">📋</span>
      <h3>เคล็ดลับ</h3>
      <p>เตรียมเอกสารสมัครสอบให้ครบก่อนกำหนดอย่างน้อย 1 สัปดาห์</p>
    </div>
  </div>
</div>

<p>สนใจติวเข้มครบทุกวิชาก่อนสอบเข้า ม.1 คอร์สของ English Mania รวม 45 ชั่วโมง ราคา 4,500 บาท พร้อมข้อสอบเก่าย้อนหลัง 5 ปี</p>
`.trim(),
  },
];

async function main() {
  if (!EMAIL || !PASS) {
    console.error("Set SUPERUSER_EMAIL / SUPERUSER_PASS first.");
    process.exit(1);
  }
  const token = await authAdmin();

  for (const post of POSTS) {
    const existing = await findOne(token, "blog_posts", `slug="${post.slug}"`);
    if (existing) {
      console.log(`  (skip) "${post.title}" — slug "${post.slug}" already exists`);
      continue;
    }
    await create(token, "blog_posts", post);
    console.log(`  + created "${post.title}"`);
  }

  console.log("\nDone. Reload /blog — the 3 articles should now appear, newest first:");
  POSTS.slice()
    .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
    .forEach((p) => console.log(`  - /blog/${p.slug}/  (${p.published_at.slice(0, 10)})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
