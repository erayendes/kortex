// Next.js instrumentation — runs on server startup before any request
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seed } = await import("@/db/seed");
    seed();
  }
}
