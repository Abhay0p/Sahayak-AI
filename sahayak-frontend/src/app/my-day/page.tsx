"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import Link from 'next/link';
import { ElderlyButton } from '@/components/ui/ElderlyButton/ElderlyButton';
import { 
  ArrowLeft, CheckCircle2, Circle, Edit2, Trash2, 
  Plus, Coffee, Droplets, Pill, Activity, Calendar, 
  Brain, Users, Moon
} from 'lucide-react';
import styles from './page.module.css';

interface RoutineItem {
  id: number;
  time: string;
  title: string;
  category: string;
  status: 'pending' | 'completed';
}

export default function MyDay() {
  const { profile, updateProfile } = useUserProfile();
  const { t } = useLanguage();
  
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [formData, setFormData] = useState({ time: '', title: '', category: 'Meal' });

  // Initial Data Load
  useEffect(() => {
    if (profile?.routinePreferences) {
      try {
        const parsed = JSON.parse(profile.routinePreferences);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sort items by time (simple sort for AM/PM format)
          const sorted = parsed.sort((a, b) => {
             const timeA = new Date('1970/01/01 ' + a.time).getTime();
             const timeB = new Date('1970/01/01 ' + b.time).getTime();
             return timeA - timeB;
          });
          setRoutine(sorted);
        } else {
          setRoutine([]);
        }
      } catch (e) {
        console.error("Failed to parse routine", e);
        setRoutine([]);
      }
    }
    setLoading(false);
  }, [profile]);

  // Immediate Save to DB wrapper
  const commitToDatabase = async (updatedRoutine: RoutineItem[]) => {
    const sorted = updatedRoutine.sort((a, b) => {
        const timeA = new Date('1970/01/01 ' + a.time).getTime();
        const timeB = new Date('1970/01/01 ' + b.time).getTime();
        return timeA - timeB;
    });
    setRoutine(sorted);
    await updateProfile({ routinePreferences: JSON.stringify(sorted) });
  };

  // CRUD Handlers
  const handleSaveModal = async () => {
    if (!formData.time || !formData.title) return; // Basic validation
    
    let updated: RoutineItem[];
    if (editingItem) {
      // Edit
      updated = routine.map(r => r.id === editingItem.id ? { ...r, ...formData } : r);
    } else {
      // Add
      const newItem: RoutineItem = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now(),
        time: formData.time,
        title: formData.title,
        category: formData.category,
        status: 'pending'
      };
      updated = [...routine, newItem];
    }
    
    await commitToDatabase(updated);
    closeModal();
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    const updated = routine.filter(r => r.id !== editingItem.id);
    await commitToDatabase(updated);
    setIsDeleteConfirmOpen(false);
    closeModal();
  };

  const toggleComplete = async (id: number) => {
    const updated: RoutineItem[] = routine.map(r => {
      if (r.id === id) {
        return { ...r, status: (r.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed' };
      }
      return r;
    });
    await commitToDatabase(updated);
  };

  // UI Helpers
  const openModal = (item?: RoutineItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ time: item.time, title: item.title, category: item.category || 'Meal' });
    } else {
      setEditingItem(null);
      setFormData({ time: '', title: '', category: 'Meal' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setEditingItem(null);
  };

  const getCategoryIcon = (category: string, title: string) => {
    const lower = (category || title).toLowerCase();
    if (lower.includes('hydrat') || lower.includes('water')) return <Droplets size={24} />;
    if (lower.includes('med') || lower.includes('pill')) return <Pill size={24} />;
    if (lower.includes('game') || lower.includes('brain')) return <Brain size={24} />;
    if (lower.includes('activ') || lower.includes('exercise')) return <Activity size={24} />;
    if (lower.includes('appoint')) return <Calendar size={24} />;
    if (lower.includes('fam')) return <Users size={24} />;
    if (lower.includes('rest')) return <Moon size={24} />;
    return <Coffee size={24} />; // Default Meal/Breakfast
  };

  // Next Activity Logic
  const { nextActivity, completedCount } = useMemo(() => {
    const completed = routine.filter(r => r.status === 'completed').length;
    // Find first pending item. In real app, would compare against Date.now()
    const next = routine.find(r => r.status === 'pending') || null;
    return { nextActivity: next, completedCount: completed };
  }, [routine]);

  if (loading) {
    return (
      <main className={styles.container}>
         <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Activity className="animate-spin" size={48} color="var(--accent-color)" style={{ margin: '0 auto' }} />
         </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/">
            <ElderlyButton variant="outline" icon={<ArrowLeft />}>
              {t('action.back', 'Back')}
            </ElderlyButton>
          </Link>
          <h1 className={styles.title}>{t('myday.title', 'My Day')}</h1>
        </div>
        <ElderlyButton variant="accent" icon={<Plus />} onClick={() => openModal()}>
          {t('action.addActivity', 'Add Activity')}
        </ElderlyButton>
      </header>

      {/* NEXT ACTIVITY HERO */}
      {routine.length > 0 && nextActivity && (
        <section className={styles.nextActivityCard}>
          <div>
            <p className={styles.nextActivityTitle}>NEXT</p>
            <p className={styles.nextActivityTime}>{nextActivity.time}</p>
            <h2 className={styles.nextActivityName}>{nextActivity.title}</h2>
          </div>
          <div>
            <button 
              className={styles.completeBtn}
              onClick={() => toggleComplete(nextActivity.id)}
            >
              <CheckCircle2 size={24} /> {t('myday.markComplete', 'Mark Complete')}
            </button>
          </div>
        </section>
      )}

      {routine.length > 0 && (
         <p className={styles.progressText}>
           <Activity size={20} /> Today's Progress: {completedCount} of {routine.length} activities completed
         </p>
      )}

      {/* TIMELINE */}
      {routine.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={64} color="var(--border-color)" style={{ margin: '0 auto' }} />
          <h2>No activities scheduled yet.</h2>
          <br/>
          <ElderlyButton variant="primary" onClick={() => openModal()}>
            + Add Activity
          </ElderlyButton>
        </div>
      ) : (
        <section className={styles.timeline}>
          {routine.map((item) => {
            const isCompleted = item.status === 'completed';
            return (
              <div key={item.id} className={styles.timelineItem}>
                <div className={styles.timeContainer}>
                  <span className={styles.time}>{item.time}</span>
                </div>
                
                <div className={`${styles.iconContainer} ${isCompleted ? styles.iconCompleted : ''}`}>
                  {isCompleted && <CheckCircle2 size={16} color="white" />}
                </div>

                <div className={`${styles.card} ${isCompleted ? styles.cardCompleted : ''}`}>
                  <div className={styles.cardContent}>
                    <div className={styles.cardIcon}>
                      {getCategoryIcon(item.category, item.title)}
                    </div>
                    <div>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      <span className={styles.statusText}>{isCompleted ? '✓ Completed' : 'Pending'}</span>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={`${styles.actionBtn} ${isCompleted ? styles.completeBtnDone : styles.completeBtn}`}
                      onClick={() => toggleComplete(item.id)}
                      aria-label="Toggle Complete"
                    >
                      <CheckCircle2 size={18} /> {isCompleted ? 'Completed' : 'Complete'}
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => openModal(item)}
                      aria-label="Edit Activity"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            {isDeleteConfirmOpen ? (
              <div>
                <h2 className={styles.modalTitle}>Delete Activity?</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Are you sure you want to remove <strong>{editingItem?.title}</strong> from your routine?</p>
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</button>
                  <button className={styles.saveBtn} style={{ background: 'var(--danger-color)' }} onClick={handleDelete}>Yes, Delete</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className={styles.modalTitle}>{editingItem ? 'Edit Activity' : 'Add Activity'}</h2>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Time</label>
                  {/* High contrast inputs */}
                  <input 
                    type="time" 
                    className={styles.input}
                    value={
                      // Convert 12h to 24h for input type="time"
                      formData.time ? 
                      (() => {
                        const [time, modifier] = formData.time.split(' ');
                        let [hours, minutes] = time.split(':');
                        if (hours === '12') hours = '00';
                        if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
                        return `${hours.padStart(2, '0')}:${minutes}`;
                      })() : ''
                    }
                    onChange={(e) => {
                       // Convert 24h back to 12h
                       let [hours, minutes] = e.target.value.split(':');
                       let h = parseInt(hours, 10);
                       const ampm = h >= 12 ? 'PM' : 'AM';
                       h = h % 12;
                       h = h ? h : 12; 
                       setFormData({ ...formData, time: `${h}:${minutes} ${ampm}` });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Activity Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Breakfast"
                    className={styles.input}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select 
                    className={styles.select}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Meal">Meal</option>
                    <option value="Medication">Medication</option>
                    <option value="Hydration">Hydration</option>
                    <option value="Exercise">Exercise</option>
                    <option value="Brain Activity">Brain Activity</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Rest">Rest</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveModal}
                    disabled={!formData.time || !formData.title}
                    style={{ opacity: (!formData.time || !formData.title) ? 0.5 : 1 }}
                  >
                    Save Changes
                  </button>
                </div>

                {editingItem && (
                  <button className={styles.deleteBtn} onClick={() => setIsDeleteConfirmOpen(true)}>
                    <Trash2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Delete this activity
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
