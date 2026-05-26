// Template de Modal acessivel (US-125 AC-125-23)
// Baseado no padrao do lionclaw (src/components/ui/Modal.tsx) — focus trap manual + role/aria + useId + restauracao de foco + ESC handler + backdrop click controlado
//
// WCAG 2.2 AA + eMAG (norma BR de acessibilidade gov)
//
// USO: copiar pra src/components/ui/Modal.tsx no seu projeto. Estilizar conforme seu design system.

import { useEffect, useId, useRef, type ReactNode } from 'react'

// =============================================================================
// Props
// =============================================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  /**
   * Permitir fechar clicando no backdrop (overlay escuro fora do modal).
   * Default: true. Setar false em modais criticos (ex: confirmar exclusao) — usuario tem que clicar em botao explicito.
   */
  fecharNoBackdrop?: boolean
  /**
   * Permitir fechar com tecla Escape.
   * Default: true. Setar false em modais de wizard com progresso nao salvo.
   */
  fecharComEsc?: boolean
  /**
   * Tamanho do modal — afeta classes CSS.
   */
  tamanho?: 'pequeno' | 'medio' | 'grande'
}

// =============================================================================
// Componente
// =============================================================================

export function Modal({
  isOpen,
  onClose,
  titulo,
  children,
  fecharNoBackdrop = true,
  fecharComEsc = true,
  tamanho = 'medio',
}: ModalProps) {
  // IDs unicos (React 19 useId) — vinculam dialog ↔ titulo
  const tituloId = useId()

  // Ref do container do modal — pra focus trap
  const dialogRef = useRef<HTMLDivElement>(null)

  // Ref do elemento que tinha foco ANTES do modal abrir — pra restaurar ao fechar
  const elementoFocadoAntes = useRef<HTMLElement | null>(null)

  // =========================================================================
  // ESC handler — fechar com Escape
  // =========================================================================
  useEffect(() => {
    if (!isOpen || !fecharComEsc) return

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, fecharComEsc, onClose])

  // =========================================================================
  // Focus trap + restauracao de foco
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return

    // Salvar elemento focado antes de abrir
    elementoFocadoAntes.current = document.activeElement as HTMLElement | null

    // Mover foco pro modal
    const dialog = dialogRef.current
    if (dialog) {
      // Procura primeiro elemento focavel dentro do modal
      const focavel = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focavel?.focus()
    }

    // Cleanup: restaurar foco pro elemento original ao fechar
    return () => {
      elementoFocadoAntes.current?.focus()
    }
  }, [isOpen])

  // =========================================================================
  // Focus trap — Tab/Shift+Tab nao escapam do modal
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return

      const focaveis = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focaveis.length === 0) return

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (!primeiro || !ultimo) return

      // Shift+Tab no primeiro → vai pro ultimo
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      }
      // Tab no ultimo → vai pro primeiro
      else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // =========================================================================
  // Render
  // =========================================================================
  if (!isOpen) return null

  return (
    <div
      role="presentation"
      onClick={(e) => {
        // Backdrop click — so fecha se permitido E se clicou no backdrop direto (nao em child)
        if (fecharNoBackdrop && e.target === e.currentTarget) {
          onClose()
        }
      }}
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={`modal modal-${tamanho}`}
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: tamanho === 'grande' ? '800px' : tamanho === 'medio' ? '500px' : '300px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <header className="modal-header">
          <h2 id={tituloId}>{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar dialogo"
            className="modal-close"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// =============================================================================
// Notas de acessibilidade
// =============================================================================

/*
WCAG 2.2 AA + eMAG (norma BR de acessibilidade gov):

✓ role="dialog" + aria-modal="true" — leitor de tela anuncia "dialogo modal"
✓ aria-labelledby — vincula titulo ao dialog (leitor anuncia titulo ao abrir)
✓ Focus trap — Tab e Shift+Tab ciclam dentro do modal
✓ Focus restoration — ao fechar, foco volta pro elemento que abriu o modal
✓ ESC fecha (configuravel)
✓ Backdrop click fecha (configuravel)
✓ Botao "Fechar" com aria-label explicito (nao depende so do "×" visual)
✓ Pintaria de cada botao com type="button" — evita submit acidental
✓ Estrutura semantica: header > h2, body > children
✓ useId() — IDs unicos sem colisao em multiplas instancias

Pra estilizar: nao remover os atributos ARIA. Pode trocar classes/CSS/cores.
*/
