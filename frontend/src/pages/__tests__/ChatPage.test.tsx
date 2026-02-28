import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/testUtils'
import userEvent from '@testing-library/user-event'
import { ChatPage } from '../ChatPage'
import { chatService } from '../../services/chat.service'
import { socketService } from '../../services/socket.service'
import { ChatMessage } from '../../types/chat.types'

// Mock services
vi.mock('../../services/chat.service')
vi.mock('../../services/socket.service')

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    isAuthenticated: true,
  }),
}))

const mockNavigate = vi.fn()

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ activityId: 'activity-1' }),
    useNavigate: () => mockNavigate,
  }
})

describe('ChatPage', () => {
  const mockActivityId = 'activity-1'
  const mockRoomId = 'room-1'

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      chatRoomId: mockRoomId,
      senderId: 'user-2',
      senderName: 'Other User',
      content: 'Hello!',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'msg-2',
      chatRoomId: mockRoomId,
      senderId: 'user-1',
      senderName: 'Test User',
      content: 'Hi there!',
      timestamp: new Date('2024-01-01T10:01:00Z'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock chat service
    vi.mocked(chatService.getChatRoomByActivityId).mockResolvedValue({
      id: mockRoomId,
      activityId: mockActivityId,
      createdAt: new Date(),
    })

    vi.mocked(chatService.getChatMessages).mockResolvedValue({
      messages: mockMessages,
      total: mockMessages.length,
    })

    // Mock socket service
    vi.mocked(socketService.connect).mockReturnValue({} as any)
    vi.mocked(socketService.isConnected).mockReturnValue(true)
    vi.mocked(socketService.joinRoom).mockImplementation(() => {})
    vi.mocked(socketService.leaveRoom).mockImplementation(() => {})
    vi.mocked(socketService.sendMessage).mockImplementation(() => {})
    vi.mocked(socketService.onMessageReceived).mockImplementation(() => {})
    vi.mocked(socketService.onUserJoined).mockImplementation(() => {})
    vi.mocked(socketService.onUserLeft).mockImplementation(() => {})
    vi.mocked(socketService.onUserTyping).mockImplementation(() => {})
    vi.mocked(socketService.onUserStopTyping).mockImplementation(() => {})
    vi.mocked(socketService.emitTyping).mockImplementation(() => {})
    vi.mocked(socketService.emitStopTyping).mockImplementation(() => {})
    vi.mocked(socketService.off).mockImplementation(() => {})
  })

  const getMessageInput = () =>
    screen.getByPlaceholderText(/輸入訊息|Enter message|Type a message/i)

  it('should render back button', () => {
    render(<ChatPage />)
    expect(screen.getByText(/返回活動|Back to Activity/)).toBeInTheDocument()
  })

  it('should navigate back to activity when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    const backButton = screen.getByText(/返回活動|Back to Activity/)
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/activities/activity-1')
  })

  it('should render chat room component', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  // Requirement 7.3: Test message sending and receiving
  it('should send and receive messages in real-time', async () => {
    let messageCallback: ((message: any) => void) | undefined

    vi.mocked(socketService.onMessageReceived).mockImplementation((callback) => {
      messageCallback = callback
    })

    const user = userEvent.setup()
    render(<ChatPage />)

    // Wait for initial messages to load
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    // Type and send a message
    await user.type(getMessageInput(), 'New message')

    // Find send button by test ID (icon button without accessible name)
    const sendButton = screen.getByTestId('SendIcon').closest('button')
    if (sendButton) {
      await user.click(sendButton)
    }

    // Verify message was sent
    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'New message')

    // Simulate receiving a new message
    if (messageCallback) {
      messageCallback({
        id: 'msg-3',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'Reply message',
        timestamp: new Date('2024-01-01T10:02:00Z').toISOString(),
      })
    }

    // Verify new message appears
    await waitFor(() => {
      expect(screen.getByText('Reply message')).toBeInTheDocument()
    })
  })

  // Requirement 7.4: Test message display with timestamps and sender names
  it('should display messages with sender names and timestamps', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      // Check sender names are displayed
      expect(screen.getByText('Other User')).toBeInTheDocument()

      // Check timestamps are displayed (in HH:MM format)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  // Requirement 7.5: Test chat history loading
  it('should load chat message history on page load', async () => {
    render(<ChatPage />)

    // Verify chat room is fetched
    await waitFor(() => {
      expect(chatService.getChatRoomByActivityId).toHaveBeenCalledWith(mockActivityId)
    })

    // Verify messages are loaded
    await waitFor(() => {
      expect(chatService.getChatMessages).toHaveBeenCalledWith(mockRoomId, 50, 0)
    })

    // Verify messages are displayed
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  // Requirement 7.5: Test pagination for chat history
  it('should load chat history on page load', async () => {
    render(<ChatPage />)

    // Verify chat room is fetched
    await waitFor(() => {
      expect(chatService.getChatRoomByActivityId).toHaveBeenCalledWith(mockActivityId)
    })

    // Verify messages are loaded with correct parameters
    await waitFor(() => {
      expect(chatService.getChatMessages).toHaveBeenCalledWith(mockRoomId, 50, 0)
    })

    // Verify messages are displayed
    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  // Test notification display - messages appear in real-time
  it('should display new messages from other users in real-time', async () => {
    let messageCallback: ((message: any) => void) | undefined

    vi.mocked(socketService.onMessageReceived).mockImplementation((callback) => {
      messageCallback = callback
    })

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    // Simulate receiving a message from another user
    if (messageCallback) {
      messageCallback({
        id: 'msg-3',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'New notification message',
        timestamp: new Date().toISOString(),
      })
    }

    // Verify message appears
    await waitFor(() => {
      expect(screen.getByText('New notification message')).toBeInTheDocument()
    })
  })

  it('should render chat interface when activity ID is provided', async () => {
    // This test verifies that the page renders correctly with a valid activity ID
    render(<ChatPage />)

    // Wait for chat room to load
    await waitFor(() => {
      expect(chatService.getChatRoomByActivityId).toHaveBeenCalledWith(mockActivityId)
    })

    // Verify the chat interface is rendered
    await waitFor(() => {
      expect(screen.getByText('Activity Chat')).toBeInTheDocument()
    })
  })

  it('should handle chat room loading error', async () => {
    vi.mocked(chatService.getChatRoomByActivityId).mockRejectedValue(
      new Error('Failed to load chat room')
    )

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load chat room')).toBeInTheDocument()
    })
  })

  it('should connect to socket on mount', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(socketService.connect).toHaveBeenCalled()
    })
  })

  it('should join chat room after loading', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(socketService.joinRoom).toHaveBeenCalledWith(mockRoomId)
    })
  })

  it('should leave chat room on unmount', async () => {
    const { unmount } = render(<ChatPage />)

    await waitFor(() => {
      expect(socketService.joinRoom).toHaveBeenCalled()
    })

    unmount()

    expect(socketService.leaveRoom).toHaveBeenCalledWith(mockRoomId)
  })

  it('should display typing indicator when another user is typing', async () => {
    let typingCallback: ((data: { userId: string; displayName: string }) => void) | undefined

    vi.mocked(socketService.onUserTyping).mockImplementation((callback) => {
      typingCallback = callback
    })

    render(<ChatPage />)

    await waitFor(() => {
      expect(socketService.onUserTyping).toHaveBeenCalled()
    })

    // Simulate another user typing
    if (typingCallback) {
      typingCallback({ userId: 'user-2', displayName: 'Other User' })
    }

    await waitFor(() => {
      expect(screen.getByText(/Other User is typing\.\.\./)).toBeInTheDocument()
    })
  })

  it('should emit typing event when user types', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    await user.type(getMessageInput(), 'T')

    await waitFor(() => {
      expect(socketService.emitTyping).toHaveBeenCalledWith(mockRoomId)
    })
  })

  it('should handle socket disconnection gracefully', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false)

    const user = userEvent.setup()
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    await user.type(getMessageInput(), 'Test message')

    // Find send button by test ID
    const sendButton = screen.getByTestId('SendIcon').closest('button')
    if (sendButton) {
      await user.click(sendButton)
    }

    await waitFor(() => {
      expect(screen.getByText(/Not connected to chat/)).toBeInTheDocument()
    })
  })
})
