// Builds the browser files in dist/, shaped like highlight.js's own CDN
// language files: pug.min.js registers itself on the global `hljs`,
// pug.es.min.js is an ES module whose default export is the grammar.
// It also builds the demo page's script and themes (demo/).
// Run `npm run build` after changing src/ and commit dist/ and demo/; CI
// checks both.
import fs from 'fs'
import { build } from 'esbuild'

const common = {
    bundle: true,
    minify: true,
    target: 'es2018',
    legalComments: 'none',
    // No version here: it would change dist/ on every release.
    banner: { js: '/*! `pug` grammar for Highlight.js 11.x | @nera-static/highlightjs-pug | MIT */' },
}

await build({
    ...common,
    stdin: {
        contents: 'import pug from "./src/languages/pug.js"\nhljs.registerLanguage("pug", pug)\n',
        resolveDir: '.',
    },
    format: 'iife',
    outfile: 'dist/pug.min.js',
})

await build({
    ...common,
    entryPoints: ['src/languages/pug.js'],
    format: 'esm',
    outfile: 'dist/pug.es.min.js',
})

// The demo page: highlight.js + the grammar in one script, no third-party
// requests.
await build({
    bundle: true,
    minify: true,
    target: 'es2018',
    legalComments: 'none',
    entryPoints: ['demo/main.js'],
    format: 'iife',
    outfile: 'demo/demo.js',
})

// Stock highlight.js themes, each scoped to a `.t-<name>` class so the
// demo can switch between them.
const scopeTheme = (name) => fs.readFileSync(`node_modules/highlight.js/styles/${name}.min.css`, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .filter((rule) => rule.includes('{'))
    .map((rule) => {
        const [selectors, body] = rule.split('{')
        return `${selectors.split(',').map((selector) => `.t-${name} ${selector.trim()}`).join(',')}{${body}}`
    })
    .join('\n')
fs.writeFileSync('demo/themes.css', ['github', 'github-dark', 'atom-one-dark'].map(scopeTheme).join('\n') + '\n')
