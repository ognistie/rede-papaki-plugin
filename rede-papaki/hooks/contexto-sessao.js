#!/usr/bin/env node
// SessionStart: diz ao Claude, em uma linha, o setor e o escopo de acesso configurados no plugin.
// A saída deste hook entra no contexto da sessão; a skill usa essa linha no Passo 0.
'use strict';

const ESCOPO = {
  setor: 'Políticas + só a sua equipe',
  'todos-os-setores': 'Políticas + as 4 equipes',
  administrador: 'Políticas + as 4 equipes + 99 Gestão',
};

function linha(env) {
  const equipe = env.CLAUDE_PLUGIN_OPTION_EQUIPE;
  const escopo = env.CLAUDE_PLUGIN_OPTION_ESCOPO || 'setor';
  if (!equipe || !env.CLAUDE_PLUGIN_OPTION_VAULT) {
    return 'Rede Papaki: plugin sem vault/equipe configurados. Configure com /plugin configure rede-papaki@rede-papaki.';
  }
  return `Rede Papaki: setor do usuário = ${equipe} · escopo = ${escopo} (${ESCOPO[escopo] || 'desconhecido'}) · gravação só em ${equipe}/_Entrada.`;
}

if (require.main === module) {
  process.stdout.write(linha(process.env) + '\n');
  process.exit(0);
}

module.exports = { linha };
