import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('labels the section and fills one segment per section reached', async () => {
    const onOpenSections = vi.fn();
    const { container } = render(
      <ProgressBar current={2} total={6} name="Vaccines" onOpenSections={onOpenSections} />,
    );
    expect(screen.getByRole('navigation', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByText('Section 2 of 6 · Vaccines')).toBeInTheDocument();
    expect(container.querySelectorAll('.oc-progress__seg')).toHaveLength(6);
    expect(container.querySelectorAll('.oc-progress__seg.is-done')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Sections' }));
    expect(onOpenSections).toHaveBeenCalledOnce();
  });
});
