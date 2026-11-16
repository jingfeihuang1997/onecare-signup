import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stamps, type StampItem } from './Stamps';

const items: StampItem[] = [
  { id: 'who', label: 'Who', mark: '1', state: 'done' },
  { id: 'shots', label: 'Shots', mark: '2', state: 'current' },
  { id: 'card', label: 'Card', mark: '3', state: 'todo' },
  { id: 'extras', label: 'Extras', mark: '+', state: 'todo' },
  { id: 'sign', label: 'Sign', mark: '4', state: 'todo' },
];

describe('Stamps', () => {
  it('names the current step and marks done and current stamps', () => {
    render(<Stamps items={items} />);
    const nav = screen.getByRole('navigation', { name: 'Pass progress. Step 2 of 5' });
    expect(nav).toHaveClass('oc-stamps');
    expect(screen.getByText('Who').parentElement).toHaveClass('oc-stamp', 'is-done');
    expect(screen.getByText('Shots').parentElement).toHaveClass('is-current');
    expect(screen.getByText('Shots').parentElement).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('+')).toHaveClass('oc-stamp__mark');
  });

  it('with onSelect, every stamp is a button that opens its step, done or not', async () => {
    const onSelect = vi.fn();
    render(<Stamps items={items} onSelect={onSelect} />);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Whodone',
      '2Shots',
      '3Card',
      '+Extras',
      '4Sign',
    ]);
    expect(screen.getByRole('button', { name: /Shots/ })).toHaveAttribute('aria-current', 'step');
    await userEvent.click(screen.getByRole('button', { name: /Sign/ }));
    expect(onSelect).toHaveBeenCalledWith('sign');
  });

  it('says so when every step is done, and can sit flat inside the pass', () => {
    render(<Stamps flat items={items.map((item) => ({ ...item, state: 'done' }))} />);
    expect(screen.getByRole('navigation', { name: 'Pass progress. All steps done' })).toHaveClass(
      'oc-stamps--flat',
    );
  });
});
