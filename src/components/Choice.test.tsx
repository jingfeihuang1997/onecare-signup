import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Choice } from './Choice';

describe('Choice', () => {
  it('radio: the whole tile is the label and shows the selected state', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Choice
        kind="radio"
        name="signer"
        title="Ana Lopez"
        sub="Signing for Maria"
        checked={false}
        onChange={onChange}
      />,
    );
    const radio = screen.getByRole('radio', { name: /Ana Lopez/ });
    expect(radio.closest('label')).toHaveClass('oc-choice');
    expect(radio.closest('label')).not.toHaveClass('is-selected');
    await userEvent.click(screen.getByText('Signing for Maria'));
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<Choice kind="radio" name="signer" title="Ana Lopez" checked onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Ana Lopez' }).closest('label')).toHaveClass('is-selected');
  });

  it('checkbox: carries longer text', () => {
    render(
      <Choice kind="checkbox" top title="Pharmacy consent" checked={false} onChange={() => undefined}>
        I consent to being vaccinated.
      </Choice>,
    );
    const box = screen.getByRole('checkbox', { name: /Pharmacy consent/ });
    expect(box).not.toBeChecked();
    expect(box.closest('label')).toHaveClass('oc-choice--top');
  });

  it('nav: a big button that moves on', async () => {
    const onClick = vi.fn();
    render(
      <Choice kind="nav" big title="Myself" sub="I am the one getting the vaccine" onClick={onClick} />,
    );
    const button = screen.getByRole('button', { name: /Myself/ });
    expect(button).toHaveClass('oc-choice', 'oc-choice--big');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
