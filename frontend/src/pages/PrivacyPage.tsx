import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { LegalDocumentLayout } from '../components/LegalDocumentLayout'

const SECTION_KEYS: { h: string; b: string }[] = [
  { h: 'legalPrivacyH2_about', b: 'legalPrivacyAbout' },
  { h: 'legalPrivacyH2_collect', b: 'legalPrivacyCollect' },
  { h: 'legalPrivacyH2_use', b: 'legalPrivacyUse' },
  { h: 'legalPrivacyH2_location', b: 'legalPrivacyLocation' },
  { h: 'legalPrivacyH2_retention', b: 'legalPrivacyRetention' },
  { h: 'legalPrivacyH2_security', b: 'legalPrivacySecurity' },
  { h: 'legalPrivacyH2_rights', b: 'legalPrivacyRights' },
  { h: 'legalPrivacyH2_changes', b: 'legalPrivacyChanges' },
  { h: 'legalPrivacyH2_contact', b: 'legalPrivacyContact' },
]

export function PrivacyPage() {
  const { t } = useTranslation()
  return (
    <LegalDocumentLayout titleKey="legalPrivacyTitle">
      {SECTION_KEYS.map(({ h, b }) => (
        <Box key={b} sx={{ mb: 2.5 }}>
          <Typography variant="h6" component="h2" sx={{ mt: 1, mb: 1 }}>
            {t(h)}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="p" sx={{ lineHeight: 1.7 }}>
            {t(b)}
          </Typography>
        </Box>
      ))}
    </LegalDocumentLayout>
  )
}
