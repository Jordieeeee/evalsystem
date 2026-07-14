import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input.jsx';

describe('Input', () => {
  it('renders a label bound to the input when provided', () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email');
  });

  it('omits the label element when no label is given', () => {
    render(<Input id="bare" placeholder="type here" />);
    expect(screen.queryByText(/./, { selector: 'label' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument();
  });

  it('defaults to type text and forwards a custom type', () => {
    const { rerender } = render(<Input id="a" placeholder="p" />);
    expect(screen.getByPlaceholderText('p')).toHaveAttribute('type', 'text');

    rerender(<Input id="a" type="password" placeholder="p" />);
    expect(screen.getByPlaceholderText('p')).toHaveAttribute('type', 'password');
  });

  it('forwards value changes through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input id="c" label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'hi');
    expect(onChange).toHaveBeenCalled();
  });
});
