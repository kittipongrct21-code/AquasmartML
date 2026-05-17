"use client";

import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface CropModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => Promise<void>;
  onCancel: () => void;
}

export default function CropModal({
  imageSrc,
  onCropComplete,
  onCancel,
}: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onCropAreaChange = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !canvasRef.current) return;

    try {
      setIsProcessing(true);

      const img = new Image();
      img.src = imageSrc;

      img.onload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            onCropComplete(blob);
          }
        }, "image/jpeg");
      };
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">ครอปรูปภาพ</h2>

        <div className="relative mb-4 h-96 w-full overflow-hidden rounded-lg bg-gray-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={true}
            onCropChange={setCrop}
            onCropAreaChange={onCropAreaChange}
            onZoomChange={setZoom}
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">ขนาด</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCropConfirm}
            disabled={isProcessing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? "กำลังประมวลผล..." : "ยืนยัน"}
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
