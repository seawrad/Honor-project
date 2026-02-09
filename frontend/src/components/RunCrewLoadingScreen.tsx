import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import './RunCrewLoadingScreen.css'

const DEFAULT_DURATION_MS = 4800
const FADEOUT_BEFORE_MS = 4200

interface RunCrewLoadingScreenProps {
  /** When set, screen will call onComplete after duration (e.g. post-login transition) */
  onComplete?: () => void
  /** Duration in ms before onComplete. Default 2200 */
  duration?: number
}

/**
 * RunCrew loading screen: logo with blur background and loading dots.
 * Use with onComplete for post-login transition; without for auth init loading.
 */
export const RunCrewLoadingScreen: React.FC<RunCrewLoadingScreenProps> = ({
  onComplete,
  duration = DEFAULT_DURATION_MS,
}) => {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!onComplete) return
    const exitTimer = setTimeout(() => setExiting(true), FADEOUT_BEFORE_MS)
    return () => clearTimeout(exitTimer)
  }, [onComplete])

  useEffect(() => {
    if (!onComplete) return
    const timer = setTimeout(onComplete, duration)
    return () => clearTimeout(timer)
  }, [onComplete, duration])

  return (
    <Box className={`runcrew-loading${exiting ? ' runcrew-loading--exit' : ''}`}>
      <Box className="runcrew-loading__center">
        <Box className="runcrew-loading__logo-glass">
          <img
            src="/Main_logo.png"
            alt="RunCrew"
            className="runcrew-loading__logo"
          />
          <Box className="runcrew-loading__dots" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
