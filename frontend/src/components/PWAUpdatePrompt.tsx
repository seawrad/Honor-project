import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar, Button, Alert } from '@mui/material';

export const PWAUpdatePrompt = () => {
  const { t } = useTranslation();
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
              {t('update')}
            </Button>
          ) : (
            <Button color="inherit" size="small" onClick={handleClose}>
              {t('close')}
            </Button>
          )
        }
        sx={{ width: '100%' }}
      >
        {updateAvailable
          ? t('updateAvailable')
          : t('appReadyOffline')}
      </Alert>
    </Snackbar>
  );
};
