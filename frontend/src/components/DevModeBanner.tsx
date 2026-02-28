import { Alert, Box } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export const DevModeBanner: React.FC = () => {
  const { isDeveloperMode } = useAuth();
  const { t } = useTranslation();

  if (!isDeveloperMode) return null;

  return (
    <Box sx={{ px: 2, py: 0.5 }}>
      <Alert
        severity="info"
        icon={<BugReportIcon />}
        sx={{
          py: 0.5,
          '& .MuiAlert-message': { fontSize: '0.875rem' },
        }}
      >
        {t('devModeActive')}
      </Alert>
    </Box>
  );
};
