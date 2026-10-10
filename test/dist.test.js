import fs from 'fs'
import vm from 'vm'
import { describe, it, expect } from 'vitest'
import core from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'
import pug from '../src/languages/pug.js'
import pugEs from '../dist/pug.es.min.js'

const sample = fs.readFileSync('test/markup/pug/theme-mixins-header.txt', 'utf-8')

const instance = (grammar) => {
    const hljs = core.newInstance()
    hljs.registerLanguage('javascript', javascript)
    hljs.registerLanguage('xml', xml)
    if (grammar) {
        hljs.registerLanguage('pug', grammar)
    }
    return hljs
}
const expected = instance(pug).highlight(sample, { language: 'pug' }).value

describe('dist', () => {
    it('pug.min.js registers itself on the global hljs, like a CDN build', () => {
        const hljs = instance()
        vm.runInNewContext(fs.readFileSync('dist/pug.min.js', 'utf-8'), { hljs })
        expect(hljs.highlight(sample, { language: 'pug' }).value).toBe(expected)
    })

    it('pug.es.min.js exports the grammar', () => {
        expect(instance(pugEs).highlight(sample, { language: 'pug' }).value).toBe(expected)
    })
})
