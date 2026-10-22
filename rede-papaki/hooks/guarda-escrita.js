#!/usr/bin/env node
// Trava de gravação da Rede Papaki: hook PreToolUse sobre as ferramentas do MCP deste plugin.
// Leitura passa. Gravação só cria um .md novo em <vault>/<equipe>/_Entrada/. Todo o resto é bloqueado.
// Recebe o evento em JSON pelo stdin; bloqueia com exit 2 e o motivo no stderr (o motivo vai para o Claude).
'use strict';

const fs = require('fs');
const path = require('path');

// Ferramentas só de leitura do @modelcontextprotocol/server-filesystem.
const LEITURA = new Set([
  'read_file',
  'read_text_file',
  'read_media_file',
  'read_multiple_files',
  'list_directory',
  'list_directory_with_sizes',
  'directory_tree',
  'search_files',
  'get_file_info',
  'list_allowed_directories',
]);
const PROIBIDOS_NO_NOME = /[\\/:*?"<>|]/;

function chave(caminho) {
  const texto = caminho.normalize('NFC');
  return process.platform === 'win32' ? texto.toLowerCase() : texto;
}

function real(caminho) {
  try {
    return fs.realpathSync.native(caminho);
  } catch {
    return null;
  }
}

function existe(caminho) {
  try {
    fs.lstatSync(caminho);
    return true;
  } catch {
    return false;
  }
}

/** Devolve o motivo do bloqueio, ou null quando a chamada pode seguir. */
function decidir(evento, env) {
  const ferramenta = String(evento.tool_name || '').split('__').pop();
  if (LEITURA.has(ferramenta)) return null;
  if (ferramenta !== 'write_file') {
    return `Rede Papaki: "${ferramenta}" está bloqueado. A Rede só cria documentos novos em _Entrada; nunca edita, move nem apaga.`;
  }

  const vault = env.CLAUDE_PLUGIN_OPTION_VAULT;
  const equipe = env.CLAUDE_PLUGIN_OPTION_EQUIPE;
  if (!vault || !equipe) {
    return 'Rede Papaki: vault ou equipe não configurados no plugin, gravação bloqueada. Configure com /plugin configure rede-papaki@rede-papaki.';
  }

  const alvo = String((evento.tool_input && evento.tool_input.path) || '');
  if (!path.isAbsolute(alvo)) {
    return 'Rede Papaki: informe o caminho absoluto do arquivo dentro de _Entrada.';
  }
  const nome = path.basename(alvo);
  if (!nome.toLowerCase().endsWith('.md') || PROIBIDOS_NO_NOME.test(nome)) {
    return 'Rede Papaki: o arquivo precisa ser .md e o nome não pode ter \\ / : * ? " < > |.';
  }

  const entrada = real(path.join(vault, equipe, '_Entrada'));
  const pasta = real(path.dirname(alvo));
  if (!entrada || !pasta || chave(entrada) !== chave(pasta)) {
    return `Rede Papaki: só é permitido gravar direto em "${equipe}/_Entrada/".`;
  }
  if (existe(alvo)) {
    return 'Rede Papaki: já existe um arquivo com esse nome em _Entrada. Não sobrescreva; proponha o próximo ID.';
  }
  return null;
}

function main() {
  let bruto = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (parte) => (bruto += parte));
  process.stdin.on('end', () => {
    let motivo;
    try {
      motivo = decidir(JSON.parse(bruto), process.env);
    } catch (erro) {
      motivo = `Rede Papaki: evento ilegível pela trava de gravação (${erro.message}); chamada bloqueada.`;
    }
    if (motivo) {
      process.stderr.write(motivo + '\n');
      process.exit(2);
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { decidir };
