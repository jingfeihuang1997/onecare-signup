import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionNav, type SectionNavItem } from './SectionNav';

const items: SectionNavItem[] = [
  { id: 'patient', number: 1, label: 'Patient', state: 'done', stateLabel: 'Done' },
  { id: 'vaccines', number: 2, label: 'Vaccines', state: 'current', stateLabel: 'You are here' },
  { id: 'insurance', number: 3, label: 'Insurance and Medicare', state: 'todo', stateLabel: 'Not started' },
];

describe('SectionNav', () => {
  it('lists the sections, marks the current one, and reports the one chosen', async () => {
    const onSelect = vi.fn();
    render(<SectionNav items={items} onSelect={onSelect} />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toHaveClass('oc-nav');

    const current = screen.getByRole('button', { name: /Vaccines/ });
    expect(current).toHaveClass('oc-nav__item', 'is-current');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveTextContent('You are here');
    expect(screen.getByRole('button', { name: /Patient/ }).querySelector('.oc-panel__mark')).toHaveClass(
      'is-done',
    );

    await userEvent.click(screen.getByRole('button', { name: /Insurance and Medicare/ }));
    expect(onSelect).toHaveBeenCalledWith('insurance');
  });

  it('still tells screen readers a section is done when the second line is left out', () => {
    render(
      <SectionNav
        items={items.map((item) => ({ ...item, stateLabel: undefined }))}
        onSelect={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Patient Done' })).toBeInTheDocument();
  });
});
