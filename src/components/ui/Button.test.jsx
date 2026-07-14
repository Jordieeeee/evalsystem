import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.jsx';

describe('Button', () => {
  it('renders children and defaults to type="button"', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('forwards type, disabled and extra className', () => {
    render(<Button type="submit" disabled className="extra">Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('extra');
  });

  it('fires onClick when enabled and not when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const { rerender } = render(<Button onClick={onClick}>Tap</Button>);
    await user.click(screen.getByRole('button', { name: 'Tap' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<Button onClick={onClick} disabled>Tap</Button>);
    await user.click(screen.getByRole('button', { name: 'Tap' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
