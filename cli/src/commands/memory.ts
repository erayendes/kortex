import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { api } from "../client.js";
import { getPersona } from "../config.js";

export function registerMemoryCommands(program: Command) {
  const memory = program.command("memory").description("Hafıza sistemi");

  memory
    .command("list")
    .description("Hafıza kayıtlarını listele")
    .option("-c, --category <category>", "Kategori filtresi")
    .action(async (opts) => {
      try {
        const params = new URLSearchParams();
        if (opts.category) params.set("category", opts.category);

        const entries = await api(`/memory?${params}`);

        if (entries.length === 0) {
          console.log(chalk.gray("Kayıt bulunamadı"));
          return;
        }

        const table = new Table({
          head: ["ID", "Kategori", "Başlık", "Yazar"].map((h) =>
            chalk.gray(h)
          ),
          style: { head: [], border: ["gray"] },
        });

        for (const e of entries) {
          table.push([
            chalk.gray(e.id),
            chalk.cyan(e.category),
            e.title.substring(0, 40),
            e.personaId ? chalk.blue(`+${e.personaId}`) : chalk.gray("-"),
          ]);
        }

        console.log(table.toString());
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  memory
    .command("get <id>")
    .description("Hafıza kaydı detayı")
    .action(async (id) => {
      try {
        const e = await api(`/memory/${id}`);
        console.log();
        console.log(chalk.bold(`${chalk.gray(e.id)}  ${e.title}`));
        console.log(chalk.gray("─".repeat(50)));
        console.log(`  Kategori: ${chalk.cyan(e.category)}`);
        if (e.personaId) console.log(`  Yazar:    ${chalk.blue(`+${e.personaId}`)}`);
        console.log();
        console.log(e.content);
        console.log();
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  memory
    .command("create")
    .description("Yeni hafıza kaydı oluştur")
    .requiredOption("-c, --category <category>", "Kategori")
    .requiredOption("-t, --title <title>", "Başlık")
    .requiredOption("--content <content>", "İçerik")
    .option("--task <taskId>", "İlişkili görev")
    .action(async (opts) => {
      try {
        const entry = await api("/memory", "POST", {
          category: opts.category,
          title: opts.title,
          content: opts.content,
          personaId: getPersona(),
          taskId: opts.task,
        });
        console.log(chalk.green(`✓ Kayıt oluşturuldu: ${chalk.gray(entry.id)}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  memory
    .command("update <id>")
    .description("Hafıza kaydını güncelle")
    .option("-t, --title <title>", "Yeni başlık")
    .option("--content <content>", "Yeni içerik")
    .action(async (id, opts) => {
      try {
        const body: any = {};
        if (opts.title) body.title = opts.title;
        if (opts.content) body.content = opts.content;

        await api(`/memory/${id}`, "PATCH", body);
        console.log(chalk.green(`✓ Kayıt güncellendi: ${chalk.gray(id)}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
