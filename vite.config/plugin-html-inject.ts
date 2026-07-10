import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export function htmlInjectPlugin(): Plugin {
  return {
    name: 'html-inject',
    transformIndexHtml(html) {
      const svgContent = readFileSync(
        path.resolve(__dirname, '../src/assets/icon/loading.svg'),
        'utf-8'
      )
      return html.replace(
        '<div id="root"></div>',
        `<div id="root">
          <style>
            #root {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
          </style>
          ${svgContent}
        </div>`
      )
    },
  }
}
