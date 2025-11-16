import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/testUtils'
import { ChatPage } from '../ChatPage'

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ activityId: 'activity-1' }),
    useNavigate: () => vi.fn(),
  }
})

// Mock ChatRoom component
vi.mock('../../components/ChatRoom', () => ({
  ChatRoom: ({ activityId }: { activityId: string }) => (
    <div data-testid="chat-room">Chat Room for {activityId}</div>
  ),
}))

describe('ChatPage', () => {
  it('should render chat room with activity ID', () => {
    render(<ChatPage />)
    expect(screen.getByTestId('chat-room')).toBeInTheDocument()
    expect(screen.getByText(/Chat Room for activity-1/)).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<ChatPage />)
    expect(screen.getByText('Back to Activity')).toBeInTheDocument()
  })
})
