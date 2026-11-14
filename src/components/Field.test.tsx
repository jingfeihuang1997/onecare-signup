import { render, screen } from '@testing-library/react';
import { Field, SelectField } from './Field';

describe('Field', () => {
  it('ties the label and the hint to the input', () => {
    render(<Field label="Medicare number" hint="The photo can fill this in." />);
    const input = screen.getByLabelText('Medicare number');
    expect(input).toHaveClass('oc-input');
    expect(input).toHaveAccessibleDescription('The photo can fill this in.');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks an optional field', () => {
    render(<Field label="Preferred name" optional />);
    expect(screen.getByLabelText('Preferred name (optional)')).toBeInTheDocument();
  });

  it('shows an error with an icon and a message, not color alone', () => {
    const { container } = render(<Field label="Your email" error="Enter the full email address." />);
    const input = screen.getByLabelText('Your email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter the full email address.');
    expect(container.querySelector('.oc-field')).toHaveClass('is-invalid');
    expect(container.querySelector('.oc-error svg')).toBeInTheDocument();
  });

  it('SelectField renders a labelled select', () => {
    render(
      <SelectField label="Your relationship to Maria" defaultValue="parent">
        <option value="child">Daughter or son</option>
        <option value="parent">Parent</option>
      </SelectField>,
    );
    expect(screen.getByRole('combobox', { name: 'Your relationship to Maria' })).toHaveValue('parent');
  });
});
