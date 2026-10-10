import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'
import hljs from 'highlight.js'
import pug from '../src/languages/pug.js'

// highlight.js's markup test format: `<case>.txt` is the input,
// `<case>.expect.txt` the expected HTML. Set WRITE_EXPECT=1 to (re)write
// the expect files from the current grammar, then review the diff.
const markupDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'markup/pug')
const cases = fs.readdirSync(markupDir)
    .filter((file) => file.endsWith('.txt') && !file.endsWith('.expect.txt'))
    .map((file) => file.slice(0, -'.txt'.length))
    .sort()

hljs.registerLanguage('pug', pug)

describe('markup', () => {
    it.each(cases)('%s', (name) => {
        const input = fs.readFileSync(path.join(markupDir, `${name}.txt`), 'utf-8')
        const expectFile = path.join(markupDir, `${name}.expect.txt`)
        const actual = hljs.highlight(input, { language: 'pug' }).value

        if (process.env.WRITE_EXPECT) {
            fs.writeFileSync(expectFile, actual)
        }

        const expected = fs.readFileSync(expectFile, 'utf-8')
        expect(actual.trim()).toBe(expected.trim())
    })
})
