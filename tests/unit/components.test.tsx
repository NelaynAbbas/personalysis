import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Note: This is a placeholder test. In a real scenario, you would import
// actual components from your codebase. Here we're creating simple components
// to demonstrate testing patterns.

// Simple button component for testing
const Button = ({ 
  onClick, 
  disabled = false, 
  children 
}: { 
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    data-testid="test-button"
  >
    {children}
  </button>
);

// Counter component for interaction testing
const Counter = () => {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        data-testid="increment"
      >
        Increment
      </button>
      <button 
        onClick={() => setCount(count - 1)}
        data-testid="decrement"
      >
        Decrement
      </button>
    </div>
  );
};

// Async component for testing asynchronous behavior
const AsyncDataFetcher = () => {
  const [data, setData] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      setData('Fetched data');
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p data-testid="loading">Loading...</p>}
      {error && <p data-testid="error">{error}</p>}
      {data && <p data-testid="data">{data}</p>}
      <button onClick={fetchData} data-testid="fetch-button">
        Fetch Data
      </button>
    </div>
  );
};

// Form component for testing form interactions
const LoginForm = ({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p data-testid="form-error">{error}</p>}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
        />
      </div>
      <button type="submit" data-testid="submit-button">
        Login
      </button>
    </form>
  );
};

// Tests
describe('Button Component', () => {
  it('renders with correct text', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click Me');
  });
  
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    
    const button = screen.getByTestId('test-button');
    await userEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled={true}>Disabled Button</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toBeDisabled();
  });
});

describe('Counter Component', () => {
  it('renders with initial count of 0', () => {
    render(<Counter />);
    
    const count = screen.getByTestId('count');
    expect(count).toHaveTextContent('Count: 0');
  });
  
  it('increments count when increment button is clicked', async () => {
    render(<Counter />);
    
    const incrementButton = screen.getByTestId('increment');
    await userEvent.click(incrementButton);
    
    const count = screen.getByTestId('count');
    expect(count).toHaveTextContent('Count: 1');
  });
  
  it('decrements count when decrement button is clicked', async () => {
    render(<Counter />);
    
    const decrementButton = screen.getByTestId('decrement');
    await userEvent.click(decrementButton);
    
    const count = screen.getByTestId('count');
    expect(count).toHaveTextContent('Count: -1');
  });
  
  it('handles multiple clicks correctly', async () => {
    render(<Counter />);
    
    const incrementButton = screen.getByTestId('increment');
    const decrementButton = screen.getByTestId('decrement');
    
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await userEvent.click(decrementButton);
    
    const count = screen.getByTestId('count');
    expect(count).toHaveTextContent('Count: 2');
  });
});

describe('AsyncDataFetcher Component', () => {
  it('shows loading state when fetching data', async () => {
    render(<AsyncDataFetcher />);
    
    const fetchButton = screen.getByTestId('fetch-button');
    await userEvent.click(fetchButton);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
  
  it('shows data after successful fetch', async () => {
    render(<AsyncDataFetcher />);
    
    const fetchButton = screen.getByTestId('fetch-button');
    await userEvent.click(fetchButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
      expect(screen.getByTestId('data')).toHaveTextContent('Fetched data');
    });
  });
  
  it('should not show loading state after data is fetched', async () => {
    render(<AsyncDataFetcher />);
    
    const fetchButton = screen.getByTestId('fetch-button');
    await userEvent.click(fetchButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });
});

describe('LoginForm Component', () => {
  it('renders form elements correctly', () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });
  
  it('shows error when submitting empty form', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    const submitButton = screen.getByTestId('submit-button');
    await userEvent.click(submitButton);
    
    expect(screen.getByTestId('form-error')).toHaveTextContent('Please fill in all fields');
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  it('calls onSubmit with form data when form is valid', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(screen.queryByTestId('form-error')).not.toBeInTheDocument();
  });
  
  it('handles input changes correctly', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);
    
    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'test');
    expect(emailInput).toHaveValue('test');
    
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new@example.com');
    expect(emailInput).toHaveValue('new@example.com');
  });
});