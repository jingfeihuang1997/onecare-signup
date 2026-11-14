import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Actions, Button } from './Button';

describe('Button', () => {
  it('is a real button that does not submit by default', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Back</Button>);
    const button = screen.getByRole('button', { name: 'Back' });
    expect(button).toHaveClass('oc-btn');
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('maps variants and sizes to the stylesheet classes', () => {
    render(
      <Actions>
        <Button variant="primary" grow icon="camera">
          Continue
        </Button>
        <Button variant="link">Type it in instead</Button>
        <Button small disabled>
          Remove
        </Button>
      </Actions>,
    );
    const primary = screen.getByRole('button', { name: 'Continue' });
    expect(primary).toHaveClass('oc-btn--primary', 'oc-btn--grow');
    expect(primary.querySelector('svg')).toBeInTheDocument();
    expect(primary.parentElement).toHaveClass('oc-actions');
    expect(screen.getByRole('button', { name: 'Type it in instead' })).toHaveClass('oc-btn--link');
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('oc-btn--small');
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });
});
