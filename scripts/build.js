// Builds the browser files in dist/, shaped like highlight.js's own CDN
// language files: pug.min.js registers itself on the global `hljs`,
// pug.es.min.js is an ES module whose default export is the grammar.
// Run `npm run build` after changing src/ and commit dist/; CI checks it.
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
