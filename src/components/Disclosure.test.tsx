import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Disclosure } from './Disclosure';

describe('Disclosure', () => {
  it('starts folded and opens on click', async () => {
    render(<Disclosure label="Why it matters">Flu can lead to a hospital stay.</Disclosure>);
    const row = screen.getByRole('button', { name: 'Why it matters' });
    expect(row).toHaveClass('oc-disc');
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Flu can lead to a hospital stay.')).not.toBeInTheDocument();

    await userEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Flu can lead to a hospital stay.')).toHaveAttribute(
      'id',
      row.getAttribute('aria-controls'),
    );

    await userEvent.click(row);
    expect(screen.queryByText('Flu can lead to a hospital stay.')).not.toBeInTheDocument();
  });

  it('has a plain variant without the line above', () => {
    render(
      <Disclosure plain label="Other options (5)">
        More
      </Disclosure>,
    );
    expect(screen.getByRole('button', { name: 'Other options (5)' })).toHaveClass('oc-disc--plain');
  });
});
