import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Home Page Navigation & Action Triggers', () => {
  it('renders home headline, quick badges, and primary call-to-actions', () => {
    render(<HomePage />);

    // Accessible verification
    expect(
      screen.getByRole('heading', { level: 1, name: /Effortless Dining/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Launch Table Menu & AI Concierge/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Kitchen Display \(KDS\)/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /AI Concierge & Dietary Guide/i })
    ).toBeInTheDocument();
  });
});
