import type { ReactNode } from 'react'
import { Box, Container, Paper, Typography, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTranslation } from 'react-i18next'

type LegalDocumentLayoutProps = {
  titleKey: string
  children: ReactNode
}

export function LegalDocumentLayout({ titleKey, children }: LegalDocumentLayoutProps) {
  const { t } = useTranslation()
  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2, bgcolor: 'grey.50' }}>
      <Container maxWidth="md">
        <Button component={RouterLink} to="/register" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          {t('backToRegister')}
        </Button>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t(titleKey)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
            {t('legalLastUpdated', { date: '2026-04-05' })}
          </Typography>
          {children}
        </Paper>
      </Container>
    </Box>
  )
}
