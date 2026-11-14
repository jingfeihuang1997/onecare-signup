import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonList, WhyWeAsk } from './WhyWeAsk';

describe('WhyWeAsk', () => {
  it('is a folded row followed by a divider', async () => {
    const { container } = render(
      <WhyWeAsk>
        <ReasonList draft items={[{ field: 'Date of birth', reason: 'Used to find the record.' }]} />
      </WhyWeAsk>,
    );
    const row = screen.getByRole('button', { name: 'Why we ask' });
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.oc-why')?.lastElementChild).toHaveClass('oc-divider');

    await userEvent.click(row);
    expect(screen.getByText('Draft wording, not yet approved.')).toBeInTheDocument();
    expect(screen.getByRole('term')).toHaveTextContent('Date of birth');
    expect(screen.getByRole('definition')).toHaveTextContent('Used to find the record.');
  });

  it('draws only the divider when a section has no reasons', () => {
    const { container } = render(<WhyWeAsk />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('hr.oc-divider')).toBeInTheDocument();
  });
});
