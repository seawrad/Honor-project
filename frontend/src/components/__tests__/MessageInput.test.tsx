import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/testUtils'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '../MessageInput'
import { socketService } from '../../services/socket.service'

// Mock socket service
vi.mock('../../services/socket.service')

describe('MessageInput', () => {
  const mockRoomId = 'room-1'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(socketService.isConnected).mockReturnValue(true)
    vi.mocked(socketService.sendMessage).mockImplementation(() => {})
  })

  it('should render message input field', () => {
    render(<MessageInput roomId={mockRoomId} />)
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
  })

  it('should render send button', () => {
    render(<MessageInput roomId={mockRoomId} />)
    const sendButton = screen.getByRole('button')
    expect(sendButton).toBeInTheDocument()
  })

  it('should disable send button when input is empty', () => {
    render(<MessageInput roomId={mockRoomId} />)
    const sendButton = screen.getByRole('button')
    expect(sendButton).toBeDisabled()
  })

  it('should enable send button when input has text', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, 'Hello')

    const sendButton = screen.getByRole('button')
    expect(sendButton).not.toBeDisabled()
  })

  it('should send message when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, 'Hello World')

    const sendButton = screen.getByRole('button')
    await user.click(sendButton)

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello World')
  })

  it('should clear input after sending message', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement
    await user.type(input, 'Hello')

    const sendButton = screen.getByRole('button')
    await user.click(sendButton)

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('should send message when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, 'Hello{Enter}')

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello')
  })

  it('should not send empty messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, '   ')

    const sendButton = screen.getByRole('button')
    await user.click(sendButton)

    expect(socketService.sendMessage).not.toHaveBeenCalled()
  })

  it('should show error when socket is not connected', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false)

    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, 'Hello')

    const sendButton = screen.getByRole('button')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText(/Not connected to chat/)).toBeInTheDocument()
    })
  })

  it('should trim whitespace from messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput roomId={mockRoomId} />)

    const input = screen.getByPlaceholderText('Type a message...')
    await user.type(input, '  Hello World  ')

    const sendButton = screen.getByRole('button')
    await user.click(sendButton)

    expect(socketService.sendMessage).toHaveBeenCalledWith(mockRoomId, 'Hello World')
  })
})
