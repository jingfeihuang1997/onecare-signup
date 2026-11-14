import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Question } from './Question';

describe('Question', () => {
  it('shows the numbered question with Yes, No and Not sure', async () => {
    const onChange = vi.fn();
    render(<Question number={1} text="Are you sick today?" value="no" onChange={onChange} />);
    expect(screen.getByText('1. Are you sick today?')).toHaveClass('oc-q__text');
    expect(screen.getByRole('group', { name: 'Answer to question 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Not sure' }));
    expect(onChange).toHaveBeenCalledWith('notSure');
  });
});
