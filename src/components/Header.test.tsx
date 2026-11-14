import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextSizeProvider } from '../app/TextSizeProvider';
import { I18nProvider } from '../i18n';
import { Header } from './Header';

function renderHeader() {
  return render(
    <I18nProvider>
      <TextSizeProvider>
        <Header pharmacyName="Cedar Lane Pharmacy" />
      </TextSizeProvider>
    </I18nProvider>,
  );
}

describe('Header', () => {
  it('shows the pharmacy and the logo placeholder', () => {
    renderHeader();
    expect(screen.getByText('Cedar Lane Pharmacy')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'OneCare logo placeholder' })).toHaveTextContent('LOGO');
  });

  it('steps the root font size through 100, 112, 125 and 140 percent', async () => {
    const user = userEvent.setup();
    renderHeader();
    const smaller = screen.getByRole('button', { name: 'A− Smaller text' });
    const larger = screen.getByRole('button', { name: 'A+ Larger text' });
    expect(document.documentElement.style.fontSize).toBe('100%');
    expect(smaller).toBeDisabled();

    await user.click(larger);
    expect(document.documentElement.style.fontSize).toBe('112%');
    await user.click(larger);
    expect(document.documentElement.style.fontSize).toBe('125%');
    await user.click(larger);
    expect(document.documentElement.style.fontSize).toBe('140%');
    expect(larger).toBeDisabled();

    await user.click(smaller);
    expect(document.documentElement.style.fontSize).toBe('125%');
  });

  it('changes the language from the menu and sets it on <html lang>', async () => {
    const user = userEvent.setup();
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'EN Language: English. Change language' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('button', { name: 'A+ Texto más grande' })).toBeInTheDocument();
  });

  it('hides the language button on request', () => {
    render(<Header pharmacyName="Cedar Lane Pharmacy" showLanguage={false} />);
    expect(screen.queryByRole('button', { name: /Change language/ })).not.toBeInTheDocument();
  });
});
