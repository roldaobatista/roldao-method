// Template Zustand store tipado (US-125 AC-125-24)
// Baseado no padrao do lionclaw (src/stores/auth-store.ts) — interface State + actions inline + async via IPC bridge tipada
//
// USO: copiar pra src/stores/<nome>-store.ts no seu projeto. Trocar <Nome>, <campos>, <api> conforme seu dominio.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// =============================================================================
// Tipos
// =============================================================================

interface ExemploEntity {
  id: string
  nome: string
  criadoEm: string
}

interface ExemploState {
  // Estado
  itens: ExemploEntity[]
  itemSelecionado: ExemploEntity | null
  carregando: boolean
  erro: string | null

  // Acoes sincronas
  selecionar: (id: string) => void
  limparErro: () => void

  // Acoes assincronas
  carregarItens: () => Promise<void>
  criarItem: (nome: string) => Promise<void>
  removerItem: (id: string) => Promise<void>
}

// =============================================================================
// Store
// =============================================================================

export const useExemploStore = create<ExemploState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      itens: [],
      itemSelecionado: null,
      carregando: false,
      erro: null,

      // Acoes sincronas
      selecionar: (id) => {
        const item = get().itens.find((i) => i.id === id) ?? null
        set({ itemSelecionado: item })
      },

      limparErro: () => set({ erro: null }),

      // Acoes assincronas — NUNCA com catch vazio (TST-001 / INV-AGENT-009)
      carregarItens: async () => {
        set({ carregando: true, erro: null })
        try {
          // Substitua pelo SEU caminho (IPC bridge tipada, fetch, etc.)
          // Exemplo Electron: const itens = await window.app.exemplo.listar()
          // Exemplo web: const r = await fetch('/api/exemplo'); const itens = await r.json()
          const itens: ExemploEntity[] = await chamadaReal()
          set({ itens, carregando: false })
        } catch (e) {
          // Erro tratado — NUNCA engolido sem log
          const msg = e instanceof Error ? e.message : 'erro desconhecido'
          set({ erro: msg, carregando: false })
          console.error('[exemplo-store] erro ao carregar:', e)
        }
      },

      criarItem: async (nome) => {
        set({ carregando: true, erro: null })
        try {
          const novo: ExemploEntity = await chamadaCriar(nome)
          set((state) => ({
            itens: [...state.itens, novo],
            carregando: false,
          }))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'erro desconhecido'
          set({ erro: msg, carregando: false })
          console.error('[exemplo-store] erro ao criar:', e)
        }
      },

      removerItem: async (id) => {
        try {
          await chamadaRemover(id)
          set((state) => ({
            itens: state.itens.filter((i) => i.id !== id),
            itemSelecionado:
              state.itemSelecionado?.id === id ? null : state.itemSelecionado,
          }))
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'erro desconhecido'
          set({ erro: msg })
          console.error('[exemplo-store] erro ao remover:', e)
        }
      },
    }),
    {
      name: 'exemplo-storage',
      storage: createJSONStorage(() => localStorage),
      // Persiste apenas estado, NAO acoes (zustand persist nao serializa funcao mesmo)
      partialize: (state) => ({
        itens: state.itens,
        itemSelecionado: state.itemSelecionado,
      }),
    }
  )
)

// =============================================================================
// Helpers de chamada — adapte pro seu projeto
// =============================================================================

async function chamadaReal(): Promise<ExemploEntity[]> {
  // PLACEHOLDER — substituir pela chamada real do seu projeto
  throw new Error('Implementar chamada real (IPC bridge tipada, fetch, GraphQL, etc.)')
}

async function chamadaCriar(_nome: string): Promise<ExemploEntity> {
  throw new Error('Implementar chamada real')
}

async function chamadaRemover(_id: string): Promise<void> {
  throw new Error('Implementar chamada real')
}

// =============================================================================
// Selectors (opcional — quando precisar de derivacao)
// =============================================================================

export const useItensOrdenados = () =>
  useExemploStore((state) =>
    [...state.itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  )

export const useTotalItens = () => useExemploStore((state) => state.itens.length)
