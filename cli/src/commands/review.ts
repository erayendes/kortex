import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { api } from "../client.js";
import { getPersona } from "../config.js";

export function registerReviewCommands(program: Command) {
  const review = program.command("review").description("Kod incelemesi");

  review
    .command("list <taskId>")
    .description("Görevin incelemelerini listele")
    .action(async (taskId) => {
      try {
        const reviews = await api(`/tasks/${taskId}/reviews`);

        if (reviews.length === 0) {
          console.log(chalk.gray("Reviewer atanmamış"));
          return;
        }

        const table = new Table({
          head: ["ID", "Reviewer", "Durum", "Yorum"].map((h) => chalk.gray(h)),
          style: { head: [], border: ["gray"] },
        });

        for (const r of reviews) {
          const statusColor =
            r.reviewStatus === "approved"
              ? chalk.green
              : r.reviewStatus === "rejected"
                ? chalk.red
                : chalk.gray;
          table.push([
            chalk.gray(r.id),
            chalk.blue(`+${r.reviewerId}`),
            statusColor(r.reviewStatus),
            r.reviewComment ? r.reviewComment.substring(0, 30) : chalk.gray("-"),
          ]);
        }

        console.log(table.toString());
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });

  review
    .command("submit <taskId>")
    .description("İnceleme sonucu gönder")
    .option("--approve", "Onayla")
    .option("--reject", "Reddet")
    .option("-c, --comment <comment>", "Yorum")
    .action(async (taskId, opts) => {
      try {
        const status = opts.approve ? "approved" : opts.reject ? "rejected" : null;
        if (!status) {
          console.error(chalk.red("--approve veya --reject belirtmelisiniz"));
          return;
        }

        // First, find the review for this persona
        const reviews = await api(`/tasks/${taskId}/reviews`);
        const myReview = reviews.find(
          (r: any) => r.reviewerId === getPersona()
        );

        if (!myReview) {
          // Add self as reviewer first
          const newReview = await api(`/tasks/${taskId}/reviews`, "POST", {
            reviewerId: getPersona(),
          });
          await api(`/tasks/${taskId}/reviews/${newReview.id}`, "PATCH", {
            reviewStatus: status,
            reviewComment: opts.comment,
          });
        } else {
          await api(`/tasks/${taskId}/reviews/${myReview.id}`, "PATCH", {
            reviewStatus: status,
            reviewComment: opts.comment,
          });
        }

        const icon = status === "approved" ? "✓" : "✗";
        const color = status === "approved" ? chalk.green : chalk.red;
        console.log(color(`${icon} ${chalk.cyan(taskId)} — ${status}`));
      } catch (err: any) {
        console.error(chalk.red(`Hata: ${err.message}`));
      }
    });
}
