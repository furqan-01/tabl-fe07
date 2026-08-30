import { vi } from 'vitest';

export interface MockChatReturn {
  messages: any[];
  sendMessage: ReturnType<typeof vi.fn>;
  regenerate: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
  error: Error | undefined;
  setMessages: ReturnType<typeof vi.fn>;
  id: string;
}

export function createMockUseChat(overrides: Partial<MockChatReturn> = {}): MockChatReturn {
  return {
    messages: [],
    sendMessage: vi.fn().mockResolvedValue(undefined),
    regenerate: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    status: 'ready',
    error: undefined,
    setMessages: vi.fn(),
    id: 'mock-chat-id-1',
    ...overrides,
  };
}
