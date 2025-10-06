import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /MoneyTracker/i })).toBeInTheDocument();

    // Check for email and password input fields
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Check for the login button
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();

    // Check for the link to the registration page
    expect(screen.getByText(/Belum punya akun?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Daftar di sini/i })).toBeInTheDocument();
  });
});