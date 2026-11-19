# Changelog

All notable changes to this package are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-11-19

### Fixed

- Content module: the icon rail no longer disappears for a frame (close and reopen) each time the mouse leaves it. The Neos UI closes its drawer 500ms after a mouse leave; that timer is no longer started for the rail.
- Content module: after **Hide menu**, opening the menu again with the hamburger button within half a second no longer closes it straight away.
- Content module: collapsing the full menu back to the rail with the hamburger button shortly after the mouse left the menu no longer makes the rail flash.

Tested on Neos 8.3, 8.4, 9.0, 9.1 and 9.2, with and without `upassist/neos-ui-thememode`.

[1.0.2]: https://github.com/UpAssist/neos-ui-sidebarcollapse/compare/v1.0.1...v1.0.2
