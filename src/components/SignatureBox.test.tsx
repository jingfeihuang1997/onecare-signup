import { render, screen } from '@testing-library/react';
import { SignatureBox } from './SignatureBox';

describe('SignatureBox', () => {
  it('shows the typed name as the signature', () => {
    render(<SignatureBox name="Ana Lopez" />);
    const box = screen.getByRole('img', { name: 'Typed signature preview: Ana Lopez' });
    expect(box).toHaveClass('oc-sign');
    expect(box.querySelector('.oc-sign__typed')).toHaveTextContent('Ana Lopez');
  });

  it('says when there is no signature yet', () => {
    render(<SignatureBox name="  " />);
    expect(screen.getByRole('img', { name: 'No signature yet' })).toBeInTheDocument();
  });
});
