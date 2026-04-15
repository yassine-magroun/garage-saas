'use client';

import { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Props = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  garageId: string;
  vehicleId: string;
  slot: string;
  onLightbox?: (url: string) => void;
};

export default function VehiclePhotoUpload({
  label,
  value,
  onChange,
  garageId,
  vehicleId,
  slot,
  onLightbox,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format accepté : JPEG, PNG, WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Taille max : 5 MB');
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${garageId}/${vehicleId}/${slot}.${ext}`;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('vehicle-photos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw new Error(uploadError.message);

      setProgress(90);

      const { data: urlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(path);

      setProgress(100);
      onChange(urlData.publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#8B8FA8]">{label}</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
        disabled={uploading || !garageId}
      />

      {value ? (
        <div className="relative group w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#2A2D3A] bg-[#0F1117]">
          {/* Thumbnail — clickable for lightbox */}
          <button
            type="button"
            className="w-full h-full"
            onClick={() => onLightbox?.(value)}
            title="Voir en grand"
          >
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
            />
          </button>

          {/* Overlay controls on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />

          {/* Delete */}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
            title="Supprimer"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Replace */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1.5 right-1.5 p-1 bg-[#1A1D27]/80 text-[#8B8FA8] rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-white z-10"
            title="Remplacer"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !garageId}
          className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-[#2A2D3A] hover:border-[#FF6B2B]/50 hover:bg-[#FF6B2B]/5 transition-all flex flex-col items-center justify-center gap-2 text-[#8B8FA8] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[11px]">{progress}%</span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span className="text-[11px]">Ajouter</span>
            </>
          )}
        </button>
      )}

      {uploading && (
        <div className="w-full h-0.5 bg-[#2A2D3A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6B2B] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
