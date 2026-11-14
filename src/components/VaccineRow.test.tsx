import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { VaccineRow } from './VaccineRow';

function Harness({ startSelected = false }: { startSelected?: boolean }) {
  const [selected, setSelected] = useState(startSelected);
  const [expanded, setExpanded] = useState(false);
  return (
    <VaccineRow
      name="COVID-19"
      status="due"
      statusLabel="Due now"
      selected={selected}
      onSelectedChange={setSelected}
      expanded={expanded}
      onExpandedChange={setExpanded}
      pick="Spikevax (Moderna)"
      reminder={<p>Had it before</p>}
    >
      <p>Details</p>
    </VaccineRow>
  );
}

describe('VaccineRow', () => {
  it('unselected: checkbox, name, status chip and a folded details button', () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole('checkbox', { name: 'COVID-19 Due now' })).not.toBeChecked();
    expect(screen.getByText('Due now')).toHaveClass('oc-chip--due');
    expect(screen.getByRole('button', { name: 'Details for COVID-19' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(container.querySelector('.oc-vax')).not.toHaveClass('is-selected');
    expect(screen.queryByText('Spikevax (Moderna)')).not.toBeInTheDocument();
    expect(screen.queryByText('Had it before')).not.toBeInTheDocument();
  });

  it('selecting shows the pick line and the reminder without expanding', async () => {
    const { container } = render(<Harness />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'COVID-19 Due now' }));
    expect(container.querySelector('.oc-vax')).toHaveClass('is-selected');
    expect(screen.getByText('Spikevax (Moderna)')).toHaveClass('oc-vax__pick');
    expect(screen.getByText('Had it before')).toBeInTheDocument();
    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('the details button expands the row and keeps the selection', async () => {
    render(<Harness startSelected />);
    const toggle = screen.getByRole('button', { name: 'Details for COVID-19' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'COVID-19 Due now' })).toBeChecked();
    // The one-line pick gives way to the full details; the reminder stays.
    expect(screen.queryByText('Spikevax (Moderna)')).not.toBeInTheDocument();
    expect(screen.getByText('Had it before')).toBeInTheDocument();
  });
});
