import { render, screen } from '@testing-library/react';
import { Note } from './Note';

describe('Note', () => {
  it('renders a notice, and a warning variant', () => {
    render(
      <>
        <Note>We will add them.</Note>
        <Note warn>They may not need another one.</Note>
      </>,
    );
    expect(screen.getByText('We will add them.')).toHaveClass('oc-note');
    expect(screen.getByText('We will add them.')).not.toHaveClass('oc-note--warn');
    expect(screen.getByText('They may not need another one.')).toHaveClass('oc-note', 'oc-note--warn');
  });
});
