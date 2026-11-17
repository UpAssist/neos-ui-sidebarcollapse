/*
 * UpAssist.Neos.UiSidebarCollapse
 *
 * Keeps the backend module menu visible as an icon-only rail while the menu
 * panel is closed. The hamburger button still opens the full panel.
 */
(function () {
    'use strict';

    var BODY_CLASS = 'upassist-sidebarcollapse';
    var OPEN_CLASS = 'neos-menu-panel-open';

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

        // Neos 9: the user menu sits at the bottom of the panel. Its dropdown
        // does not fit in the rail, so a click there opens the full panel.
        var userMenu = panel.querySelector('.neos-menu-bottom-wrapper');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
