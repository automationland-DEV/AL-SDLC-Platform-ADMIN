import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '../../../components/ui';
import getCroppedImg from '../../../utils/cropImage';
import toast from 'react-hot-toast';

interface AvatarCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export function AvatarCropperModal({
  imageSrc,
  onClose,
  onCropComplete,
}: AvatarCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      if (croppedAreaPixels) {
        const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (croppedFile) {
          onCropComplete(croppedFile);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi cắt ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Chỉnh sửa ảnh đại diện</h3>
        </div>
        
        <div className="relative w-full h-80 bg-black/10">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            zoomSpeed={0.1}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">
              Thu phóng
            </label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => {
                setZoom(Number(e.target.value));
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
              Huỷ
            </Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? 'Đang xử lý...' : 'Lưu ảnh'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
