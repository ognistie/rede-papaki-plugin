#!/usr/bin/env node
// Sobe o servidor MCP de arquivos só com as pastas do escopo do usuário e fica entre ele e o Claude.
// 1. Calcula as pastas permitidas a partir de vault + equipe + escopo (setor, todos-os-setores, administrador).
// 2. O Claude Code anuncia a capacidade MCP "roots" (a pasta da sessão). Quando recebe isso, o
//    server-filesystem TROCA as pastas da linha de comando pela pasta da sessão. Aqui a capacidade é
//    retirada do `initialize` e o aviso `roots/list_changed` é descartado.
// Uso: node isolar-pastas.js --vault <v> --equipe <e> --escopo <s> -- <comando do servidor> [args...]
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PORTAL = '00 Políticas e Documentação';
const GESTAO = '99 Gestão';
const EQUIPES = ['01 RH', '02 Financeiro', '03 Administração', '04 IA'];
const ESCOPOS = ['setor', 'todos-os-setores', 'administrador'];

/** Pastas que o servidor pode ver. Lança erro se a configuração for inválida. */
function pastasPermitidas(vault, equipe, escopo) {
  if (!vault) throw new Error('vault não configurado');
  if (!EQUIPES.includes(equipe)) throw new Error(`equipe inválida: "${equipe}"`);
  if (!ESCOPOS.includes(escopo)) throw new Error(`escopo inválido: "${escopo}"`);
  const nomes = escopo === 'setor' ? [PORTAL, equipe]
    : escopo === 'todos-os-setores' ? [PORTAL, ...EQUIPES]
    : [PORTAL, ...EQUIPES, GESTAO];
  return nomes.map((nome) => path.join(vault, nome));
}

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

function lerArgs(argv) {
  const separador = argv.indexOf('--');
  const opcoes = separador < 0 ? argv : argv.slice(0, separador);
  const servidor = separador < 0 ? [] : argv.slice(separador + 1);
  const valor = (nome) => {
    const i = opcoes.indexOf(`--${nome}`);
    return i < 0 ? '' : String(opcoes[i + 1] || '');
  };
  return { vault: valor('vault'), equipe: valor('equipe'), escopo: valor('escopo') || 'setor', servidor };
}

function main() {
  const { vault, equipe, escopo, servidor } = lerArgs(process.argv.slice(2));
  let pastas;
  try {
    if (!servidor.length) throw new Error('informe o comando do servidor MCP depois de --');
    pastas = pastasPermitidas(vault, equipe, escopo).filter((p) => fs.existsSync(p));
    if (!pastas.length) throw new Error(`nenhuma pasta do escopo existe em "${vault}"`);
  } catch (erro) {
    process.stderr.write(`isolar-pastas: ${erro.message}.\n`);
    process.exit(2);
  }

  const [comando, ...args] = servidor;
  const filho = spawn(comando, [...args, ...pastas], { stdio: ['pipe', 'pipe', 'inherit'] });
  filho.on('error', (erro) => {
    process.stderr.write(`isolar-pastas: não foi possível iniciar o servidor (${erro.message}).\n`);
    process.exit(1);
  });
  filho.on('exit', (codigo) => process.exit(codigo === null ? 1 : codigo));
  filho.stdout.pipe(process.stdout);

  const entrada = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  entrada.on('line', (linha) => {
    const repassar = filtrar(linha);
    if (repassar !== null) filho.stdin.write(repassar + '\n');
  });
  entrada.on('close', () => filho.stdin.end());
}

if (require.main === module) main();

module.exports = { filtrar, pastasPermitidas, EQUIPES, ESCOPOS };
