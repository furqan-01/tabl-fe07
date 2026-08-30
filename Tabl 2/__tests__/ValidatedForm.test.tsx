import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatContainer from '@/components/chat/ChatContainer';
import AdminLoginPage from '@/app/admin/page';
import * as aiSdkReact from '@ai-sdk/react';
import { createMockUseChat } from '@/test-utils/mock-ai-sdk';

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(),
}));

describe('Validated Forms: Chat Input & Admin Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Chat Form: Prevent empty submission & Send valid query
  describe('Chat Input Form', () => {
    it('prevents whitespace-only submissions and sends valid prompts', async () => {
      const user = userEvent.setup();
      const mockSendMessage = vi.fn().mockResolvedValue(undefined);

      vi.mocked(aiSdkReact.useChat).mockReturnValue(
        createMockUseChat({
          status: 'ready',
          sendMessage: mockSendMessage,
        }) as any
      );

      render(<ChatContainer />);

      const inputField = screen.getByPlaceholderText(/Ask about dishes, deals, dietary options, or price/i);
      const sendButton = screen.getByTitle(/Send message/i);

      // 1. Submit with empty / whitespace input
      await user.type(inputField, '   ');
      await user.click(sendButton);
      expect(mockSendMessage).not.toHaveBeenCalled();

      // 2. Submit with valid prompt
      await user.clear(inputField);
      await user.type(inputField, 'What are your top chef specials?');
      await user.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith({
        text: 'What are your top chef specials?',
      });
    });
  });

  // Admin Login Form: Validation, Error Handling, and Successful Authentication
  describe('Admin Login Form Validation', () => {
    it('displays error feedback on invalid credentials and succeeds on valid login', async () => {
      const user = userEvent.setup();

      // Mock fetch for /api/admin/login
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      render(<AdminLoginPage />);

      const emailInput = screen.getByLabelText(/Staff Email/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Sign In to Admin Dashboard/i });

      // 1. Attempt failed login
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid staff email or password' }),
      });

      await user.type(emailInput, 'wrong@tabl.local');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      expect(await screen.findByText(/Invalid staff email or password/i)).toBeInTheDocument();

      // 2. Attempt successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            name: 'Head Chef Marco',
            email: 'admin@tabl.local',
            role: 'manager',
          },
        }),
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'admin@tabl.local');
      await user.clear(passwordInput);
      await user.type(passwordInput, 'admin123');
      await user.click(submitButton);

      // Verify authenticated hub appears
      expect(await screen.findByText(/Welcome back, Head Chef Marco/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });

    it('supports quick PIN mode authentication with validation', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      render(<AdminLoginPage />);

      // Switch to PIN mode
      const pinTab = screen.getByRole('button', { name: /Quick POS PIN/i });
      await user.click(pinTab);

      const pinInput = screen.getByLabelText(/Staff 4-Digit Access PIN/i);
      const submitButton = screen.getByRole('button', { name: /Sign In to Admin Dashboard/i });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            name: 'Floor Staff',
            email: 'pos@tabl.local',
            role: 'waiter',
          },
        }),
      });

      await user.type(pinInput, '1234');
      await user.click(submitButton);

      expect(await screen.findByText(/Welcome back, Floor Staff/i)).toBeInTheDocument();
    });
  });
});
