import { Command } from "commander";
import chalk from "chalk";
import { api } from "../client.js";
import { getPersona } from "../config.js";

export function registerCmdCommands(program: Command) {
  const cmd = program
    .command("cmd")
    .description("Framework komutları (!start, !deploy, vb.)");

  const commands = [
    { name: "start", cmd: "!start", desc: "Projeyi başlat" },
    { name: "refinement", cmd: "!refinement", desc: "Backlog düzenleme" },
    { name: "start-dev", cmd: "!start-dev", desc: "Geliştirme döngüsü" },
    { name: "deploy", cmd: "!deploy", desc: "Dağıtım" },
  ];

  for (const c of commands) {
    cmd
      .command(c.name)
      .description(c.desc)
      .action(async () => {
        try {
          await api("/commands", "POST", {
            command: c.cmd,
            triggeredBy: getPersona(),
          });
          console.log(chalk.green(`✓ ${chalk.yellow(c.cmd)} komutu çalıştırıldı`));
        } catch (err: any) {
          console.error(chalk.red(`Hata: ${err.message}`));
        }
      });
  }

  cmd
    .command("approve <taskId>")
    .description("Görevi onayla")
    .action(async (taskId) => {
      try {
        await api(`/tasks/${taskId}/transition`, "POST", {
          targetStatus: "done",
          personaId: getPersona(),
        });
        await api("/commands", "POST", {
          command: "!approve",
          triggeredBy: getPersona(),
          targetTaskId: taskId,
        });
        console.log(chalk.green(`✓ ${chalk.cyan(taskId)} onaylandı`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  cmd
    .command("reject <taskId>")
    .description("Görevi reddet")
    .option("-r, --reason <reason>", "Red sebebi")
    .action(async (taskId, opts) => {
      try {
        await api(`/tasks/${taskId}/transition`, "POST", {
          targetStatus: "in_progress",
          personaId: getPersona(),
        });
        await api("/commands", "POST", {
          command: "!reject",
          triggeredBy: getPersona(),
          targetTaskId: taskId,
          payload: { reason: opts.reason },
        });
        console.log(chalk.green(`✓ ${chalk.cyan(taskId)} reddedildi`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
