"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ArrowLeft, Mic, Send, History } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { apiClient } from '@/lib/apiClient';

export default function MemoriesPage() {
  const { session } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your Memory Assistant. You can tell me about your family, friends, or favorite memories. For example, "My grandson\'s name is Rahul."' }
  ]);
  const [pendingMemory, setPendingMemory] = useState<any>(null);
  const [savedMemories, setSavedMemories] = useState<any[]>([]);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchMemories();
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await apiClient('/api/memory-assistant');
      if (res.ok) {
        const data = await res.json();
        setSavedMemories(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition is not supported in this browser. Please type your answer.");
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    // If there is a pending memory, check if user said Yes or No
    if (pendingMemory) {
      const isYes = userMessage.toLowerCase().match(/^(yes|yeah|sure|yep|ok|okay|ha|haan)$/);
      if (isYes) {
        try {
          const res = await apiClient('/api/memory-assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', memory: pendingMemory })
          });
          if (res.ok) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Wonderful! I have safely stored that memory.' }]);
            fetchMemories();
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: 'No problem, I won\'t save that. Would you like to tell me something else?' }]);
      }
      setPendingMemory(null);
      return;
    }

    // Normal extraction flow
    try {
      const res = await apiClient('/api/memory-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract', text: userMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'ai', text: data.responseMessage }]);
        setPendingMemory(data.extracted);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto', display: 'flex', gap: '2rem' }}>
        
        {/* Left Side: Conversational Assistant */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={24} />
            </Link>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Memory Assistant</h1>
          </div>
          
          <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end',
                  background: msg.role === 'ai' ? 'var(--bg-color)' : 'var(--accent-color)',
                  color: msg.role === 'ai' ? 'var(--text-primary)' : 'white',
                  padding: '1rem 1.5rem',
                  borderRadius: '1rem',
                  maxWidth: '75%',
                  fontSize: '1.1rem',
                  border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none'
                }}>
                  {msg.text}
                </div>
              ))}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={toggleListen}
                style={{
                  background: isListening ? '#ef4444' : 'var(--accent-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                title={isListening ? "Stop listening" : "Tap to speak"}
              >
                <Mic size={28} />
              </button>
              
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Or type here..."
                style={{ flex: 1, padding: '1rem', fontSize: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
              />
              
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                style={{ background: inputText.trim() ? 'var(--accent-color)' : 'var(--border-color)', color: 'white', border: 'none', padding: '1rem', borderRadius: 'var(--radius-md)', cursor: inputText.trim() ? 'pointer' : 'not-allowed' }}
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Saved Memories Log */}
        <div style={{ width: '400px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <History size={24} color="var(--accent-color)" />
            <h2 style={{ fontSize: '1.5rem' }}>Remembered Items</h2>
          </div>
          
          {savedMemories.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No memories saved yet. Talk to the assistant to save some!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedMemories.map((m: any) => (
                <div key={m.id} style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)', marginBottom: '0.25rem' }}>{m.relationship}: {m.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{m.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
