import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from './use-focus-trap';

function Dialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) {
    return null;
  }
  return (
    <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} data-testid="dialog">
      <button type="button">Premier</button>
      <button type="button">Milieu</button>
      <button type="button">Dernier</button>
    </div>
  );
}

function Fixture() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function DialogWithoutFocusable({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) {
    return null;
  }
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      data-testid="empty-dialog"
    >
      Rien de focusable ici.
    </div>
  );
}

function DialogWithDetachedRef({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  // Ref volontairement jamais posee sur un element (simule un bug
  // d'integration cote appelant) : verifie que le hook reste defensif
  // (`containerRef.current === null`) plutot que de planter.
  void ref;
  return isOpen ? <p data-testid="detached">Contenu sans conteneur reference.</p> : null;
}

describe('useFocusTrap', () => {
  it('deplace le focus dans le conteneur a l ouverture', async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.click(screen.getByRole('button', { name: /ouvrir/i }));

    expect(screen.getByRole('button', { name: /premier/i })).toHaveFocus();
  });

  it('cantonne Tab au conteneur (boucle du dernier au premier)', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: /ouvrir/i }));

    const last = screen.getByRole('button', { name: /dernier/i });
    last.focus();
    await user.tab();

    expect(screen.getByRole('button', { name: /premier/i })).toHaveFocus();
  });

  it('cantonne Shift+Tab au conteneur (boucle du premier au dernier)', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: /ouvrir/i }));

    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: /dernier/i })).toHaveFocus();
  });

  it('n intercepte pas Tab depuis un bouton du milieu (ordre naturel)', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: /ouvrir/i }));

    screen.getByRole('button', { name: /^milieu$/i }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: /^dernier$/i })).toHaveFocus();
  });

  it('n intercepte pas Shift+Tab depuis un bouton du milieu (ordre naturel)', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: /ouvrir/i }));

    screen.getByRole('button', { name: /^milieu$/i }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: /^premier$/i })).toHaveFocus();
  });

  it('empeche Tab de sortir du conteneur meme sans element focusable a l interieur', async () => {
    const user = userEvent.setup();
    render(<DialogWithoutFocusable isOpen onClose={vi.fn()} />);
    const dialog = screen.getByTestId('empty-dialog');
    expect(dialog).toHaveFocus();

    await user.tab();

    expect(dialog).toHaveFocus();
  });

  it('ne plante pas si le conteneur n est jamais attache au DOM (defense)', () => {
    expect(() =>
      render(<DialogWithDetachedRef isOpen onClose={vi.fn()} />),
    ).not.toThrow();
    expect(screen.getByTestId('detached')).toBeInTheDocument();
  });

  it('ne plante pas si Tab est presse sans conteneur attache au DOM', async () => {
    const user = userEvent.setup();
    render(<DialogWithDetachedRef isOpen onClose={vi.fn()} />);

    await expect(user.keyboard('{Tab}')).resolves.not.toThrow();
  });

  it('ferme sur Echap', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Dialog isOpen onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('retire l ecouteur clavier a la fermeture (pas de fuite)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog
          isOpen={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      );
    }
    render(<Harness />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    // Le dialogue est ferme : un second Echap ne doit plus rien declencher,
    // l'ecouteur clavier pose sur `document` devait etre retire.
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne revole pas le focus quand onClose change d identite sans que isOpen change', async () => {
    const user = userEvent.setup();
    function ParentWithInlineOnClose() {
      const [open, setOpen] = useState(false);
      const [, forceRerender] = useState(0);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Ouvrir
          </button>
          <button type="button" onClick={() => forceRerender((n) => n + 1)}>
            Re-rendre le parent
          </button>
          {/* Fonction inline : nouvelle identite a chaque rendu du parent. */}
          <Dialog isOpen={open} onClose={() => setOpen(false)} />
        </div>
      );
    }
    render(<ParentWithInlineOnClose />);

    await user.click(screen.getByRole('button', { name: /ouvrir/i }));
    // Le clic sur "Re-rendre" deplace naturellement le focus dessus (vrai
    // comportement navigateur) : si le piege se re-declenchait a tort sur
    // ce rendu du parent, il le renverrait de force sur "Premier".
    await user.click(screen.getByRole('button', { name: /re-rendre le parent/i }));

    expect(screen.getByRole('button', { name: /re-rendre le parent/i })).toHaveFocus();
  });

  it('restaure le focus sur l element declencheur a la fermeture', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: /ouvrir/i });

    await user.click(trigger);
    expect(screen.getByRole('button', { name: /premier/i })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });
});
