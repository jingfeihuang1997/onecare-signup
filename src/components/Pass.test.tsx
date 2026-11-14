import { render, screen } from '@testing-library/react';
import { Pass, PassPart } from './Pass';

describe('Pass', () => {
  it('is a labelled region made of parts', () => {
    const { container } = render(
      <Pass>
        <PassPart label="CLINIC PASS" title="Maria Lopez">
          <span>Tue, Dec 1, 2026 at 10:00 AM</span>
        </PassPart>
        <PassPart>
          <span>Four stamps and the pass is yours.</span>
        </PassPart>
      </Pass>,
    );
    expect(screen.getByRole('region', { name: 'Clinic pass' })).toHaveClass('oc-pass');
    expect(container.querySelectorAll('.oc-pass__part')).toHaveLength(2);
    expect(screen.getByText('CLINIC PASS')).toHaveClass('oc-pass__label');
    expect(screen.getByText('Maria Lopez')).toHaveClass('oc-pass__title');
  });
});
