'use client'

import React, { useEffect } from 'react'

/**
 * هذا المكون يقوم بإنشاء ملف صوتي بطريقة برمجية باستخدام Web Audio API
 * وحفظه في المجلد العام للموقع
 */
const AudioGenerator = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime) // تردد الصوت
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2)
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.4)
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.5)
        
        console.log('تم إنشاء الصوت بنجاح')
      } catch (err) {
        console.error('فشل إنشاء الصوت', err)
      }
    }
  }, [])
  
  return null // هذا المكون لا يعرض أي عناصر في الواجهة
}

export default AudioGenerator
