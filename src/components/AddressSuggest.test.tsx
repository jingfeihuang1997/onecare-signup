import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressSuggest, type AddressOption } from './AddressSuggest';

const suggestions: AddressOption[] = [
  { id: '1', main: '1420 Maple St', sub: 'Ann Arbor, MI 48104' },
  { id: '2', main: '1420 Maple Rd', sub: 'Troy, MI 48084' },
];

function renderSuggest(list: AddressOption[] = suggestions) {
  const onSelect = vi.fn();
  const onChange = vi.fn();
  render(
    <AddressSuggest
      label="Start typing the address"
      value="1420 Map"
      onChange={onChange}
      suggestions={list}
      onSelect={onSelect}
    />,
  );
  return { onSelect, onChange, input: screen.getByRole('combobox', { name: 'Start typing the address' }) };
}

describe('AddressSuggest', () => {
  it('lists the suggestions with the first one highlighted', () => {
    const { input } = renderSuggest();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveClass('oc-suggest__opt', 'is-active');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id);
  });

  it('works with the keyboard only: arrows move, Enter picks, Escape hides', async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderSuggest();
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(suggestions[1]);

    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('picks with a click', async () => {
    const { onSelect } = renderSuggest();
    await userEvent.click(screen.getByText('1420 Maple St'));
    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it('is closed when there is nothing to suggest', () => {
    const { input } = renderSuggest([]);
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
