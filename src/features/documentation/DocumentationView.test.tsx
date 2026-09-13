import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DocumentationView } from './DocumentationView';

it('permite recorrer y buscar la biblioteca', async () => {
  const user = userEvent.setup();
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

  function ControlledDocumentation() {
    const [pageId, setPageId] = useState('aprender');
    return (
      <DocumentationView
        initialPageId={pageId}
        onBack={vi.fn()}
        onNavigate={setPageId}
        theme="light"
        onToggleTheme={vi.fn()}
      />
    );
  }

  render(<ControlledDocumentation />);
  const library = within(screen.getByRole('complementary', { name: 'Índice de documentación' }));

  expect(screen.getByRole('heading', { name: 'Aprender con SmartBI', level: 1 })).toBeInTheDocument();
  await user.click(library.getByRole('button', { name: /Mapa del código/i }));
  expect(screen.getByRole('heading', { name: 'Mapa del código', level: 1 })).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/Buscar en las guías/i), 'GitHub');
  expect(library.getByRole('button', { name: /GitHub y colaboración/i })).toBeInTheDocument();
  expect(library.queryByRole('button', { name: /Aprender con SmartBI/i })).not.toBeInTheDocument();
});
