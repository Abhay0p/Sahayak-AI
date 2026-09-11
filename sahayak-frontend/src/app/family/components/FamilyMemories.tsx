import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Heart, Plus, Edit3, Image as ImageIcon, X, Check } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import SummaryCard from '@/app/family/components/SummaryCard';

export default function FamilyMemories({ patientId }: { patientId: string }) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [memories, setMemories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMemories();
  }, [patientId]);

  const loadMemories = () => {
    if (!patientId) return;
    setIsLoading(true);
    apiClient(`/api/family/dashboard?elderlyId=${patientId}`)
      .then(d => {
        if (d.success && d.data.memories) {
          setMemories(d.data.memories);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!uploadPreview || !uploadTitle.trim()) {
      alert('Please enter a title for the photo.');
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem('sahayak_token') || '';
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/family/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          elderlyId: patientId,
          title: uploadTitle,
          description: '',
          mediaBase64: uploadPreview,
          mediaType: 'image',
        }),
      });
      setUploadPreview(null);
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMemories();
    } catch {
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SummaryCard icon={<Heart className="text-pink-400" />} title="Family Memories" className="mb-4">
      <input 
        id="memory-file-input"
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      {uploadPreview && (
        <div className="bg-black/20 p-4 rounded-lg mb-4">
          <img src={uploadPreview} alt="Preview" className="w-full max-h-48 object-cover rounded mb-3" />
          <input
            type="text"
            placeholder="Add a title..."
            value={uploadTitle}
            onChange={e => setUploadTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded p-2 mb-3 text-white outline-none"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => { setUploadPreview(null); setUploadTitle(''); }}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm flex items-center gap-1"
            >
              <X size={14} /> Cancel
            </button>
            <button 
              onClick={uploadPhoto}
              disabled={uploading || !uploadTitle.trim()}
              className="px-3 py-1.5 rounded bg-pink-500/80 hover:bg-pink-500 text-white text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Check size={14} /> {uploading ? 'Saving...' : 'Save Memory'}
            </button>
          </div>
        </div>
      )}
      {isLoading ? (
        <p className="text-white/70">Loading memories...</p>
      ) : memories.length === 0 ? (
        <div className="text-center p-6 bg-black/20 rounded-lg">
          <ImageIcon className="mx-auto opacity-40 mb-2" size={32} />
          <p className="text-white/70">No memories added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map(memory => (
            <div key={memory.id} className="bg-black/20 p-4 rounded-lg relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button className="text-white/60 hover:text-white bg-black/40 p-1.5 rounded-md">
                  <Edit3 size={14} />
                </button>
              </div>
              <p className="italic text-lg mb-2">\"{memory.title}\"</p>
              <p className="text-sm text-pink-300 font-medium">— {memory.uploader?.firstName} {memory.uploader?.lastName}</p>
            </div>
          ))}
        </div>
      )}
    </SummaryCard>
  );
}
