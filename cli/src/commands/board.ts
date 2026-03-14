import { Command } from "commander";
import chalk from "chalk";
import { api } from "../client.js";
import { getConfig } from "../config.js";

const STATUS_COLORS: Record<string, (s: string) => string> = {
  todo: chalk.gray,
  in_progress: chalk.blue,
  test: chalk.yellow,
  review: chalk.magenta,
  done: chalk.green,
};

export function registerBoardCommand(program: Command) {
  program
    .command("board")
    .description("Kanban panosu özeti")
    .option("-p, --project <projectId>", "Proje ID")
    .action(async (opts) => {
      try {
        const projectId = opts.project || getConfig().projectId || "";
        const data = await api(`/board?projectId=${projectId}`);

        console.log();
        console.log(chalk.bold("  Kortex Kanban Panosu"));
        console.log(chalk.gray("  " + "═".repeat(60)));
        console.log();

        for (const col of data.columns) {
          const status = col.id || col.status || "unknown";
          const label = col.label || status;
          const colorFn = STATUS_COLORS[status] || chalk.white;
          const header = colorFn(`  ● ${label.toUpperCase()}`);
          const count = chalk.gray(`(${col.tasks.length})`);
          console.log(`${header} ${count}`);

          if (col.tasks.length === 0) {
            console.log(chalk.gray("    Görev yok"));
          } else {
            for (const task of col.tasks) {
              const id = chalk.cyan(task.id.padEnd(12));
              const title = (task.title || "").substring(0, 35).padEnd(35);
              const assignee = (task.assigneePersonaId || task.assignee?.displayName)
                ? chalk.blue(task.assigneePersonaId || task.assignee?.displayName)
                : chalk.gray("-");
              console.log(`    ${id} ${title}  ${assignee}`);
            }
          }
          console.log();
        }
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
