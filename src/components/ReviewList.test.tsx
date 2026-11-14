import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewList } from './ReviewList';

describe('ReviewList', () => {
  it('shows each value and opens a row for editing when tapped', async () => {
    const editName = vi.fn();
    const editDob = vi.fn();
    render(
      <ReviewList
        rows={[
          { id: 'name', label: 'Name', value: 'Maria Lopez', onClick: editName },
          { id: 'dob', label: 'Date of birth', value: 'Apr 12, 1954', onClick: editDob },
        ]}
      />,
    );
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveClass('oc-review__row');
    expect(rows[0]).toHaveTextContent('Name');
    expect(rows[0]).toHaveTextContent('Maria Lopez');

    await userEvent.click(screen.getByRole('button', { name: /Date of birth/ }));
    expect(editDob).toHaveBeenCalledOnce();
    expect(editName).not.toHaveBeenCalled();
  });
});
