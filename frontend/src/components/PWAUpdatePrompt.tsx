import { useEffect, useState } from 'react';
import { Snackbar, Button, Alert } from '@mui/material';

export const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setUpdateAvailable(true);
                setShowPrompt(true);
              }
            });
          }
        });
      });

      // Check for offline ready
      navigator.serviceWorker.ready.then(() => {
        if (!updateAvailable) {
          setShowPrompt(true);
          // Auto-hide after 3 seconds
          setTimeout(() => setShowPrompt(false), 3000);
        }
      });
    }
  }, [updateAvailable]);

  const handleClose = () => {
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 70, sm: 24 } }}
    >
      <Alert
        severity={updateAvailable ? 'info' : 'success'}
        action={
          updateAvailable ? (
            <Button color="inherit" size="small" onClick={handleUpdate}>
              更新
            </Button>
          ) : (
            <Button color="inherit" size="small" onClick={handleClose}>
              關閉
            </Button>
          )
        }
        sx={{ width: '100%' }}
      >
        {updateAvailable
          ? '有新版本可用，點擊更新以獲取最新功能'
          : '應用程式已可離線使用'}
      </Alert>
    </Snackbar>
  );
};
