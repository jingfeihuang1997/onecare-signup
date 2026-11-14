import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

describe('Segmented', () => {
  it('is a named group with one pressed option', async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="How to sign"
        value="type"
        onChange={onChange}
        options={[
          { value: 'type', label: 'Type' },
          { value: 'draw', label: 'Draw' },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'How to sign' })).toHaveClass('oc-seg');
    expect(screen.getByRole('button', { name: 'Type' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Type' })).toHaveClass('oc-seg__opt', 'is-on');
    expect(screen.getByRole('button', { name: 'Draw' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Draw' }));
    expect(onChange).toHaveBeenCalledWith('draw');
  });
});
