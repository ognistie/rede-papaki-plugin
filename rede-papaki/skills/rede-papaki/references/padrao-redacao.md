# Padrão de redação da Rede Papaki

Objetivo: qualquer pessoa da empresa **e** qualquer IA entendem o documento em 30 segundos (Ficha rápida) e conseguem executar o processo só com ele (seções 1–12).

## Regras de escrita

| Regra | Faça | Evite |
|---|---|---|
| Título diz a ação (de preferência verbo + objeto) | "Conciliar extrato bancário com o ERP" | "Conciliação", "Processo do financeiro" |
| Resumo em 1 frase (≤ 160 caracteres) | "Cruza extrato e ERP com o Claude e lista divergências para o analista conferir." | Parágrafos, histórico, opinião |
| Um passo = uma ação | "Exportar o extrato em OFX" | "Exportar, conferir e enviar o extrato" |
| Imperativo, frases curtas | "Enviar o lote ao Claude com o prompt da seção 8." | "Deve-se então proceder ao envio…" |
| Quem faz em todo passo | coluna *Quem / ferramenta* sempre preenchida | passo sem responsável |
| Números concretos | "~6 min → ~2 min por currículo" | "bem mais rápido" |
| Datas ISO | `2026-10-21` | "21/10", "semana que vem" |
| Termos do Glossário | "curador", "_Entrada", "Ficha rápida" | sinônimos inventados |
| Siglas explicadas na 1ª vez | "DPO (encarregado de dados)" | siglas soltas |
| Desconhecido = `A confirmar` | `A confirmar` (exatamente assim) | inventar, "TBD", "?", deixar vazio |

## Estrutura (não mude a ordem nem os nomes das seções)

1. **Ficha rápida** (callout `[!info]`): endereço, status, responsável, o que faz, quando, ferramentas, risco.
2. Seções numeradas `## 1.` a `## 12.`, exatamente como no template. A ferramenta do curador mede a completude por elas.
3. Tabelas para dados repetidos (entradas, passos, saídas, riscos, métricas, exceções).
4. **Fluxo** em Mermaid `flowchart LR`, com 3 a 7 caixas:
   - `([...])` para início e fim (gatilho e saída), `[...]` para passos, `{...}` para decisão ou revisão humana.
   - Rótulos curtos (≤ 5 palavras), entre aspas, sem `"`, `[` ou `]` dentro.
   - Se houver revisão humana, ela aparece como decisão `{...}`.

## Ícones (use só estes, sempre acompanhados de texto)

| Ícone | Significado |
|---|---|
| 🟢 🟡 🟠 ⚫ | status: aprovado, em revisão, rascunho, obsoleto |
| 🔒 | dados pessoais ou informação restrita/confidencial |
| ⏰ / 📅 | revisão vencida / revisão em breve |
| ✏️ | pendência `A confirmar` |
| 👤 / 🛠 | responsável / ferramentas |

Nunca use só a cor ou só o ícone para passar uma informação: escreva a palavra junto (ex.: "🔒 restrito").

## Propriedades (frontmatter)

- `resumo` = o mesmo texto de "O que faz" da Ficha.
- `frequencia`: `diaria` · `semanal` · `mensal` · `sob-demanda` · `por-evento`.
- `revisao_humana: sim` sempre que a saída da IA for usada para decidir algo sobre pessoas, dinheiro ou contratos.
- Listas no formato `[A, B]`; datas `AAAA-MM-DD`; sem acentos nos **valores** de enumeração (`automacao`, `nao`).

## Checklist antes de mostrar a prévia

- [ ] Título com verbo; resumo ≤ 160 caracteres e igual em `resumo` e na Ficha.
- [ ] 12 seções presentes, na ordem; nenhum `{{…}}` do template sobrando (exceto `{{SEGREDO: …}}` / `{{DADO_PESSOAL: …}}`).
- [ ] Todo passo tem ação + quem; o fluxo Mermaid bate com o passo a passo.
- [ ] Nada inventado: o que falta está como `A confirmar`.
- [ ] Sem segredos nem dados pessoais reais (ver `seguranca.md`).
- [ ] `revisao_humana` coerente com a seção 9.
