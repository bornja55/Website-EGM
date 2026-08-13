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
  // Address/email confirmed 2026-08-11 directly from the old live site's
  // /contact page (https://ballevrtgab.makeweb.co/contact) via browser —
  // NOT the same address as an earlier (wrong) guess: it's เขตบางใหญ่, not
  // บางบัวทอง.
  const REAL_ADDRESS = "62/35 ถนนบางใหญ่ซิตี้ ซอย 9, ตำบลเสาธงหิน, เขตบางใหญ่, นนทบุรี 11140";
  await create(token, "site_settings", {
    phone: "098 579 5693",
    email: "englishmaniabkk@gmail.com",
    line_oa_url: "https://lin.ee/REPLACE_WITH_SANDBOX_OA",
    address: REAL_ADDRESS,
    hours: "เปิดทุกวัน",
    company_name_th: "บริษัท อิงลิช เมเนีย จำกัด",
    company_registration_no: "0125568032059",
    facebook_url: "https://www.facebook.com/englishmaniaofficial",
    // Basic Maps embed by address text — no API key needed. Swap for a
    // pinned place-ID embed later if the address ever proves ambiguous.
    google_maps_embed_url: "https://www.google.com/maps?q=" + encodeURIComponent(REAL_ADDRESS) + "&output=embed",
  });

  console.log("Seeding services (real subject catalog from old site's footer menu)...");
  const services = [
    // ภาษาอังกฤษ
    { category: "ภาษาอังกฤษ", title: "ปรับพื้นฐาน", description: "ปูพื้นฐานภาษาอังกฤษให้แน่น เหมาะกับผู้เริ่มต้นหรือต้องการทบทวน", sort_order: 1 },
    { category: "ภาษาอังกฤษ", title: "เรียนกลุ่ม ตามระดับ", description: "เรียนเป็นกลุ่มเล็ก แบ่งตามระดับความสามารถ", sort_order: 2 },
    { category: "ภาษาอังกฤษ", title: "เรียนส่วนตัว", description: "ตัวต่อตัว ออกแบบบทเรียนตามเป้าหมายของผู้เรียนแต่ละคน", sort_order: 3 },
    { category: "ภาษาอังกฤษ", title: "ติวสอบ TOEIC/IELTS/Toefl", description: "เตรียมสอบวัดระดับนานาชาติ กับติวเตอร์ผู้เชี่ยวชาญ", sort_order: 4 },
    // คณิตศาสตร์
    { category: "คณิตศาสตร์", title: "ประถม", description: "คณิตศาสตร์ระดับประถมศึกษา", sort_order: 5 },
    { category: "คณิตศาสตร์", title: "มัธยมต้น", description: "คณิตศาสตร์ระดับมัธยมศึกษาตอนต้น", sort_order: 6 },
    { category: "คณิตศาสตร์", title: "มัธยมปลาย", description: "คณิตศาสตร์ระดับมัธยมศึกษาตอนปลาย", sort_order: 7 },
    { category: "คณิตศาสตร์", title: "ติวสอบ", description: "ติวเข้มเตรียมสอบคณิตศาสตร์ทุกระดับชั้น", sort_order: 8 },
    // วิทยาศาสตร์
    { category: "วิทยาศาสตร์", title: "ประถม", description: "วิทยาศาสตร์ระดับประถมศึกษา", sort_order: 9 },
    { category: "วิทยาศาสตร์", title: "มัธยมต้น", description: "วิทยาศาสตร์ระดับมัธยมศึกษาตอนต้น", sort_order: 10 },
    { category: "วิทยาศาสตร์", title: "มัธยมปลาย", description: "วิทยาศาสตร์ระดับมัธยมศึกษาตอนปลาย", sort_order: 11 },
    { category: "วิทยาศาสตร์", title: "ติวสอบ", description: "ติวเข้มเตรียมสอบวิทยาศาสตร์ทุกระดับชั้น", sort_order: 12 },
    // อื่นๆ
    { category: "อื่นๆ", title: "Digital Marketing | LINE OA", description: "อบรมการตลาดดิจิทัลและการใช้งาน LINE Official Account", sort_order: 13 },
    { category: "อื่นๆ", title: "เช่า Co-Working Space / ห้องประชุม", description: "ห้องเรียนคุณภาพสูง แอร์ กระดานอัจฉริยะ โสตทัศนูปกรณ์ครบ ให้เช่ารายชั่วโมง", sort_order: 14 },
    { category: "อื่นๆ", title: "แปลเอกสาร ราชการ/วิจัย/บทความ", description: "บริการแปลเอกสารราชการ งานวิจัย และบทความ", sort_order: 15 },
    { category: "อื่นๆ", title: "คอร์สการสนทนาทางธุรกิจ (ภาษาอังกฤษ)", description: "ภาษาอังกฤษเพื่อการสื่อสารในที่ทำงานและธุรกิจ", sort_order: 16 },
    { category: "อื่นๆ", title: "ตะลุยสอบ ด่วนพิเศษ", description: "คอร์สติวเข้มก่อนสอบ 10-20 ชม./อาทิตย์", sort_order: 17 },
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

  console.log("Seeding real named courses (confirmed 2026-08-11 from old site's /course page)...");
  const courses = [
    { title: "Exclusive English Mentoring by English Mania", description: "คอร์ส Summer 68 — 29,800 บาท / 64 ชม. เรียนวันเสาร์ 10:00-15:00 น.", price: 29800 },
    { title: "คอร์ส Native Speaker (อา)", description: "เรียนกับเจ้าของภาษา วันอาทิตย์ 3,500 บาท/เดือน", price: 3500 },
    { title: "คอร์สภาษาญี่ปุ่น", description: "ภาษาญี่ปุ่นพื้นฐาน 3,500 บาท / 10 ชั่วโมง", price: 3500 },
    { title: "คอร์สออนไลน์ตัวต่อตัว", description: "Private คอร์สตัวต่อตัว 3,500 บาท / 8 ชั่วโมง", price: 3500 },
    { title: "คอร์สสอบเข้า ม.1", description: "ติวสอบเข้า ม.1 4,500 บาท / 45 ชั่วโมง", price: 4500 },
    { title: "คอร์ส TGAT & A-Level", description: "เตรียมสอบ TGAT & A-Level 3,500 บาท / 12 ชั่วโมง", price: 3500 },
    { title: "คอร์สเพิ่มเกรด เสริมทักษะ (ส-อา)", description: "อ.3 - ป.6 เรียนวันเสาร์-อาทิตย์ 2,800 บาท/เดือน", price: 2800 },
    { title: "คอร์สเพิ่มเกรด เสริมทักษะ (จ-ศ)", description: "ป.1 - ป.6 เรียนวันจันทร์-ศุกร์ 4,000 บาท/เทอม", price: 4000 },
    { title: "คอร์สฟิสิกส์ (อา)", description: "ฟิสิกส์ ม.4-ม.6 เรียนวันอาทิตย์ 2,800 บาท/เดือน", price: 2800 },
  ];
  for (const c of courses) {
    await create(token, "promotions", {
      ...c,
      line_link: "https://lin.ee/REPLACE_WITH_SANDBOX_OA",
      is_active: true,
    });
  }

  console.log("Seeding a real workshop (from Facebook, per PRD.md)...");
  // Found the actual promo flyer in the FB photo export
  // (FB raw/Export_1786443238_452bc550/image_001.jpg): age range 7-12,
  // instructor from "Wanghin Lab", exactly 10 seats, one day 10:00-15:00.
  // The 25 July photos in that export were from an earlier session that
  // already ran. User confirmed 2026-08-22 (22 ส.ค. 2569) as the next real
  // session date on 2026-08-11 — using that, not a guess.
  await create(token, "workshops", {
    title: "Insect Pinning Workshop",
    slug: "insect-pinning-workshop",
    description: "เวิร์กช็อปวิทยาศาสตร์แมลง สตาฟแมลงจริง สำหรับเด็ก 7-12 ปี อบรมโดยวิทยากรจาก Wanghin Lab เรียนรู้ผ่านภาษาอังกฤษ ที่นั่งจำกัดเพียง 10 ที่",
    // Real price confirmed in PRD.md and the FB promo flyer — do NOT use the
    // 1,500฿ figure from the Stitch mockup, that was an invented placeholder.
    price: 2599,
    seats_total: 10,
    event_date: "2026-08-22",
    is_active: true,
    line_link: "https://lin.ee/REPLACE_WITH_SANDBOX_OA",
    // Real photo from the 25 July 2026 Insect Pinning Workshop, business's
    // own Facebook photo export — a real pinned specimen next to the
    // student's own painted-wing craft, not a stock/placeholder image.
    cover_image: "/images/workshops/insect-pinning-specimen.jpg",
  });

  console.log("Seeding testimonials (real Google/Facebook review screenshots, found");
  console.log("2026-08-11 in OneDrive/English Mania Ball/Web/รีวิว/ — replaces the earlier");
  console.log("achievement-based stand-ins now that real review TEXT is available)...");
  const reviews = [
    { author_name: "Cha Pong", source: "google", rating: 5, quote: "พ่อเคยเรียนออนไลน์ กับครูแยม สอนดี มีความใจเย็น ราคาไม่แพง เลยแนะนำให้เจ้าลูกชาย ติวสอบเข้า EP สวนกุหลาบ แล้วก็ไม่ผิดหวังเลยครับ ลูกชายสอบเข้าได้ แล้วก็ยังเรียนกับสถาบันต่อเนื่องครับ ขอบคุณสถาบันฯคุณภาพครับ" },
    { author_name: "Pakkapon Sukseeta", source: "google", rating: 5, quote: "เด็กๆเรียนติวที่นี้ รู้สึกประทับใจและมีการสอนที่ดี เข้าใจง่าย (เรียนตั้งแต่ออนไลน์ยาวนานต่อเนื่องมาเลย)" },
    { author_name: "ปัญจมา กวางติ๊ด", source: "google", rating: 5, quote: "คุณครูสอนเข้าใจง่าย ลูกสาวเรียนเข้าใจเนื้อหามากขึ้นค่ะ" },
    { author_name: "Nu Yotmokhi", source: "facebook", rating: 5, quote: "คุณครูแยม เป็นติวเตอร์ได้ดีมาก กันเอง และทำให้ผู้เรียนไม่เกิดความเกร็งในการเรียน ได้รับความรู้ใหม่ๆเยอะมากๆเลยครับ" },
    { author_name: "Pawan Keard", source: "facebook", rating: 5, quote: "คุณครูสอนได้ตามเป้าหมายของเราและเข้าใจเด็กมากๆ" },
  ];
  for (const r of reviews) await create(token, "testimonials", r);

  console.log("Seeding tutors (real roster, from OneDrive/English Mania Ball/Web/ติวเตอร์/");
  console.log("profile graphics — credentials transcribed as-is from each card)...");
  const tutors = [
    {
      name: "ครูพี่แยม",
      photo: "/images/tutors/kruyam2.jpg",
      education: "บริหารธุรกิจระหว่างประเทศ มหาวิทยาลัยรังสิต (หลักสูตรนานาชาติ) / Hospitality Management, Hospitality Singapore",
      subjects: "English, Math, Science, Interview for Admission",
      credentials: "<ul><li>ประสบการณ์สอนมากกว่า 7 ปี</li><li>สอนตัวต่อตัวและแบบกลุ่ม 3-10 คน</li><li>สอนสนทนาระดับผู้บริหาร และภาษาอังกฤษสำหรับองค์กร</li><li>ติวสอบเข้า TOEIC, IELTS</li><li>Math, Science, Health, Social, Reading (เฉพาะ EP และนานาชาติ)</li><li>แปลเอกสารราชการ ใบ Cert. รายงานจบมหาวิทยาลัย งานวิจัย บทคัดย่อ (พร้อมเซ็นต์รับรอง)</li></ul>",
      sort_order: 1,
    },
    {
      name: "ติวเตอร์ปุยฝ้าย",
      photo: "/images/tutors/puifai.jpg",
      education: "คณะศึกษาศาสตร์ (หลักสูตร 5 ปี) มหาวิทยาลัยนานาชาติเซนต์เทเรซา",
      subjects: "ภาษาอังกฤษ, ภาษาไทย",
      credentials: "<ul><li>อาจารย์ ร.ร.สวนกุหลาบรังสิต</li><li>ติวเตอร์สถาบันกวดวิชา ระดับ ป.1-ม.6 (5 ปี)</li><li>ติวเนื้อหาและติวสอบ หอวังฯ บดินทรฯ สกร. สปร. และอื่นๆ</li><li>ติวเนื้อหาและติวสอบ มข. มก.ศรช ม.กรุงเทพ และอื่นๆ</li><li>รองผู้จัดการ และหัวหน้าฝ่ายลูกค้าสัมพันธ์ สถาบันกวดวิชา</li><li>เกรด A วิชา Language and Culture for Teacher, Public Speaking, Paragraph Reading</li></ul>",
      sort_order: 2,
    },
    {
      name: "ติวเตอร์นุ๊ก",
      photo: "/images/tutors/nook.jpg",
      education: "คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
      subjects: "Math (ประถม-มัธยม), Science (ประถม-มัธยม)",
      credentials: "<ul><li>เกียรตินิยมอันดับ 2</li><li>เน้นสอนด้วยความใจเย็น เน้นเข้าใจมากกว่าจำ</li><li>ปรับหลักสูตรให้เหมาะสมกับผู้เรียน</li><li>Portfolio specialist ที่ธนาคาร</li><li>ประสบการณ์สอนมากกว่า 5 ปี</li><li>ทริคและเทคนิคตีโจทย์ข้อสอบ</li></ul>",
      sort_order: 3,
    },
    {
      name: "ติวเตอร์บี๋",
      photo: "/images/tutors/bee.jpg",
      education: "คณะศึกษาศาสตร์ (ภาษาอังกฤษ) มหาวิทยาลัยราชภัฏเชียงใหม่ / TESOL Cert., International House (Sydney)",
      subjects: "English, TOEIC, English for Business",
      credentials: "<ul><li>มีใบอนุญาต TESOL Cert.</li><li>สอนภาษาอังกฤษออนไลน์ให้ผู้เรียนรุ่นเยาว์และผู้ใหญ่ทุกวัย</li><li>สอนตั้งแต่ Foundation จนถึง Advance</li><li>สอนภาษาอังกฤษธุรกิจตั้งแต่พื้นฐานจนถึงระดับสูง</li><li>ปรับรูปแบบการสอนสำหรับนักเรียนที่มีความต้องการพิเศษ</li><li>ได้รางวัลครูยอดเยี่ยมจากสถาบัน Kynaforkids 2 ปีติดต่อกัน</li></ul>",
      sort_order: 4,
    },
    {
      name: "ติวเตอร์กัญ",
      photo: "/images/tutors/kan.jpg",
      education: "คณะสัตวแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
      subjects: "ภาษาอังกฤษ, ชีววิทยา, คณิตศาสตร์, สังคม, วิทยาศาสตร์, ภาษาไทย",
      credentials: "<ul><li>TOEIC 700 คะแนน, IELTS 5.5, TOEFL iTP 503</li><li>หัวหน้าชั้นปี คณะสัตวแพทยศาสตร์</li><li>GPAX 6 เทอม 3.68</li><li>เกรด A วิชา EXP ENG II ของมหาวิทยาลัย</li><li>รางวัลชนะเลิศแต่งคำประพันธ์อวยพรปีใหม่แด่พณฯ องคมนตรีและนายกรัฐมนตรีของโรงเรียน</li></ul>",
      sort_order: 5,
    },
    {
      name: "ติวเตอร์ฝน",
      photo: "/images/tutors/fon.jpg",
      education: "คณะครุศาสตร์ (เอกอังกฤษ) มหาวิทยาลัยราชภัฏนครราชสีมา",
      subjects: "English, Math, Science",
      credentials: "<ul><li>เกียรตินิยมอันดับ 1 (3.98)</li><li>นักเรียนแลกเปลี่ยนที่ปุตราจายา มาเลเซีย</li><li>ล่ามให้คณะอาจารย์จาก James Cook ออสเตรเลีย และสิงคโปร์โพลีเทคนิค</li><li>ล่ามให้มหาวิทยาลัยอื่นๆ ในอาเซียน</li><li>แปลภาษาไทย-อังกฤษ / อังกฤษ-ไทย</li><li>อาจารย์ภาษาอังกฤษ ร.ร. สอนภาษานานาชาติ</li></ul>",
      sort_order: 6,
    },
    {
      name: "ติวเตอร์เน็ต",
      photo: "/images/tutors/net.jpg",
      education: "สาขาวิทยาศาสตร์ มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา",
      subjects: "Math, คณิต, จินตคณิต, ฟิสิกส์",
      credentials: "<ul><li>สอนมัธยมปลาย โรงเรียนเทพศิรินทร์ นนทบุรี</li><li>สอนพิเศษในสถาบันย่านพระราม 2 ระดับชั้นอนุบาล</li><li>สอนพิเศษในสถาบันกวดวิชามโนทัศน์ สาขาสำโรง ระดับชั้นอนุบาล 3 ถึงมัธยมต้น</li><li>สอนเสริม/ติวสอบให้นักเรียนโรงเรียนจังหวัดชุมพร ระดับประถม-มัธยมต้น</li><li>Math Camp ม.1-3 วัดพุทธบูชา, Math Camp ป.1-6 คาเบรียลอุปถัมภ์</li></ul>",
      sort_order: 7,
    },
    {
      name: "ติวเตอร์แพรว",
      photo: "/images/tutors/praew.jpg",
      education: "คณะมนุษยศาสตร์และสังคมศาสตร์ (ภาษาอังกฤษ) มหาวิทยาลัยขอนแก่น — กำลังศึกษาระดับ ป.โท คณะเดียวกัน",
      subjects: "English, Math (ประถม), Science (ประถม)",
      credentials: "<ul><li>TOEIC 835 คะแนน</li><li>นักเรียนแลกเปลี่ยนประเทศอังกฤษ</li><li>สอนภาษาอังกฤษออนไลน์สำหรับนักเรียนตั้งแต่ 5 ขวบ ถึง 18 ปี</li><li>เคยสอนที่สถาบันสอนภาษา I'm growing (ขอนแก่น)</li><li>ผลการศึกษาระดับ ป.โท 4.00</li></ul>",
      sort_order: 8,
    },
    {
      name: "ติวเตอร์นุ่น",
      photo: "/images/tutors/noon.jpg",
      education: "สาขาครุศาสตร์ เอกวิทยาศาสตร์ มหาวิทยาลัยราชภัฏพระนครศรีอยุธยา",
      subjects: "Math (ประถม), Science (ประถม), คณิต (ประถม), วิทย์ (ประถม)",
      credentials: "<ul><li>ติวเตอร์ระดับประถม สถาบันกวดวิชาบริลเลียนแอนไบรท์ (5 ปี)</li><li>ติวสอบเข้า ม.1 คณิต-วิทย์, ติวสอบ O-NET</li><li>สอนห้อง gifted และ EP</li><li>เป็นครูสอนวิชาวิทยาศาสตร์มานานกว่า 9 ปี</li><li>ปัจจุบันเป็นอาจารย์สอนในโรงเรียน ภาควิชาวิทยาศาสตร์และคณิตศาสตร์ ประถมปลาย</li></ul>",
      sort_order: 9,
    },
  ];
  for (const t of tutors) await create(token, "tutors", t);

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
