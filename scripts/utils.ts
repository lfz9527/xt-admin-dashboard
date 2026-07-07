export const log = {
  info: (...args: unknown[]) => console.log(`\x1b[36mℹ\x1b[0m `, ...args),
  success: (...args: unknown[]) => console.log(`\x1b[32m✔\x1b[0m `, ...args),
  warn: (...args: unknown[]) => console.log(`\x1b[33m⚠\x1b[0m `, ...args),
  error: (...args: unknown[]) => console.error(`\x1b[31m✖\x1b[0m `, ...args),
  title: (msg: string) => console.log(`\n\x1b[1m\x1b[35m${msg}\x1b[0m\n`),
}
