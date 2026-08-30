import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatContainer from '@/components/chat/ChatContainer';
import * as aiSdkReact from '@ai-sdk/react';
import { createMockUseChat } from '@/test-utils/mock-ai-sdk';

// Mock useChat from @ai-sdk/react
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

describe('Chat Message Renderer & Lifecycle States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Requirement 2.a: Initial / Idle state
  it('renders initial idle state with concierge welcome message and quick prompts', () => {
    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'ready',
        messages: [
          {
            id: 'welcome-msg',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'Hello! I am your Tabl Concierge. Ask me for recommendations!',
              },
            ],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    // Accessible query for header and welcome message
    expect(screen.getByRole('heading', { name: /Tabl Concierge/i })).toBeInTheDocument();
    expect(screen.getByText(/Hello! I am your Tabl Concierge/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vegetarian under Rs\. 1000/i })).toBeInTheDocument();
  });

  // Requirement 2.b: Pending / Thinking state (loading animation)
  it('renders thinking / pending state when assistant is consulting kitchen menu', () => {
    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'streaming',
        messages: [
          {
            id: 'msg-user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Recommend spicy starters' }],
          },
          {
            id: 'msg-asst-1',
            role: 'assistant',
            parts: [], // empty assistant response while thinking
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    expect(screen.getByText(/Consulting live kitchen menu & deals/i)).toBeInTheDocument();
  });

  // Requirement 2.c: Active streaming state (streamed text & markdown rendering)
  it('renders streamed markdown text in real-time response', () => {
    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'streaming',
        messages: [
          {
            id: 'msg-user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Tell me about the chef specials' }],
          },
          {
            id: 'msg-asst-1',
            role: 'assistant',
            parts: [
              {
                type: 'text',
                text: 'Here are our top **Chef Specials**:\n\n- Flame Grilled Tikka\n- Truffle Pasta',
              },
            ],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    expect(screen.getByText(/Here are our top/i)).toBeInTheDocument();
    expect(screen.getByText(/Flame Grilled Tikka/i)).toBeInTheDocument();
    expect(screen.getByText(/Truffle Pasta/i)).toBeInTheDocument();
  });

  // Requirement 2.d: Error state banner with working Retry trigger
  it('renders error state banner and triggers retry when clicked', async () => {
    const user = userEvent.setup();
    const mockRegenerate = vi.fn().mockResolvedValue(undefined);

    vi.mocked(aiSdkReact.useChat).mockReturnValue(
      createMockUseChat({
        status: 'error',
        error: new Error('Network connection timeout to AI model'),
        regenerate: mockRegenerate,
        messages: [
          {
            id: 'msg-user-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Any desserts?' }],
          },
        ],
      }) as any
    );

    render(<ChatContainer />);

    // Accessible check for error message and retry button
    expect(screen.getByText(/Response interrupted/i)).toBeInTheDocument();
    expect(screen.getByText(/Network connection timeout to AI model/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(mockRegenerate).toHaveBeenCalledTimes(1);
  });
});
