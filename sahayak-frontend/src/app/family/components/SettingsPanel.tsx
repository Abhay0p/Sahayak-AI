import React, { useState } from 'react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';

import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

export default function SettingsPanel() {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  
  // Local state initialized from profile, falling back to defaults
  const [uiLanguage, setUiLanguage] = useState(profile?.languagePreference || 'English');
  const [voiceLanguage, setVoiceLanguage] = useState(profile?.voiceLanguage || 'English');
  const [voiceType, setVoiceType] = useState(profile?.voicePreference || 'MALE');
  
  const [highPriorityPush, setHighPriorityPush] = useState(true);
  const [normalPush, setNormalPush] = useState(true);
  const [normalSummary, setNormalSummary] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    // In a real implementation, we would send a PUT/PATCH request to a /api/profile endpoint
    // to update these fields in the database.
    // For now, we simulate a successful save.
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 max-w-2xl text-white">
      <h2 className="text-xl font-bold mb-6">{t('portal_settings')}</h2>
      
      <div className="space-y-6">
        {/* UI Language */}
        <div>
          <label className="block text-sm font-medium opacity-90 mb-2">
            {t('ui_language')}
          </label>
          <select
            value={uiLanguage}
            onChange={(e) => setUiLanguage(e.target.value)}
            className="w-full bg-black/30 border border-white/20 rounded-md p-2 text-white outline-none focus:border-accent-color"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Assamese">Assamese</option>
            <option value="Bengali">Bengali</option>
          </select>
          <p className="text-xs opacity-70 mt-1">
            {t('ui_language_desc')}
          </p>
        </div>

        <hr className="border-white/10" />

        {/* Voice Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('voice_prefs')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium opacity-90 mb-2">
                {t('voice_lang')}
              </label>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-md p-2 text-white outline-none focus:border-accent-color"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Assamese">Assamese</option>
                <option value="Bengali">Bengali</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium opacity-90 mb-2">
                {t('voice_type')}
              </label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-md p-2 text-white outline-none focus:border-accent-color"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NEUTRAL">Neutral</option>
              </select>
            </div>
          </div>
          <p className="text-xs opacity-70 mt-2">
            {t('voice_desc')}
          </p>
        </div>

        <hr className="border-white/10" />

        {/* Notification Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Family Notification Settings</h3>
          
          <div className="space-y-4">
            <div className="bg-black/20 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-red-400">High Priority Alerts</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={highPriorityPush} onChange={(e) => setHighPriorityPush(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-color"></div>
                </label>
              </div>
              <p className="text-xs opacity-70">Help Requests, Important Reminders, Emergency Alerts. Sent immediately to your device.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-blue-400">Normal Notifications</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={normalPush} onChange={(e) => setNormalPush(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-color"></div>
                </label>
              </div>
              <p className="text-xs opacity-70">Game Completions, Hydration Status, Messages. Sent immediately when they occur.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-green-400">Daily Summary Only</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={normalSummary} onChange={(e) => setNormalSummary(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-color"></div>
                </label>
              </div>
              <p className="text-xs opacity-70">If enabled, Normal notifications will be suppressed during the day and rolled into a single Daily Summary.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
        {success ? (
          <span className="text-green-400 text-sm font-medium">{t('saved_successfully')}</span>
        ) : (
          <span /> // Spacer
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--accent-color)] hover:bg-[var(--accent-color)]/90 text-white px-6 py-2 rounded-md font-medium transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          {t('save_changes')}
        </button>
      </div>
    </div>
  );
}
