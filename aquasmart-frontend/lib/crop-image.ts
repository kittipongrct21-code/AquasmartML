export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    
    // 🚨 FIXED: ถ้าเป็นโลคอลไฟล์หรือ Data URL (Base64) ห้ามเซต crossOrigin เด็ดขาด
    if (url && !url.startsWith("data:")) {
      image.setAttribute("crossOrigin", "anonymous");
    }
    
    image.src = url;
  });

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CroppedAreaPixels
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // ตั้งค่าขนาดผลลัพธ์ปลายทาง (400x400 px สำหรับรูปโปรไฟล์)
  canvas.width = 400;
  canvas.height = 400;

  // วาดรูปภาพที่ถูกตัดลงบน Canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400
  );

  // แปลง Canvas เป็น Blob รูปภาพประเภท JPEG
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, "image/jpeg", 0.85); // คุณภาพ 85% บีบอัดกำลังดี
  });
}