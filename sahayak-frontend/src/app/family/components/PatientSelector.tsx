"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { apiClient } from '@/lib/apiClient';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  avatarUrl?: string | null;
  relationshipType?: string | null;
}

interface PatientSelectorProps {
  /** Called with the full patient object whenever selection changes */
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientSelector({ onSelectPatient }: PatientSelectorProps) {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient('/api/family/members')
      .then(d => {
        if (Array.isArray(d)) {
          const mappedPatients = d.map((p: any) => ({
            ...p,
            id: p.profileId
          }));
          if (mappedPatients.length > 0) {
            setPatients(mappedPatients);
            const first = mappedPatients[0];
            setSelected(first);
            onSelectPatient(first);
          }
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (p: Patient) => {
    setSelected(p);
    onSelectPatient(p);
    setOpen(false);
  };

  const displayName = (p: Patient) =>
    p.preferredName || `${p.firstName} ${p.lastName}`.trim();

  // Single patient — no dropdown needed
  if (patients.length === 1 && selected) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
        <PatientAvatar patient={selected} size={32} />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{displayName(selected)}</p>
          {selected.relationshipType && (
            <p className="text-xs text-white/50 leading-tight capitalize">{selected.relationshipType}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" style={{ minWidth: '220px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all text-left"
      >
        {selected ? (
          <>
            <PatientAvatar patient={selected} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{displayName(selected)}</p>
              {selected.relationshipType && (
                <p className="text-xs text-white/50 truncate leading-tight capitalize">{selected.relationshipType}</p>
              )}
            </div>
          </>
        ) : (
          <span className="text-sm text-white/50 flex-1">{t('select_patient')}</span>
        )}
        <ChevronDown
          size={16}
          className={`text-white/50 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 top-full mt-2 w-full bg-[#1e2a45] border border-white/15 rounded-xl shadow-2xl overflow-hidden"
        >
          {patients.map(p => (
            <li
              key={p.id}
              role="option"
              aria-selected={selected?.id === p.id}
              onClick={() => handleSelect(p)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selected?.id === p.id
                  ? 'bg-purple-600/30 text-white'
                  : 'hover:bg-white/5 text-white/80'
              }`}
            >
              <PatientAvatar patient={p} size={32} />
              <div>
                <p className="text-sm font-medium leading-tight">{displayName(p)}</p>
                {p.relationshipType && (
                  <p className="text-xs text-white/50 leading-tight capitalize">{p.relationshipType}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PatientAvatar({ patient, size }: { patient: Patient; size: number }) {
  const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();
  if (patient.avatarUrl) {
    return (
      <img
        src={patient.avatarUrl}
        alt={`${patient.firstName} ${patient.lastName}`}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      }}
    >
      {initials || <User size={size * 0.5} />}
    </div>
  );
}
