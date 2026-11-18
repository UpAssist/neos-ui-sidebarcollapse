# UpAssist.Neos.UiSidebarCollapse

Icon-only main menu for the Neos CMS backend: the content module and the backend modules (Media, Workspaces, User management, ...).

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
- **Hide the menu completely:** the button at the bottom of the menu, **Hide menu** (`«`), closes the menu completely, the normal Neos behaviour. To get the icon bar back, open the menu with the hamburger button and click **Collapse to icons** (`‹`). Both buttons close the menu straight away, and the hamburger button closes to the same state from then on. The choice is stored per browser (`localStorage`, key `upassist.sidebarcollapse.mode`) and applies to all modules.
- In the rail every section is shown expanded, since the section toggles do not fit. The collapsed state you set in the full menu is kept.
- The content module works the same way: the page tree, canvas and inspector move 54px to the right. In full screen editing the rail is hidden. When a content element is selected, a long breadcrumb is cut off, so the inspector and the edit mode, preview and full screen buttons stay in view.
- The button labels are translated (English, Dutch, German) in `Resources/Private/Translations`.
- Neos 9 shows the user menu at the bottom of the menu, in the modules and in the content module. In the rail only the avatar remains; clicking it opens the full menu, a second click opens the user menu.
- The module content and the sticky footer get a 16px gap next to the rail.

## How it works

`SidebarCollapse.js` adds the class `upassist-sidebarcollapse` to `<body>`, plus `upassist-sidebarcollapse-rail` while the icon bar is switched on. It also sets a `title` on every menu item and adds the toggle button. The rail styles in `SidebarCollapse.css` only apply when the rail class is present, so without JavaScript Neos behaves as before.

- **Backend modules:** the rail styles apply while the menu is closed (`body:not(.neos-menu-panel-open)`). The script marks the current module.
- **Content module:** the React app only renders the menu items while its drawer is open. In rail mode the script keeps the drawer open and the CSS narrows it to the rail. The hamburger button then switches between the rail and the full menu (`upassist-sidebarcollapse-expanded`). The UI's CSS class names are hashed (`sD1RHa_drawer`), so the CSS matches them on their suffix (`[class*="_drawer"]`).
- **Translations:** the `Main` source is added to `xliff.json` through `Neos.Neos.userInterface.translation.autoInclude`. The modules translate through `NeosCMS.I18n`. The content module has no global translation API, so the script fetches `xliff.json` itself.

The files are loaded in every backend module through `Neos.Neos.moduleConfiguration.additionalResources`, and in the content module through `Neos.Neos.Ui.resources`.

## Scope

- Works together with [`upassist/neos-ui-thememode`](https://github.com/UpAssist/neos-ui-thememode).

## Files

| File | Purpose |
|---|---|
| `Resources/Public/JavaScript/SidebarCollapse.js` | Body classes, tooltips, current module, toggle button, avatar click, content module drawer |
| `Resources/Public/Styles/SidebarCollapse.css` | Rail layout and content spacing, for the modules and the content module |
| `Resources/Private/Translations/*/Main.xlf` | Button labels (en, nl, de) |
| `Configuration/Settings.yaml` | Registers the resources for the modules and the content module, and the translations |

## License

MIT
