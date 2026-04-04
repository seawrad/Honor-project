import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { LegalDocumentLayout } from '../components/LegalDocumentLayout'

const SECTION_KEYS: { h: string; b: string }[] = [
  { h: 'legalTermsH2_about', b: 'legalTermsAbout' },
  { h: 'legalTermsH2_acceptance', b: 'legalTermsAcceptance' },
  { h: 'legalTermsH2_account', b: 'legalTermsAccount' },
  { h: 'legalTermsH2_conduct', b: 'legalTermsConduct' },
  { h: 'legalTermsH2_location', b: 'legalTermsLocation' },
  { h: 'legalTermsH2_disclaimer', b: 'legalTermsDisclaimer' },
  { h: 'legalTermsH2_changes', b: 'legalTermsChanges' },
  { h: 'legalTermsH2_contact', b: 'legalTermsContact' },
]

export function TermsPage() {
  const { t } = useTranslation()
  return (
    <LegalDocumentLayout titleKey="legalTermsTitle">
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
