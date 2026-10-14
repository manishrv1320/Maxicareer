import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadFile, pickFile } from '../lib/api';

interface AvatarUploaderProps {
  src?: string;
  name: string;
  onUploaded: (url: string) => void;
  accent?: 'blue' | 'emerald';
}

/** Profile photo with an upload button; stores the image in Azure Blob Storage. */
export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ src, name, onUploaded, accent = 'blue' }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = async () => {
    const file = await pickFile('image/png,image/jpeg,image/webp,image/gif');
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadFile(file, 'avatar');
      onUploaded(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const ring = accent === 'emerald' ? 'hover:border-emerald-400 text-emerald-700' : 'hover:border-blue-400 text-blue-700';
  return (
    <div className="flex items-center gap-4">
      {src ? (
        <img src={src} alt={name} className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-black text-slate-500">
          {name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={choose}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 ${ring} disabled:opacity-60 cursor-pointer`}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {busy ? 'Uploading…' : 'Upload photo'}
        </button>
        <p className="text-[11px] text-slate-500 mt-1">PNG, JPG or WebP, up to 3 MB.</p>
        {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
};
