import { render, screen } from '@testing-library/react';
import LoginPage from '../index';

// Mock the Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

describe('LoginPage', () => {
  it('renders the login form', () => {
    render(<LoginPage />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /MoneyTracker/i })).toBeInTheDocument();

    // Check for form elements
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();

    // Check for the link to the registration page
    expect(screen.getByText(/Daftar di sini/i)).toBeInTheDocument();
  });
});