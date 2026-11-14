import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubPanel } from './SubPanel';

describe('SubPanel', () => {
  it('unfolds in place', () => {
    const { container } = render(
      <SubPanel title="Reminders" summary="Phone or email" open onToggle={() => undefined}>
        <p>Body</p>
      </SubPanel>,
    );
    expect(container.querySelector('.oc-panel')).toHaveClass('oc-panel--sub', 'is-open');
    expect(screen.getByRole('button', { name: 'Reminders' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('as a drill-in, it leads elsewhere and is not a disclosure', async () => {
    const onToggle = vi.fn();
    render(
      <SubPanel drill title="Health questions" summary="14 answers, all set to No" onToggle={onToggle} />,
    );
    const head = screen.getByRole('button', { name: /Health questions/ });
    expect(head).not.toHaveAttribute('aria-expanded');
    expect(head).toHaveTextContent('14 answers, all set to No');
    await userEvent.click(head);
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
