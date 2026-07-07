import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

export function createIconsPlugin(iconDir: string, defaultSize = 24) {
  return Icons({
    compiler: 'jsx',
    jsx: 'react',
    customCollections: {
      'local-icons': FileSystemIconLoader(iconDir, (svg) =>
        svg
          .replace(/fill=".*?"/, 'fill="currentColor"')
          .replace(/width=".*?"/, `width="${defaultSize}"`)
          .replace(/height=".*?"/, `height="${defaultSize}"`)
          .replace(/^<svg/, (match) =>
            match.includes('width')
              ? match
              : `<svg width="${defaultSize}" height="${defaultSize}" fill="currentColor"`
          )
      ),
    },
  })
}
