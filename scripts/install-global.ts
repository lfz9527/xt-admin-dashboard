import { execSync } from 'node:child_process'
import { log } from './utils.ts'

const packages = ['rimraf']

packages.forEach((pkg) => {
  try {
    const version = execSync(`${pkg} --version`, { stdio: 'pipe' })
      .toString()
      .trim()
    log.success(`[✔] ${pkg} 已安装，版本：${version}`)
  } catch {
    log.info(`[➤] ${pkg} 未安装，尝试全局安装...`)
    try {
      execSync(`npm install -g ${pkg}`, { stdio: 'inherit' })
      log.info(`[✔] ${pkg} 安装成功`)
    } catch (err) {
      log.error(`[✖] 安装 ${pkg} 失败`, err)
    }
  }
})
