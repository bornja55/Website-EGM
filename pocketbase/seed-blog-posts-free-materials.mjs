// One-off, IDEMPOTENT seed script — adds 12 new evergreen blog_posts
// articles built from English Mania's Facebook "free teaching material /
// quick vocab tip" posts (surveyed via Meta Business Suite Content Library,
// 2026-09-19, per Siraphob's go-ahead as page owner).
//
// Per the same principle used in seed-blog-posts.mjs (2026-08-18): these
// are EVERGREEN articles, not verbatim reposts of the FB captions/images.
// Each FB post only announced a topic and pointed to an image/graphic or a
// downloadable file — this script does not reproduce those images or
// files. Instead each article is freshly written, accurate curriculum
// content on the SAME topic (English vocabulary sets, grammar points, or
// basic math concepts that are standard/uncontroversial school material),
// laid out with the 3 apple.com/support-style content modules already
// used in blog/[slug].astro (.content-split / .content-explore /
// .content-highlights).
//
// Source posts (Meta Business Suite, englishmaniaofficial, re-verified
// 2026-09-19 — captions read directly from the Content Library table):
//   1. "คำศัพท์ภัยพิบัติ"                    — 23 Jun (multi-media post)
//   2. "คำศัพท์อาชีพต่างๆ"                    — 29 May
//   3. "Welcome back to school! คำศัพท์ชื่อวิชา" — 20 May
//   4. "คำศัพท์อวัยวะในร่างกาย"                — 13 May
//   5. "คำศัพท์ฤดูกาลและสภาพอากาศ"             — 9 May
//   6. "คำศัพท์วันแรงงาน"                      — 1 May (#vocabulary)
//   7. "Short Brief: Let / Let's / Let us"     — 22 Oct 2025
//   8. "ไฟล์คำศัพท์แจกฟรี ป.4-ป.6 (O-NET/ม.1)" — 17 Sep 2025
//   9. "แจกฟรี สรุปแกรมม่า + คำศัพท์ 180 คำ"    — 14 May 2025
//  10. "แจกความรู้พื้นฐานเรื่องรูปสามเหลี่ยม"   — 11 Oct 2025
//  11. "แจกเฉลยพรีเทสสอบเข้า ม.1 บดินทรเดชา (Gifted Science, Math)" — 12 Feb 2025
//  12. "รีวิวรับคำศัพท์ระดับประถมปลาย 100+ คำ"  — 9 Mar 2025 (reel)
//  (Post #13, "คำศัพท์วัยรุ่น ค่ตจะเริ่ดดด" 8 Mar 2025, excluded per
//   Siraphob's instruction — too short/thin for a full article.)
//
// Note on #11: the FB post gave away an ANSWER KEY to another school's
// (บดินทรเดชา) actual past entrance exam. This article does NOT reproduce
// those specific questions — it explains the general problem types and
// exam strategy for ม.1 Gifted/Science-EP math entrance exams instead,
// which is the reusable, evergreen part of that post.
//
// Images: 10 of the 12 articles use the REAL giveaway graphics captured from
// their source FB posts (web/public/images/blog/*.jpg, added 2026-09-20).
// The remaining 2 (#9 vocab-upper-primary-must-know — source post was a
// QR/LINE-only giveaway with no embedded graphic, and #11 m1-gifted-science —
// deliberately not reusing another school's exam material) keep generic
// stock photos from web/public/images/gallery/.
//
// Safe to re-run: creates any post whose slug is new, and UPDATES the
// content/images/excerpt/cover of any post whose slug already exists —
// so re-running after editing an entry below refreshes what's already
// live in PocketBase (added 2026-09-20, after discovering an earlier
// skip-only run had left 2 topics' real images un-synced).
//
// Usage: from the `pocketbase` directory —
//   Get-Content .credentials | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "Env:$k" $v }
//   node seed-blog-posts-free-materials.mjs
//
// Or on the production VM (no SSH tunnel needed):
//   docker exec -e PB_URL=http://pb:8090 -i egm-web node - < pocketbase/seed-blog-posts-free-materials.mjs

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

