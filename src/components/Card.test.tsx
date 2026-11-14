import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('shows a kicker, a title and its content', () => {
    const { container } = render(
      <Card kicker="Vaccination clinic" title="Tue, Dec 1, 2026 at 10:00 AM">
        <span>Cedar Lane Pharmacy · [Clinic address]</span>
      </Card>,
    );
    expect(container.firstElementChild).toHaveClass('oc-card');
    expect(container.firstElementChild).not.toHaveClass('oc-card--gap');
    expect(screen.getByText('Vaccination clinic')).toHaveClass('oc-card__kicker');
    expect(screen.getByText('Tue, Dec 1, 2026 at 10:00 AM')).toHaveClass('oc-card__title');
    // Bracketed placeholders stay visible until the real value is supplied.
    expect(screen.getByText(/\[Clinic address\]/)).toBeInTheDocument();
  });

  it('has a roomier variant for cards that hold controls', () => {
    const { container } = render(<Card gap>Content</Card>);
    expect(container.firstElementChild).toHaveClass('oc-card--gap');
  });
});
