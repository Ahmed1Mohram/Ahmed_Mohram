// إنشاء صوت بسيط باستخدام Web Audio API
function createSimpleBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log('تم تشغيل صوت بسيط بنجاح');
  } catch (err) {
    console.error('فشل في إنشاء الصوت:', err);
  }
}

// تصدير الوظيفة
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createSimpleBeep };
}
