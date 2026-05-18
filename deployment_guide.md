# 🚀 คู่มือการนำ AquaSmart ขึ้น GitHub และ Deploy ระบบจริง

เพื่อให้คนอื่นสามารถใช้งานระบบ AquaSmart ได้จริง เราจะแบ่งการทำงานเป็น 3 ส่วน: 
1. **ดันโค้ดขึ้น GitHub**
2. **Deploy ฝั่ง Frontend (Next.js)** ไปที่ **Vercel**
3. **Deploy ฝั่ง Backend (FastAPI)** ไปที่ **Render** 

---

## 📦 1. การนำโค้ดขึ้น GitHub

1. ไปที่ [GitHub](https://github.com/) และสร้าง Repository ใหม่ (เช่นชื่อ `AquaSmart-ML`)
2. เปิด Terminal ใน VSCode (ตรวจสอบให้แน่ใจว่าทำงานอยู่ที่โฟลเดอร์ `d:\AquaSmart-ML`)
3. รันคำสั่งต่อไปนี้ตามลำดับ:

```bash
# เตรียมไฟล์ทั้งหมดเข้าสู่ Git
git add .

# บันทึกการเปลี่ยนแปลง (Commit)
git commit -m "🚀 First release: MVP ready for testing"

# เชื่อมต่อกับ GitHub ของคุณ (เปลี่ยน <YOUR_USERNAME> เป็นชื่อของคุณ)
# **ถ้าเคย add origin ไว้แล้ว ให้ข้ามบรรทัดนี้ไปได้เลย**
git remote add origin https://github.com/YOUR_USERNAME/AquaSmart-ML.git

# ดันโค้ดขึ้น GitHub
git push -u origin main
```
*(ปล. ไฟล์ระบบต่างๆ อย่าง `node_modules` หรือ `venv` จะไม่ถูกดันขึ้นไปเพราะเราตั้ง `.gitignore` ไว้เรียบร้อยแล้ว ปลอดภัยหายห่วงครับ)*

---

## 🌐 2. Deploy ฝั่ง Frontend (Vercel)

**Vercel** เป็นแพลตฟอร์มที่เสถียร ฟรี และเหมาะกับ Next.js ที่สุดครับ

1. สมัครและล็อกอินที่ [Vercel](https://vercel.com/) ด้วยบัญชี GitHub
2. กดปุ่ม **"Add New Project"** แล้วเลือก Repository `AquaSmart-ML` จาก GitHub
3. ในส่วน **Framework Preset** ให้เลือกเป็น `Next.js`
4. **⚠️ สำคัญมาก:** ในช่อง **Root Directory** ให้กดปุ่ม Edit แล้วเลือกโฟลเดอร์ `aquasmart-frontend`
5. เลื่อนลงมาที่แถบ **Environment Variables** เพื่อเพิ่มตัวแปรจากไฟล์ `.env` หรือ `.env.local` ฝั่ง Frontend ของคุณ:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(URL ของโปรเจกต์ Supabase)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(API Key ของ Supabase)*
   - `NEXT_PUBLIC_API_URL` = *(เว้นว่างไว้ก่อน หรือใส่ของ Localhost เดี๋ยวเราค่อยกลับมาแก้หลังจากได้ลิงก์ของ Backend ครับ)*
6. กด **Deploy** แล้วรอประมาณ 1-2 นาที คุณจะได้ลิงก์หน้าเว็บสำหรับแชร์ให้ผู้ใช้ทดสอบครับ

---

## ⚙️ 3. Deploy ฝั่ง Backend (Render)

**Render** เป็น Hosting ที่มีแพ็กเกจฟรีสำหรับเซิร์ฟเวอร์ (Web Service) เหมาะกับการรัน FastAPI มากๆ

1. สมัครและล็อกอินที่ [Render](https://render.com/) ด้วย GitHub
2. กดสร้างโปรเจกต์ใหม่ **"New"** -> **"Web Service"**
3. เลือก **"Build and deploy from a Git repository"** และเลือก Repository `AquaSmart-ML` ของคุณ
4. ตั้งค่าตามนี้เลยครับ:
   - **Name:** `aquasmart-backend` (หรือชื่ออื่นที่คุณชอบ)
   - **Region:** สิงคโปร์ หรือ อเมริกา (เลือกที่ใกล้ไทยที่สุดถ้ามี)
   - **Root Directory:** พิมพ์คำว่า `aquasmart-backend` ลงไป
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. เลื่อนลงมาล่างสุด หาหัวข้อ **Environment Variables** ให้กด Add และเอาค่าทั้งหมดจากไฟล์ `aquasmart-backend/.env` มาใส่ (ตัวที่ต้องเชื่อมกับ Supabase และตัวอื่นๆ)
6. เลือก Free Plan แล้วกด **"Create Web Service"**

---

## 🔗 4. ผูกระบบ Frontend เข้ากับ Backend บนโลกจริง

หลังจากเซิร์ฟเวอร์บน Render รันเสร็จ คุณจะได้ลิงก์จริงของ Backend มา (หน้าตาประมาณ `https://aquasmart-backend-xxxx.onrender.com`)

1. คัดลอกลิงก์นั้นไว้
2. กลับไปที่ Dashboard ของ Vercel (โปรเจกต์ Frontend ที่คุณ Deploy ไว้)
3. ไปที่เมนู **Settings** -> แท็บ **Environment Variables**
4. ค้นหา `NEXT_PUBLIC_API_URL` แล้วแก้ค่า (Edit) เป็นลิงก์ของ Render ที่ก๊อปปี้มา (ระวังอย่าให้มีเครื่องหมาย `/` ตามท้าย)
5. ไปที่แท็บ **Deployments** แล้วกดปุ่มจุดสามจุดเลือก **"Redeploy"**

เท่านี้เสร็จสิ้นครับ! ระบบ AquaSmart-ML ของคุณจะออนไลน์เต็มรูปแบบและพร้อมส่งลิงก์ให้ทีมหรือผู้ใช้งานคนอื่นทดสอบได้ทันที 🎉

---

## 🛠️ 5. คู่มือการแก้ไขปัญหาและบันทึก Hotfix (Production Updates)

นี่คือบันทึกความผิดพลาดและการแก้ไขปัญหา (Hotfixes & Configuration Updates) ล่าสุดบนระบบโปรดักชัน เพื่อความเสถียรและความปลอดภัยของระบบ:

### 🚨 Hotfix 1: ปัญหา React Hydration Mismatch (Error #418) บน Vercel Production
* **อาการของปัญหา (Symptoms):** เมื่อเปิดหน้าแคตตาล็อกปลา (`/fish`) หรือหน้าอื่นๆ บน Vercel หน้าจอจะค้างขาว (Hard Crash) และมีข้อผิดพลาด `Uncaught Error: Minified React error #418` ปรากฏในบราวเซอร์คอนโซล
* **สาเหตุ (Root Cause):** เกิดจากการเรนเดอร์ขัดแย้งกันระหว่าง Server-Side Rendering (Vercel) และ Client-Side Rendering (Browser) โดย [i18n-context.tsx](file:///d:/AquaSmart-ML/aquasmart-frontend/lib/i18n-context.tsx) พยายามอ่านภาษาจาก `localStorage` ทันทีที่เริ่มต้นโหลด ซึ่งเซิร์ฟเวอร์อ่านไม่ได้แต่บราวเซอร์อ่านได้ ส่งผลให้ HTML สองฝั่งไม่ตรงกัน (Hydration Text Mismatch)
* **การแก้ไข (Resolution):** ปรับปรุง `I18nProvider` โดยเพิ่มตัวแปรสถานะ `isMounted` เข้ามาดัก หากระบบยังโหลดฝั่งไคลเอนต์ไม่เสร็จสมบูรณ์ (`!isMounted`) จะระงับการเรนเดอร์ชั่วคราว (`return null`) เพื่อให้ Next.js รอจนกว่าบราวเซอร์จะเมาท์เสร็จสมบูรณ์ จึงค่อยดึงค่าจาก `localStorage` มาแสดงผลได้อย่างถูกต้องปลอดภัย

### 🚨 Hotfix 2: ปัญหาลิงก์กู้คืนรหัสผ่าน (Password Recovery Link) ชี้ไปที่ localhost
* **อาการของปัญหา (Symptoms):** ผู้ใช้สามารถกดและส่งอีเมลเพื่อขอ "ลืมรหัสผ่าน" (Forgot Password) ได้สำเร็จ แต่เมื่อกดลิงก์ในอีเมลแล้ว ลิงก์กลับส่งผู้ใช้ไปที่ `http://localhost:3000/...` เสมอ ทำให้ไม่สามารถกู้คืนรหัสผ่านบนเว็บจริงได้
* **สาเหตุ (Root Cause):** ค่าคอนฟิก Site URL ของบริการ Authentication ในระบบ Supabase Dashboard ยังคงชี้เป้าหลักไปที่เครื่อง Localhost (สภาพแวดล้อมระหว่างพัฒนา) 
* **การแก้ไข (Resolution):**
  1. **การตั้งค่า Supabase Dashboard (Auth Config):**
     * อัปเดต **Site URL** ในเมนู *Authentication -> URL Configuration* ให้ชี้ไปที่โดเมนจริงของ Vercel: `https://aquasmart-ml-w6nr.vercel.app`
     * เพิ่ม **Redirect URLs** เป็น `https://aquasmart-ml-w6nr.vercel.app/`
  2. **ปรับปรุงโค้ดฝั่ง Frontend (Router Fix):**
     * เพิ่มลอจิกความปลอดภัยในไฟล์ [AppNavbar.tsx](file:///d:/AquaSmart-ML/aquasmart-frontend/components/AppNavbar.tsx) ในฟังก์ชัน `supabase.auth.onAuthStateChange`
     * หากระบบตรวจพบอีเวนต์ประเภท `PASSWORD_RECOVERY` ตัวโมดูลนำทางของแอปพลิเคชันจะดักสัญญาณแล้วเปลี่ยนเส้นทาง (Redirect) ส่งผู้ใช้อัตโนมัติไปที่หน้าฟอร์มตั้งรหัสผ่านใหม่ที่หน้า `/auth/reset-password` บน Vercel ทันที
