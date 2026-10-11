# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-10-11

### Changed

-   README shows the Test workflow and npm version badges under the title, like every other Nera package.

## [1.0.3] - 2026-10-10

### Changed

-   README: link `@nera-static/plugin-code-blocks`, now released, which
    registers this grammar for Nera sites by default.

## [1.0.2] - 2026-10-10

### Added

-   README: link to the live demo page (GitHub Pages), which shows real
    templates in stock highlight.js themes with each token's scope on hover

## [1.0.1] - 2026-10-10

### Fixed

-   Block expansion after `when` and `default` (`when 0: p none`,
    `default: p other`): the tag after the `:` is highlighted as a tag, no
    longer as part of the JavaScript value

## [1.0.0] - 2026-10-10

### Added

-   Pug grammar for highlight.js 11, registered as `pug` with the alias
    `jade`: tags, class and id shorthand, attributes with JavaScript values
    (also across lines), keywords (`extends`, `block`, `include`, `mixin`,
    `if`, `each … in`, `case`, …), include and extends paths, mixin
    declarations and calls, `&attributes`, comments, doctype, piped text,
    block expansion, `-` code lines, `=` and `!=` output, `#{}`, `!{}` and
    `#[]` interpolation, filters and literal HTML lines
-   JavaScript and XML as sub-languages, plain text when they are not
    registered
-   Relevance tuned for `highlightAuto`: prose and other languages are not
    detected as Pug
-   `dist/pug.min.js` (registers itself on the global `hljs`, like
    highlight.js's CDN files) and `dist/pug.es.min.js` for browsers
