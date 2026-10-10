/*
Language: Pug
Description: Pug (formerly Jade), the indentation-based HTML template language.
Author: Michael Becker
Website: https://pugjs.org
Category: template
*/

/** @type {import('highlight.js').LanguageFn} */
export default function pug(hljs) {
    return {
        name: 'Pug',
        aliases: ['jade'],
        case_insensitive: false,
        contains: [
            {
                scope: 'name',
                begin: /^\s*[a-zA-Z][\w-]*/,
                relevance: 0,
            },
        ],
    }
}
