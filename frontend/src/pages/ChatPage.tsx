import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { ChatRoom } from '../components/ChatRoom'

export const ChatPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>()
  const navigate = useNavigate()

  if (!activityId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Activity ID is required
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/activities/${activityId}`)}
        >
          Back to Activity
        </Button>
      </Box>

      <ChatRoom activityId={activityId} />
    </Container>
  )
}
