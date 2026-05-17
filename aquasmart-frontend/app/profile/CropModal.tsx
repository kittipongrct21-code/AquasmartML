"use client";

import React, { useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/crop-image";

interface CropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function CropModal({ imageSrc, onCropComplete, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = (croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  };

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) return;
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (blob) {
        onCropComplete(blob);
      }
    } catch (error) {
      console.error("Failed to crop image:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[500px] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        
        {/* ส่วนหัวข้อ */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900">ปรับแต่งรูปโปรไฟล์</h3>
          <p className="text-xs text-slate-500">ลากเพื่อย้ายพิกัด หรือเลื่อนแถบเพื่อซูมรูปภาพ</p>
        </div>

        {/* พื้นที่สำหรับทำระบบครอปรูป */}
        <div className="relative w-full flex-1 rounded-2xl bg-slate-100 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // อัตราส่วน 1:1 เป็นสี่เหลี่ยมจัตุรัส
            cropShape="round" // แสดงผลไกด์ไลน์เป็นวงกลมสำหรับรูปโปรไฟล์
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        {/* แถบเลื่อนปรับการซูม */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs font-medium text-slate-500">ซูม</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
          />
        </div>

        {/* ปุ่มกดยืนยัน / ยกเลิก */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ใช้รูปนี้
          </button>
        </div>
      </div>
    </div>
  );
}