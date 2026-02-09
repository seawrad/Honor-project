import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import './LoginSuccessTransition.css'

const DURATION_MS = 2200
const FADEOUT_MS = 1800

interface LoginSuccessTransitionProps {
  onComplete: () => void
}

export const LoginSuccessTransition: React.FC<LoginSuccessTransitionProps> = ({ onComplete }) => {
  const { t } = useTranslation()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), FADEOUT_MS)
    return () => clearTimeout(exitTimer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(onComplete, DURATION_MS)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <Box
      className={`login-success-transition${exiting ? ' login-success-transition--exit' : ''}`}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--login-transition-start, #0d47a1) 0%, var(--login-transition-end, #1565c0) 50%, var(--login-transition-mid, #1976d2) 100%)',
        color: '#fff',
      }}
    >
      <Box className="login-success-transition__check-wrap" sx={{ mb: 3 }}>
        <CheckCircleOutlineRoundedIcon
          className="login-success-transition__check"
          sx={{ fontSize: 96 }}
        />
      </Box>
      <Typography
        className="login-success-transition__welcome"
        variant="h4"
        component="span"
        fontWeight="600"
        letterSpacing="0.05em"
      >
        {t('welcome')}
      </Typography>
    </Box>
  )
}