async function update(token, collection, id, record) {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`update ${collection}/${id} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

// --- posts -------------------------------------------------------------

const POSTS = [
  {
    title: "คำศัพท์ภาษาอังกฤษเกี่ยวกับภัยพิบัติทางธรรมชาติ (Natural Disasters)",
    slug: "vocab-natural-disasters",
    excerpt:
      "รวมคำศัพท์ภาษาอังกฤษเกี่ยวกับภัยพิบัติทางธรรมชาติที่เจอบ่อยในข่าวและข้อสอบ พร้อมตัวอย่างประโยคใช้งานจริง",
    cover_image: "/images/gallery/stem-volcano-01.jpg",
    published_at: "2026-08-20 00:00:00.000Z",
    content: `
<p>ข่าวภัยพิบัติทางธรรมชาติเป็นหัวข้อที่เจอได้ทั้งในบทอ่านภาษาอังกฤษ ข้อสอบ และข่าวรอบตัว การรู้จักคำศัพท์กลุ่มนี้ช่วยให้เด็กๆ อ่านข่าวหรือบทความภาษาอังกฤษเข้าใจง่ายขึ้น บทความนี้รวบรวมคำศัพท์ภัยพิบัติที่พบบ่อยที่สุด พร้อมความหมายและตัวอย่างประโยค</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>ภัยพิบัติที่เกี่ยวกับน้ำและอากาศ</h3>
    <p><strong>flood</strong> (น้ำท่วม), <strong>drought</strong> (ภัยแล้ง), <strong>tsunami</strong> (สึนามิ), <strong>typhoon</strong> (พายุไต้ฝุ่น), <strong>tornado</strong> (พายุทอร์นาโด), <strong>thunderstorm</strong> (พายุฝนฟ้าคะนอง) เช่น "The flood destroyed many houses along the river."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/natural-disasters-1.jpg" alt="อินโฟกราฟิกคำศัพท์ภัยพิบัติทางธรรมชาติ Volcano eruption Typhoon Forest fire จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>ภัยพิบัติที่เกี่ยวกับแผ่นดิน</h3>
    <p><strong>earthquake</strong> (แผ่นดินไหว), <strong>volcanic eruption</strong> (ภูเขาไฟระเบิด), <strong>landslide</strong> (ดินถล่ม), <strong>forest fire</strong> (ไฟป่า) เช่น "A strong earthquake shook the city last night." คำเหล่านี้มักปรากฏคู่กับกริยา hit, strike, destroy, damage ในข่าว</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/natural-disasters-2.jpg" alt="อินโฟกราฟิกคำศัพท์ภัยพิบัติทางธรรมชาติ Earthquake Tsunami Flood จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/science-static-01.jpg" alt="นักเรียนทำกิจกรรมวิทยาศาสตร์เกี่ยวกับปรากฏการณ์ธรรมชาติ" />
    </div>
    <h4>ฝึกแต่งประโยคจากคำศัพท์</h4>
    <p>ลองแต่งประโยคของตัวเองจากคำศัพท์แต่ละคำ จะช่วยจำได้แม่นกว่าท่องความหมายเฉยๆ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/classroom.jpg" alt="บรรยากาศห้องเรียนภาษาอังกฤษที่ English Mania" />
    </div>
    <h4>อ่านข่าวสั้นภาษาอังกฤษ</h4>
    <p>ลองหาข่าวภัยพิบัติสั้นๆ ภาษาอังกฤษมาอ่าน จะเจอคำศัพท์กลุ่มนี้ซ้ำๆ จนคุ้นเคยเอง</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปคำศัพท์ที่ควรจำ</h3>
    <p>flood, drought, tsunami, typhoon, tornado, thunderstorm, earthquake, volcanic eruption, landslide, forest fire — ทั้งหมดนี้เป็นคำนาม (noun) ที่มักตามด้วยกริยา hit, strike, cause, damage เมื่อเล่าเหตุการณ์</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>วัดความรุนแรงของ earthquake ด้วยหน่วย magnitude เช่น "a magnitude 6 earthquake" ส่วน tsunami มักเกิดตามหลัง earthquake ใต้ทะเล ไม่ใช่ภัยที่เกิดขึ้นเองโดยลำพัง</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🌋</span>
      <h3>เคล็ดลับ</h3>
      <p>จัดกลุ่มคำศัพท์ตามธาตุ (น้ำ ไฟ ดิน ลม) ช่วยจำง่ายขึ้น</p>
    </div>
  </div>
</div>

<p>อยากเสริมคำศัพท์และทักษะภาษาอังกฤษให้ลูกอย่างเป็นระบบ ดูรายละเอียดคอร์สปูพื้นฐานสำหรับเด็กประถมของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษเกี่ยวกับอาชีพ (Occupations) ที่เด็กควรรู้",
    slug: "vocab-occupations",
    excerpt:
      "โตขึ้นอยากเป็นอะไร? รวมคำศัพท์ภาษาอังกฤษชื่ออาชีพต่างๆ ที่พบบ่อย พร้อมตัวอย่างประโยคถามตอบเรื่องอาชีพในอนาคต",
    cover_image: "/images/services-tutoring.jpg",
    published_at: "2026-08-23 00:00:00.000Z",
    content: `
<p>"What do you want to be when you grow up?" เป็นประโยคคลาสสิกที่เด็กๆ เจอบ่อยทั้งในห้องเรียนและข้อสอบ บทความนี้รวบรวมคำศัพท์ชื่ออาชีพภาษาอังกฤษที่พบบ่อยที่สุด พร้อมวิธีใช้ในประโยค</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>อาชีพในชีวิตประจำวัน</h3>
    <p><strong>teacher</strong> (ครู), <strong>police</strong> (ตำรวจ), <strong>actor</strong> (นักแสดงชาย), <strong>actress</strong> (นักแสดงหญิง), <strong>nurse</strong> (พยาบาล), <strong>carpenter</strong> (ช่างไม้), <strong>dancer</strong> (นักเต้น), <strong>barber</strong> (ช่างตัดผมชาย), <strong>doctor</strong> (แพทย์), <strong>firefighter</strong> (พนักงานดับเพลิง) เช่น "My mother is a nurse. She works at a hospital."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/occupations-1.jpg" alt="อินโฟกราฟิกคำศัพท์อาชีพ Teacher Police Actor Actress Nurse Carpenter Dancer Barber Doctor Firefighter จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>อาชีพอื่นๆ ที่ควรรู้จัก</h3>
    <p><strong>pharmacist</strong> (เภสัชกร), <strong>secretary</strong> (เลขานุการ), <strong>writer</strong> (นักเขียน), <strong>model</strong> (นางแบบ), <strong>musician</strong> (นักดนตรี), <strong>pilot</strong> (นักบิน), <strong>lawyer</strong> (นักกฎหมาย), <strong>farmer</strong> (ชาวนา), <strong>judge</strong> (ผู้พิพากษา), <strong>veterinarian</strong> (สัตวแพทย์) โครงสร้างประโยคที่ใช้บ่อย: "I want to be a/an + อาชีพ" เช่น "I want to be a pilot."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/occupations-2.jpg" alt="อินโฟกราฟิกคำศัพท์อาชีพ Pharmacist Secretary Writer Model Musician Pilot Lawyer Farmer Judge Veterinarian จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/craft-keychain-01.jpg" alt="กิจกรรมสร้างสรรค์ของนักเรียนที่ English Mania" />
    </div>
    <h4>เล่นเกมทายอาชีพ</h4>
    <p>ให้เด็กแสดงท่าทางอาชีพแล้วให้เพื่อนทายเป็นภาษาอังกฤษ ช่วยจำคำศัพท์แบบสนุกๆ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-lowtable-01.jpg" alt="นักเรียนเขียนคำศัพท์อาชีพลงสมุด" />
    </div>
    <h4>เขียนแนะนำอาชีพในฝัน</h4>
    <p>ฝึกเขียนสั้นๆ 3-4 ประโยคว่าอยากเป็นอาชีพอะไรและทำไม ฝึกทั้งคำศัพท์และการแต่งประโยค</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปประโยคที่ใช้บ่อย</h3>
    <p>"What do you want to be when you grow up?" — "I want to be a doctor." สังเกตว่าต้องใช้ a หรือ an นำหน้าชื่ออาชีพเสมอ (a teacher, an actor) ห้ามละไว้แบบภาษาไทย</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>"police" ในความหมายอาชีพเป็นการเรียกแบบย่อ ชื่อเต็มคือ "police officer" ส่วน "actor" กับ "actress" ใช้แยกตามเพศของผู้แสดง</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">👩‍⚕️</span>
      <h3>เคล็ดลับ</h3>
      <p>จำคำศัพท์อาชีพคู่กับสถานที่ทำงาน เช่น nurse - hospital, firefighter - fire station, lawyer - court</p>
    </div>
  </div>
</div>

<p>อยากให้ลูกฝึกพูดและแต่งประโยคภาษาอังกฤษอย่างมั่นใจ ดูคอร์สปูพื้นฐานภาษาอังกฤษสำหรับเด็กประถมของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษชื่อวิชาเรียนในโรงเรียน (School Subjects)",
    slug: "vocab-school-subjects",
    excerpt:
      "เปิดเทอมแล้ว มาทบทวนคำศัพท์ชื่อวิชาเรียนต่างๆ เป็นภาษาอังกฤษกัน พร้อมประโยคพูดถึงตารางเรียน",
    cover_image: "/images/services/subject-english.jpg",
    published_at: "2026-08-26 00:00:00.000Z",
    content: `
<p>Welcome back to school! ทุกครั้งที่เปิดเทอมใหม่ เด็กๆ จะเจอตารางเรียนที่มีชื่อวิชาเป็นภาษาอังกฤษ บทความนี้รวมชื่อวิชาที่พบบ่อยในโรงเรียน พร้อมวิธีพูดถึงตารางเรียนของตัวเอง</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>วิชาหลัก</h3>
    <p><strong>Math</strong> (คณิตศาสตร์), <strong>Science</strong> (วิทยาศาสตร์), <strong>English</strong> (ภาษาอังกฤษ), <strong>History</strong> (ประวัติศาสตร์), <strong>Geography</strong> (ภูมิศาสตร์), <strong>Art</strong> (ศิลปะ) เช่น "My favorite subject is Science."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/school-subjects-1.jpg" alt="อินโฟกราฟิกคำศัพท์ชื่อวิชาเรียน Math Science English History Geography Art จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>วิชาแยกย่อยและวิชาพื้นฐานอื่นๆ</h3>
    <p><strong>Physics</strong> (ฟิสิกส์), <strong>Biology</strong> (ชีววิทยา), <strong>Chemistry</strong> (เคมี), <strong>Thai Language</strong> (ภาษาไทย), <strong>Social Studies</strong> (สังคมศึกษา), <strong>Physical Education</strong> (พลศึกษา) โครงสร้างที่ใช้พูดตารางเรียน: "I have Math on Monday." / "What subject do you have today?"</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/school-subjects-2.jpg" alt="อินโฟกราฟิกคำศัพท์ชื่อวิชาเรียน Physics Biology Chemistry Thai Language Social Studies Physical Education จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/classroom.jpg" alt="ตารางเรียนติดอยู่ในห้องเรียน English Mania" />
    </div>
    <h4>เขียนตารางเรียนเป็นภาษาอังกฤษ</h4>
    <p>ลองให้เด็กเขียนตารางเรียนของตัวเองเป็นภาษาอังกฤษทั้งหมด ฝึกทั้งคำศัพท์และวันในสัปดาห์ไปพร้อมกัน</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/services/format-onsite.jpg" alt="นักเรียนคุยกันเรื่องวิชาที่ชอบในบรรยากาศห้องเรียน" />
    </div>
    <h4>ถาม-ตอบวิชาที่ชอบ</h4>
    <p>ฝึกสนทนาสั้นๆ "What's your favorite subject? Why?" ช่วยฝึกทั้งคำศัพท์และการแสดงความคิดเห็น</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปชื่อวิชาที่ควรจำ</h3>
    <p>Math, Science, English, History, Geography, Art, Physics, Biology, Chemistry, Thai Language, Social Studies, Physical Education — สังเกตว่าชื่อวิชาภาษาอังกฤษเขียนขึ้นต้นด้วยตัวพิมพ์ใหญ่เสมอ เพราะถือเป็นชื่อเฉพาะ</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>"P.E." เป็นคำย่อของ Physical Education ใช้พูดในบทสนทนาทั่วไปได้ แต่ในงานเขียนทางการควรสะกดเต็ม</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">📚</span>
      <h3>เคล็ดลับ</h3>
      <p>ใช้ "have" กับวิชาเรียน ไม่ใช่ "learn" เมื่อพูดถึงตารางเรียน เช่น "I have Art today."</p>
    </div>
  </div>
</div>

<p>เปิดเทอมนี้อยากปูพื้นฐานภาษาอังกฤษและวิชาหลักให้แน่น ดูรายละเอียดคอร์สเปิดเทอมของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษเกี่ยวกับอวัยวะในร่างกาย (Parts of the Body)",
    slug: "vocab-parts-of-the-body",
    excerpt:
      "รวมคำศัพท์ภาษาอังกฤษชื่ออวัยวะในร่างกายที่ต้องรู้ ตั้งแต่ภายนอกไปจนถึงอวัยวะภายในพื้นฐาน",
    cover_image: "/images/gallery/english-bodyparts-01.jpg",
    published_at: "2026-08-29 00:00:00.000Z",
    content: `
<p>คำศัพท์เกี่ยวกับร่างกายเป็นหนึ่งในหมวดคำศัพท์พื้นฐานที่สุดที่เด็กเล็กควรรู้ ใช้ได้ทั้งในชีวิตประจำวันและเวลาพูดถึงร่างกายตัวเองเป็นภาษาอังกฤษ บทความนี้รวบรวมชื่ออวัยวะภาษาอังกฤษที่พบบ่อยที่สุด 10 คำ</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>อวัยวะภายนอก</h3>
    <p><strong>head</strong> (ศีรษะ), <strong>ear</strong> (หู), <strong>mouth</strong> (ปาก), <strong>arm</strong> (แขน), <strong>leg</strong> (ขา) เช่น "Touch your head, then touch your ear."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/body-parts-1.jpg" alt="อินโฟกราฟิกคำศัพท์อวัยวะ Head Ear Mouth Arm Leg จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>อวัยวะอื่นๆ ที่ต้องรู้</h3>
    <p><strong>eye</strong> (ตา), <strong>nose</strong> (จมูก), <strong>hand</strong> (มือ), <strong>knee</strong> (หัวเข่า), <strong>foot</strong> (เท้า) เช่น "Wash your hands before eating."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/body-parts-2.jpg" alt="อินโฟกราฟิกคำศัพท์อวัยวะ Eye Nose Hand Knee Foot จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-coloring-01.jpg" alt="เด็กระบายสีภาพร่างกายมนุษย์พร้อมคำศัพท์ภาษาอังกฤษ" />
    </div>
    <h4>ระบายสีพร้อมเขียนคำศัพท์</h4>
    <p>ให้เด็กระบายสีรูปร่างกายแล้วเขียนชื่ออวัยวะภาษาอังกฤษกำกับ ช่วยจำได้ทั้งภาพและคำ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-teens-01.jpg" alt="นักเรียนเล่นเกม Simon Says ในคลาสภาษาอังกฤษ" />
    </div>
    <h4>เล่นเกม Simon Says</h4>
    <p>"Simon says touch your nose!" เป็นเกมคลาสสิกที่ช่วยฝึกฟังและจำคำศัพท์อวัยวะไปพร้อมกัน</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปคำศัพท์ที่ควรจำ</h3>
    <p>head, ear, mouth, arm, leg, eye, nose, hand, knee, foot — คำนามส่วนใหญ่ในหมวดนี้เป็นนามนับได้ ต้องระวังเรื่องเอกพจน์-พหูพจน์ เช่น eye/eyes, hand/hands</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>อวัยวะที่มีคู่ (ตา หู มือ ขา) มักถูกถามในรูปพหูพจน์ในข้อสอบ เช่น "How many eyes do you have?" — "I have two eyes."</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🧠</span>
      <h3>เคล็ดลับ</h3>
      <p>จำคำศัพท์อวัยวะพร้อมหน้าที่การทำงาน จะช่วยได้ทั้งวิชาอังกฤษและวิทยาศาสตร์</p>
    </div>
  </div>
</div>

<p>อยากเสริมคำศัพท์ภาษาอังกฤษพื้นฐานให้ลูกอย่างเป็นระบบ ดูรายละเอียดคอร์สปูพื้นฐานของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษเกี่ยวกับฤดูกาลและสภาพอากาศ (Seasons & Weather)",
    slug: "vocab-seasons-and-weather",
    excerpt:
      "อากาศเปลี่ยนแปลงบ่อย มาทบทวนคำศัพท์ฤดูกาลและสภาพอากาศภาษาอังกฤษ พร้อมประโยคพูดถึงอากาศวันนี้",
    cover_image: "/images/gallery/english-coloring-01.jpg",
    published_at: "2026-09-01 00:00:00.000Z",
    content: `
<p>"What's the weather like today?" เป็นหนึ่งในบทสนทนาแรกๆ ที่เด็กเรียนภาษาอังกฤษ เพราะพูดถึงได้ทุกวัน บทความนี้รวมคำศัพท์ฤดูกาลและสภาพอากาศที่ใช้บ่อยที่สุด</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>ฤดูกาล (Seasons)</h3>
    <p>ในหนังสือเรียนสากลมี 4 ฤดู: <strong>spring</strong> (ฤดูใบไม้ผลิ), <strong>summer</strong> (ฤดูร้อน), <strong>autumn / fall</strong> (ฤดูใบไม้ร่วง), <strong>winter</strong> (ฤดูหนาว) ส่วนประเทศไทยพูดถึง 3 ฤดูในชีวิตจริง: summer, <strong>rainy season</strong> (ฤดูฝน), winter</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/seasons.jpg" alt="อินโฟกราฟิกคำศัพท์ฤดูกาล Summer Winter Rainy season Spring Fall/Autumn จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>สภาพอากาศ (Weather)</h3>
    <p><strong>sunny</strong> (แดดจัด), <strong>snowy</strong> (มีหิมะตก), <strong>cloudy</strong> (มีเมฆมาก), <strong>rainy</strong> (ฝนตก), <strong>windy</strong> (ลมแรง), <strong>stormy</strong> (มีพายุ), <strong>humid</strong> (อากาศชื้น), <strong>hot</strong> (ร้อน), <strong>cold</strong> (หนาว) เช่น "It's very humid today."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/weather.jpg" alt="อินโฟกราฟิกคำศัพท์สภาพอากาศ Sunny Snowy Cloudy Stormy Windy Rainy จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/classroom.jpg" alt="ป้ายบอกสภาพอากาศประจำวันในห้องเรียน" />
    </div>
    <h4>ทำปฏิทินอากาศประจำวัน</h4>
    <p>ให้เด็กพูดหรือเขียนสภาพอากาศวันนั้นเป็นภาษาอังกฤษทุกเช้า ฝึกใช้คำศัพท์ซ้ำจนคุ้นเคย</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-writing-01.jpg" alt="นักเรียนเขียนบันทึกสภาพอากาศเป็นภาษาอังกฤษ" />
    </div>
    <h4>เขียนไดอารี่สั้นเรื่องอากาศ</h4>
    <p>ฝึกแต่งประโยค "Today is sunny and hot." หรือ "It was rainy yesterday." ฝึกทั้งคำศัพท์และ tense พื้นฐาน</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>โครงสร้างประโยคที่ใช้บ่อย</h3>
    <p>"What's the weather like today?" — "It's sunny/rainy/cloudy." สังเกตว่าพูดถึงอากาศต้องใช้ "It is..." เสมอ ไม่ใช้ "The weather is..." ในบทสนทนาทั่วไป (แม้จะพูดแบบนั้นได้ในภาษาเขียน)</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>autumn ใช้ในภาษาอังกฤษแบบอังกฤษ (British English) ส่วน fall ใช้ในภาษาอังกฤษแบบอเมริกัน (American English) ความหมายเหมือนกัน</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🌦️</span>
      <h3>เคล็ดลับ</h3>
      <p>จำคำคุณศัพท์อากาศเป็นคู่ตรงข้าม เช่น hot-cold, sunny-cloudy จะช่วยจำได้เร็วขึ้น</p>
    </div>
  </div>
</div>

<p>อยากให้ลูกฝึกพูดภาษาอังกฤษในชีวิตประจำวันได้อย่างเป็นธรรมชาติ ดูรายละเอียดคอร์สปูพื้นฐานของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษเกี่ยวกับวันแรงงาน (Labour Day) และอาชีพผู้ใช้แรงงาน",
    slug: "vocab-labour-day",
    excerpt:
      "เนื่องในวันแรงงานแห่งชาติ มาทำความรู้จักคำศัพท์ภาษาอังกฤษเกี่ยวกับผู้ใช้แรงงานและอาชีพช่างต่างๆ กัน",
    cover_image: "/images/classroom.jpg",
    published_at: "2026-09-04 00:00:00.000Z",
    content: `
<p>วันแรงงานแห่งชาติ (National Labour Day) ตรงกับวันที่ 1 พฤษภาคมของทุกปี เป็นโอกาสดีที่จะพาเด็กๆ รู้จักคำศัพท์ภาษาอังกฤษเกี่ยวกับโลกของการทำงานที่อยู่รอบตัว</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>คำศัพท์เกี่ยวกับแรงงานและอาชีพ</h3>
    <p><strong>labor</strong> (แรงงาน, ชนชั้นแรงงาน, กรรมกร), <strong>worker / employee</strong> (ลูกจ้าง, คนงาน, พนักงาน), <strong>employer</strong> (นายจ้าง, เจ้านาย, ผู้ว่าจ้าง), <strong>company</strong> (บริษัท), <strong>occupation / job</strong> (งาน, อาชีพ, วิชาชีพ) เช่น "My father is an employee at a company in Bangkok."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/labour-day-1.jpg" alt="อินโฟกราฟิกคำศัพท์ Labor Worker Employee Employer Company Occupation Job จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>คำศัพท์เกี่ยวกับค่าตอบแทนและวันหยุด</h3>
    <p><strong>wage</strong> (ค่าจ้าง), <strong>salary</strong> (เงินเดือน), <strong>holiday</strong> (วันหยุด), <strong>leave</strong> (ลา/ลางาน — เป็นคำกริยา), <strong>resign</strong> (ลาออก — เป็นคำกริยา) เช่น "She wants to resign from her job next month."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/labour-day-2.jpg" alt="อินโฟกราฟิกคำศัพท์ Wage Salary Holiday Leave Resign จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/stem-car-01.jpg" alt="นักเรียนโชว์ผลงานรถของเล่น STEM ที่ประดิษฐ์เอง บรรยากาศกิจกรรมที่ English Mania" />
    </div>
    <h4>แยกคำศัพท์ฝั่งนายจ้างกับฝั่งลูกจ้าง</h4>
    <p>ให้เด็กจัดกลุ่มคำศัพท์ที่เกี่ยวกับฝ่ายนายจ้าง (employer, company) กับฝ่ายลูกจ้าง (worker, employee) ช่วยจำคำศัพท์ผ่านความสัมพันธ์ของคำ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/services/format-private.jpg" alt="นักเรียนพูดคุยเรื่องอาชีพต่างๆ ในครอบครัว" />
    </div>
    <h4>เล่าอาชีพคนในครอบครัว</h4>
    <p>ฝึกพูดสั้นๆ ว่าคนในครอบครัวทำอาชีพอะไร เป็นการนำคำศัพท์อาชีพมาใช้จริงในชีวิตประจำวัน</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>รู้หรือไม่ วันแรงงานสากล</h3>
    <p>International Workers' Day หรือ May Day ตรงกับวันที่ 1 พฤษภาคม จัดขึ้นเพื่อรำลึกถึงสิทธิแรงงาน (labour rights) ในหลายประเทศทั่วโลก รวมถึงประเทศไทย</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>"labour" สะกดแบบอังกฤษ (British English) ส่วน "labor" สะกดแบบอเมริกัน (American English) ทั้งสองแบบถูกต้อง เลือกใช้ให้สม่ำเสมอในงานเขียนเดียวกัน</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🔧</span>
      <h3>เคล็ดลับ</h3>
      <p>จำคำศัพท์เป็นคู่ที่เกี่ยวข้องกัน เช่น employer-employee (นายจ้าง-ลูกจ้าง), wage-salary (ค่าจ้างรายวัน-เงินเดือน), leave-resign (ลา-ลาออก)</p>
    </div>
  </div>
</div>

<p>อยากให้ลูกมีคลังคำศัพท์ภาษาอังกฤษกว้างและใช้งานได้จริง ดูรายละเอียดคอร์สปูพื้นฐานของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "Let, Let's, Let us ต่างกันอย่างไร ใช้เมื่อไหร่ให้ถูกต้อง",
    slug: "let-lets-let-us-grammar-guide",
    excerpt:
      "สรุปความแตกต่างระหว่าง Let, Let's และ Let us แบบเข้าใจง่าย พร้อมตัวอย่างประโยคที่ใช้ถูกบริบท",
    cover_image: "/images/services/format-group.jpg",
    published_at: "2026-09-07 00:00:00.000Z",
    content: `
<p>Let, Let's และ Let us เป็นคำที่หน้าตาคล้ายกันแต่ใช้ต่างสถานการณ์กัน หลายคนสับสนโดยเฉพาะ Let's กับ Let us บทความนี้สรุปให้เข้าใจง่ายพร้อมตัวอย่างประโยคจริง</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>Let + กรรม + Verb infinitive (ไม่มี to)</h3>
    <p>ใช้เมื่อ "อนุญาต" หรือ "ปล่อยให้" ใครทำอะไร โครงสร้าง: Let + object + verb (base form) เช่น "My mom let me go to the party." หรือ "Please let him speak."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/services/format-onsite.jpg" alt="นักเรียนฝึกเขียนประโยคแกรมม่าภาษาอังกฤษในบรรยากาศห้องเรียน" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>Let's = Let us (คำชวน)</h3>
    <p>Let's เป็นรูปย่อของ Let us ใช้ชวนทำอะไรร่วมกัน (คนพูดรวมอยู่ในกลุ่มที่จะทำด้วย) เช่น "Let's go to the park." = "Let us go to the park." ทั้งสองแบบความหมายเหมือนกัน แต่ Let's เป็นทางการน้อยกว่าและใช้บ่อยกว่าในบทสนทนา</p>
  </div>
  <div class="content-split-media">
    <img src="/images/gallery/english-teens-01.jpg" alt="กลุ่มนักเรียนกำลังชวนกันทำกิจกรรม" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/blog/let-lets-let-us.jpg" alt="อินโฟกราฟิกสรุปการใช้ Let, Let's, Let Us จาก English Mania" />
    </div>
    <h4>Let us ที่ไม่ใช่คำชวน</h4>
    <p>"Let us" ยังใช้แบบทางการเพื่อขออนุญาตหรือขอร้องได้ เช่น "Please let us know if you have any questions." ในกรณีนี้ไม่สามารถย่อความหมายเป็นคำชวนได้ ต้องดูบริบทประกอบ</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-lowtable-01.jpg" alt="นักเรียนฝึกแต่งประโยคกับเพื่อน" />
    </div>
    <h4>ฝึกแต่งประโยคเปรียบเทียบ</h4>
    <p>ลองแต่งประโยคคู่ๆ กัน เช่น "Let me help you." กับ "Let's help him." เพื่อฝึกแยกความแตกต่างของโครงสร้าง</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปสั้นๆ ก่อนสอบ</h3>
    <p><strong>Let</strong> = อนุญาต/ปล่อยให้ (Let + object + verb) | <strong>Let's</strong> = คำชวนแบบไม่ทางการ (Let's + verb) | <strong>Let us</strong> = คำชวนแบบทางการ หรือขอร้อง/ขออนุญาตแบบเป็นทางการ</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>อย่าเติม to หลัง let เด็ดขาด เช่น "Let me to go" เป็นประโยคที่ผิด ต้องเป็น "Let me go" เท่านั้น</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">✍️</span>
      <h3>เคล็ดลับ</h3>
      <p>ถ้าประโยคชวนทำอะไรร่วมกัน ใช้ Let's ถ้าขออนุญาตให้คนอื่นทำ ใช้ Let + object</p>
    </div>
  </div>
