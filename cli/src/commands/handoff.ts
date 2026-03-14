import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { api } from "../client.js";
import { getPersona } from "../config.js";

export function registerHandoffCommands(program: Command) {
  const handoff = program.command("handoff").description("Devir yönetimi");

  handoff
    .command("create")
    .description("Yeni devir oluştur")
    .requiredOption("--task <taskId>", "Görev ID")
    .requiredOption("--to <personaId>", "Hedef persona")
    .requiredOption("--next-step <step>", "Sonraki adım")
    .option("--status <status>", "Durum (completed|partial)", "completed")
    .option("--context <context>", "Ek bağlam")
    .action(async (opts) => {
      try {
        const handoff = await api("/handoffs", "POST", {
          taskId: opts.task,
          fromPersonaId: getPersona(),
          toPersonaId: opts.to,
          status: opts.status,
          nextStep: opts.nextStep,
          context: opts.context,
        });
        console.log(
          chalk.green(
            `✓ Devir oluşturuldu: ${chalk.blue(`+${getPersona()}`)} → ${chalk.magenta(`+${opts.to}`)}`
          )
        );
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  handoff
    .command("pending")
    .description("Bekleyen devirleri göster")
    .action(async () => {
      try {
        const handoffs = await api(`/handoffs/pending?persona_id=${getPersona()}`);

        if (handoffs.length === 0) {
          console.log(chalk.gray("Bekleyen devir yok"));
          return;
        }

        const table = new Table({
          head: ["ID", "Görev", "Kimden", "Sonraki Adım", "Durum"].map((h) =>
            chalk.gray(h)
          ),
          style: { head: [], border: ["gray"] },
        });

        for (const h of handoffs) {
          table.push([
            chalk.gray(h.id),
            chalk.cyan(h.taskId),
            chalk.blue(`+${h.fromPersonaId}`),
            h.nextStep.substring(0, 30),
            h.status === "completed" ? chalk.green("Tam") : chalk.yellow("Kısmi"),
          ]);
        }

        console.log(table.toString());
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
