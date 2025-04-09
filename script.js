// Sélection des éléments du DOM
const carousels = document.querySelectorAll('.carousel-container'); // Tous les carousels
const searchBar = document.getElementById('search-bar'); // Barre de recherche
const searchButton = document.getElementById('search-button'); // Bouton de recherche
const suggestionsList = document.getElementById('search-suggestions'); // Liste des suggestions
const siteCards = document.querySelectorAll('.site-card'); // Toutes les cartes
const streamingButton = document.getElementById('streaming-button'); // Bouton streaming
const backToTopButton = document.getElementById('back-to-top'); // Bouton retour en haut

// Vérification que les éléments essentiels existent pour éviter les erreurs
if (!searchBar || !searchButton || !suggestionsList) {
    console.error('Un ou plusieurs éléments de la barre de recherche sont manquants dans le DOM.');
    throw new Error('Éléments de recherche manquants');
}

// Fonction pour récupérer les cartes dynamiquement
const getSiteCards = (carousel) => carousel.querySelectorAll('.site-card');

// Fonction pour recalculer la largeur du carousel
const updateCarouselSize = (carousel) => {
    const siteCards = getSiteCards(carousel);
    if (siteCards.length === 0) return;

    const cardWidth = siteCards[0].offsetWidth + parseInt(window.getComputedStyle(siteCards[0]).marginRight);
    const totalWidth = siteCards.length * cardWidth;

    carousel.style.width = `${totalWidth}px`; // Ajustement dynamique de la largeur
};

// Fonction pour récupérer la valeur actuelle de translateX
const getCurrentTranslateX = (carousel) => {
    const transform = getComputedStyle(carousel).transform;
    return transform !== "none" ? new DOMMatrix(transform).m41 : 0;
};

// Ajout des événements pour drag-to-scroll
carousels.forEach((carouselContainer) => {
    const carousel = carouselContainer.querySelector('.carousel');

    // Vérification que le carousel existe
    if (!carousel) {
        console.error('Carousel manquant dans un carousel-container.');
        return;
    }

    // Variables pour le drag-to-scroll
    let isMouseDown = false;
    let startX, scrollLeft;

    // Lors du mousedown, on active le drag
    carouselContainer.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.pageX - carouselContainer.offsetLeft;
        scrollLeft = carousel.scrollLeft;
        carouselContainer.style.cursor = 'grabbing';
    });

    // Lorsque la souris quitte l’élément
    carouselContainer.addEventListener('mouseleave', () => {
        isMouseDown = false;
        carouselContainer.style.cursor = 'grab';
    });

    // Lors du mouseup, on désactive le drag
    carouselContainer.addEventListener('mouseup', () => {
        isMouseDown = false;
        carouselContainer.style.cursor = 'grab';
    });

    // Lors du mouvement de la souris, on déplace le carousel
    carouselContainer.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const x = e.pageX - carouselContainer.offsetLeft;
        const walk = (x - startX) * 3; // Vitesse du défilement
        carousel.scrollLeft = scrollLeft - walk;
    });

    // Ajustement du carousel au chargement et au redimensionnement
    window.addEventListener('load', () => updateCarouselSize(carousel));
    window.addEventListener('resize', () => updateCarouselSize(carousel));
});

// Gestion des clics sur les site-cards (logs retirés)
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
    // Retire le surlignage de toutes les cartes
    siteCards.forEach(c => c.classList.remove('highlight'));

    // Ajoute le surlignage à la carte trouvée
    card.classList.add('highlight');

    // Trouve le carousel parent
    const carouselContainer = card.closest('.carousel-container');
    const carousel = carouselContainer.querySelector('.carousel');

    // Vérification que le carousel existe
    if (!carouselContainer || !carousel) {
        console.error('Carousel ou carousel-container manquant pour la carte sélectionnée.');
        return;
    }

    // Calcule la position de la carte par rapport au carousel
    const cardRect = card.getBoundingClientRect();
    const carouselRect = carouselContainer.getBoundingClientRect();
    const scrollPosition = card.offsetLeft - (carouselRect.width / 2) + (cardRect.width / 2);

    // Scrolle doucement vers la carte
    carouselContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });

    // Scrolle aussi verticalement pour que la section soit visible
    const section = card.closest('.categories');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Fonction pour afficher les suggestions sous forme de mini site-card
