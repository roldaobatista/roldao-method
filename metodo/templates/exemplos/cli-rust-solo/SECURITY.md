---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 80
proposito: política de divulgação de vulnerabilidades do `tempo-cli`.
---

# Política de segurança — tempo-cli

## Como reportar

Encontrou uma vulnerabilidade? Por favor **NÃO abra issue pública**. Reporte por um dos canais privados:

- **E-mail:** seguranca@exemplo.com.br — assunto começando com `[SEC]`.
- **GitHub Security Advisory:** aba **Security → Report a vulnerability** no repositório.

Inclua: passos para reproduzir, impacto observado, versão do `tempo-cli`, SO/arquitetura. PoC opcional mas bem-vindo.

## Compromisso de resposta

- **Confirmação de recebimento:** 5 dias úteis.
- **Avaliação inicial (crítico/alto/médio/baixo):** 10 dias úteis.
- **Correção em release:** crítico 30 dias, alto 60 dias, médio/baixo no próximo release de feature.

Projeto solo, sem SLA contratual. Janelas são compromisso de boa-fé.

## Safe-harbor

Pesquisador que reporta vulnerabilidade de boa-fé, sem exfiltrar dado de terceiros e respeitando a janela de embargo combinada, **não será processado** judicialmente. Boa-fé inclui: não acessar dado de outros usuários (não há banco compartilhado de qualquer forma — `tempo-cli` é 100% local), não destruir/alterar dado em PoC.

## Escopo

- **Em escopo:** binário `tempo-cli` distribuído via crates.io ou GitHub Releases, e o repositório fonte.
- **Fora do escopo:** dependências de terceiros (reporte ao upstream — Cargo/crates.io), `cargo install` de fork não-oficial.

## Cadeia de suprimentos

- Releases assinadas com `cosign` (a partir de v0.3).
- SBOM CycloneDX publicado junto a cada release.
- Sem dependência de runtime fora das listadas em `Cargo.toml`. Auditoria via `cargo audit` no CI.

## Histórico de avisos

Nenhum até o momento. Quando houver, irá aparecer na aba **Security Advisories** do repositório.
