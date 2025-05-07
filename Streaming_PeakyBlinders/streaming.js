
// Fonction pour générer les liens de streaming
function generateStreamingLinks() {
    const seasons = [
        {
            name: "Season 1",
            thumbnail: "../images/placeholder-pbs1.jpg",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=1&episode=6&color=e600e6" }
            ]
        },

        {
            name: "Season 2",
            thumbnail: "../images/placeholder-pbs2.webp",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=2&episode=6&color=e600e6" }
            ]
        },

        {
            name: "Season 3",
            thumbnail: "../images/placeholder-pbs3.jpg",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=3&episode=6&color=e600e6" }
            ]
        },
        {
            name: "Season 4",
            thumbnail: "../images/placeholder-pbs4.webp",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=4&episode=6&color=e600e6" }
            ]
        },

        {
            name: "Season 5",
            thumbnail: "../images/placeholder-pbs5.webp",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=5&episode=6&color=e600e6" }
            ]
        },

        {
            name: "Season 6",
            thumbnail: "../images/placeholder-pbs6.jpg",
            episodes: [
                { episode: 1, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=1&color=e600e6" },
                { episode: 2, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=2&color=e600e6" },
                { episode: 3, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=3&color=e600e6" },
                { episode: 4, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=4&color=e600e6" },
                { episode: 5, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=5&color=e600e6" },
                { episode: 6, videoUrl: "https://vidsrc.io/embed/tv?imdb=tt2442560&season=6&episode=6&color=e600e6" }
            ]
        },

        {
            name: "Films",
            thumbnail: "../images/placeholder-pbs7.jpg",
            episodes: [
                { episode: "Film", videoUrl: "" },
            ]
        }
    ];
    return seasons;
}

document.addEventListener('DOMContentLoaded', () => {
    const seasons = generateStreamingLinks();
    const seasonList = document.getElementById('season-list');
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const suggestionsList = document.getElementById('search-suggestions');
    const userStatus = document.getElementById('user-status');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const historyContent = document.getElementById('history-content');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const historyLogSidebar = document.getElementById('history-log-sidebar');

    // Check DOM elements
    if (!seasonList || !historyContent || !userStatus || !hamburgerMenu || !historyLogSidebar) {
        console.error('Missing DOM elements:', {
            seasonList, historyContent, userStatus, hamburgerMenu, historyLogSidebar
        });
        return;
    }

    seasons.forEach((season, index) => {
        const seasonCard = document.createElement('div');
        seasonCard.className = 'season-card';
        seasonCard.innerHTML = `
            <a href="season${index}.html">
                <img src="${season.thumbnail || '../images/default-season-placeholder.jpg'}" alt="${season.name}">
                <h3>${season.name}</h3>
            </a>
        `;
        seasonList.appendChild(seasonCard);
    });

    function showSuggestions(query) {
        suggestionsList.innerHTML = '';
        if (!query) {
            suggestionsList.style.display = 'none';
            return;
        }
        const filteredSeasons = seasons.filter(season => season.name.toLowerCase().includes(query.toLowerCase()));
        if (filteredSeasons.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }
        filteredSeasons.forEach((season, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${season.thumbnail || '../images/default-season-placeholder.jpg'}" alt="${season.name}">
                <span>${season.name}</span>
            `;
            li.dataset.index = seasons.indexOf(season);
            li.addEventListener('click', () => {
                scrollToCard(season.name);
                suggestionsList.style.display = 'none';
                searchBar.value = season.name;
            });
            suggestionsList.appendChild(li);
        });
        suggestionsList.style.display = 'block';
    }

    function scrollToCard(seasonName) {
        const seasonCard = Array.from(document.querySelectorAll('.season-card')).find(card =>
            card.querySelector('h3').textContent.toLowerCase() === seasonName.toLowerCase()
        );
        if (seasonCard) {
            seasonCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            seasonCard.classList.add('highlight');
            setTimeout(() => seasonCard.classList.remove('highlight'), 2000);
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        .season-card.highlight {
            box-shadow: 0 0 20px #ffb300;
            transform: scale(1.1);
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    let activeSuggestion = -1;
    searchBar.addEventListener('input', (e) => {
        activeSuggestion = -1;
        showSuggestions(e.target.value);
    });

    searchButton.addEventListener('click', () => {
        const query = searchBar.value.trim();
        if (query) {
            scrollToCard(query);
            suggestionsList.style.display = 'none';
        }
    });

    searchBar.addEventListener('keydown', (e) => {
        const suggestions = suggestionsList.querySelectorAll('li');
        if (suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestion = Math.min(activeSuggestion + 1, suggestions.length - 1);
            updateActiveSuggestion(suggestions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestion = Math.max(activeSuggestion - 1, -1);
            updateActiveSuggestion(suggestions);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestion >= 0) {
                suggestions[activeSuggestion].click();
            } else {
                scrollToCard(searchBar.value.trim());
                suggestionsList.style.display = 'none';
            }
        }
    });

    function updateActiveSuggestion(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('active', index === activeSuggestion);
        });
        if (activeSuggestion >= 0) {
            suggestions[activeSuggestion].scrollIntoView({ block: 'nearest' });
            searchBar.value = suggestions[activeSuggestion].querySelector('span').textContent;
        }
    }

    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });

    if (typeof netlifyIdentity === 'undefined') {
        console.error('Netlify Identity not loaded');
        userStatus.textContent = 'Error: Netlify Identity not loaded';
        return;
    }

    function updateUI(user) {
        if (user) {
            console.log('User logged in:', user.email, user.user_metadata);
            userStatus.textContent = `Logged in: ${user.email}`;
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            loadHistory(user, seasons);
            loadHistoryLog(user);
        } else {
            console.log('No user logged in');
            userStatus.textContent = 'Not logged in';
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            historyContent.textContent = 'No history yet.';
            historyLogSidebar.innerHTML = '<p>Not logged in</p>';
        }
    }

    function loadHistory(user, seasons) {
        if (!user) {
            historyContent.textContent = 'Not logged in';
            return;
        }
        const history = (user.user_metadata && user.user_metadata.history) || {};
        console.log('History loaded:', history);
        if (Object.keys(history).length === 0) {
            historyContent.textContent = 'No episodes watched recently.';
            return;
        }

        historyContent.innerHTML = '';
        Object.entries(history).forEach(([seasonName, episodeData]) => {
            if (!episodeData || !episodeData.episode) {
                console.log('Invalid history data for:', seasonName);
                return;
            }
            const seasonIndex = seasons.findIndex(s => s.name === seasonName);
            if (seasonIndex === -1) {
                console.log('Season not found in seasons:', seasonName);
                return;
            }
            const season = seasons[seasonIndex];
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <a href="season${seasonIndex}.html#episode${episodeData.episode}">
                    <img src="${season.thumbnail || '../images/default-season-placeholder.jpg'}" alt="${seasonName}">
                    <div class="history-info">
                        <h3>Last Episode Watched</h3>
                        <p>${seasonName} - Episode ${episodeData.episode}</p>
                    </div>
                </a>
                <button class="delete-history" data-season="${seasonName}">✖</button>
            `;
            historyContent.appendChild(card);
        });

        document.querySelectorAll('.delete-history').forEach(button => {
            button.addEventListener('click', () => {
                const seasonName = button.dataset.season;
                const user = netlifyIdentity.currentUser();
                if (user) {
                    const currentHistory = (user.user_metadata && user.user_metadata.history) || {};
                    const updatedHistory = { ...currentHistory };
                    delete updatedHistory[seasonName];
                    user.update({
                        data: {
                            history: updatedHistory,
                            history_log: user.user_metadata && user.user_metadata.history_log || []
                        }
                    }).then(() => {
                        console.log(`History deleted for ${seasonName}`);
                        loadHistory(user, seasons);
                    }).catch(err => {
                        console.error('Error deleting history:', err);
                    });
                }
            });
        });

        if (!historyContent.hasChildNodes()) {
            historyContent.textContent = 'No valid history.';
        }
    }

    function loadHistoryLog(user) {
        console.log('Loading history log for user:', user ? user.email : 'none');
        if (!user) {
            historyLogSidebar.innerHTML = '<p>Not logged in</p>';
            return;
        }
        const historyLog = (user.user_metadata && user.user_metadata.history_log) || [];
        console.log('Full history log loaded:', historyLog);
        
        // Initialize sidebar structure if empty
        if (!historyLogSidebar.querySelector('.history-log-list')) {
            historyLogSidebar.innerHTML = `
                <div class="sidebar-header">
                    <h2>Full History</h2>
                    <button class="close-sidebar-btn">Close</button>
                </div>
                <ul class="history-log-list"></ul>
            `;
        }

        // Update history list only
        const historyLogList = historyLogSidebar.querySelector('.history-log-list');
        if (historyLog.length === 0) {
            historyLogList.innerHTML = '<li>No full history yet.</li>';
            return;
        }

        historyLogList.innerHTML = '';
        historyLog.forEach(log => {
            const li = document.createElement('li');
            li.textContent = `${log.season}, Episode ${log.episode}, ${log.timestamp}, IP: ${log.ip}`;
            historyLogList.appendChild(li);
        });
    }

    // Event delegation for close button
    historyLogSidebar.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-sidebar-btn')) {
            console.log('Close sidebar button clicked');
            hamburgerMenu.classList.remove('active');
            historyLogSidebar.classList.remove('open');
        }
    });

    // Hamburger menu handler
    hamburgerMenu.addEventListener('click', () => {
        console.log('Hamburger menu clicked');
        hamburgerMenu.classList.toggle('active');
        historyLogSidebar.classList.toggle('open');
    });

    netlifyIdentity.on('init', (user) => {
        console.log('Init event:', user);
        updateUI(user);
    });

    netlifyIdentity.on('login', (user) => {
        console.log('Login event:', user);
        updateUI(user);
        netlifyIdentity.close();
    });

    netlifyIdentity.on('logout', () => {
        console.log('Logout event');
        updateUI(null);
    });

    netlifyIdentity.on('signup', (user) => {
        console.log('Signup event:', user);
        updateUI(user);
        netlifyIdentity.close();
    });

    const checkUser = () => {
        const user = netlifyIdentity.currentUser();
        console.log('User check:', user);
        updateUI(user);
    };

    checkUser();
    setInterval(checkUser, 5000);
});