const showSuggestions = (searchTerm) => {
    // Vide la liste des suggestions
    suggestionsList.innerHTML = '';

    if (!searchTerm) {
        suggestionsList.classList.remove('show');
        return;
    }

    // Filtre les cartes correspondantes
    const matchingCards = Array.from(siteCards).filter(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const link = card.querySelector('a')?.href.toLowerCase() || '';
        return title.includes(searchTerm) || link.includes(searchTerm);
    });

    if (matchingCards.length === 0) {
        suggestionsList.classList.remove('show');
        return;
    }

    // Crée une suggestion pour chaque carte correspondante
    matchingCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent || 'Sans titre';
        const imgSrc = card.querySelector('img')?.src || ''; // Récupère l’image de la carte

        const li = document.createElement('li');
        li.innerHTML = `
            ${imgSrc ? `<img src="${imgSrc}" alt="${title}">` : ''}
            <span>${title}</span>
        `;
        li.addEventListener('click', () => {
            scrollToCard(card); // Scrolle vers la carte quand on clique sur la suggestion
            suggestionsList.classList.remove('show'); // Cache la liste après clic
            searchBar.value = ''; // Vide la barre de recherche après clic
        });

        suggestionsList.appendChild(li);
    });

    // Affiche la liste
    suggestionsList.classList.add('show');
};

// Recherche en temps réel (à chaque saisie)
searchBar.addEventListener('input', () => {
    const searchTerm = searchBar.value.toLowerCase();
    showSuggestions(searchTerm);
});

// Recherche avec le bouton (scrolle vers le premier résultat)
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
        searchBar.value = ''; // Vide la barre de recherche après clic
    } else {
        alert('Aucun résultat trouvé pour "' + searchTerm + '".');
    }
});

// Gestion de la navigation dans les suggestions avec les flèches
let selectedIndex = -1; // Index de la suggestion actuellement sélectionnée (-1 = aucune)

searchBar.addEventListener('keydown', (e) => {
    const suggestions = suggestionsList.querySelectorAll('li');

    if (suggestions.length === 0) return; // S'il n'y a pas de suggestions, on ne fait rien

    if (e.key === 'ArrowDown') {
        e.preventDefault(); // Empêche le défilement de la page
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1); // Incrémente l'index
        updateSelectedSuggestion(suggestions);
        scrollSuggestionIntoView(suggestions[selectedIndex]);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // Empêche le défilement de la page
        selectedIndex = Math.max(selectedIndex - 1, -1); // Décrémente l'index
        updateSelectedSuggestion(suggestions);
        if (selectedIndex >= 0) {
            scrollSuggestionIntoView(suggestions[selectedIndex]);
        }
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault(); // Empêche la soumission par défaut
        suggestions[selectedIndex].click(); // Simule un clic sur la suggestion sélectionnée
    }
});

// Fonction pour mettre à jour la suggestion sélectionnée
function updateSelectedSuggestion(suggestions) {
    suggestions.forEach((suggestion, index) => {
        if (index === selectedIndex) {
            suggestion.classList.add('selected');
        } else {
            suggestion.classList.remove('selected');
        }
    });
}

// Fonction pour faire défiler la suggestion dans la vue
function scrollSuggestionIntoView(suggestion) {
    suggestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Recherche avec la touche "Entrée" (scrolle vers le premier résultat si aucune suggestion n'est sélectionnée)
searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && selectedIndex === -1) { // Si aucune suggestion n'est sélectionnée
        const searchTerm = searchBar.value.toLowerCase();
        const firstMatch = Array.from(siteCards).find(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const link = card.querySelector('a')?.href.toLowerCase() || '';
            return title.includes(searchTerm) || link.includes(searchTerm);
        });

        if (firstMatch) {
            scrollToCard(firstMatch);
            suggestionsList.classList.remove('show');
            searchBar.value = ''; // Vide la barre de recherche après clic
        } else {
            alert('Aucun résultat trouvé pour "' + searchTerm + '".');
        }
    }
});

// Réinitialiser l'index de sélection quand les suggestions changent
searchBar.addEventListener('input', () => {
    selectedIndex = -1; // Réinitialise l'index quand l'utilisateur tape
});

// Cacher la liste si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.classList.remove('show');
        selectedIndex = -1; // Réinitialise l'index quand la liste se ferme
    }
});

// Gestion du menu hamburger
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('nav');

hamburger.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// Cacher la navigation si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('active');
    }
});

// Gestion des liens actifs
const navLinks = document.querySelectorAll('nav ul li a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        nav.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
    });
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

// Gestion du bouton "Streaming"
streamingButton.addEventListener('click', () => {
    window.location.href = 'Streaming/streaming.html';
});