</div>

<p>อยากเสริมแกรมม่าพื้นฐานให้แน่นก่อนสอบ ดูรายละเอียดคอร์สปูพื้นฐานภาษาอังกฤษของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "คำศัพท์ภาษาอังกฤษ ป.4-6 ที่ต้องรู้ก่อนสอบ O-NET และสอบเข้า ม.1",
    slug: "vocab-p4-6-onet-m1-entrance",
    excerpt:
      "รวมคำศัพท์ภาษาอังกฤษที่ออกสอบบ่อยในข้อสอบ O-NET ป.6 และข้อสอบเข้า ม.1 แยกตามทักษะที่ใช้บ่อยที่สุด",
    cover_image: "/images/courses/entrance-exam-m1.jpg",
    published_at: "2026-09-10 00:00:00.000Z",
    content: `
<p>ข้อสอบ O-NET ป.6 และข้อสอบเข้า ม.1 มักออกคำศัพท์ชุดเดิมซ้ำๆ ทุกปี บทความนี้รวบรวมคำศัพท์ที่พบบ่อยที่สุด แยกตามทักษะการอ่านและการทำโจทย์ เพื่อให้เด็กๆ เตรียมตัวได้ตรงจุด</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>คำศัพท์เกี่ยวกับการอ่านจับใจความ</h3>
    <p><strong>main idea</strong> (ใจความสำคัญ), <strong>context clue</strong> (คำใบ้ในบริบท), <strong>compare</strong> (เปรียบเทียบ), <strong>describe</strong> (บรรยาย), <strong>sequence</strong> (ลำดับเหตุการณ์), <strong>synonym</strong> (คำพ้องความหมาย), <strong>antonym</strong> (คำตรงข้าม) — คำเหล่านี้มักปรากฏในคำสั่งโจทย์ (instruction) ของข้อสอบอ่าน</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/vocab-p4-6-sample.jpg" alt="ตัวอย่างชีทคำศัพท์ Vocabulary Test สำหรับ ป.4 จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>คำศัพท์ข้ามวิชา (Math/Science เป็นภาษาอังกฤษ)</h3>
    <p><strong>average</strong> (ค่าเฉลี่ย), <strong>fraction</strong> (เศษส่วน), <strong>multiply</strong> (คูณ), <strong>divide</strong> (หาร), <strong>ecosystem</strong> (ระบบนิเวศ), <strong>habitat</strong> (ถิ่นที่อยู่), <strong>energy</strong> (พลังงาน), <strong>environment</strong> (สิ่งแวดล้อม) — เจอบ่อยในโจทย์ Math/Science ที่ให้โจทย์เป็นภาษาอังกฤษ</p>
  </div>
  <div class="content-split-media">
    <img src="/images/gallery/science-testtube-01.jpg" alt="อุปกรณ์วิทยาศาสตร์ที่ใช้ในการเรียนคำศัพท์เฉพาะทาง" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-writing-01.jpg" alt="นักเรียนฝึกทำโจทย์ข้อสอบเก่า" />
    </div>
    <h4>ฝึกทำข้อสอบเก่าเป็นประจำ</h4>
    <p>การเจอคำศัพท์เดิมซ้ำๆ ในข้อสอบเก่าหลายชุด จะช่วยให้จำคำศัพท์กลุ่มนี้ได้แม่นแบบไม่ต้องท่อง</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/services/format-private.jpg" alt="บรรยากาศติวเข้มก่อนสอบเข้า ม.1 ที่ English Mania" />
    </div>
    <h4>ทำสมุดคำศัพท์เฉพาะสอบ</h4>
    <p>แยกสมุดคำศัพท์เฉพาะที่เจอบ่อยในข้อสอบ ทบทวนก่อนสอบจริงจะช่วยประหยัดเวลาอ่านทวนได้มาก</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>สรุปก่อนเข้าห้องสอบ</h3>
    <p>เน้นคำศัพท์คำสั่งโจทย์ (main idea, compare, describe) ให้แม่นที่สุด เพราะถ้าไม่เข้าใจคำสั่ง จะตอบผิดทั้งที่รู้เนื้อหา รองลงมาคือคำศัพท์ข้ามวิชาที่ใช้บ่อยในโจทย์ Math/Science</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>synonym และ antonym มักถูกถามสลับกันในโจทย์ ต้องอ่านคำถามให้ครบก่อนตอบว่าโจทย์ต้องการคำ "ความหมายเหมือน" หรือ "ความหมายตรงข้าม"</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">📝</span>
      <h3>เคล็ดลับ</h3>
      <p>อ่านคำสั่งโจทย์ (instruction) ให้จบก่อนเริ่มทำ ทุกครั้ง</p>
    </div>
  </div>
</div>

<p>คอร์สสอบเข้า ม.1 ของ English Mania ครอบคลุมคำศัพท์และแนวข้อสอบทั้ง 45 ชั่วโมง พร้อมข้อสอบเก่าย้อนหลัง 5 ปี ดูรายละเอียดเพิ่มเติมได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "สรุป 6 Tenses พื้นฐานที่เด็กประถมต้องรู้จัก",
    slug: "basic-6-tenses-summary-primary",
    excerpt:
      "ภาพรวมโครงสร้าง 6 tenses พื้นฐาน (Present/Past/Future x Simple/Continuous) แบบเข้าใจง่ายสำหรับเด็กประถม",
    cover_image: "/images/gallery/english-writing-01.jpg",
    published_at: "2026-09-12 00:00:00.000Z",
    content: `
