#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { setConfig, getConfig } from "./config.js";
import { registerTaskCommands } from "./commands/task.js";
import { registerHandoffCommands } from "./commands/handoff.js";
import { registerMemoryCommands } from "./commands/memory.js";
import { registerBoardCommand } from "./commands/board.js";
import { registerCmdCommands } from "./commands/cmd.js";
import { registerReviewCommands } from "./commands/review.js";
import { registerActivityCommand } from "./commands/activity.js";

const program = new Command();

program
  .name("kortex")
  .description("Kortex — AI Agent Workflow CLI")
  .version("0.1.0");

// Config commands
const config = program.command("config").description("Konfigürasyon yönetimi");

config
  .command("set-url <url>")
  .description("API URL ayarla")
  .action((url) => {
    setConfig("apiUrl", url);
    console.log(chalk.green(`✓ API URL: ${url}`));
  });

config
  .command("set-persona <persona>")
  .description("Varsayılan persona ayarla")
  .action((persona) => {
    setConfig("persona", persona);
    console.log(chalk.green(`✓ Persona: +${persona}`));
  });

config
  .command("set-project <id>")
  .description("Varsayılan proje ID'sini ayarla")
  .action((id) => {
    setConfig("projectId", id);
    console.log(chalk.green(`✓ Proje ID: ${chalk.cyan(id)}`));
  });

config
  .command("show")
  .description("Mevcut konfigürasyonu göster")
  .action(() => {
    const cfg = getConfig();
    console.log();
    console.log(chalk.bold("  Kortex Konfigürasyon"));
    console.log(chalk.gray("  " + "─".repeat(30)));
    console.log(`  API URL:  ${chalk.cyan(cfg.apiUrl)}`);
    console.log(`  Persona:  ${chalk.blue(`+${cfg.persona}`)}`);
    console.log(`  Proje:    ${cfg.projectId ? chalk.cyan(cfg.projectId) : chalk.gray("(ayarlanmamış)")}`);
    console.log();
  });

// Register all command groups
registerTaskCommands(program);
registerHandoffCommands(program);
registerMemoryCommands(program);
registerBoardCommand(program);
registerCmdCommands(program);
registerReviewCommands(program);
registerActivityCommand(program);

program.parse();
