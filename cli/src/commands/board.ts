import { Command } from "commander";
import chalk from "chalk";
import { api } from "../client.js";

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
    .action(async () => {
      try {
        const data = await api("/board");

        console.log();
        console.log(chalk.bold("  Kortex Kanban Panosu"));
        console.log(chalk.gray("  " + "═".repeat(60)));
        console.log();

        for (const col of data.columns) {
          const colorFn = STATUS_COLORS[col.status] || chalk.white;
          const header = colorFn(`  ● ${col.label.toUpperCase()}`);
          const count = chalk.gray(`(${col.tasks.length})`);
          console.log(`${header} ${count}`);

          if (col.tasks.length === 0) {
            console.log(chalk.gray("    Görev yok"));
          } else {
            for (const task of col.tasks) {
              const id = chalk.cyan(task.id.padEnd(12));
              const title = task.title.substring(0, 35).padEnd(35);
              const assignee = task.assignee
                ? chalk.blue(task.assignee.displayName)
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
