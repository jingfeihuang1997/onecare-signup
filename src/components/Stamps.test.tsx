import { render, screen } from '@testing-library/react';
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

  it('says so when every step is done, and can sit flat inside the pass', () => {
    render(<Stamps flat items={items.map((item) => ({ ...item, state: 'done' }))} />);
    expect(screen.getByRole('navigation', { name: 'Pass progress. All steps done' })).toHaveClass(
      'oc-stamps--flat',
    );
  });
});
