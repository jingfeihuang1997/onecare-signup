import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DateOfBirthField, type DateOfBirthValue } from './DateOfBirthField';

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState<DateOfBirthValue>({ month: '', day: '', year: '' });
  return <DateOfBirthField value={value} onChange={setValue} error={error} />;
}

describe('DateOfBirthField', () => {
  it('is one group of three numeric inputs that keep digits only', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Date of birth' })).toBeInTheDocument();
    const month = screen.getByLabelText('Month');
    const year = screen.getByLabelText('Year');
    expect(month).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByLabelText('Day')).toHaveAttribute('autocomplete', 'bday-day');

    await user.type(month, '0a4');
    await user.type(year, '19x54');
    expect(month).toHaveValue('04');
    expect(year).toHaveValue('1954');
  });

  it('shows one error for the group', () => {
    render(<Harness error="Enter a real date." />);
    expect(screen.getByRole('group', { name: 'Date of birth' })).toHaveAccessibleDescription(
      'Enter a real date.',
    );
    expect(screen.getByLabelText('Month')).toHaveAttribute('aria-invalid', 'true');
  });
});