<p>ก่อนจะไปลึกถึงแกรมม่าขั้นสูง เด็กประถมควรรู้จักภาพรวมของ 6 tenses พื้นฐานให้แม่นก่อน บทความนี้สรุปโครงสร้างของแต่ละ tense แบบเห็นภาพรวมในหน้าเดียว</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>กลุ่มปัจจุบัน (Present)</h3>
    <p><strong>Present Simple</strong>: Subject + V.1 (is/am/are, have/has, do/does) — ใช้กับความจริงทั่วไปหรือสิ่งที่ทำเป็นประจำ เช่น "She goes to school every day."<br/><strong>Present Continuous</strong>: Subject + is/am/are + V.ing — ใช้กับสิ่งที่กำลังเกิดขึ้นตอนนี้ เช่น "She is going to school now."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/grammar-tenses-sample.jpg" alt="ชีทสรุปโครงสร้าง Tense ภาษาอังกฤษที่เขียนด้วยลายมือจาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>กลุ่มอดีตและอนาคต (Past & Future)</h3>
    <p><strong>Past Simple</strong>: Subject + V.2 — เช่น "She went to school yesterday."<br/><strong>Past Continuous</strong>: Subject + was/were + V.ing — เช่น "She was going to school at 7 a.m."<br/><strong>Future Simple</strong>: Subject + will(not) + V.infinitive — เช่น "She will go to school tomorrow."<br/><strong>Future Continuous</strong>: Subject + will(not) + be + V.ing — เช่น "She will be going to school at 7 a.m. tomorrow."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/classroom.jpg" alt="ครูอธิบายโครงสร้าง tense บนกระดานในห้องเรียน" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/blog/tenses-notes-01.jpg" alt="ตัวอย่างโน้ตสรุปการผัน Past Simple เช่น watched, played, jumped และ study-studied" />
    </div>
    <h4>แต่งประโยคเดียวกัน 6 แบบ</h4>
    <p>ลองใช้ประโยคเดียวกัน (เช่น "I do my homework") ผลัดกันแต่งใน 6 tenses จะเห็นความต่างของโครงสร้างชัดเจน</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/english-teens-01.jpg" alt="นักเรียนเล่นเกมจับคู่ tense กับคำสัญญาณเวลา" />
    </div>
    <h4>จับคู่ tense กับคำสัญญาณเวลา</h4>
    <p>เกมจับคู่คำอย่าง yesterday, now, tomorrow, every day กับ tense ที่ถูกต้อง ช่วยฝึกความไวในการเลือก tense</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>ตารางสรุป 6 Tenses</h3>
    <p>Present Simple: S+V.1 | Present Continuous: S+is/am/are+V.ing | Past Simple: S+V.2 | Past Continuous: S+was/were+V.ing | Future Simple: S+will+V.inf | Future Continuous: S+will+be+V.ing</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>V.1 กับ V.infinitive หน้าตาเหมือนกันแต่ใช้ต่างบริบท: V.1 ผัน is/am/are/have/has/do/does ตามประธาน ส่วน V.infinitive ไม่ผันตามประธานเลย</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">⏳</span>
      <h3>เคล็ดลับ</h3>
      <p>จำ tense กลุ่ม Simple ก่อน แล้วค่อยต่อยอดไปกลุ่ม Continuous จะไม่งง</p>
    </div>
  </div>
