import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the install prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('cys:installPromptDismissed', Date.now().toString());
  };

  // Don't show if already dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('cys:installPromptDismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Don't show if already installed (running in standalone mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (!showPrompt || !deferredPrompt || isStandalone) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '420px',
      width: 'calc(100% - 32px)',
      background: '#0f172a',
      border: '2px solid #10b981',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
      zIndex: 9999,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px' }}>
          Install Call Your Sphere
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
          Add to your home screen for quick access. Works offline and feels like a native app!
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '8px',
            border: '2px solid #475569',
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Not Now
        </button>
        <button
          onClick={handleInstall}
          style={{
            flex: 2,
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: '#0f172a',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          Install App
        </button>
      </div>
    </div>
  );
}
