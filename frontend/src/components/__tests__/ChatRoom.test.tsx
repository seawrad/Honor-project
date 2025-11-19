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
    vi.mocked(socketService.onUserTyping).mockImplementation(() => {})
    vi.mocked(socketService.onUserStopTyping).mockImplementation(() => {})
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

  it('should setup typing event listeners', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.onUserTyping).toHaveBeenCalled()
      expect(socketService.onUserStopTyping).toHaveBeenCalled()
    })
  })

  it('should display typing indicator when user is typing', async () => {
    let typingCallback: ((data: { userId: string; displayName: string }) => void) | null = null

    vi.mocked(socketService.onUserTyping).mockImplementation((callback) => {
      typingCallback = callback
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.onUserTyping).toHaveBeenCalled()
    })

    // Simulate user typing
    if (typingCallback) {
      typingCallback({ userId: 'user-2', displayName: 'Other User' })
    }

    await waitFor(() => {
      expect(screen.getByText(/Other User is typing\.\.\./)).toBeInTheDocument()
    })
  })

  it('should not show typing indicator for own messages', async () => {
    let typingCallback: ((data: { userId: string; displayName: string }) => void) | null = null

    vi.mocked(socketService.onUserTyping).mockImplementation((callback) => {
      typingCallback = callback
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.onUserTyping).toHaveBeenCalled()
    })

    // Simulate own user typing
    if (typingCallback) {
      typingCallback({ userId: 'user-1', displayName: 'Test User' })
    }

    // Should not show typing indicator
    expect(screen.queryByText(/typing\.\.\./)).not.toBeInTheDocument()
  })

  it('should remove typing indicator when user stops typing', async () => {
    let typingCallback: ((data: { userId: string; displayName: string }) => void) | null = null
    let stopTypingCallback: ((data: { userId: string }) => void) | null = null

    vi.mocked(socketService.onUserTyping).mockImplementation((callback) => {
      typingCallback = callback
    })

    vi.mocked(socketService.onUserStopTyping).mockImplementation((callback) => {
      stopTypingCallback = callback
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(socketService.onUserTyping).toHaveBeenCalled()
      expect(socketService.onUserStopTyping).toHaveBeenCalled()
    })

    // Simulate user typing
    if (typingCallback) {
      typingCallback({ userId: 'user-2', displayName: 'Other User' })
    }

    await waitFor(() => {
      expect(screen.getByText(/Other User is typing\.\.\./)).toBeInTheDocument()
    })

    // Simulate user stop typing
    if (stopTypingCallback) {
      stopTypingCallback({ userId: 'user-2' })
    }

    await waitFor(() => {
      expect(screen.queryByText(/typing\.\.\./)).not.toBeInTheDocument()
    })
  })

  it('should load chat history on room join', async () => {
    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(chatService.getChatRoomByActivityId).toHaveBeenCalledWith(mockActivityId)
      expect(chatService.getChatMessages).toHaveBeenCalledWith(mockRoomId, 50, 0)
    })
  })

  it('should merge real-time messages with history', async () => {
    let messageCallback: ((message: any) => void) | null = null

    vi.mocked(socketService.onMessageReceived).mockImplementation((callback) => {
      messageCallback = callback
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    // Simulate receiving a new real-time message
    if (messageCallback) {
      messageCallback({
        id: 'msg-3',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'New message!',
        timestamp: new Date('2024-01-01T10:02:00Z').toISOString(),
      })
    }

    await waitFor(() => {
      expect(screen.getByText('New message!')).toBeInTheDocument()
    })
  })

  it('should prevent duplicate messages when merging', async () => {
    let messageCallback: ((message: any) => void) | null = null

    vi.mocked(socketService.onMessageReceived).mockImplementation((callback) => {
      messageCallback = callback
    })

    render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    // Try to add the same message again
    if (messageCallback) {
      messageCallback({
        id: 'msg-1',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'Hello!',
        timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      })
    }

    // Should still only have one instance
    await waitFor(() => {
      const messages = screen.getAllByText('Hello!')
      expect(messages).toHaveLength(1)
    })
  })

  it('should load more messages when scrolling to top', async () => {
    const olderMessages: ChatMessage[] = [
      {
        id: 'msg-0',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'Older message',
        timestamp: new Date('2024-01-01T09:00:00Z'),
      },
    ]

    // First call returns initial messages
    vi.mocked(chatService.getChatMessages)
      .mockResolvedValueOnce({
        messages: mockMessages,
        total: 3,
      })
      // Second call returns older messages
      .mockResolvedValueOnce({
        messages: olderMessages,
        total: 3,
      })

    const { container } = render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    // Find the scrollable container
    const scrollContainer = container.querySelector('[class*="MuiBox-root"]')
    if (scrollContainer) {
      // Simulate scroll to top
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true })
      scrollContainer.dispatchEvent(new Event('scroll'))
    }

    await waitFor(() => {
      expect(chatService.getChatMessages).toHaveBeenCalledWith(mockRoomId, 50, 2)
    })
  })

  it('should show loading indicator when loading more messages', async () => {
    const olderMessages: ChatMessage[] = [
      {
        id: 'msg-0',
        chatRoomId: mockRoomId,
        senderId: 'user-2',
        senderName: 'Other User',
        content: 'Older message',
        timestamp: new Date('2024-01-01T09:00:00Z'),
      },
    ]

    // Mock with delay to see loading state
    vi.mocked(chatService.getChatMessages)
      .mockResolvedValueOnce({
        messages: mockMessages,
        total: 3,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  messages: olderMessages,
                  total: 3,
                }),
              100
            )
          )
      )

    const { container } = render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    // Find the scrollable container
    const scrollContainer = container.querySelector('[class*="MuiBox-root"]')
    if (scrollContainer) {
      // Simulate scroll to top
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true })
      scrollContainer.dispatchEvent(new Event('scroll'))
    }

    // Should show loading indicator
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  it('should not load more messages when already loading', async () => {
    vi.mocked(chatService.getChatMessages)
      .mockResolvedValueOnce({
        messages: mockMessages,
        total: 3,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  messages: [],
                  total: 3,
                }),
              100
            )
          )
      )

    const { container } = render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    const scrollContainer = container.querySelector('[class*="MuiBox-root"]')
    if (scrollContainer) {
      // Simulate multiple scroll events
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true })
      scrollContainer.dispatchEvent(new Event('scroll'))
      scrollContainer.dispatchEvent(new Event('scroll'))
      scrollContainer.dispatchEvent(new Event('scroll'))
    }

    // Should only call once (initial + one pagination call)
    await waitFor(() => {
      expect(chatService.getChatMessages).toHaveBeenCalledTimes(2)
    })
  })

  it('should not load more messages when no more available', async () => {
    // All messages already loaded
    vi.mocked(chatService.getChatMessages).mockResolvedValue({
      messages: mockMessages,
      total: 2,
    })

    const { container } = render(<ChatRoom activityId={mockActivityId} />)

    await waitFor(() => {
      expect(screen.getByText('Hello!')).toBeInTheDocument()
    })

    const scrollContainer = container.querySelector('[class*="MuiBox-root"]')
    if (scrollContainer) {
      // Simulate scroll to top
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 50, writable: true })
      scrollContainer.dispatchEvent(new Event('scroll'))
    }

    // Should not make additional calls
    await waitFor(() => {
      expect(chatService.getChatMessages).toHaveBeenCalledTimes(1)
    })
  })
})
