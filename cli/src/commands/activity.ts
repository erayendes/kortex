import { Command } from "commander";
import chalk from "chalk";
import { api } from "../client.js";

const EVENT_ICONS: Record<string, string> = {
  task_created: "+",
  task_moved: "→",
  task_assigned: "◎",
  handoff: "↔",
  command: "⌘",
  memory_update: "◉",
  review: "✓",
  comment: "💬",
  epic_created: "◈",
};

export function registerActivityCommand(program: Command) {
  program
    .command("activity")
    .description("Aktivite akışını göster")
    .option("-l, --limit <limit>", "Kayıt limiti", "20")
    .action(async (opts) => {
      try {
        const activities = await api(`/activity?limit=${opts.limit}`);

        if (activities.length === 0) {
          console.log(chalk.gray("Henüz aktivite yok"));
          return;
        }

        console.log();
        for (const a of activities) {
          const icon = EVENT_ICONS[a.eventType] || "•";
          const time = new Date(a.createdAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const actor = chalk.blue(`+${a.actorId}`);
          const task = a.taskId ? chalk.cyan(` [${a.taskId}]`) : "";

          console.log(
            `  ${chalk.gray(time)}  ${icon}  ${actor}${task}  ${a.description}`
          );
        }
        console.log();
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