</div>

<p>อยากปูพื้นฐานแกรมม่าให้แน่นตั้งแต่ต้น ดูรายละเอียดคอร์สปูพื้นฐานภาษาอังกฤษของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "ความรู้พื้นฐานเรื่องรูปสามเหลี่ยม (Triangles) สำหรับเด็กประถม",
    slug: "triangle-basics-math-english-terms",
    excerpt:
      "ทบทวนความรู้พื้นฐานเรื่องรูปสามเหลี่ยม ทั้งชนิดของสามเหลี่ยมและคำศัพท์ภาษาอังกฤษที่เกี่ยวข้อง",
    cover_image: "/images/gallery/stem-experiment-01.jpg",
    published_at: "2026-09-14 00:00:00.000Z",
    content: `
<p>รูปสามเหลี่ยม (triangle) เป็นรูปเรขาคณิตพื้นฐานที่เด็กประถมต้องรู้จัก ทั้งในวิชาคณิตศาสตร์และในโจทย์ Math ที่เป็นภาษาอังกฤษ บทความนี้ทบทวนชนิดของสามเหลี่ยมและคำศัพท์ที่เกี่ยวข้อง</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>ชนิดของสามเหลี่ยมแบ่งตามด้าน</h3>
    <p><strong>equilateral triangle</strong> (สามเหลี่ยมด้านเท่า) — ด้านเท่ากันทั้ง 3 ด้าน มุมเท่ากันทุกมุมที่ 60 องศา<br/><strong>isosceles triangle</strong> (สามเหลี่ยมหน้าจั่ว) — มีด้านเท่ากัน 2 ด้าน<br/><strong>scalene triangle</strong> (สามเหลี่ยมด้านไม่เท่า) — ด้านยาวไม่เท่ากันทั้ง 3 ด้าน</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/triangle-by-side.jpg" alt="อินโฟกราฟิกชนิดของสามเหลี่ยมแบ่งตามด้าน จาก English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>ชนิดของสามเหลี่ยมแบ่งตามมุม</h3>
    <p><strong>right triangle</strong> (สามเหลี่ยมมุมฉาก) — มีมุม 90 องศาอยู่ 1 มุม<br/><strong>acute triangle</strong> (สามเหลี่ยมมุมแหลม) — ทุกมุมเล็กกว่า 90 องศา<br/><strong>obtuse triangle</strong> (สามเหลี่ยมมุมป้าน) — มีมุมหนึ่งใหญ่กว่า 90 องศา กฎสำคัญ: ผลรวมมุมภายในของสามเหลี่ยมทุกชนิดเท่ากับ 180 องศาเสมอ</p>
  </div>
  <div class="content-split-media">
    <img src="/images/blog/triangle-by-angle.jpg" alt="อินโฟกราฟิกชนิดของสามเหลี่ยมแบ่งตามมุม จาก English Mania" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/craft-keychain-01.jpg" alt="นักเรียนประดิษฐ์รูปทรงเรขาคณิตด้วยมือ" />
    </div>
    <h4>พับกระดาษเป็นสามเหลี่ยม 3 ชนิด</h4>
    <p>ให้เด็กพับหรือตัดกระดาษเป็นสามเหลี่ยมด้านเท่า หน้าจั่ว และด้านไม่เท่า แล้ววัดด้านเปรียบเทียบด้วยตัวเอง</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/science-skittles-01.jpg" alt="กิจกรรมทดลองที่เกี่ยวข้องกับการวัดและคำนวณ" />
    </div>
    <h4>ฝึกคำนวณพื้นที่สามเหลี่ยม</h4>
    <p>สูตรพื้นฐาน: <strong>area</strong> (พื้นที่) = 1/2 × <strong>base</strong> (ฐาน) × <strong>height</strong> (ความสูง) ลองฝึกคำนวณจากรูปที่พับเองเพื่อความเข้าใจที่จับต้องได้</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>คำศัพท์ที่ควรรู้</h3>
    <p><strong>side</strong> (ด้าน), <strong>angle</strong> (มุม), <strong>vertex</strong> (จุดยอด), <strong>base</strong> (ฐาน), <strong>height</strong> (ความสูง), <strong>perimeter</strong> (เส้นรอบรูป), <strong>area</strong> (พื้นที่) — คำศัพท์กลุ่มนี้ใช้ซ้ำกับรูปเรขาคณิตอื่นๆ ด้วย ไม่ใช่แค่สามเหลี่ยม</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>สามเหลี่ยม 1 รูปอาจเข้าได้ทั้ง 2 กลุ่ม เช่น right isosceles triangle (สามเหลี่ยมมุมฉากที่เป็นหน้าจั่วด้วย) — การแบ่งตามด้านและตามมุมไม่ได้แยกขาดจากกัน</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">📐</span>
      <h3>เคล็ดลับ</h3>
      <p>ท่องสูตรพื้นที่คู่กับหน่วยวัดเสมอ (ตร.ซม., ตร.ม.) ป้องกันลืมใส่หน่วยตอนทำข้อสอบ</p>
    </div>
  </div>
</div>

<p>อยากปูพื้นฐานคณิตศาสตร์และภาษาอังกฤษไปพร้อมกัน ดูรายละเอียดคอร์สปูพื้นฐานของ English Mania ได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "เตรียมสอบเข้า ม.1 ห้อง Gifted/Science-EP วิชาคณิตศาสตร์ ต้องฝึกอะไรบ้าง",
    slug: "m1-gifted-science-entrance-math-tips",
    excerpt:
      "แนวทางเตรียมตัวสำหรับข้อสอบคณิตศาสตร์เข้า ม.1 ห้อง Gifted และ Science-EP โจทย์แบบไหนที่ออกบ่อย ควรฝึกอย่างไร",
    cover_image: "/images/services/subject-science.jpg",
    published_at: "2026-09-16 00:00:00.000Z",
    content: `
