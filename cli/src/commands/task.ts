import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { api } from "../client.js";
import { getPersona } from "../config.js";

const STATUS_COLORS: Record<string, (s: string) => string> = {
  todo: chalk.gray,
  in_progress: chalk.blue,
  test: chalk.yellow,
  review: chalk.magenta,
  done: chalk.green,
};

const PRIORITY_COLORS: Record<string, (s: string) => string> = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.green,
};

export function registerTaskCommands(program: Command) {
  const task = program.command("task").description("Görev yönetimi");

  task
    .command("list")
    .description("Görevleri listele")
    .option("-s, --status <status>", "Duruma göre filtrele")
    .option("-e, --epic <epicId>", "Epic'e göre filtrele")
    .option("-m, --mine", "Sadece bana atananlar")
    .action(async (opts) => {
      try {
        const params = new URLSearchParams();
        if (opts.status) params.set("status", opts.status);
        if (opts.epic) params.set("epic_id", opts.epic);
        if (opts.mine) params.set("assignee_id", getPersona());

        const tasks = await api(`/tasks?${params}`);

        if (tasks.length === 0) {
          console.log(chalk.gray("Görev bulunamadı"));
          return;
        }

        const table = new Table({
          head: ["ID", "Başlık", "Durum", "Öncelik", "Atanan"].map((h) =>
            chalk.gray(h)
          ),
          style: { head: [], border: ["gray"] },
        });

        for (const t of tasks) {
          const statusColor = STATUS_COLORS[t.status] || chalk.white;
          const priorityColor = PRIORITY_COLORS[t.priority] || chalk.white;
          table.push([
            chalk.cyan(t.id),
            t.title.substring(0, 40),
            statusColor(t.status),
            priorityColor(t.priority),
            t.assigneeId ? chalk.blue(`+${t.assigneeId}`) : chalk.gray("-"),
          ]);
        }

        console.log(table.toString());
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  task
    .command("get <id>")
    .description("Görev detayını göster")
    .action(async (id) => {
      try {
        const t = await api(`/tasks/${id}`);
        console.log();
        console.log(chalk.bold(`${chalk.cyan(t.id)}  ${t.title}`));
        console.log(chalk.gray("─".repeat(50)));
        console.log(`  Durum:    ${(STATUS_COLORS[t.status] || chalk.white)(t.status)}`);
        console.log(`  Öncelik:  ${(PRIORITY_COLORS[t.priority] || chalk.white)(t.priority)}`);
        console.log(`  Tür:      ${t.type}`);
        console.log(`  Atanan:   ${t.assigneeId ? chalk.blue(`+${t.assigneeId}`) : chalk.gray("-")}`);
        console.log(`  Raporlayan: ${t.reporterId ? chalk.magenta(`+${t.reporterId}`) : chalk.gray("-")}`);
        if (t.epicId) console.log(`  Epic:     ${chalk.cyan(t.epicId)}`);
        if (t.branchName) console.log(`  Branch:   ${chalk.gray(t.branchName)}`);
        if (t.description) {
          console.log();
          console.log(chalk.gray("  Açıklama:"));
          console.log(`  ${t.description}`);
        }
        console.log();
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  task
    .command("create")
    .description("Yeni görev oluştur")
    .requiredOption("-t, --title <title>", "Görev başlığı")
    .option("--type <type>", "Tür (task|story|bug|subtask)", "task")
    .option("-p, --priority <priority>", "Öncelik (critical|high|medium|low)", "medium")
    .option("-e, --epic <epicId>", "Epic ID")
    .option("-a, --assign <personaId>", "Atanacak persona")
    .option("-d, --desc <description>", "Açıklama")
    .action(async (opts) => {
      try {
        const task = await api("/tasks", "POST", {
          title: opts.title,
          type: opts.type,
          priority: opts.priority,
          epicId: opts.epic,
          assigneeId: opts.assign,
          description: opts.desc,
          reporterId: getPersona(),
        });
        console.log(chalk.green(`✓ Görev oluşturuldu: ${chalk.cyan(task.id)} — ${task.title}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  task
    .command("move <id> <status>")
    .description("Görev durumunu değiştir")
    .action(async (id, status) => {
      try {
        const result = await api(`/tasks/${id}/transition`, "POST", {
          targetStatus: status,
          personaId: getPersona(),
        });
        console.log(
          chalk.green(`✓ ${chalk.cyan(id)} → ${(STATUS_COLORS[status] || chalk.white)(status)}`)
        );
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  task
    .command("assign <id> <personaId>")
    .description("Görevi bir persona'ya ata")
    .action(async (id, personaId) => {
      try {
        await api(`/tasks/${id}/assign`, "POST", { personaId });
        console.log(chalk.green(`✓ ${chalk.cyan(id)} → ${chalk.blue(`+${personaId}`)}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  task
    .command("comment <id> <content>")
    .description("Göreve yorum ekle")
    .action(async (id, content) => {
      try {
        await api(`/tasks/${id}/comments`, "POST", {
          personaId: getPersona(),
          content,
        });
        console.log(chalk.green(`✓ Yorum eklendi: ${chalk.cyan(id)}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
