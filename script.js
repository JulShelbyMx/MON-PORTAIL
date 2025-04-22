document.addEventListener('DOMContentLoaded', () => {
    // Sélection des éléments du DOM
    const carousels = document.querySelectorAll('.carousel-container');
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const suggestionsList = document.getElementById('search-suggestions');
    const siteCards = document.querySelectorAll('.site-card');
    const backToTopButton = document.getElementById('back-to-top');
    const hamburger = document.querySelector('.hamburger');
    const navButtons = document.querySelector('.nav-buttons');

    // Vérification que les éléments essentiels existent pour éviter les erreurs
    if (!searchBar || !searchButton || !suggestionsList) {
        console.error('Un ou plusieurs éléments de la barre de recherche sont manquants dans le DOM.');
        throw new Error('Éléments de recherche manquants');
    }

    if (!hamburger || !navButtons) {
        console.error('Éléments du menu hamburger manquants dans le DOM.');
        throw new Error('Éléments du menu hamburger manquants');
    }

    // Gestion du menu hamburger
    hamburger.addEventListener('click', () => {
        navButtons.classList.toggle('active');
        hamburger.querySelector('i').classList.toggle('fa-bars');
        hamburger.querySelector('i').classList.toggle('fa-times');
    });

    // Fermer le menu si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navButtons.contains(e.target)) {
            navButtons.classList.remove('active');
            hamburger.querySelector('i').classList.remove('fa-times');
            hamburger.querySelector('i').classList.add('fa-bars');
        }
    });

    // Fermer le menu après un clic sur un lien
    navButtons.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
            navButtons.classList.remove('active');
            hamburger.querySelector('i').classList.remove('fa-times');
            hamburger.querySelector('i').classList.add('fa-bars');
        });
    });

    // Fonction pour récupérer les cartes dynamiquement
    const getSiteCards = (carousel) => carousel.querySelectorAll('.site-card');

    // Fonction pour recalculer la largeur du carousel
    const updateCarouselSize = (carousel) => {
        const siteCards = getSiteCards(carousel);
        if (siteCards.length === 0) return;

        const cardWidth = siteCards[0].offsetWidth + parseInt(window.getComputedStyle(siteCards[0]).marginRight);
        const totalWidth = siteCards.length * cardWidth;

        carousel.style.width = `${totalWidth}px`;
    };

    // Fonction pour récupérer la valeur actuelle de translateX
    const getCurrentTranslateX = (carousel) => {
        const transform = getComputedStyle(carousel).transform;
        return transform !== "none" ? new DOMMatrix(transform).m41 : 0;
    };

    // Ajout des événements pour drag-to-scroll
    carousels.forEach((carouselContainer) => {
        const carousel = carouselContainer.querySelector('.carousel');

        if (!carousel) {
            console.error('Carousel manquant dans un carousel-container.');
            return;
        }

        let isMouseDown = false;
        let startX, scrollLeft;

        carouselContainer.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startX = e.pageX - carouselContainer.offsetLeft;
            scrollLeft = carousel.scrollLeft;
            carouselContainer.style.cursor = 'grabbing';
        });

        carouselContainer.addEventListener('mouseleave', () => {
            isMouseDown = false;
            carouselContainer.style.cursor = 'grab';
        });

        carouselContainer.addEventListener('mouseup', () => {
            isMouseDown = false;
            carouselContainer.style.cursor = 'grab';
        });

        carouselContainer.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault();
            const x = e.pageX - carouselContainer.offsetLeft;
            const walk = (x - startX) * 3;
            carousel.scrollLeft = scrollLeft - walk;
        });

        window.addEventListener('load', () => updateCarouselSize(carousel));
        window.addEventListener('resize', () => updateCarouselSize(carousel));
    });

    // Gestion des clics sur les site-cards
    siteCards.forEach(card => {
        card.addEventListener('click', async (e) => {
            const link = card.querySelector('a');
            if (link) {
                window.open(link.href, '_blank');
            }
        });
    });

    // Fonction pour scroller vers une carte et la surligner
    const scrollToCard = (card) => {
        siteCards.forEach(c => c.classList.remove('highlight'));

        card.classList.add('highlight');

        const carouselContainer = card.closest('.carousel-container');
        const carousel = carouselContainer.querySelector('.carousel');

        if (!carouselContainer || !carousel) {
            console.error('Carousel ou carousel-container manquant pour la carte sélectionnée.');
            return;
        }

        const cardRect = card.getBoundingClientRect();
        const carouselRect = carouselContainer.getBoundingClientRect();
        const scrollPosition = card.offsetLeft - (carouselRect.width / 2) + (cardRect.width / 2);

        carouselContainer.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });

        const section = card.closest('.categories');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Fonction pour afficher les suggestions
    const showSuggestions = (searchTerm) => {
        suggestionsList.innerHTML = '';

        if (!searchTerm) {
            suggestionsList.classList.remove('show');
            return;
        }

        const matchingCards = Array.from(siteCards).filter(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const link = card.querySelector('a')?.href.toLowerCase() || '';
            return title.includes(searchTerm) || link.includes(searchTerm);
        });

        if (matchingCards.length === 0) {
            suggestionsList.classList.remove('show');
            return;
        }

        matchingCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent || 'Sans titre';
            const imgSrc = card.querySelector('img')?.src || '';

            const li = document.createElement('li');
            li.innerHTML = `
                ${imgSrc ? `<img src="${imgSrc}" alt="${title}">` : ''}
                <span>${title}</span>
            `;
            li.addEventListener('click', () => {
                scrollToCard(card);
                suggestionsList.classList.remove('show');
                searchBar.value = '';
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.add('show');
    };

    // Recherche en temps réel
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        showSuggestions(searchTerm);
    });

    // Recherche avec le bouton
    searchButton.addEventListener('click', () => {
        const searchTerm = searchBar.value.toLowerCase();
        const firstMatch = Array.from(siteCards).find(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const link = card.querySelector('a')?.href.toLowerCase() || '';
            return title.includes(searchTerm) || link.includes(searchTerm);
        });

        if (firstMatch) {
            scrollToCard(firstMatch);
            suggestionsList.classList.remove('show');
            searchBar.value = '';
        } else {
            alert('Aucun résultat trouvé pour "' + searchTerm + '".');
        }
    });

    // Gestion de la navigation dans les suggestions avec les flèches
    let selectedIndex = -1;

    searchBar.addEventListener('keydown', (e) => {
        const suggestions = suggestionsList.querySelectorAll('li');

        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions);
            scrollSuggestionIntoView(suggestions[selectedIndex]);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedSuggestion(suggestions);
            if (selectedIndex >= 0) {
                scrollSuggestionIntoView(suggestions[selectedIndex]);
            }
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            suggestions[selectedIndex].click();
        }
    });

    function updateSelectedSuggestion(suggestions) {
        suggestions.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    function scrollSuggestionIntoView(suggestion) {
        suggestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Recherche avec "Entrée"
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && selectedIndex === -1) {
            const searchTerm = searchBar.value.toLowerCase();
            const firstMatch = Array.from(siteCards).find(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const link = card.querySelector('a')?.href.toLowerCase() || '';
                return title.includes(searchTerm) || link.includes(searchTerm);
            });

            if (firstMatch) {
                scrollToCard(firstMatch);
                suggestionsList.classList.remove('show');
                searchBar.value = '';
            } else {
                alert('Aucun résultat trouvé pour "' + searchTerm + '".');
            }
        }
    });

    // Réinitialiser l'index de sélection
    searchBar.addEventListener('input', () => {
        selectedIndex = -1;
    });

    // Cacher la liste si on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.remove('show');
            selectedIndex = -1;
        }
    });

    // Gestion du bouton "Retour en haut"
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});