<p>ข้อสอบคณิตศาสตร์เข้า ม.1 ห้อง Gifted และ Science-EP ของหลายโรงเรียนมักยากกว่าห้องเรียนปกติ เน้นทั้งความแม่นยำและความเร็ว บทความนี้สรุปประเภทโจทย์ที่ออกบ่อยและวิธีฝึกฝนอย่างมีประสิทธิภาพ</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>ประเภทโจทย์ที่ออกบ่อย</h3>
    <p>โจทย์ปัญหา (<strong>word problems</strong>) ทั้งภาษาไทยและภาษาอังกฤษ, เศษส่วนและอัตราส่วน (<strong>fraction & ratio</strong>), พื้นที่และเส้นรอบรูป (<strong>area & perimeter</strong>), แบบรูปและความสัมพันธ์ (<strong>pattern & sequence</strong>) เป็นหมวดที่พบบ่อยที่สุดในข้อสอบ Gifted/Science-EP</p>
  </div>
  <div class="content-split-media">
    <img src="/images/services/exam-prep.jpg" alt="เอกสารติวสอบเข้า ม.1 ห้อง Gifted ของ English Mania" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>ทักษะการให้เหตุผล (Logical Reasoning)</h3>
    <p>นอกจากคำนวณแล้ว ข้อสอบ Gifted มักมีโจทย์วัดตรรกะ เช่น การจัดลำดับ การหาความสัมพันธ์ระหว่างตัวเลขหรือรูปภาพ โจทย์กลุ่มนี้ต้องฝึกฝนบ่อยๆ เพราะไม่มีสูตรตายตัว ต้องอาศัยความคุ้นเคยกับรูปแบบโจทย์</p>
  </div>
  <div class="content-split-media">
    <img src="/images/gallery/science-testtube-01.jpg" alt="นักเรียนฝึกทำโจทย์คณิตศาสตร์และวิทยาศาสตร์" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/science-beaker-01.jpg" alt="บรรยากาศห้องเรียนติวเข้มวิชาคณิตศาสตร์และวิทยาศาสตร์" />
    </div>
    <h4>อ่านโจทย์ 2 รอบก่อนลงมือทำ</h4>
    <p>รอบแรกอ่านเพื่อจับใจความว่าโจทย์ถามอะไร รอบสองอ่านพร้อมขีดเส้นใต้ตัวเลขและคำสำคัญ ช่วยลดการตีโจทย์ผิด</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/science-specimen-01.jpg" alt="นักเรียนสองคนโชว์ผลงานรถของเล่น STEM ที่ประดิษฐ์เอง" />
    </div>
    <h4>ฝึกทำโจทย์แบบจับเวลา</h4>
    <p>ข้อสอบ Gifted มักมีเวลาจำกัดต่อข้อค่อนข้างน้อย การฝึกจับเวลาสม่ำเสมอช่วยฝึกการบริหารเวลาในสนามสอบจริง</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>กลยุทธ์การทำข้อสอบ</h3>
    <p>ทำโจทย์ที่มั่นใจก่อน ข้ามโจทย์ที่ยากไว้ทำทีหลัง ใช้เทคนิคตัดตัวเลือกที่เป็นไปไม่ได้ออกก่อนเมื่อไม่แน่ใจคำตอบ และเผื่อเวลาตรวจทานคำตอบอย่างน้อย 5 นาทีสุดท้าย</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>อย่าติดอยู่กับโจทย์ข้อเดียวนานเกินไป หากคิดไม่ออกภายในเวลาที่ตั้งไว้ ให้ข้ามไปทำข้ออื่นก่อนแล้วค่อยกลับมา</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🎯</span>
      <h3>เคล็ดลับ</h3>
      <p>ฝึกโจทย์ย้อนหลังหลายปีจากหลายโรงเรียน จะช่วยให้คุ้นเคยกับหลากหลายรูปแบบโจทย์</p>
    </div>
  </div>
