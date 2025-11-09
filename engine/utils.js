// Universal Learning Utils - Optional tools for any topic
window.LearningUtils = {
  
  // Score & Progress Management
  score: {
    init(topicId, callbacks = {}) {
      const key = `learn:${topicId}`;
      const data = JSON.parse(localStorage.getItem(key) || '{"score":0,"attempts":0,"streak":0,"bestStreak":0}');
      
      return {
        data,
        save() { localStorage.setItem(key, JSON.stringify(data)); },
        correct() {
          data.score++;
          data.streak++;
          data.bestStreak = Math.max(data.bestStreak, data.streak);
          this.save();
          callbacks.onCorrect?.(data);
        },
        incorrect() {
          data.attempts++;
          data.streak = 0;
          this.save();
          callbacks.onIncorrect?.(data);
        },
        skip() {
          data.attempts++;
          this.save();
          callbacks.onSkip?.(data);
        }
      };
    }
  },

  // Timer utilities
  timer: {
    create(duration, onTick, onComplete) {
      let remaining = duration;
      const interval = setInterval(() => {
        remaining--;
        onTick?.(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          onComplete?.();
        }
      }, 1000);
      
      return {
        stop() { clearInterval(interval); },
        remaining() { return remaining; }
      };
    }
  },

  // Visual feedback
  effects: {
    confetti(container, colors = ['#ff0080', '#00ff80', '#8000ff', '#ff8000']) {
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
          position: fixed;
          width: 10px;
          height: 10px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          left: ${Math.random() * 100}vw;
          top: -10px;
          border-radius: 50%;
          pointer-events: none;
          animation: confetti-fall ${1 + Math.random() * 2}s linear forwards;
          z-index: 1000;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
      }
    },

    toast(message, type = 'info') {
      const toast = document.createElement('div');
      const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
      };
      
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: toast-slide 0.3s ease;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    },

    pulse(element) {
      element.style.animation = 'pulse 0.6s ease';
      setTimeout(() => element.style.animation = '', 600);
    }
  },

  // Audio feedback
  audio: {
    beep(frequency = 800, duration = 200) {
      if (!window.AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration/1000);
      
      osc.start();
      osc.stop(ctx.currentTime + duration/1000);
    },

    success() { this.beep(523, 150); setTimeout(() => this.beep(659, 150), 100); },
    error() { this.beep(220, 300); },
    click() { this.beep(800, 50); }
  },

  // Drag & Drop utilities
  dragDrop: {
    makeDraggable(element, onDrag, onDrop) {
      element.draggable = true;
      element.style.cursor = 'grab';
      
      element.addEventListener('dragstart', (e) => {
        element.style.cursor = 'grabbing';
        element.style.opacity = '0.5';
        onDrag?.(element, e);
      });
      
      element.addEventListener('dragend', (e) => {
        element.style.cursor = 'grab';
        element.style.opacity = '1';
        onDrop?.(element, e);
      });
    },

    makeDropZone(element, onDrop, onDragOver) {
      element.addEventListener('dragover', (e) => {
        e.preventDefault();
        element.style.background = 'rgba(0,255,0,0.1)';
        onDragOver?.(element, e);
      });
      
      element.addEventListener('dragleave', () => {
        element.style.background = '';
      });
      
      element.addEventListener('drop', (e) => {
        e.preventDefault();
        element.style.background = '';
        onDrop?.(element, e);
      });
    }
  }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
  }
  @keyframes toast-slide {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);