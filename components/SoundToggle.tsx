'use client'

import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useAudio } from './useAudio'

interface SoundToggleProps {
  className?: string
}

const SoundToggle = ({ className = '' }: SoundToggleProps) => {
  const [soundFile, setSoundFile] = useState('/audio/welcome-sound.mp3')
  const [isMuted, setIsMuted] = useState(false)
  
  // التحقق من وجود ملفات الصوت
  useEffect(() => {
    const checkFiles = async () => {
      const filesToCheck = [
        '/audio/welcome-sound.mp3',
        '/audio/منصه-enhanced-v2.wav',
        '/audio/welcome.mp3',
        '/welcome.mp3',
        '/welcome-sound.mp3'
      ];
      
      for (const file of filesToCheck) {
        try {
          const response = await fetch(file, { method: 'HEAD' });
          if (response.ok) {
            setSoundFile(file);
            console.log('تم العثور على ملف الصوت للتحكم:', file);
            break;
          }
        } catch (err) {
          console.log('لم يتم العثور على ملف الصوت:', file);
        }
      }
    };
    
    checkFiles();
  }, []);

  const { playing, toggle } = useAudio({ 
    src: soundFile,
    autoPlay: false
  });

  const handleToggle = () => {
    toggle();
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg hover:bg-white/10 transition-all relative ${className}`}
      title={playing ? 'إيقاف الصوت' : 'تشغيل صوت الترحيب'}
    >
      {playing ? (
        <Volume2 className="w-5 h-5 text-gold" />
      ) : (
        <VolumeX className="w-5 h-5 text-white/60 hover:text-gold" />
      )}
      
      {/* مؤشر الصوت */}
      {playing && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
};

export default SoundToggle;
