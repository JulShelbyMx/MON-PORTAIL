document.addEventListener('DOMContentLoaded', () => {
    /* -----------------------------------------------------------
       Elements
    ----------------------------------------------------------- */
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const suggestionsList = document.getElementById('search-suggestions');
    const backToTopButton = document.getElementById('back-to-top');
    const hamburger = document.querySelector('.hamburger');
    const navButtons = document.querySelector('.nav-buttons');

    /* -----------------------------------------------------------
       Hamburger menu (mobile)
    ----------------------------------------------------------- */
    if (hamburger && navButtons) {
        hamburger.addEventListener('click', () => {
            const isOpen = navButtons.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.querySelector('i').classList.toggle('fa-bars', !isOpen);
            hamburger.querySelector('i').classList.toggle('fa-times', isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navButtons.contains(e.target)) {
                navButtons.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.querySelector('i').classList.remove('fa-times');
                hamburger.querySelector('i').classList.add('fa-bars');
            }
        });

        navButtons.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', () => {
                navButtons.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                hamburger.querySelector('i').classList.remove('fa-times');
                hamburger.querySelector('i').classList.add('fa-bars');
            });
        });
    }

    /* -----------------------------------------------------------
       Favorites (localStorage), rendered in a dedicated section
    ----------------------------------------------------------- */
    const FAV_KEY = 'jp-favorites';
    const favoritesSection = document.getElementById('Favorites');
    const favoritesCarousel = favoritesSection ? favoritesSection.querySelector('.carousel') : null;

    const getFavorites = () => {
        try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
        catch { return []; }
    };
    const setFavorites = (list) => localStorage.setItem(FAV_KEY, JSON.stringify(list));

    const buildCardMarkup = (card) => {
        const clone = card.cloneNode(true);
        clone.dataset.cloned = 'true';
        return clone;
    };

    const renderFavorites = () => {
        if (!favoritesCarousel || !favoritesSection) return;
        const favs = getFavorites();
        favoritesCarousel.innerHTML = '';

        if (favs.length === 0) {
            favoritesSection.classList.add('is-empty');
            return;
        }
        favoritesSection.classList.remove('is-empty');

        favs.forEach(href => {
            const original = document.querySelector(`.site-card[data-href="${CSS.escape(href)}"]`);
            if (original) {
                favoritesCarousel.appendChild(buildCardMarkup(original));
            }
        });
        bindCardInteractions(favoritesCarousel);

        const statFavoritesEl = document.getElementById('stat-favorites');
        if (statFavoritesEl) statFavoritesEl.textContent = favs.length;
    };

    const toggleFavorite = (href, btn) => {
        let favs = getFavorites();
        const isFav = favs.includes(href);
        favs = isFav ? favs.filter(f => f !== href) : [...favs, href];
        setFavorites(favs);

        document.querySelectorAll(`.site-card[data-href="${CSS.escape(href)}"] .favorite-toggle`).forEach(b => {
            b.classList.toggle('is-active', !isFav);
            b.innerHTML = !isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        });
        renderFavorites();
    };

    /* -----------------------------------------------------------
       Card interactions (click to open, star to favorite)
    ----------------------------------------------------------- */
    function bindCardInteractions(scope) {
        scope.querySelectorAll('.site-card').forEach(card => {
            const link = card.querySelector('a');
            if (!link) return;
            const href = card.dataset.href || link.getAttribute('href');
            card.dataset.href = href;

            if (!card.querySelector('.favorite-toggle')) {
                const btn = document.createElement('button');
                btn.className = 'favorite-toggle';
                btn.type = 'button';
                btn.setAttribute('aria-label', 'Ajouter aux favoris');
                const isFav = getFavorites().includes(href);
                if (isFav) btn.classList.add('is-active');
                btn.innerHTML = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(href, btn);
                });
                card.appendChild(btn);
            }
        });
    }

    bindCardInteractions(document);
    renderFavorites();

    /* -----------------------------------------------------------
       Search
    ----------------------------------------------------------- */
    if (searchBar && searchButton && suggestionsList) {
        const getAllCards = () => Array.from(document.querySelectorAll('.categories:not(#Favorites) .site-card'));

        const matchCards = (term) => getAllCards().filter(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const link = (card.dataset.href || card.querySelector('a')?.href || '').toLowerCase();
            return title.includes(term) || link.includes(term);
        });

        const showSuggestions = (term) => {
            suggestionsList.innerHTML = '';
            if (!term) { suggestionsList.classList.remove('show'); return; }

            const matches = matchCards(term).slice(0, 8);
            if (matches.length === 0) { suggestionsList.classList.remove('show'); return; }

            matches.forEach(card => {
                const title = card.querySelector('h3')?.textContent || 'Sans titre';
                const imgSrc = card.querySelector('img')?.src || '';
                const li = document.createElement('li');
                li.innerHTML = `${imgSrc ? `<img src="${imgSrc}" alt="" loading="lazy">` : ''}<span>${title}</span>`;
                li.addEventListener('click', () => {
                    scrollToCard(card);
                    suggestionsList.classList.remove('show');
                    searchBar.value = '';
                });
                suggestionsList.appendChild(li);
            });
            suggestionsList.classList.add('show');
        };

        const scrollToCard = (card) => {
            document.querySelectorAll('.site-card.highlight').forEach(c => c.classList.remove('highlight'));
            card.classList.add('highlight');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const section = card.closest('.categories');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => card.classList.remove('highlight'), 1600);
        };

        const runSearch = () => {
            const term = searchBar.value.trim().toLowerCase();
            if (!term) return;
            const firstMatch = matchCards(term)[0];
            if (firstMatch) {
                scrollToCard(firstMatch);
                suggestionsList.classList.remove('show');
                searchBar.value = '';
            } else {
                suggestionsList.innerHTML = '<li style="cursor:default"><span>Aucun résultat pour « ' + term + ' »</span></li>';
                suggestionsList.classList.add('show');
            }
        };

        searchBar.addEventListener('input', () => { selectedIndex = -1; showSuggestions(searchBar.value.trim().toLowerCase()); });
        searchButton.addEventListener('click', runSearch);
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && selectedIndex === -1) runSearch();
        });

        let selectedIndex = -1;
        searchBar.addEventListener('keydown', (e) => {
            const items = suggestionsList.querySelectorAll('li');
            if (items.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                items[selectedIndex].click();
                return;
            } else { return; }
            items.forEach((li, i) => li.classList.toggle('selected', i === selectedIndex));
            if (selectedIndex >= 0) items[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.addEventListener('click', (e) => {
            if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.remove('show');
                selectedIndex = -1;
            }
        });

        // Keyboard shortcut: "/" focuses the search bar
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchBar) {
                e.preventDefault();
                searchBar.focus();
            }
            if (e.key === 'Escape' && document.activeElement === searchBar) {
                searchBar.blur();
                suggestionsList.classList.remove('show');
            }
        });
    }

    /* -----------------------------------------------------------
       Generic tab switch (.tab-switch / .tab-panel)
    ----------------------------------------------------------- */
    document.querySelectorAll('.tab-switch').forEach(switcher => {
        const buttons = switcher.querySelectorAll('button[data-target]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                buttons.forEach(b => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-selected', String(b === btn));
                });
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.toggle('active', panel.id === target);
                });
                document.dispatchEvent(new CustomEvent('tab-switched', { detail: { target } }));
            });
        });
    });

    /* -----------------------------------------------------------
       Hero stats strip (homepage only)
    ----------------------------------------------------------- */
    const statLinks = document.getElementById('stat-links');
    const statCategories = document.getElementById('stat-categories');
    const statFavorites = document.getElementById('stat-favorites');
    const statClock = document.getElementById('stat-clock');

    if (statLinks && statCategories) {
        const linkCount = document.querySelectorAll('.categories:not(#Favorites) .site-card').length;
        const catCount = document.querySelectorAll('.categories:not(#Favorites)').length;
        statLinks.textContent = linkCount;
        statCategories.textContent = catCount;
    }
    if (statFavorites) {
        statFavorites.textContent = getFavorites().length;
    }
    if (statClock) {
        const updateClock = () => {
            statClock.textContent = new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'
            }).format(new Date());
        };
        updateClock();
        setInterval(updateClock, 30000);
    }

    /* -----------------------------------------------------------
       Back to top
    ----------------------------------------------------------- */
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            backToTopButton.style.display = window.scrollY > 300 ? 'flex' : 'none';
        }, { passive: true });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
