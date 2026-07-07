import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const ROOT_DIR = path.resolve(__dirname, '../')

const DEP_TEMPLATE_DIR = path.join(ROOT_DIR, '/scripts/init-deps')

export const log = {
  info: (...args: unknown[]) => console.log(`\x1b[36mℹ\x1b[0m `, ...args),
  success: (...args: unknown[]) => console.log(`\x1b[32m✔\x1b[0m `, ...args),
  warn: (...args: unknown[]) => console.log(`\x1b[33m⚠\x1b[0m `, ...args),
  error: (...args: unknown[]) => console.error(`\x1b[31m✖\x1b[0m `, ...args),
  title: (msg: string) => console.log(`\n\x1b[1m\x1b[35m${msg}\x1b[0m\n`),
}

export function isDirExists(dirPath: string): boolean {
  try {
    const stat = fs.statSync(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export function isFileExists(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

export const getDepTemplatePath = (depPath: string) => {
  return path.join(DEP_TEMPLATE_DIR, depPath)
}

export const getAllSupportedDeps = (paths = DEP_TEMPLATE_DIR): string[] => {
  try {
    const items = fs.readdirSync(paths, { withFileTypes: true })
    return items.filter((item) => item.isDirectory()).map((item) => item.name)
  } catch (error) {
    console.error('读取目录失败:', (error as Error).message)
    return []
  }
}

export const formatPath = (tPath: string) => {
  const t = path.relative(ROOT_DIR, tPath)
  return t.replace(/\\/g, '/')
}

export const readExecutableFile = async (filePath: string) => {
  if (!isFileExists(filePath)) {
    return null
  }
  return await import(url.pathToFileURL(filePath).href)
}

export function removeComments(code: string): string {
  const regex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\/\*[\s\S]*?\*\/|\/\/[^\n\r]*)/g

  return code.replace(regex, (match, group1, group2) => {
    if (group1) {
      return group1
    }
    if (group2) {
      return ''
    }
    return match
  })
}
