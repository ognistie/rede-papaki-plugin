# Exemplo de documento no padrão da Rede Papaki

> Exemplo de referência (fictício) de um documento **completo**: Ficha rápida, 12 seções numeradas, fluxo em Mermaid, passos em tabela e riscos em tabela. Copie a estrutura, não o conteúdo.

````markdown
---
id: FIN-PRC-001
titulo: Conciliação bancária mensal assistida por IA
resumo: Cruza extrato bancário e lançamentos do ERP com o Claude e lista divergências para o analista conferir e lançar.
area: FIN
tipo: processo
status: aprovado
versao: 1.1.0
responsavel: Analista Financeiro (exemplo)
curador: Curador Financeiro (definir)
ferramentas: [Claude, Excel, ERP]
frequencia: mensal
revisao_humana: sim
classificacao: restrito
dados_pessoais: nao
criado: 2026-10-20
atualizado: 2026-10-21
revisar_em: 2027-04-20
relacionados: []
tags: [area/fin, tipo/processo, exemplo]
---

# FIN-PRC-001 — Conciliação bancária mensal assistida por IA

> [!info] Ficha rápida
> **Endereço:** [[_Mapa Financeiro]] › Processos › FIN-PRC-001
> **Status:** 🟢 aprovado · **Versão:** 1.1.0 · **Responsável:** Analista Financeiro (exemplo)
> **O que faz:** Cruza extrato bancário e lançamentos do ERP com o Claude e lista divergências para o analista conferir e lançar.
> **Quando:** fechamento do mês · mensal (até o 3º dia útil)
> **Ferramentas:** Claude, Excel, ERP
> **Risco:** 🔒 restrito · Dados pessoais: não · Revisão humana: sim

## 1. Objetivo e resultado esperado
Fechar a conciliação do mês em menos tempo e sem divergências esquecidas. Sucesso = 100% das divergências listadas com justificativa até o 3º dia útil.

## 2. Gatilho e frequência
- **Gatilho:** fechamento do mês.
- **Frequência:** mensal (até o 3º dia útil).

## 3. Fluxo (visão rápida)
```mermaid
flowchart LR
  G(["Fechamento do mês"]) --> P1["1. Exportar extrato e ERP"] --> P2["2. Remover dados de PF"]
  P2 --> P3["3. Claude lista divergências"] --> R{"4. Analista confere"}
  R -- ok --> P5["5. Lançar ajustes no ERP"] --> S(["Planilha de divergências"])
  R -- sem explicação --> E(["Escalar à coordenação"])
```

## 4. Entradas
| Entrada | Origem | Formato |
|---|---|---|
| Extrato bancário do mês | Internet banking | OFX/CSV |
| Lançamentos do mês | Relatório do ERP | XLSX |

## 5. Passo a passo
| # | Ação | Quem / ferramenta |
|:-:|---|---|
| 1 | Exportar extrato e relatório do ERP | Analista |
| 2 | Remover colunas desnecessárias (sem dados de pessoa física) | Analista / Excel |
| 3 | Enviar os dois arquivos ao Claude com o prompt abaixo | Claude |
| 4 | Conferir a lista de divergências por amostragem e 100% acima de {valor_limite} | Analista |
| 5 | Lançar ajustes no ERP e arquivar a planilha de conciliação | Analista / ERP |

## 6. Saídas
| Saída | Destino | Quem usa |
|---|---|---|
| Planilha de divergências justificadas | Pasta de fechamento do mês | Financeiro e contabilidade |

## 7. Ferramentas e integrações
| Ferramenta | Função no processo | Conta/acesso |
|---|---|---|
| Claude | Cruzamento e listagem de divergências | Conta corporativa |
| ERP | Origem dos lançamentos e destino dos ajustes | Usuário do analista |

## 8. Prompts utilizados
```text
Compare o extrato bancário com os lançamentos do ERP. Faça o pareamento por data (±2 dias),
valor exato e descrição. Liste em tabela: itens só no extrato, itens só no ERP e pareamentos
com diferença de valor. Não invente justificativas; quando não houver evidência escreva "verificar".
```

## 9. Dados e riscos
| Item | Situação e como é tratado |
|---|---|
| Dados pessoais | não (colunas de pessoa física são removidas antes do envio). |
| Segredos/credenciais | acesso ao banco e ao ERP ficam com o analista — {{SEGREDO: credenciais no cofre do Financeiro}}. |
| Revisão humana | analista confere 100% das divergências acima do limite antes de lançar. |
| Riscos conhecidos | pareamento errado em valores repetidos; arquivo truncado em meses de alto volume. |

## 10. Métricas
| Métrica | Antes | Depois |
|---|---|---|
| Tempo da conciliação | ~8 h | ~3 h (exemplo) |

## 11. Exceções e o que fazer quando falha
| Situação | O que fazer | Contato |
|---|---|---|
| Arquivo grande demais | Dividir por semana | Analista |
| Divergência sem explicação | Escalar para o coordenador | Coordenação Financeira |

## 12. Histórico de versões
| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 1.0.0 | 2026-10-20 | Rede Papaki | Documento de exemplo |
| 1.1.0 | 2026-10-21 | Rede Papaki | Migrado para o Padrão de Documentação v1.2 |
````
