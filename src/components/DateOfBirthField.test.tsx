import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { DateOfBirthField, type DateOfBirthValue } from './DateOfBirthField';

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState<DateOfBirthValue>({ month: '', day: '', year: '' });
  return <DateOfBirthField value={value} onChange={setValue} error={error} />;
}

describe('DateOfBirthField', () => {
  it('is one group: a list of months, then numeric day and year that keep digits only', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Date of birth' })).toBeInTheDocument();
    const month = screen.getByLabelText('Month');
    const day = screen.getByLabelText('Day');
    const year = screen.getByLabelText('Year');
    expect(month.tagName).toBe('SELECT');
    expect(month).toHaveAttribute('autocomplete', 'bday-month');
    expect(day).toHaveAttribute('inputmode', 'numeric');
    expect(day).toHaveAttribute('autocomplete', 'bday-day');

    await user.selectOptions(month, 'April');
    await user.type(day, '1a2');
    await user.type(year, '19x54');
    expect(month).toHaveValue('04');
    expect(day).toHaveValue('12');
    expect(year).toHaveValue('1954');
  });

  it('passes digits typed after the day on to the year', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText('Day'), '121954');
    expect(screen.getByLabelText('Day')).toHaveValue('12');
    expect(screen.getByLabelText('Year')).toHaveValue('1954');
    expect(screen.getByLabelText('Year')).toHaveFocus();
  });

  it('shows one error for the group', () => {
    render(<Harness error="Enter a real date." />);
    expect(screen.getByRole('group', { name: 'Date of birth' })).toHaveAccessibleDescription(
      'Enter a real date.',
    );
    expect(screen.getByLabelText('Month')).toHaveAttribute('aria-invalid', 'true');
  });
});
