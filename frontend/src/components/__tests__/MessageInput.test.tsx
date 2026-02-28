import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/testUtils'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../MessageInput'
import { socketService } from '../../services/socket.service'

// Mock socket service
vi.mock('../../services/socket.service')

describe('MessageInput', () => {
  const mockRoomId = 'room-1'
  const getMessageInput = () =>
    screen.getByPlaceholderText(/輸入訊息|Enter message|Type a message/i)
  const getSendButton = () => screen.getByRole('button', { name: /send/i })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(socketService.isConnected).mockReturnValue(true)
    vi.mocked(socketService.sendMessage).mockImplementation(() => {})
    vi.mocked(socketService.emitTyping).mockImplementation(() => {})
    vi.mocked(socketService.emitStopTyping).mockImplementation(() => {})
  })

  it('should render message input field', () => {
    render(<MessageInput roomId={mockRoomId} />)
    expect(getMessageInput()).toBeInTheDocument()
  })

  it('should render send button', () => {
    render(<MessageInput roomId={mockRoomId} />)
    expect(getSendButton()).toBeInTheDocument()
  })

  it('should disable send button when input is empty', () => {
    render(<MessageInput roomId={mockRoomId} />)
    expect(getSendButton()).toBeDisabled()
  })

  it('should enable send button when input has text', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = getMessageInput()
    await user.type(input, 'Hello')

    expect(getSendButton()).not.toBeDisabled()
  })

  it('should send message when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = getMessageInput()
    await user.type(input, 'Hello World')

    await user.click(getSendButton())

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello World')
  })

  it('should clear input after sending message', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = getMessageInput() as HTMLTextAreaElement
    await user.type(input, 'Hello')

    await user.click(getSendButton())

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('should send message when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = getMessageInput()
    await user.type(input, 'Hello{Enter}')

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello')
  })

  it('should not send empty messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    await user.type(getMessageInput(), '   ')

    // Button should be disabled for empty/whitespace-only messages
    expect(getSendButton()).toBeDisabled()
    expect(socketService.sendMessage).not.toHaveBeenCalled()
  })

  it('should show error when socket is not connected', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false)

    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    await user.type(getMessageInput(), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText(/Not connected to chat|無法連線/)).toBeInTheDocument()
    })
  })

  it('should trim whitespace from messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    await user.type(getMessageInput(), '  Hello World  ')
    await user.click(getSendButton())

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello World')
  })

  it('should emit typing event when user starts typing', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    await user.type(getMessageInput(), 'H')

    await waitFor(() => {
      expect(socketService.emitTyping).toHaveBeenCalledWith(mockRoomId)
    })
  })

  it('should emit stop typing event after sending message', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    await user.type(getMessageInput(), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(socketService.emitStopTyping).toHaveBeenCalledWith(mockRoomId)
    })
  })

  it('should not emit typing event when socket is not connected', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false)

    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = getMessageInput()
    await user.type(input, 'H')

    // Wait a bit to ensure no typing event is emitted
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(socketService.emitTyping).not.toHaveBeenCalled()
  })
})
