import { render, screen } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('maps each vaccine status to its class', () => {
    render(
      <>
        <Chip tone="due">Due now</Chip>
        <Chip tone="had">Had it · Sep 2024</Chip>
        <Chip>No record</Chip>
      </>,
    );
    expect(screen.getByText('Due now')).toHaveClass('oc-chip', 'oc-chip--due');
    expect(screen.getByText('Had it · Sep 2024')).toHaveClass('oc-chip--had');
    expect(screen.getByText('No record')).toHaveClass('oc-chip');
    expect(screen.getByText('No record')).not.toHaveClass('oc-chip--due', 'oc-chip--had');
  });
});
