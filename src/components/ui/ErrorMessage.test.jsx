import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from './ErrorMessage.jsx';

describe('ErrorMessage', () => {
  it('renders the message text when provided', () => {
    render(<ErrorMessage message="Something broke" />);
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders nothing when the message is empty', () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no message prop is passed', () => {
    const { container } = render(<ErrorMessage />);
    expect(container).toBeEmptyDOMElement();
  });
});