</div>

<p>คอร์สสอบเข้า ม.1 ของ English Mania รวม 45 ชั่วโมง ครบทุกวิชา พร้อมข้อสอบเก่าย้อนหลัง 5 ปีให้ฝึกฝน ดูรายละเอียดเพิ่มเติมได้ที่หน้าคอร์สของเรา</p>
`.trim(),
  },
  {
    title: "รวมคำศัพท์ภาษาอังกฤษระดับประถมปลาย (ป.4-6) ที่ควรรู้",
    slug: "vocab-upper-primary-must-know",
    excerpt:
      "รวมคำศัพท์ภาษาอังกฤษพื้นฐานในชีวิตประจำวันที่เด็กประถมปลายควรรู้ แยกตามหมวดหมู่ใกล้ตัว",
    cover_image: "/images/courses/english-foundation.jpg",
    published_at: "2026-09-18 00:00:00.000Z",
    content: `
<p>นอกจากคำศัพท์เฉพาะทางที่ออกสอบ เด็กประถมปลายควรมีคลังคำศัพท์พื้นฐานในชีวิตประจำวันที่กว้างพอจะสื่อสารและอ่านเข้าใจ บทความนี้รวมคำศัพท์ใกล้ตัวที่ควรรู้ แยกตามหมวดหมู่</p>

