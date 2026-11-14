import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Panel } from './Panel';

describe('Panel', () => {
  it('folded: the head is one button that shows the summary', async () => {
    const onToggle = vi.fn();
    const { container } = render(
      <Panel
        number={1}
        title="Patient"
        summary="Maria Lopez · Apr 12, 1954"
        done
        open={false}
        onToggle={onToggle}
      >
        <p>Body</p>
      </Panel>,
    );
    const head = screen.getByRole('button', { name: /Patient/ });
    expect(head).toHaveAttribute('aria-expanded', 'false');
    expect(head).toHaveTextContent('Maria Lopez · Apr 12, 1954');
    expect(container.querySelector('.oc-panel')).toHaveClass('is-done');
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    await userEvent.click(head);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('open: title, then a folded "Why we ask" row, then a divider, then the body', async () => {
    const { container } = render(
      <Panel
        number={1}
        title="Patient"
        summary="Hidden while open"
        open
        onToggle={() => undefined}
        why={<p>The reason</p>}
      >
        <p>Body</p>
      </Panel>,
    );
    expect(screen.getByRole('button', { name: /Patient/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('Hidden while open')).not.toBeInTheDocument();

    const body = container.querySelector('.oc-panel__body');
    expect(body?.firstElementChild).toHaveClass('oc-why');
    expect(body?.querySelector('.oc-why > hr.oc-divider')).toBeInTheDocument();
    expect(body?.lastElementChild).toHaveTextContent('Body');

    const why = screen.getByRole('button', { name: 'Why we ask' });
    expect(why).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('The reason')).not.toBeInTheDocument();
    await userEvent.click(why);
    expect(screen.getByText('The reason')).toBeInTheDocument();
  });

  it('shows a tag after the title', () => {
    render(
      <Panel
        number={5}
        title="Save time at the clinic"
        tag="Optional"
        open={false}
        onToggle={() => undefined}
      />,
    );
    expect(screen.getByText('Optional')).toHaveClass('oc-tag');
  });
});
