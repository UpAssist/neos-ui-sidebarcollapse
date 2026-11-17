# UpAssist.Neos.UiSidebarCollapse

Icon-only sidebar for the Neos CMS backend modules (Media, Workspaces, User management, ...).

When the module menu is closed, it stays visible as a narrow rail with only the icons, as wide as the hamburger button. The hamburger button still opens the full menu with labels.

Works with Neos 8.3+ and Neos 9, with no build step.

## Installation

```bash
composer require upassist/neos-ui-sidebarcollapse
```

Then flush the caches and publish the resources:

```bash
./flow flow:cache:flush
./flow resource:publish
```

For local development against a checkout, add a path repository to the distribution's `composer.json`:

```json
{"type": "path", "url": "../neos-ui-sidebarcollapse", "options": {"symlink": true}}
```

## Behaviour

- **Closed menu:** a rail with the icon of every section and module. Hovering an icon shows its label as a tooltip. The module you are in is marked in blue.
- **Open menu:** the normal Neos menu, unchanged.
- In the rail every section is shown expanded, since the section toggles do not fit. The collapsed state you set in the full menu is kept.
- Neos 9 shows the user menu at the bottom of the menu. In the rail only the avatar remains; clicking it opens the full menu, a second click opens the user menu.
- The module content and the sticky footer get a 16px gap next to the rail.

## How it works

`SidebarCollapse.js` adds the class `upassist-sidebarcollapse` to `<body>`, sets a `title` on every menu item and marks the current module. `SidebarCollapse.css` only applies when that class is present and the menu is closed (`body:not(.neos-menu-panel-open)`), so without JavaScript Neos behaves as before.

Both files are loaded in every backend module through `Neos.Neos.moduleConfiguration.additionalResources`.

## Scope

- Only the backend modules. The content UI (the page tree and inspector) has its own layout and is not changed.
- Works together with [`upassist/neos-ui-thememode`](https://github.com/UpAssist/neos-ui-thememode).

## Files

| File | Purpose |
|---|---|
| `Resources/Public/JavaScript/SidebarCollapse.js` | Body class, tooltips, current module, avatar click |
| `Resources/Public/Styles/SidebarCollapse.css` | Rail layout and content spacing |
| `Configuration/Settings.yaml` | Registers the resources for all modules |

## License

MIT
