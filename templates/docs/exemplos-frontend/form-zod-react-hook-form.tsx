// Template Form Zod + react-hook-form (US-125 AC-125-25)
// Validacao em runtime + tipagem TypeScript automatica + acessibilidade
//
// USO: copiar pra src/components/forms/MeuForm.tsx no seu projeto.
// Ajustar schema pra seus campos. Skills BR como `validar-cpf-cnpj` ja existem.

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { z } from 'zod'

// =============================================================================
// Schema Zod — SOURCE OF TRUTH
// =============================================================================

/**
 * Schema do form. Tipos TypeScript derivam disso automaticamente.
 *
 * Validacao roda em runtime (na submissao) E em compile-time (tipo do form).
 */
const cadastroSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome precisa de pelo menos 3 letras')
    .max(100, 'Nome muito longo (max 100 letras)'),

  email: z
    .string()
    .email('Email invalido — formato esperado: nome@dominio.com')
    .max(200),

  // Exemplo de CPF — em projeto real, importar validador da skill `validar-cpf-cnpj`
  cpf: z
    .string()
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve ter 11 numeros')
    .transform((v) => v.replace(/\D/g, '')) // normaliza removendo pontuacao
    .refine((v) => v.length === 11, 'CPF deve ter exatamente 11 numeros'),

  idade: z
    .number({ message: 'Idade precisa ser numero' })
    .int('Idade precisa ser inteiro')
    .min(18, 'Idade minima 18 anos')
    .max(120, 'Idade maxima 120 anos'),

  aceitoTermos: z
    .literal(true, { message: 'Voce precisa aceitar os termos pra continuar' }),
})

// Tipo TypeScript automatico — derivado do schema
type CadastroForm = z.infer<typeof cadastroSchema>

// =============================================================================
// Componente
// =============================================================================

interface MeuFormProps {
  /** Chamado apos form valido. Recebe dados ja tipados. */
  onSubmit: (data: CadastroForm) => void | Promise<void>
  /** Valor inicial dos campos (opcional). */
  defaultValues?: Partial<CadastroForm>
}

export function MeuForm({ onSubmit, defaultValues }: MeuFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: defaultValues ?? {},
    // Validar ao perder foco (UX melhor que onChange — nao reclama enquanto usuario digita)
    mode: 'onBlur',
  })

  // IDs unicos pra cada label↔input
  const nomeId = useId()
  const emailId = useId()
  const cpfId = useId()
  const idadeId = useId()
  const termosId = useId()

  // Handler tipado — TypeScript garante shape dos dados
  const handleValid: SubmitHandler<CadastroForm> = async (data) => {
    try {
      await onSubmit(data)
    } catch (e) {
      // Erro tratado — NUNCA engolido (TST-001)
      console.error('[meu-form] erro no onSubmit:', e)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} noValidate>
      {/* Campo: Nome */}
      <div className="form-field">
        <label htmlFor={nomeId}>Nome completo</label>
        <input
          id={nomeId}
          type="text"
          autoComplete="name"
          aria-invalid={errors.nome ? 'true' : 'false'}
          aria-describedby={errors.nome ? `${nomeId}-erro` : undefined}
          {...register('nome')}
        />
        {errors.nome && (
          <span id={`${nomeId}-erro`} role="alert" className="form-error">
            {errors.nome.message}
          </span>
        )}
      </div>

      {/* Campo: Email */}
      <div className="form-field">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? `${emailId}-erro` : undefined}
          {...register('email')}
        />
        {errors.email && (
          <span id={`${emailId}-erro`} role="alert" className="form-error">
            {errors.email.message}
          </span>
        )}
      </div>

      {/* Campo: CPF */}
      <div className="form-field">
        <label htmlFor={cpfId}>CPF</label>
        <input
          id={cpfId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          aria-invalid={errors.cpf ? 'true' : 'false'}
          aria-describedby={errors.cpf ? `${cpfId}-erro` : undefined}
          {...register('cpf')}
        />
        {errors.cpf && (
          <span id={`${cpfId}-erro`} role="alert" className="form-error">
            {errors.cpf.message}
          </span>
        )}
      </div>

      {/* Campo: Idade */}
      <div className="form-field">
        <label htmlFor={idadeId}>Idade</label>
        <input
          id={idadeId}
          type="number"
          inputMode="numeric"
          min={18}
          max={120}
          aria-invalid={errors.idade ? 'true' : 'false'}
          aria-describedby={errors.idade ? `${idadeId}-erro` : undefined}
          {...register('idade', { valueAsNumber: true })}
        />
        {errors.idade && (
          <span id={`${idadeId}-erro`} role="alert" className="form-error">
            {errors.idade.message}
          </span>
        )}
      </div>

      {/* Checkbox: Termos */}
      <div className="form-field">
        <label htmlFor={termosId}>
          <input
            id={termosId}
            type="checkbox"
            aria-invalid={errors.aceitoTermos ? 'true' : 'false'}
            aria-describedby={errors.aceitoTermos ? `${termosId}-erro` : undefined}
            {...register('aceitoTermos')}
          />{' '}
          Aceito os termos de uso e politica de privacidade
        </label>
        {errors.aceitoTermos && (
          <span id={`${termosId}-erro`} role="alert" className="form-error">
            {errors.aceitoTermos.message}
          </span>
        )}
      </div>

      {/* Botao de submit */}
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Cadastrar'}
      </button>

      {isSubmitSuccessful && (
        <div role="status" aria-live="polite">
          Cadastro salvo com sucesso.
        </div>
      )}
    </form>
  )
}

// =============================================================================
// Exemplo de uso
// =============================================================================

/*
import { MeuForm } from './components/forms/MeuForm'

export function PaginaCadastro() {
  return (
    <main>
      <h1>Cadastro</h1>
      <MeuForm
        onSubmit={async (data) => {
          // data ja tipado: { nome: string, email: string, cpf: string, idade: number, aceitoTermos: true }
          await fetch('/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
        }}
      />
    </main>
  )
}
*/

// =============================================================================
// Notas
// =============================================================================

/*
✓ Zod = SOURCE OF TRUTH — schema define validacao + tipo TypeScript
✓ react-hook-form — performance otimizada, nao re-renderiza tudo em cada keystroke
✓ aria-invalid + aria-describedby — leitor de tela anuncia erro
✓ role="alert" no erro — leitor anuncia imediatamente quando erro aparece
✓ autoComplete declarado — autofill funciona corretamente
✓ inputMode="numeric" — celular abre teclado numerico
✓ aria-busy no submit — feedback durante envio
✓ role="status" + aria-live="polite" no sucesso — anuncia sem interromper
✓ noValidate no form — desliga validacao nativa do browser (queremos so Zod)
✓ valueAsNumber — react-hook-form converte string→number automaticamente

PRA VALIDAR CPF/CNPJ REAL: substituir o regex pelo validador da skill `validar-cpf-cnpj`:

import { validarCpf } from '@/lib/validar-cpf-cnpj'

cpf: z.string().refine(
  (v) => validarCpf(v.replace(/\D/g, '')),
  'CPF invalido'
)
*/
