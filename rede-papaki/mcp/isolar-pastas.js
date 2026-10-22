#!/usr/bin/env node
// Intermediário stdio entre o Claude e o servidor MCP de arquivos.
// O Claude Code anuncia a capacidade MCP "roots" (a pasta da sessão). Quando recebe isso, o
// server-filesystem TROCA as pastas da linha de comando (Políticas + equipe) pela pasta da sessão.
// Aqui a capacidade é retirada do `initialize` e o aviso `roots/list_changed` é descartado, então o
// servidor fica sempre só com as pastas configuradas no plugin.
// Uso: node isolar-pastas.js <comando do servidor> [args...]
'use strict';

const { spawn } = require('child_process');
const readline = require('readline');

/** Devolve a linha a repassar ao servidor, ou null para descartar. */
function filtrar(linha) {
  let mensagem;
  try {
    mensagem = JSON.parse(linha);
  } catch {
    return linha;
  }
  if (!mensagem || typeof mensagem !== 'object') return linha;
  if (mensagem.method === 'notifications/roots/list_changed') return null;
  if (mensagem.method === 'initialize' && mensagem.params && mensagem.params.capabilities) {
    delete mensagem.params.capabilities.roots;
    return JSON.stringify(mensagem);
  }
  return linha;
}

function main() {
  const [comando, ...args] = process.argv.slice(2);
  if (!comando) {
    process.stderr.write('isolar-pastas: informe o comando do servidor MCP.\n');
    process.exit(2);
  }

  const servidor = spawn(comando, args, { stdio: ['pipe', 'pipe', 'inherit'] });
  servidor.on('error', (erro) => {
    process.stderr.write(`isolar-pastas: não foi possível iniciar o servidor (${erro.message}).\n`);
    process.exit(1);
  });
  servidor.on('exit', (codigo) => process.exit(codigo === null ? 1 : codigo));
  servidor.stdout.pipe(process.stdout);

  const entrada = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  entrada.on('line', (linha) => {
    const repassar = filtrar(linha);
    if (repassar !== null) servidor.stdin.write(repassar + '\n');
  });
  entrada.on('close', () => servidor.stdin.end());
}

if (require.main === module) main();

module.exports = { filtrar };
