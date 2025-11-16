import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../../test/testUtils'
import { ChatRoom } from '../ChatRoom'
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

describe('ChatRoom', () => {
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
    // Reset mocks
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
    vi.mocked(socketService.onMessageReceived).mockImplementation(() => {})
    vi.mocked(socketService.onUserJoined).mockImplementation(() => {})
    vi.mocked(socketService.onUserLeft).mockImplementation(() => {})
    vi.mocked(socketService.off).mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render loading state initially', () => {
    render(<ChatRoom activityId={mockActivityId} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should load and display chat messages', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  it('should connect to socket and join room', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.connect).toHaveBeenCalled()
      expect(socketService.joinRoom).toHaveBeenCalledWith(mockRoomId)
    })
  })

  it('should display message sender names', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
  })

  it('should display message timestamps', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  it('should show empty state when no messages', async () => {
    vi.mocked(chatService.getChatMessages).mockResolvedValue({
      messages: [],
      total: 0,
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument()
    })
  })

  it('should display error message on load failure', async () => {
    vi.mocked(chatService.getChatRoomByActivityId).mockRejectedValue(
      new Error('Failed to load')
    )

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load chat room')).toBeInTheDocument()
    })
  })

  it('should leave room on unmount', async () => {
    const { unmount } = render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.joinRoom).toHaveBeenCalled()
    })

    unmount()

    expect(socketService.leaveRoom).toHaveBeenCalledWith(mockRoomId)
  })
})