<div class="content-split">
  <div class="content-split-text">
    <h3>ครอบครัวและอาหาร</h3>
    <p><strong>ครอบครัว</strong>: father, mother, sibling, grandparent, cousin<br/><strong>อาหาร</strong>: breakfast, lunch, dinner, vegetable, fruit เช่น "I have rice and vegetables for lunch."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/gallery/english-lowtable-01.jpg" alt="นักเรียนเรียนรู้คำศัพท์ภาษาอังกฤษในชีวิตประจำวัน" />
  </div>
</div>

<div class="content-split content-split--reverse">
  <div class="content-split-text">
    <h3>สัตว์และกิจวัตรประจำวัน</h3>
    <p><strong>สัตว์</strong>: elephant, tiger, insect, mammal, reptile<br/><strong>กิจวัตรประจำวัน</strong>: wake up, brush teeth, study, exercise, go to bed เช่น "I wake up at six o'clock every day."</p>
  </div>
  <div class="content-split-media">
    <img src="/images/gallery/english-coloring-01.jpg" alt="นักเรียนระบายสีภาพสัตว์พร้อมคำศัพท์ภาษาอังกฤษ" />
  </div>
</div>

<div class="content-explore">
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/services/format-onsite.jpg" alt="นักเรียนเล่นเกมทายคำศัพท์ภาษาอังกฤษเป็นกลุ่ม" />
    </div>
    <h4>เล่นเกมทายคำศัพท์ (Charades)</h4>
    <p>ให้เด็กแสดงท่าทางตามคำศัพท์แต่ละหมวด แล้วให้เพื่อนทายเป็นภาษาอังกฤษ ช่วยจำคำศัพท์แบบสนุกและจำได้นาน</p>
  </div>
  <div class="content-explore-item">
    <div class="content-explore-media">
      <img src="/images/gallery/craft-keychain-01.jpg" alt="นักเรียนทำการ์ดคำศัพท์ภาษาอังกฤษ" />
    </div>
    <h4>ทำการ์ดคำศัพท์ (Flashcards)</h4>
    <p>ให้เด็กทำการ์ดคำศัพท์เองพร้อมวาดภาพประกอบ เป็นวิธีทบทวนคำศัพท์ที่ได้ผลดีและฝึกความจำระยะยาว</p>
  </div>
</div>

<div class="content-highlights">
  <div class="content-highlights-main">
    <h3>วิธีทบทวนคำศัพท์ให้ได้ผล</h3>
    <p>แบ่งคำศัพท์เป็นหมวดหมู่ใกล้ตัว (ครอบครัว อาหาร สัตว์ กิจวัตร) แล้วทบทวนทีละหมวด สลับกับการนำไปใช้จริงในประโยคหรือบทสนทนาสั้นๆ จะจำได้แม่นกว่าท่องจำรายการคำโดดๆ</p>
  </div>
  <div class="content-highlights-row">
    <div class="content-highlights-card">
      <h3>ข้อควรระวัง</h3>
      <p>คำนามนับได้กับนับไม่ได้ใช้ต่างกัน เช่น "a vegetable" (นับได้ทีละหน่วย) กับ "rice" (นับไม่ได้ ต้องพูดว่า "some rice" หรือ "a bowl of rice")</p>
    </div>
    <div class="content-highlights-card content-highlights-card--compact">
      <span class="content-highlights-icon">🐘</span>
      <h3>เคล็ดลับ</h3>
      <p>ทบทวนคำศัพท์เก่าสัปดาห์ละครั้ง ควบคู่กับเรียนคำใหม่ จะช่วยไม่ให้ลืมคำที่เคยเรียนไปแล้ว</p>
    </div>
  </div>
</div>

<p>อยากให้ลูกมีคลังคำศัพท์ภาษาอังกฤษที่กว้างและใช้งานได้จริงในชีวิตประจำวัน ดูรายละเอียดคอร์สปูพื้นฐานของ English Mania ได้ที่หน้าคอร์สของเรา</p>
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
      await update(token, "blog_posts", existing.id, post);
      console.log(`  ~ updated "${post.title}" — slug "${post.slug}" already existed, refreshed its content/images`);
      continue;
    }
    await create(token, "blog_posts", post);
    console.log(`  + created "${post.title}"`);
  }

  console.log(`\nDone. Reload /blog — the ${POSTS.length} articles should now appear, newest first:`);
  POSTS.slice()
    .sort((a, b) => (a.published_at < b.published_at ? 1 : -1))
    .forEach((p) => console.log(`  - /blog/${p.slug}/  (${p.published_at.slice(0, 10)})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
