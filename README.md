# 🏫 English Mania Website (เว็บไซต์สถาบันสอนภาษา English Mania by KruYam)

![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-SQLite-B8DBE4?style=for-the-badge&logo=pocketbase&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-%3E%3D22.12-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Status](https://img.shields.io/badge/status-pre--launch-yellow?style=for-the-badge)

เว็บไซต์ตัวใหม่ของสถาบัน **English Mania by KruYam** สร้างขึ้นมาแทนที่ระบบเช่าแพลตฟอร์มเดิมที่กำลังจะหมดอายุ
ด้วยสถาปัตยกรรมเบา ๆ ที่รันได้บนเครื่องเดียว ทั้งหน้าเว็บ (Astro) และระบบจัดการเนื้อหา (PocketBase) โฮสต์เอง
บน Google Cloud โดยที่ **ไม่มีค่าใช้จ่ายรายเดือนเลยสักบาท (Zero-cost hosting)** ไม่ต้องพึ่ง CMS ราคาแพง
หรือปลั๊กอินรกเครื่องอีกต่อไป — สวยงามระดับพรีเมียมแบบ Apple-inspired แต่ดูแลเองได้ 100%!

---

## 📢 อัปเดตล่าสุด (Recent Updates)

- **ทุกคอร์สมีหน้าของตัวเองแล้ว (Course, Promotion & Workshop Pages):** เมื่อก่อนคลิกคอร์สแล้วไม่มีอะไรให้อ่าน
  ต่อ ตอนนี้ทุกคอร์ส ทุกโปรโมชั่น และทุกเวิร์กช็อป มีหน้ารายละเอียดของตัวเอง — เห็นราคา ตารางเรียน รูปห้องเรียนจริง
  รีวิว และปุ่มจองผ่าน LINE ที่ลอยตามตลอดเวลาที่เลื่อนอ่าน กดจองได้ทันทีไม่ต้องเลื่อนกลับขึ้นไปหา
  สถานะปัจจุบัน: **โครงหน้าเสร็จครบทุกคอร์สแล้ว รอเติมเนื้อหาจริง**
- **เมนูคอร์สเรียนแบบใหม่ + ใช้งานบนมือถือได้แล้ว (Mega-Menu & Mobile Nav):** ชี้ที่ "คอร์สเรียน" แล้วเมนูใหญ่จะ
  กางออกมา แยกให้เลือกตาม **วิชา / ชั้นปี / ติวสอบ / รูปแบบการเรียน / เวิร์กช็อป** ผู้ปกครองที่มีลูก ป.6 กดคำว่า
  "ป.6" ครั้งเดียวก็เห็นเฉพาะคอร์สที่เหมาะกับลูกทันที และเมนูจะโชว์เฉพาะหมวดที่มีคอร์สจริงเท่านั้น ไม่มีทางกดเข้าไป
  เจอหน้าว่าง ส่วนบนมือถือ เมื่อก่อนเมนูล้นออกนอกจอจนกดไม่ได้ ตอนนี้เปลี่ยนเป็นปุ่มขีดสามขีดเปิดเมนูเต็มจอแทน
- **หน้ารวมคอร์สเห็นทุกอย่างในที่เดียว (Unified Catalog):** หน้า "คอร์สเรียน" รวมคอร์ส โปรโมชั่น และเวิร์กช็อป
  ไว้หน้าเดียว โดยโปรโมชั่นอยู่บนสุดพร้อมป้ายกำกับสีแดง — ของที่มีเวลาจำกัดจะได้ไม่ถูกกลบ
- **แก้รูปการ์ดคอร์สยืดผิดสัดส่วน (Card Image Fix):** คอร์สที่ใช้รูปแนวตั้งจะทำให้การ์ดใบนั้นสูงกว่าเพื่อน
  แถวเบี้ยวทั้งแถว ตอนนี้ทุกการ์ดถูกครอบเป็นสัดส่วนเดียวกันหมดไม่ว่าจะอัปโหลดรูปแนวไหนมา

## 🕒 Previous Updates

- **ดีไซน์ใหม่ครบทั้ง 8 หน้า (Full Design Rollout):** หน้าแรก, คอร์สเรียน, เวิร์กช็อป, บทความ, เกี่ยวกับเรา,
  คำถามที่พบบ่อย และติดต่อเรา ทุกหน้าอัปเดตเป็นดีไซน์ใหม่แนว "clean + minimal, with flair" แล้ว โทนสีทุกหน้า
  ยึดตาม [`design/DESIGN.md`](./design/DESIGN.md) เป๊ะ ๆ ไม่มีสีหลุดโทนแบรนด์แม้แต่จุดเดียว
  สถานะปัจจุบัน: **เสถียรพร้อมใช้งาน (Build ผ่านแล้ว)**
- **แก้บั๊กฟอร์มติดต่อ (Contact Form Fix):** เมื่อก่อนถ้าส่งข้อความไม่สำเร็จ (เน็ตหลุด, เซิร์ฟเวอร์ล่มชั่วคราว)
  ปุ่มยืนยันตัวตนกันสแปมจะค้าง กดส่งซ้ำไม่ได้อีกเลย ตอนนี้แก้แล้ว รีเซ็ตให้อัตโนมัติทุกครั้งไม่ว่าจะสำเร็จหรือไม่ก็ตาม
- **ยืนยันแล้วว่ารันได้จริง (First Verified Build):** ก่อนหน้านี้โค้ดผ่านแค่การอ่านทวนเท่านั้น รอบนี้รัน
  `npm install` + `npm run build` จริงแล้วผ่านฉลุยไม่มี error
- Scaffold โครงสร้างเริ่มต้น (Astro + PocketBase + Docker Compose + GitHub Actions) — 2026-08-08
- ระบบ PDPA consent, Cloudflare Turnstile กันสแปม, ระบบสำรองข้อมูลอัตโนมัติขึ้น Google Drive

---

## 🔥 ไฮไลท์ฟีเจอร์เด่น (Key Features)

### 🎨 1. ดีไซน์สวยระดับพรีเมียม แต่เว็บไม่อืด (Fast & Premium Design)
บอกลาเว็บแบบสำเร็จรูปที่ช้าและลายตา! หน้าเว็บทุกหน้าถูกออกแบบใหม่ให้ขาวสะอาด โล่ง อ่านง่าย
เน้นรูปถ่ายจริงเป็นพระเอกแทนสีสันจัดจ้าน โหลดเร็วเพราะ Astro render ฝั่งเซิร์ฟเวอร์โดยตรง ไม่ต้องรอ JavaScript
โหลดทั้งกองก่อนถึงจะเห็นเนื้อหา

### 📱 2. จองคอร์ส/เวิร์กช็อปผ่าน LINE ได้ทันที (One-Tap LINE Booking)
ทุกปุ่ม "จองผ่าน LINE" พาไปคุยกับแอดมินตัวจริงทันที ไม่ต้องสมัครสมาชิก ไม่ต้องจำรหัสผ่านให้ยุ่งยาก
เหมือนธุรกิจจริงที่ใช้ LINE คุยกับลูกค้าทุกวันอยู่แล้ว

### ✍️ 3. แก้เนื้อหาเองได้ไม่ต้องรอโปรแกรมเมอร์ (Self-Service Content via PocketBase)
คอร์สเรียน โปรโมชั่น เวิร์กช็อป รีวิว คำถามที่พบบ่อย — ทุกอย่างแก้ผ่านหน้าจัดการเนื้อหา (PocketBase Admin)
ได้เอง ไม่ต้องแตะโค้ดสักบรรทัด อัปเดตปุ๊บ เว็บอัปเดตปั๊บ

### 🔒 4. ปลอดภัยตามมาตรฐาน PDPA (Privacy-First by Design)
แบบฟอร์มติดต่อมี checkbox ขอความยินยอมตามกฎหมาย PDPA จริง ๆ ไม่ใช่แค่มีให้ดูเฉย ๆ — ระบบเช็คซ้ำฝั่งเซิร์ฟเวอร์
ด้วย ต่อให้มีคนพยายามส่งข้อมูลข้ามหน้าฟอร์มมาตรง ๆ ก็ยังเซฟข้อมูลไม่ได้ถ้าไม่ติ๊กยินยอม พร้อมระบบกันสแปม
Cloudflare Turnstile ฟรี ไม่จำกัดจำนวนครั้ง

✅ ระบบสำรองข้อมูลอัตโนมัติขึ้น Google Drive ทุกวัน (14 วันย้อนหลัง)
✅ เว็บวิ่งอยู่หลัง Cloudflare เข้ารหัส HTTPS ให้อัตโนมัติ ไม่ต้องยุ่งกับใบรับรองเอง
✅ ค่าโฮสต์ 0 บาท/เดือน ใช้ GCP free tier

---

## 🛠️ Tech Stack

### Frontend
- **Astro 7** (SSR mode, `@astrojs/node` adapter — standalone)
- Vanilla CSS ผ่าน `global.css` design tokens (ไม่ใช้ Tailwind — สีและระยะห่างล็อกตาม `design/DESIGN.md`)

### Backend / CMS
- **PocketBase** (SQLite ในตัว Go binary เดียว ไม่ต้องแยกฐานข้อมูล)
- Google Sheets API + Gmail API สำหรับ backup และแจ้งเตือนฟอร์มติดต่อ

### DevOps
- **Docker Compose** (สภาพแวดล้อม dev เหมือน prod เป๊ะ)
- **GitHub Actions** deploy อัตโนมัติทุกครั้งที่ push ขึ้น `main`
- **GCP Compute Engine `e2-micro`** (Always Free tier — ต้องอยู่ใน `us-west1`/`us-east1`/`us-central1`)
- **Cloudflare** (DNS + Proxy TLS + Turnstile anti-spam)

---

## 🛠 สิ่งที่ต้องมีในเครื่อง (Prerequisites)

- **Node.js >= 22.12** — เช็คด้วย `node --version` (มี `.nvmrc` ให้แล้ว ใช้ `fnm`/`nvm` สลับเวอร์ชั่นอัตโนมัติได้)
- **Docker + Docker Compose** (จำลองสภาพแวดล้อม prod บนเครื่อง)

---

## 🚀 วิธีการเริ่มต้นใช้งาน (Quick Start)

รันสองส่วนแยกกัน: PocketBase (API + CMS พอร์ต 8090) และ Astro dev server (พอร์ต 4321)

### 1. ตั้งค่า PocketBase

```bash
cd pocketbase
# โหลด PocketBase binary ให้ตรงเวอร์ชั่น (ดูที่ https://pocketbase.io/docs) — ไฟล์นี้ .gitignore ไว้แล้ว
curl -sL -o pb.zip https://github.com/pocketbase/pocketbase/releases/download/v0.39.5/pocketbase_0.39.5_linux_amd64.zip
unzip -o pb.zip pocketbase && rm pb.zip && chmod +x ./pocketbase

cp .env.example .credentials
# แก้ .credentials ใส่รหัสผ่านของตัวเอง

./pocketbase serve --http=127.0.0.1:8090
```

ครั้งแรกเท่านั้น เปิด terminal อีกหน้าต่าง:

```bash
cd pocketbase
source .credentials
./pocketbase superuser upsert "$SUPERUSER_EMAIL" "$SUPERUSER_PASS"
node seed.mjs
```

👉 หน้าจัดการเนื้อหา PocketBase: http://127.0.0.1:8090/_/

### 2. รันเว็บ Astro

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

👉 เปิดดูที่ http://localhost:4321

> 💡 อ่านสถาปัตยกรรมและโครงสร้างข้อมูลแบบละเอียดได้ที่ [`CLAUDE.md`](./CLAUDE.md)

---

## 🎯 Roadmap

- ✅ **DONE** — Scaffold โครงสร้าง Astro + PocketBase + Docker + CI/CD (2026-08-08)
- ✅ **DONE** — ดีไซน์ครบ 8 หน้า, build ผ่านจริงเป็นครั้งแรก, push ขึ้น GitHub (2026-08-09)
- 🚧 **IN PROGRESS** — Pre-launch checklist:
  - จัดเตรียมเครื่อง GCP `e2-micro` จริง
  - กรอก GitHub Actions secrets ให้ครบ (ดูตารางด้านล่าง)
  - สร้าง Cloudflare Turnstile widget + LINE OA ตัวจริง
  - ย้าย DNS ที่ Cloudflare มาชี้เครื่องใหม่
  - ทดสอบสคริปต์ backup กับ PocketBase ตัวจริงบนเครื่อง VM
- 📋 **PLANNED** — ทนายตรวจ `privacy.astro` ให้ตรง PDPA แบบเป๊ะ ๆ ก่อน launch, อัปเดตเนื้อหาเกี่ยวกับเรา/คอร์สเรียนที่ค้างมา ~1 ปี
- 🎯 **เป้าหมาย**: ย้ายออกจากระบบเดิมให้เสร็จก่อน **2026-11-08** (วันที่แผนฟรีของระบบเดิมหมดอายุ)

---

## 📦 GitHub Actions Secrets ที่ต้องกรอกก่อน Deploy

ไปกรอกที่ `github.com/bornja55/Website-EGM` → Settings → Secrets and variables → Actions →
"New repository secret" (Claude กรอกให้ไม่ได้ ต้องทำเองเท่านั้น เพราะเป็นข้อมูลลับ):

| Secret | มาจากไหน | จำเป็นไหม |
|---|---|---|
| `GCP_SSH_HOST` | IP ของเครื่อง `e2-micro` (จาก wizard ตอน setup GCP) | ✅ จำเป็น |
| `GCP_SSH_USER` | ผู้ใช้ deploy ที่สร้างไว้บนเครื่อง VM | ✅ จำเป็น |
| `GCP_SSH_KEY` | SSH private key เฉพาะสำหรับ deploy (อย่าใช้คีย์ส่วนตัวซ้ำ) | ✅ จำเป็น |
| `SUPERUSER_EMAIL` | อีเมลที่ตั้งไว้เอง เช่น `admin@englishmania.local` | ✅ จำเป็น |
| `SUPERUSER_PASS` | รหัสผ่านที่ตั้งเองแบบรัดกุม | ✅ จำเป็น |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile → สร้าง widget ให้ `englishmania.co.th` → "Site Key" | ✅ จำเป็น |
| `TURNSTILE_SECRET_KEY` | widget เดียวกัน → "Secret Key" | ✅ จำเป็น (ไม่งั้นระบบกันสแปมจะปิดเงียบ ๆ) |
| `PUBLIC_POCKETBASE_URL` | `https://englishmania.co.th/pb` หรือ path ที่เปิด PocketBase API สู่สาธารณะ | ✅ จำเป็น |
| `GOOGLE_SHEETS_ID` | ID จาก URL ของ Google Sheet ที่จะเก็บ backup ฟอร์มติดต่อ | ⬜ ยังไม่ต้องก็ได้ |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service account key ของ GCP ที่เปิดสิทธิ์ Sheets + Gmail API | ⬜ ยังไม่ต้องก็ได้ |
| `GMAIL_SENDER` | อีเมล Gmail ที่ใช้ส่งแจ้งเตือนฟอร์มติดต่อ | ⬜ ยังไม่ต้องก็ได้ |

> 🚨 แม้แถวที่ "ยังไม่ต้องก็ได้" ก็ต้องสร้าง secret ทิ้งไว้ (ใส่ค่าว่างได้) เพราะขั้นตอน deploy จะ error ถ้าหา secret ที่อ้างถึงไม่เจอเลย

---

## ⚠️ ความปลอดภัยและสิ่งที่ควรทราบ (Security & Privacy)

- 🔒 **HTTPS บังคับทุกการเชื่อมต่อ** ผ่าน Cloudflare Proxy — ตัวเครื่อง VM เองไม่เปิดพอร์ต 443 เลยด้วยซ้ำ
- 🛡️ **กันสแปมด้วย Cloudflare Turnstile** ฟรี ไม่จำกัดจำนวนครั้ง ไม่ต้องให้ผู้ใช้ติ๊กรูปภาพน่ารำคาญแบบ CAPTCHA เก่า ๆ
- 👻 **ข้อมูลฟอร์มติดต่อได้รับความยินยอมจริง** ตามกฎหมาย PDPA — บังคับทั้งฝั่งหน้าเว็บและฝั่งเซิร์ฟเวอร์ ป้องกันการ
  ส่งข้อมูลลัดขั้นตอน
- 🔑 Secret ทุกตัว (รหัสผ่าน, API key) เก็บใน GitHub Actions secrets เท่านั้น ไม่มีอยู่ในโค้ดที่ push ขึ้น repo

---

## 🛠️ Troubleshooting

### `npm run build` ค้าง หรือ error "native binding"
**Status:** ทราบสาเหตุแล้ว
**Impact:** ปกติเวลาสลับรันโปรเจกต์ข้าม OS (เช่น รันบน Linux ทั้งที่ `node_modules` ลงจาก Windows)
**What broke:** ตัว compiler ของ Astro (`rolldown`) ใช้ native binary เฉพาะ OS ที่ลงตอน `npm install`
**Workaround:** ลบแล้วลงใหม่บน OS เดียวกับที่จะรันจริง
```bash
rm -rf node_modules package-lock.json
npm install
```

### `npm install` ค้างนานผิดปกติบนไดรฟ์ที่ sync กับ Google Drive/OneDrive
**Status:** ทราบสาเหตุแล้ว
**Impact:** ค้างได้เป็นสิบ ๆ นาที หรือดูเหมือนแฮงค์ไปเลย
**What broke:** โปรแกรม sync คลาวด์แย่งล็อกไฟล์กับ npm ที่กำลังเขียน `node_modules`
**Workaround:** ย้ายโปรเจกต์ไปไว้บนไดรฟ์ local ที่ไม่ sync กับคลาวด์ใด ๆ ก่อนพัฒนา

---

## 📄 License

ใช้ภายในสำหรับ English Mania by KruYam เท่านั้น ไม่เปิด public license

## 👨‍💻 Maintainer

**Siraphob** — พัฒนาโดยเจ้าของธุรกิจเอง ร่วมกับ Claude เป็น dev partner

<p align="center">Made with ❤️ for English Mania by KruYam</p>
