/*
 * UpAssist.Neos.UiSidebarCollapse
 *
 * Keeps the Neos main menu visible as an icon-only rail while it is closed,
 * in the backend modules and in the content module. The hamburger button
 * still opens the full menu. A button at the bottom of the menu switches
 * between the rail and the normal hidden menu.
 */
(function () {
    'use strict';

    var PACKAGE_KEY = 'UpAssist.Neos.UiSidebarCollapse';
    var BODY_CLASS = 'upassist-sidebarcollapse';
    var RAIL_CLASS = 'upassist-sidebarcollapse-rail';
    var UI_CLASS = 'upassist-sidebarcollapse-ui';
    var EXPANDED_CLASS = 'upassist-sidebarcollapse-expanded';
    var MODULE_OPEN_CLASS = 'neos-menu-panel-open';
    var STORAGE_KEY = 'upassist.sidebarcollapse.mode';
    var MODE_RAIL = 'rail';
    var MODE_HIDDEN = 'hidden';

    // English fallbacks; the translations live in Resources/Private/Translations.
    var LABELS = {
        hideMenu: 'Hide menu',
        collapseToIcons: 'Collapse to icons'
    };

    // ------------------------------------------------------------------
    // Mode (stored per browser, the rail is the default)
    // ------------------------------------------------------------------

    function getMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) === MODE_HIDDEN ? MODE_HIDDEN : MODE_RAIL;
        } catch (e) {
            return MODE_RAIL;
        }
    }

    function storeMode(mode) {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) {
            // Storage blocked: the choice holds for this page only.
        }
        document.body.classList.toggle(RAIL_CLASS, mode === MODE_RAIL);
    }

    // ------------------------------------------------------------------
    // Translations
    // ------------------------------------------------------------------

    // xliff.json as loaded by the content module, which has no global API.
    var xliff = null;
    var translationListeners = [];

    function translate(id) {
        // Backend modules: Neos' own I18n service.
        var i18n = window.NeosCMS && window.NeosCMS.I18n;
        if (i18n && i18n.initialized && typeof i18n.translate === 'function') {
            return i18n.translate(id, LABELS[id], PACKAGE_KEY, 'Main');
        }
        // Content module: the xliff.json fetched by loadXliff().
        var source = xliff && xliff[PACKAGE_KEY.replace(/\./g, '_')];
        var value = source && source.Main && source.Main[id];
        return typeof value === 'string' && value ? value : LABELS[id];
    }

    function onTranslations(callback) {
        translationListeners.push(callback);
    }

    function translationsChanged() {
        translationListeners.forEach(function (callback) {
            callback();
        });
    }

    window.addEventListener('neoscms-i18n-initialized', translationsChanged);

    // Neos 9 has a <link> to xliff.json; Neos 8 only mentions it in the
    // inline configuration scripts.
    function xliffUri() {
        var link = document.querySelector('link[id$="/xliff.json"]');
        if (link) {
            return link.href;
        }
        for (var i = 0; i < document.scripts.length; i++) {
            var match = /"(https?:[^"]*?xliff\.json[^"]*)"/.exec(document.scripts[i].textContent || '');
            if (match) {
                return match[1].replace(/\\\//g, '/');
            }
        }
        return null;
    }

    function loadXliff() {
        var uri = xliffUri();
        if (!uri || !window.fetch) {
            return;
        }
        window.fetch(uri, {credentials: 'same-origin'})
            .then(function (response) {
                return response.ok ? response.json() : null;
            })
            .then(function (data) {
                if (data) {
                    xliff = data;
                    translationsChanged();
                }
            })
            .catch(function () {
                // Keep the English labels.
            });
    }

    // ------------------------------------------------------------------
    // Toggle button at the bottom of the menu
    // ------------------------------------------------------------------

    // A second way to close the menu, to the state the hamburger button does
    // not give: in rail mode it hides the menu completely, in hidden mode it
    // collapses the menu to the icon rail. `onSwitch` closes the menu.
    function createToggle(onSwitch) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'upassist-sidebarcollapse-toggle';
        var icon = document.createElement('i');
        var label = document.createElement('span');
        button.appendChild(icon);
        button.appendChild(label);

        function render() {
            var rail = getMode() === MODE_RAIL;
            var text = translate(rail ? 'hideMenu' : 'collapseToIcons');
            icon.className = rail ? 'fas fa-angle-double-left' : 'fas fa-angle-left';
            // The content module has no icon font; CSS shows this glyph there.
            icon.setAttribute('data-glyph', rail ? '«' : '‹');
            label.textContent = text;
            button.title = text;
            button.setAttribute('aria-label', text);
        }

        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            storeMode(getMode() === MODE_RAIL ? MODE_HIDDEN : MODE_RAIL);
            onSwitch();
            render();
        });
        onTranslations(render);
        render();
        return button;
    }

    function labelOf(element) {
        return (element.textContent || '').replace(/\s+/g, ' ').trim();
    }

    // Labels are hidden in the rail, so every item gets a native tooltip.
    function addTooltips(items) {
        Array.prototype.forEach.call(items, function (item) {
            var label = labelOf(item);
            if (label && !item.getAttribute('title')) {
                item.setAttribute('title', label);
            }
        });
    }

    // ------------------------------------------------------------------
    // Backend modules (server-rendered menu)
    // ------------------------------------------------------------------

    function mountModule(panel) {
        var menuButton = document.querySelector('.neos-menu .neos-menu-button');

        function isOpen() {
            return document.body.classList.contains(MODULE_OPEN_CLASS);
        }

        function setOpen(open) {
            if (menuButton && isOpen() !== open) {
                menuButton.click();
            }
        }

        addTooltips(panel.querySelectorAll('.neos-menu-headline, .neos-menu-list a, .neos-menu-list .neos-menu-item'));
        markCurrent(panel);

        var toggle = createToggle(function () {
            setOpen(false);
        });
        // Neos 9 already has a bottom section (user menu); Neos 8 does not.
        var bottom = panel.querySelector('.neos-menu-bottom-wrapper');
        if (bottom) {
            bottom.insertBefore(toggle, bottom.firstChild);
        } else {
            bottom = document.createElement('div');
            bottom.className = 'upassist-sidebarcollapse-bottom';
            bottom.appendChild(toggle);
            panel.appendChild(bottom);
        }

        // Neos 9: the user menu sits at the bottom of the panel. Its dropdown
        // does not fit in the rail, so a click there opens the full panel.
        var userMenu = panel.querySelector('#neos-user-actions');
        if (userMenu) {
            userMenu.addEventListener('click', function (event) {
                if (!isOpen() && getMode() === MODE_RAIL) {
                    event.preventDefault();
                    event.stopPropagation();
                    setOpen(true);
                }
            }, true);
        }
    }

    // Marks the menu item of the module being shown: the link whose path is
    // the longest prefix of the current path (so /users/edit matches /users).
    function markCurrent(panel) {
        var path = window.location.pathname.replace(/\/+$/, '');
        var best = null;
        var bestLength = 0;
        Array.prototype.forEach.call(panel.querySelectorAll('.neos-menu-list a[href]'), function (link) {
            var linkPath = link.pathname.replace(/\/+$/, '');
            var matches = path === linkPath || path.indexOf(linkPath + '/') === 0;
            if (matches && linkPath.length > bestLength) {
                best = link;
                bestLength = linkPath.length;
            }
        });
        if (best) {
            best.classList.add('upassist-sidebarcollapse-current');
            best.setAttribute('aria-current', 'page');
        }
    }

    // ------------------------------------------------------------------
    // Content module (Neos.Neos.Ui, a React app)
    // ------------------------------------------------------------------

    // The drawer only renders its menu items while it is open. In rail mode
    // the drawer is therefore kept open as far as the React app knows, and
    // CSS narrows it to the rail unless the body has EXPANDED_CLASS. The
    // hamburger button switches between the rail and the full drawer.

    function findDrawer() {
        // CSS module class names are hashed (e.g. "sD1RHa_drawer"), so match
        // on the suffix and skip the drawer's child elements ("_drawer__...").
        return document.querySelector('#neos-application [class*="_drawer"]:not([class*="_drawer__"])');
    }

    // Marks the items that lead to the page being shown: the "Content" section
    // and the current site (same host and path; other sites have their own
    // host). The class is only added when missing, because every change to
    // the class attribute wakes the MutationObserver again.
    function markCurrentContentItems(drawer) {
        var path = window.location.pathname.replace(/\/+$/, '');
        Array.prototype.forEach.call(drawer.querySelectorAll('[class*="_drawer__menuItem"] a[href]'), function (link) {
            var button = link.querySelector('button');
            var current = link.host === window.location.host && link.pathname.replace(/\/+$/, '') === path;
            if (button && current !== button.classList.contains('upassist-sidebarcollapse-current')) {
                button.classList.toggle('upassist-sidebarcollapse-current', current);
            }
        });
    }

    function mountContentUi(application) {
        document.body.classList.add(UI_CLASS);
        loadXliff();

        var drawer = null;
        var toggle = null;
        var clickingToggler = false;

        function drawerIsOpen() {
            return !!drawer && !/_drawer--isHidden/.test(drawer.className);
        }

        function isRail() {
            return getMode() === MODE_RAIL;
        }

        function isExpanded() {
            return document.body.classList.contains(EXPANDED_CLASS);
        }

        function setExpanded(expanded) {
            document.body.classList.toggle(EXPANDED_CLASS, expanded);
        }

        // Opens or closes the drawer through the React app.
        function setDrawerOpen(open) {
            var toggler = document.getElementById('neos-MenuToggler');
            if (toggler && drawer && drawerIsOpen() !== open) {
                clickingToggler = true;
                try {
                    toggler.click();
                } finally {
                    clickingToggler = false;
                }
            }
        }

        // The full menu may still have its auto-close pending (the mouse left
        // it less than 500ms ago). A mouseover from outside the window is a
        // mouse enter for React, which clears that timer, so it cannot close
        // the rail the hamburger button just returned to.
        function cancelAutoClose() {
            if (drawer) {
                drawer.dispatchEvent(new MouseEvent('mouseover', {bubbles: true, relatedTarget: null}));
            }
        }

        // Rail mode needs the drawer open (narrowed by CSS). If the app closed
        // it, e.g. on Escape, that ends the full menu: back to the rail.
        function sync() {
            if (isRail() && drawer && !drawerIsOpen()) {
                setExpanded(false);
                setDrawerOpen(true);
            }
        }

        function attach(found) {
            drawer = found;
            addTooltips(drawer.querySelectorAll('[class*="_drawer__menuItem"] button'));
            markCurrentContentItems(drawer);
            if (!toggle) {
                toggle = createToggle(function () {
                    setExpanded(false);
                    if (!isRail()) {
                        setDrawerOpen(false);
                    }
                });
            }
            if (toggle.parentNode !== drawer) {
                var bottom = drawer.querySelector('[class*="_drawer__bottom"]');
                drawer.insertBefore(toggle, bottom && bottom.parentNode === drawer ? bottom : null);
            }
            sync();
        }

        // The hamburger button. React listens on its root container, so this
        // capture listener on window runs first and can take the click over.
        window.addEventListener('click', function (event) {
            if (clickingToggler || !isRail() || !drawer) {
                return;
            }
            var target = event.target instanceof Element ? event.target : null;
            if (!target) {
                return;
            }
            if (target.closest('#neos-MenuToggler')) {
                event.preventDefault();
                event.stopPropagation();
                var collapsing = isExpanded();
                setExpanded(!collapsing);
                if (collapsing) {
                    cancelAutoClose();
                }
                sync();
                return;
            }
            // Neos 9: the user menu at the bottom of the drawer. Its dropdown
            // does not fit in the rail, so a click there opens the full menu.
            if (!isExpanded() && target.closest('[class*="_drawer__bottom"]')) {
                event.preventDefault();
                event.stopPropagation();
                setExpanded(true);
            }
        }, true);

        // The drawer closes itself 500ms after the mouse leaves it (React
        // derives onMouseLeave from `mouseout`). For the rail that meant a
        // close and reopen, a visible flash, every time the mouse left it.
        // A leave from a drawer that is already hidden (after the toggle
        // closed it under the mouse) armed the same timer, which then closed
        // the menu again right after the hamburger button opened it. Neither
        // case should start the timer; the full menu keeps its auto-close.
        window.addEventListener('mouseout', function (event) {
            if (!drawer || !(event.target instanceof Node) || !drawer.contains(event.target)) {
                return;
            }
            var related = event.relatedTarget;
            if (related instanceof Node && drawer.contains(related)) {
                return;
            }
            if (!drawerIsOpen() || (isRail() && !isExpanded())) {
                event.stopPropagation();
            }
        }, true);

        // The React app renders the drawer late and re-renders it (classes,
        // menu items). Re-apply tooltips, the toggle and the rail each time.
        var scheduled = false;
        new MutationObserver(function () {
            if (scheduled) {
                return;
            }
            scheduled = true;
            window.requestAnimationFrame(function () {
                scheduled = false;
                var found = findDrawer();
                if (found) {
                    attach(found);
                }
            });
        }).observe(application, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});

        var initial = findDrawer();
        if (initial) {
            attach(initial);
        }
    }

    // ------------------------------------------------------------------

    function mount() {
        if (document.body.classList.contains(BODY_CLASS)) {
            return;
        }
        var panel = document.querySelector('.neos-menu .neos-menu-panel');
        // The content module renders into #appContainer after loading.
        var application = document.getElementById('appContainer');
        if (!panel && !application) {
            return;
        }
        document.body.classList.add(BODY_CLASS);
        document.body.classList.toggle(RAIL_CLASS, getMode() === MODE_RAIL);
        if (panel) {
            mountModule(panel);
        } else {
            mountContentUi(application);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
