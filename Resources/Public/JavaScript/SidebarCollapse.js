/*
 * UpAssist.Neos.UiSidebarCollapse
 *
 * Keeps the backend module menu visible as an icon-only rail while the menu
 * panel is closed. The hamburger button still opens the full panel. A button
 * at the bottom of the menu switches back to the normal hidden menu.
 */
(function () {
    'use strict';

    var BODY_CLASS = 'upassist-sidebarcollapse';
    var RAIL_CLASS = 'upassist-sidebarcollapse-rail';
    var OPEN_CLASS = 'neos-menu-panel-open';
    var STORAGE_KEY = 'upassist.sidebarcollapse.mode';
    var MODE_RAIL = 'rail';
    var MODE_HIDDEN = 'hidden';

    // Stored per browser. Without storage the rail is the default.
    function getMode() {
        try {
            return window.localStorage.getItem(STORAGE_KEY) === MODE_HIDDEN ? MODE_HIDDEN : MODE_RAIL;
        } catch (e) {
            return MODE_RAIL;
        }
    }

    function setMode(mode) {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) {
            // Storage blocked: the choice holds for this page only.
        }
        applyMode(mode);
    }

    function applyMode(mode) {
        document.body.classList.toggle(RAIL_CLASS, mode === MODE_RAIL);
    }

    function labelOf(element) {
        return (element.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function isCollapsed() {
        return !document.body.classList.contains(OPEN_CLASS);
    }

    function openPanel() {
        var button = document.querySelector('.neos-menu .neos-menu-button');
        if (button && isCollapsed()) {
            button.click();
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

    function mount() {
        var panel = document.querySelector('.neos-menu .neos-menu-panel');
        if (!panel || document.body.classList.contains(BODY_CLASS)) {
            return;
        }
        document.body.classList.add(BODY_CLASS);
        applyMode(getMode());

        // Labels are hidden in the rail, so every item gets a native tooltip.
        var items = panel.querySelectorAll('.neos-menu-headline, .neos-menu-list a, .neos-menu-list .neos-menu-item');
        Array.prototype.forEach.call(items, function (item) {
            var label = labelOf(item);
            if (label && !item.getAttribute('title')) {
                item.setAttribute('title', label);
            }
            if (label && !item.getAttribute('aria-label')) {
                item.setAttribute('aria-label', label);
            }
        });

        markCurrent(panel);

        mountToggle(panel);

        // Neos 9: the user menu sits at the bottom of the panel. Its dropdown
        // does not fit in the rail, so a click there opens the full panel.
        var userMenu = panel.querySelector('#neos-user-actions');
        if (userMenu) {
            userMenu.addEventListener('click', function (event) {
                if (isCollapsed()) {
                    event.preventDefault();
                    event.stopPropagation();
                    openPanel();
                }
            }, true);
        }
    }

    // Button at the bottom of the menu that switches the closed state between
    // the icon rail and the normal hidden menu. In the rail it only shows the
    // icon; in the open menu it shows the label as well.
    function mountToggle(panel) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'upassist-sidebarcollapse-toggle';
        var icon = document.createElement('i');
        var label = document.createElement('span');
        button.appendChild(icon);
        button.appendChild(label);

        function render() {
            var rail = getMode() === MODE_RAIL;
            var text = rail ? 'Hide icon bar' : 'Show icon bar';
            icon.className = rail ? 'fas fa-angle-double-left' : 'fas fa-angle-double-right';
            label.textContent = text;
            button.title = text;
            button.setAttribute('aria-label', text);
            button.setAttribute('aria-pressed', rail ? 'true' : 'false');
        }

        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            setMode(getMode() === MODE_RAIL ? MODE_HIDDEN : MODE_RAIL);
            render();
        });
        render();

        // Neos 9 already has a bottom section (user menu); Neos 8 does not.
        var bottom = panel.querySelector('.neos-menu-bottom-wrapper');
        if (bottom) {
            bottom.insertBefore(button, bottom.firstChild);
        } else {
            bottom = document.createElement('div');
            bottom.className = 'upassist-sidebarcollapse-bottom';
            bottom.appendChild(button);
            panel.appendChild(bottom);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
