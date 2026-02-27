// ========================================
// FORCE HOME SECTION - MUST BE FIRST!
// ========================================
(function initializeAtHome() {
    // Disable scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Remove hash
    if (window.location.hash) {
        history.replaceState(null, null, window.location.pathname);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
})();

// Page show event (back/forward buttons)
window.addEventListener('pageshow', function(event) {
    window.scrollTo(0, 0);
    
    // Update nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.nav-link[href="#home"]')?.classList.add('active');
});

// Before unload
window.addEventListener('beforeunload', function() {
    window.scrollTo(0, 0);
});

console.log("🏠 App starting at Home section...");

// ========================================
// GLOBAL VARIABLES & STATE MANAGEMENT
// ========================================
let currentBooks = [...booksData];
let filteredBooks = [...booksData];
let favoritesIds = JSON.parse(localStorage.getItem('favorites')) || [];
let readingListIds = JSON.parse(localStorage.getItem('readingList')) || [];
let readingProgress = JSON.parse(localStorage.getItem('readingProgress')) || {};
let currentPage = 1;
let booksPerPage = 12;
let currentView = 'grid';
let currentFilters = {
    category: '',
    rating: '',
    year: '',
    sort: 'default',
    search: ''
};

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Hide preloader
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, 1500);

    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    // Initialize all components
    initNavigation();
    initTheme();
    initSearch();
    initCategories();
    initFilters();
    initBooks();
    initFeaturedBooks();
    initNewArrivals();
    initReadingProgress();
    initSidebars();
    initModals();
    initScrollEffects();
    initNewsletterForm();
    initCounterAnimation();
    
    // Update UI counts
    updateFavoritesCount();
    updateReadingListCount();
});

// ========================================
// Navigation
// ========================================
function initNavigation() {
    const navbar = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Sticky navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scroll & active link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href.startsWith('#')) {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Close mobile menu
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    bootstrap.Collapse.getInstance(navbarCollapse).hide();
                }
            }
        });
    });
    
    // Highlight active section on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ========================================
// Theme Toggle
// ========================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme === 'dark' ? 'Dark' : 'Light'} mode activated`);
    });
}

// ========================================
// Search Functionality
// ========================================
function initSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchCategory = document.getElementById('searchCategory');
    const searchSort = document.getElementById('searchSort');
    const voiceSearch = document.getElementById('voiceSearch');
    const suggestionTags = document.querySelectorAll('.suggestion-tags .tag');
    
    // Populate search category filter
    searchCategory.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        searchCategory.innerHTML += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
    });
    
    // Open search overlay
    searchToggle.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput.focus(), 300);
    });
    
    // Close search overlay
    searchClose.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
        }
    });
    
    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });
    
    // Search filters
    searchCategory.addEventListener('change', () => {
        performSearch(searchInput.value);
    });
    
    searchSort.addEventListener('change', () => {
        performSearch(searchInput.value);
    });
    
    // Voice search
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        voiceSearch.addEventListener('click', () => {
            recognition.start();
            voiceSearch.innerHTML = '<i class="bi bi-mic-fill text-danger"></i>';
        });
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            searchInput.value = transcript;
            performSearch(transcript);
            voiceSearch.innerHTML = '<i class="bi bi-mic"></i>';
        };
        
        recognition.onerror = () => {
            voiceSearch.innerHTML = '<i class="bi bi-mic"></i>';
            showToast('Voice search error', 'error');
        };
    } else {
        voiceSearch.style.display = 'none';
    }
    
    // Suggestion tags
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const searchTerm = tag.getAttribute('data-search');
            searchInput.value = searchTerm;
            performSearch(searchTerm);
        });
    });
}

function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const searchCategory = document.getElementById('searchCategory').value;
    const searchSort = document.getElementById('searchSort').value;
    
    if (!query && !searchCategory) {
        searchResults.innerHTML = '';
        return;
    }
    
    let results = booksData.filter(book => {
        const matchesQuery = !query || 
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase()) ||
            book.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = !searchCategory || book.category === searchCategory;
        
        return matchesQuery && matchesCategory;
    });
    
    // Sort results
    results = sortBooks(results, searchSort);
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search" style="font-size: 3rem; color: var(--gray-400);"></i>
                <p style="color: var(--gray-400); margin-top: 1rem;">No books found</p>
            </div>
        `;
        return;
    }
    
    searchResults.innerHTML = results.slice(0, 10).map(book => `
        <div class="search-result-item" data-book-id="${book.id}">
            <img src="${book.cover}" alt="${book.title}">
            <div class="search-result-info flex-grow-1">
                <h5>${book.title}</h5>
                <p>${book.author} • ${book.category} • ${book.rating} ⭐</p>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to results
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const bookId = parseInt(item.getAttribute('data-book-id'));
            const book = booksData.find(b => b.id === bookId);
            openBookModal(book);
            document.getElementById('searchOverlay').classList.remove('active');
        });
    });
}

// ========================================
// Categories Section
// ========================================
function initCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Render categories
    categoriesGrid.innerHTML = categories.map(cat => `
        <div class="category-card" data-category="${cat.name}" data-aos="fade-up">
            <span class="category-icon">${cat.icon}</span>
            <h5 class="category-name">${cat.name}</h5>
            <p class="category-count">${cat.count} books</p>
        </div>
    `).join('');
    
    // Populate filter dropdown
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
    
    // Category card click
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // Apply filter
            currentFilters.category = category;
            categoryFilter.value = category;
            applyFilters();
            
            // Scroll to catalog
            document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ========================================
// Filters
// ========================================
function initFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const yearFilter = document.getElementById('yearFilter');
    const sortFilter = document.getElementById('sortFilter');
    const viewButtons = document.querySelectorAll('.view-btn');
    
    // Filter change handlers
    categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        applyFilters();
    });
    
    ratingFilter.addEventListener('change', (e) => {
        currentFilters.rating = e.target.value;
        applyFilters();
    });
    
    yearFilter.addEventListener('change', (e) => {
        currentFilters.year = e.target.value;
        applyFilters();
    });
    
    sortFilter.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        applyFilters();
    });
    
    // View toggle
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = view;
            
            const booksContainer = document.getElementById('booksContainer');
            booksContainer.className = `books-container ${view}-view`;
        });
    });
}

function applyFilters() {
    filteredBooks = [...booksData];
    
    // Apply category filter
    if (currentFilters.category) {
        filteredBooks = filteredBooks.filter(book => book.category === currentFilters.category);
    }
    
    // Apply rating filter
    if (currentFilters.rating) {
        const minRating = parseFloat(currentFilters.rating);
        filteredBooks = filteredBooks.filter(book => book.rating >= minRating);
    }
    
    // Apply year filter
    if (currentFilters.year) {
        if (currentFilters.year === 'classic') {
            filteredBooks = filteredBooks.filter(book => book.year < 1950);
        } else {
            const year = parseInt(currentFilters.year);
            filteredBooks = filteredBooks.filter(book => book.year >= year);
        }
    }
    
    // Apply sorting
    filteredBooks = sortBooks(filteredBooks, currentFilters.sort);
    
    // Update active filters UI
    updateActiveFilters();
    
    // Reset pagination
    currentPage = 1;
    
    // Render books
    renderBooks();
}

function sortBooks(books, sortType) {
    const sorted = [...books];
    
    switch(sortType) {
        case 'title-asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'rating-desc':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return sorted.sort((a, b) => b.year - a.year);
        case 'popular':
            return sorted.sort((a, b) => b.rating - a.rating); // Can be modified with actual popularity metric
        default:
            return sorted;
    }
}

function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    const activeFilters = [];
    
    if (currentFilters.category) {
        activeFilters.push({ label: currentFilters.category, key: 'category' });
    }
    if (currentFilters.rating) {
        activeFilters.push({ label: `${currentFilters.rating}+ Stars`, key: 'rating' });
    }
    if (currentFilters.year) {
        const yearLabel = currentFilters.year === 'classic' ? 'Classic' : `${currentFilters.year}+`;
        activeFilters.push({ label: yearLabel, key: 'year' });
    }
    
    if (activeFilters.length === 0) {
        activeFiltersContainer.innerHTML = '';
        return;
    }
    
    activeFiltersContainer.innerHTML = activeFilters.map(filter => `
        <span class="filter-tag">
            ${filter.label}
            <button data-filter="${filter.key}">
                <i class="bi bi-x"></i>
            </button>
        </span>
    `).join('');
    
    // Add remove filter handlers
    activeFiltersContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterKey = btn.getAttribute('data-filter');
            currentFilters[filterKey] = '';
            
            // Update dropdown
            document.getElementById(`${filterKey}Filter`).value = '';
            
            applyFilters();
        });
    });
}

// ========================================
// Books Rendering
// ========================================
function initBooks() {
    renderBooks();
    
    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentPage++;
        renderBooks(true);
    });
}

function renderBooks(append = false) {
    const booksContainer = document.getElementById('booksContainer');
    const resultsCount = document.getElementById('resultsCount');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const booksToShow = filteredBooks.slice(startIndex, endIndex);
    
    const booksHTML = booksToShow.map(book => createBookCard(book)).join('');
    
    if (append) {
        booksContainer.innerHTML += booksHTML;
    } else {
        booksContainer.innerHTML = booksHTML;
        booksContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Update results count
    resultsCount.textContent = filteredBooks.length;
    
    // Show/hide load more button
    if (endIndex >= filteredBooks.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
    
    // Add event listeners to book cards
    attachBookCardListeners();
    
    // Refresh AOS
    AOS.refresh();
}

function createBookCard(book) {
    const isFavorite = favoritesIds.includes(book.id);
    const isInReadingList = readingListIds.includes(book.id);
    
    return `
        <div class="book-card" data-book-id="${book.id}" data-aos="fade-up">
            <div class="book-cover-wrapper">
                <img src="${book.cover}" alt="${book.title}" loading="lazy">
                <div class="book-overlay">
                    <div class="book-actions">
                        <button class="btn btn-primary btn-sm view-book">
                            <i class="bi bi-eye"></i> View
                        </button>
                        <button class="btn btn-light btn-sm read-book">
                            <i class="bi bi-book"></i> Read
                        </button>
                    </div>
                </div>
                ${book.featured ? '<div class="book-badges"><span class="badge bg-warning">⭐ Featured</span></div>' : ''}
                ${book.newArrival ? '<div class="book-badges"><span class="badge bg-success">🆕 New</span></div>' : ''}
                <div class="book-quick-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="Add to Favorites">
                        <i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i>
                    </button>
                    <button class="bookmark-btn ${isInReadingList ? 'active' : ''}" title="Add to Reading List">
                        <i class="bi bi-bookmark${isInReadingList ? '-fill' : ''}"></i>
                    </button>
                    <button class="share-btn" title="Share">
                        <i class="bi bi-share"></i>
                    </button>
                </div>
            </div>
            <div class="book-info">
                <span class="book-category">${book.category}</span>
                <h5 class="book-title">${book.title}</h5>
                <p class="book-author">by ${book.author}</p>
                <div class="book-rating">
                    ${generateStars(book.rating)}
                    <span>${book.rating}</span>
                </div>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="bi bi-star-fill"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="bi bi-star-half"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="bi bi-star"></i>';
    }
    
    return stars;
}

function attachBookCardListeners() {
    document.querySelectorAll('.book-card').forEach(card => {
        const bookId = parseInt(card.getAttribute('data-book-id'));
        const book = booksData.find(b => b.id === bookId);
        
        // View book
        card.querySelector('.view-book').addEventListener('click', (e) => {
            e.stopPropagation();
            openBookModal(book);
        });
        
        // Read book
        card.querySelector('.read-book').addEventListener('click', (e) => {
            e.stopPropagation();
            openReader(book);
        });
        
        // Favorite
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(bookId, e.currentTarget);
        });
        
        // Bookmark
        card.querySelector('.bookmark-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleReadingList(bookId, e.currentTarget);
        });
        
        // Share
        card.querySelector('.share-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            shareBook(book);
        });
        
        // Click card to view
        card.addEventListener('click', () => {
            openBookModal(book);
        });
    });
}

// ========================================
// Featured Books
// ========================================
function initFeaturedBooks() {
    const featuredBooksContainer = document.getElementById('featuredBooks');
    const featuredBooks = booksData.filter(book => book.featured);
    
    featuredBooksContainer.innerHTML = featuredBooks.map(book => `
        <div class="swiper-slide">
            <div class="featured-card">
                <div class="featured-cover">
                    <img src="${book.cover}" alt="${book.title}">
                </div>
                <div class="featured-info">
                    <span class="book-category">${book.category}</span>
                    <h4>${book.title}</h4>
                    <p class="book-author">by ${book.author}</p>
                    <div class="book-rating mb-3">
                        ${generateStars(book.rating)}
                        <span>${book.rating}</span>
                    </div>
                    <p class="text-secondary">${book.description.substring(0, 100)}...</p>
                    <button class="btn btn-primary w-100 mt-3" onclick="openBookModalById(${book.id})">
                        <i class="bi bi-book"></i> View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Initialize Swiper
    new Swiper('.featured-swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },
    });
}

// ========================================
// New Arrivals
// ========================================
function initNewArrivals() {
    const newArrivalsContainer = document.getElementById('newArrivals');
    const newBooks = booksData.filter(book => book.newArrival).slice(0, 6);
    
    newArrivalsContainer.innerHTML = newBooks.map(book => `
        <div class="col-md-4 col-sm-6" data-aos="fade-up">
            ${createBookCard(book)}
        </div>
    `).join('');
    
    attachBookCardListeners();
}

// ========================================
// Reading Progress
// ========================================
function initReadingProgress() {
    updateReadingProgress();
}

function updateReadingProgress() {
    const progressCardsContainer = document.getElementById('progressCards');
    const emptyProgress = document.getElementById('emptyProgress');
    const progressEntries = Object.entries(readingProgress);
    
    if (progressEntries.length === 0) {
        emptyProgress.style.display = 'block';
        return;
    }
    
    emptyProgress.style.display = 'none';
    
    progressCardsContainer.innerHTML = progressEntries.map(([bookId, progress]) => {
        const book = booksData.find(b => b.id === parseInt(bookId));
        if (!book) return '';
        
        return `
            <div class="progress-card" data-aos="fade-up">
                <div class="progress-card-cover">
                    <img src="${book.cover}" alt="${book.title}">
                </div>
                <div class="progress-card-info">
                    <h5>${book.title}</h5>
                    <p>${book.author}</p>
                    <div class="progress-bar-wrapper">
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                                 aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                    <div class="progress-meta">
                        <span>${progress}% Complete</span>
                        <span>Page ${Math.floor(book.pages * progress / 100)} of ${book.pages}</span>
                    </div>
                    <button class="btn btn-primary btn-sm mt-2 w-100" onclick="openReader(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                        <i class="bi bi-book"></i> Continue Reading
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Sidebars (Favorites & Reading List)
// ========================================
function initSidebars() {
    const favoritesToggle = document.getElementById('favoritesToggle');
    const closeFavorites = document.getElementById('closeFavorites');
    const favoritesSidebar = document.getElementById('favoritesSidebar');
    
    const readingListToggle = document.getElementById('readingListToggle');
    const closeReadingList = document.getElementById('closeReadingList');
    const readingListSidebar = document.getElementById('readingListSidebar');
    
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Favorites
    favoritesToggle.addEventListener('click', () => {
        favoritesSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        renderFavorites();
    });
    
    closeFavorites.addEventListener('click', closeSidebars);
    
    // Reading List
    readingListToggle.addEventListener('click', () => {
        readingListSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        renderReadingList();
    });
    
    closeReadingList.addEventListener('click', closeSidebars);
    
    // Overlay
    sidebarOverlay.addEventListener('click', closeSidebars);
}

function closeSidebars() {
    document.getElementById('favoritesSidebar').classList.remove('active');
    document.getElementById('readingListSidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function renderFavorites() {
    const favoritesBody = document.getElementById('favoritesBody');
    
    if (favoritesIds.length === 0) {
        favoritesBody.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-heart"></i>
                <p>No favorites yet</p>
            </div>
        `;
        return;
    }
    
    const favoriteBooks = booksData.filter(book => favoritesIds.includes(book.id));
    
    favoritesBody.innerHTML = favoriteBooks.map(book => `
        <div class="sidebar-book-item">
            <img src="${book.cover}" alt="${book.title}">
            <div class="sidebar-book-info">
                <h6>${book.title}</h6>
                <p>${book.author}</p>
                <button class="btn btn-primary" onclick="openBookModalById(${book.id})">
                    <i class="bi bi-eye"></i> View
                </button>
            </div>
        </div>
    `).join('');
}

function renderReadingList() {
    const readingListBody = document.getElementById('readingListBody');
    
    if (readingListIds.length === 0) {
        readingListBody.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-bookmark"></i>
                <p>Your reading list is empty</p>
            </div>
        `;
        return;
    }
    
    const readingBooks = booksData.filter(book => readingListIds.includes(book.id));
    
    readingListBody.innerHTML = readingBooks.map(book => `
        <div class="sidebar-book-item">
            <img src="${book.cover}" alt="${book.title}">
            <div class="sidebar-book-info">
                <h6>${book.title}</h6>
                <p>${book.author}</p>
                <button class="btn btn-primary" onclick="openReader(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                    <i class="bi bi-book"></i> Read
                </button>
            </div>
        </div>
    `).join('');
}

function toggleFavorite(bookId, button) {
    const index = favoritesIds.indexOf(bookId);
    
    if (index > -1) {
        favoritesIds.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-heart"></i>';
        showToast('Removed from favorites', 'info');
    } else {
        favoritesIds.push(bookId);
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-heart-fill"></i>';
        showToast('Added to favorites ❤️', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favoritesIds));
    updateFavoritesCount();
}

function toggleReadingList(bookId, button) {
    const index = readingListIds.indexOf(bookId);
    
    if (index > -1) {
        readingListIds.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-bookmark"></i>';
        showToast('Removed from reading list', 'info');
    } else {
        readingListIds.push(bookId);
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-bookmark-fill"></i>';
        showToast('Added to reading list 📚', 'success');
    }
    
    localStorage.setItem('readingList', JSON.stringify(readingListIds));
    updateReadingListCount();
}

function updateFavoritesCount() {
    document.getElementById('favCount').textContent = favoritesIds.length;
}

function updateReadingListCount() {
    document.getElementById('readingCount').textContent = readingListIds.length;
}

// ========================================
// Book Modal
// ========================================
function initModals() {
    // Book modal elements are handled dynamically
}

function openBookModal(book) {
    const modal = new bootstrap.Modal(document.getElementById('bookModal'));
    
    // Populate modal
    document.getElementById('modalCover').src = book.cover;
    document.getElementById('modalCategory').textContent = book.category;
    document.getElementById('modalTitle').textContent = book.title;
    document.getElementById('modalAuthor').textContent = book.author;
    document.getElementById('modalRating').innerHTML = `${generateStars(book.rating)} ${book.rating}`;
    document.getElementById('modalPages').textContent = book.pages;
    document.getElementById('modalYear').textContent = book.year;
    document.getElementById('modalDescription').textContent = book.description;
    
    // Tags
    const tagsHTML = book.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    document.getElementById('modalTags').innerHTML = tagsHTML;
    
    // Badges
    let badgesHTML = '';
    if (book.featured) badgesHTML += '<span class="badge bg-warning">⭐ Featured</span>';
    if (book.newArrival) badgesHTML += '<span class="badge bg-success">🆕 New</span>';
    document.getElementById('modalBadges').innerHTML = badgesHTML;
    
    // Button states
    const isFavorite = favoritesIds.includes(book.id);
    const isInReadingList = readingListIds.includes(book.id);
    
    const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
    const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');
    
    modalFavoriteBtn.innerHTML = `<i class="bi bi-heart${isFavorite ? '-fill' : ''}"></i>`;
    modalFavoriteBtn.classList.toggle('active', isFavorite);
    
    modalBookmarkBtn.innerHTML = `<i class="bi bi-bookmark${isInReadingList ? '-fill' : ''}"></i>`;
    modalBookmarkBtn.classList.toggle('active', isInReadingList);
    
    // Button handlers
    document.getElementById('modalReadBtn').onclick = () => {
        modal.hide();
        openReader(book);
    };
    
    modalFavoriteBtn.onclick = () => toggleFavorite(book.id, modalFavoriteBtn);
    modalBookmarkBtn.onclick = () => toggleReadingList(book.id, modalBookmarkBtn);
    document.getElementById('modalShareBtn').onclick = () => shareBook(book);
    
    modal.show();
}

function openBookModalById(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (book) openBookModal(book);
}

// ========================================
// Book Reader
// ========================================
function openReader(book) {
    const modal = new bootstrap.Modal(document.getElementById('readerModal'));
    
    document.getElementById('readerTitle').textContent = book.title;
    document.getElementById('readerContent').innerHTML = sampleBookContent;
    
    // Initialize progress
    const savedProgress = readingProgress[book.id] || 0;
    document.getElementById('readerProgress').value = savedProgress;
    document.getElementById('progressPercent').textContent = `${savedProgress}%`;
    
    // Progress handler
    const progressInput = document.getElementById('readerProgress');
    progressInput.oninput = (e) => {
        const progress = parseInt(e.target.value);
        document.getElementById('progressPercent').textContent = `${progress}%`;
        readingProgress[book.id] = progress;
        localStorage.setItem('readingProgress', JSON.stringify(readingProgress));
        updateReadingProgress();
    };
    
    // Reader controls
    let fontSize = 18;
    document.getElementById('fontIncrease').onclick = () => {
        fontSize = Math.min(fontSize + 2, 32);
        document.getElementById('readerContent').style.fontSize = `${fontSize}px`;
    };
    
    document.getElementById('fontDecrease').onclick = () => {
        fontSize = Math.max(fontSize - 2, 14);
        document.getElementById('readerContent').style.fontSize = `${fontSize}px`;
    };
    
    document.getElementById('readerTheme').onclick = () => {
        const body = document.getElementById('readerBody');
        body.classList.toggle('reader-dark');
    };
    
    document.getElementById('fullscreen').onclick = () => {
        const elem = document.getElementById('readerModal').querySelector('.modal-dialog');
        if (!document.fullscreenElement) {
            elem.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    
    modal.show();
}

// ========================================
// Share Functionality
// ========================================
function shareBook(book) {
    if (navigator.share) {
        navigator.share({
            title: book.title,
            text: `Check out "${book.title}" by ${book.author}`,
            url: window.location.href
        }).then(() => {
            showToast('Book shared successfully! 📤', 'success');
        }).catch(() => {
            fallbackShare(book);
        });
    } else {
        fallbackShare(book);
    }
}

function fallbackShare(book) {
    const url = window.location.href;
    const text = `Check out "${book.title}" by ${book.author} - ${url}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Unable to share', 'error');
    });
}

// ========================================
// Scroll Effects
// ========================================
function initScrollEffects() {
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// Newsletter Form
// ========================================
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        // Simulate subscription
        setTimeout(() => {
            showToast('🎉 Successfully subscribed to newsletter!', 'success');
            form.reset();
        }, 500);
    });
}

// ========================================
// Counter Animation
// ========================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = `toast-${Date.now()}`;
    
    const bgColors = {
        success: 'bg-success',
        error: 'bg-danger',
        info: 'bg-primary',
        warning: 'bg-warning'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white ${bgColors[type] || bgColors.info} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}
function showSkeletons() {
    const container = document.getElementById('booksContainer');
    container.innerHTML = Array(8).fill().map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        </div>
    `).join('');
}

// Use before loading books
showSkeletons();
setTimeout(() => renderBooks(), 1500);

// Add to app.js
function initQuickView() {
    document.querySelectorAll('.book-card').forEach(card => {
        let timeout;
        
        card.addEventListener('mouseenter', (e) => {
            timeout = setTimeout(() => {
                showQuickPreview(card, e);
            }, 800);
        });
        
        card.addEventListener('mouseleave', () => {
            clearTimeout(timeout);
            hideQuickPreview();
        });
    });
}
function showQuickPreview(card, e) {
    const bookId = parseInt(card.getAttribute('data-book-id'));
    const book = booksData.find(b => b.id === bookId);
    
    const preview = document.createElement('div');
    preview.className = 'quick-preview';
    preview.innerHTML = `
        <img src="${book.cover}" alt="${book.title}">
        <div class="preview-info">
            <h4>${book.title}</h4>
            <p>${book.author}</p>
            <p class="description">${book.description}</p>
            <div class="preview-actions">
                <button onclick="openBookModalById(${book.id})">View Details</button>
                <button onclick="openReader(booksData.find(b=>b.id===${book.id}))">Read Now</button>
            </div>
        </div>
    `;
    
    preview.style.top = `${e.pageY}px`;
    preview.style.left = `${e.pageX + 20}px`;
    document.body.appendChild(preview);
}

function hideQuickPreview() {
    document.querySelector('.quick-preview')?.remove();
}
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isReading = false;

function initTextToSpeech() {
    const readerContent = document.getElementById('readerContent');
    
    // Add TTS button to reader
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'btn btn-icon tts-btn';
    ttsBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
    ttsBtn.onclick = toggleSpeech;
    
    document.querySelector('.reader-controls')?.appendChild(ttsBtn);
}

function toggleSpeech() {
    if (isReading) {
        stopSpeech();
    } else {
        startSpeech();
    }
}

function startSpeech() {
    const content = document.getElementById('readerContent').innerText;
    currentUtterance = new SpeechSynthesisUtterance(content);
    
    // Settings
    currentUtterance.rate = 1;
    currentUtterance.pitch = 1;
    currentUtterance.lang = 'en-US';
    
    // Events
    currentUtterance.onend = () => {
        isReading = false;
        updateTTSButton();
    };
    
    speechSynthesis.speak(currentUtterance);
    isReading = true;
    updateTTSButton();
    showToast('🔊 Reading started');
}

function stopSpeech() {
    speechSynthesis.cancel();
    isReading = false;
    updateTTSButton();
    showToast('🔇 Reading stopped');
}

function updateTTSButton() {
    const btn = document.querySelector('.tts-btn i');
    if (btn) {
        btn.className = isReading ? 'bi bi-stop-fill' : 'bi bi-volume-up';
    }
}

// Voice selection
function getVoices() {
    return speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
}
let highlights = JSON.parse(localStorage.getItem('highlights')) || {};

function initHighlighting() {
    const readerContent = document.getElementById('readerContent');
    
    readerContent?.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
            showHighlightMenu(selection, text);
        }
    });
}

function showHighlightMenu(selection, text) {
    // Remove existing menu
    document.querySelector('.highlight-menu')?.remove();
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const menu = document.createElement('div');
    menu.className = 'highlight-menu';
    menu.innerHTML = `
        <button onclick="highlightText('yellow')">🟡</button>
        <button onclick="highlightText('green')">🟢</button>
        <button onclick="highlightText('blue')">🔵</button>
        <button onclick="highlightText('pink')">🔴</button>
        <button onclick="addNote()">📝 Note</button>
        <button onclick="copyText()">📋 Copy</button>
    `;
    
    menu.style.top = `${rect.top + window.scrollY - 50}px`;
    menu.style.left = `${rect.left + (rect.width / 2)}px`;
    document.body.appendChild(menu);
}

function highlightText(color) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = `highlight highlight-${color}`;
        span.setAttribute('data-highlight-id', Date.now());
        range.surroundContents(span);
        
        // Save highlight
        saveHighlight(span.textContent, color);
        showToast('✨ Text highlighted!');
    }
    
    document.querySelector('.highlight-menu')?.remove();
}

function addNote() {
    const selection = window.getSelection();
    const text = selection.toString();
    
    const note = prompt('Add your note:');
    if (note) {
        const noteData = {
            id: Date.now(),
            text: text,
            note: note,
            timestamp: new Date().toISOString()
        };
        
        const notes = JSON.parse(localStorage.getItem('bookNotes')) || [];
        notes.push(noteData);
        localStorage.setItem('bookNotes', JSON.stringify(notes));
        
        showToast('📝 Note saved!');
    }
    
    document.querySelector('.highlight-menu')?.remove();
}
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};

function addBookmark(bookId, pageNumber, note = '') {
    if (!bookmarks[bookId]) {
        bookmarks[bookId] = [];
    }
    
    bookmarks[bookId].push({
        id: Date.now(),
        page: pageNumber,
        note: note,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    showToast('🔖 Bookmark added!');
    updateBookmarksList(bookId);
}

function getBookmarks(bookId) {
    return bookmarks[bookId] || [];
}

function showBookmarksSidebar(bookId) {
    const bookmarksList = getBookmarks(bookId);
    
    const html = bookmarksList.length === 0 
        ? '<p class="text-muted">No bookmarks yet</p>'
        : bookmarksList.map(bm => `
            <div class="bookmark-item" onclick="goToPage(${bm.page})">
                <span class="page-num">Page ${bm.page}</span>
                <span class="note">${bm.note || 'No note'}</span>
                <button onclick="deleteBookmark(${bookId}, ${bm.id})">🗑️</button>
            </div>
        `).join('');
    
    document.getElementById('bookmarksList').innerHTML = html;
}
let readingStats = JSON.parse(localStorage.getItem('readingStats')) || {
    totalTime: 0,
    sessionsCount: 0,
    booksRead: [],
    dailyStats: {}
};

let currentSession = {
    startTime: null,
    bookId: null
};

function startReadingSession(bookId) {
    currentSession = {
        startTime: Date.now(),
        bookId: bookId
    };
    
    // Update UI
    updateReadingTimer();
}

function endReadingSession() {
    if (!currentSession.startTime) return;
    
    const duration = Math.floor((Date.now() - currentSession.startTime) / 1000);
    
    // Update stats
    readingStats.totalTime += duration;
    readingStats.sessionsCount++;
    
    // Daily stats
    const today = new Date().toISOString().split('T')[0];
    readingStats.dailyStats[today] = (readingStats.dailyStats[today] || 0) + duration;
    
    localStorage.setItem('readingStats', JSON.stringify(readingStats));
    
    showToast(`📖 Read for ${formatTime(duration)}`);
    
    currentSession = { startTime: null, bookId: null };
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
}

function updateReadingTimer() {
    setInterval(() => {
        if (currentSession.startTime) {
            const elapsed = Math.floor((Date.now() - currentSession.startTime) / 1000);
            document.getElementById('readingTimer').textContent = formatTime(elapsed);
        }
    }, 1000);
}

function showReadingStats() {
    const modal = `
        <div class="reading-stats-modal">
            <h3>📊 Your Reading Statistics</h3>
            <div class="stats-grid">
                <div class="stat">
                    <span class="value">${formatTime(readingStats.totalTime)}</span>
                    <span class="label">Total Reading Time</span>
                </div>
                <div class="stat">
                    <span class="value">${readingStats.sessionsCount}</span>
                    <span class="label">Reading Sessions</span>
                </div>
                <div class="stat">
                    <span class="value">${readingStats.booksRead.length}</span>
                    <span class="label">Books Completed</span>
                </div>
            </div>
            <h4>Daily Activity (Last 7 Days)</h4>
            <div class="activity-chart" id="activityChart"></div>
        </div>
    `;
    
    // Show modal with stats
}
let readingGoals = JSON.parse(localStorage.getItem('readingGoals')) || {
    dailyMinutes: 30,
    weeklyBooks: 1,
    monthlyBooks: 4,
    yearlyBooks: 52
};

function setReadingGoal(type, value) {
    readingGoals[type] = value;
    localStorage.setItem('readingGoals', JSON.stringify(readingGoals));
    showToast('🎯 Goal updated!');
    updateGoalProgress();
}

function updateGoalProgress() {
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = Math.floor((readingStats.dailyStats[today] || 0) / 60);
    const progress = Math.min((todayMinutes / readingGoals.dailyMinutes) * 100, 100);
    
    document.getElementById('goalProgress').innerHTML = `
        <div class="goal-card">
            <h5>📅 Daily Goal</h5>
            <div class="progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <p>${todayMinutes}/${readingGoals.dailyMinutes} minutes</p>
            ${progress >= 100 ? '<span class="badge bg-success">🎉 Goal Met!</span>' : ''}
        </div>
    `;
}
function getRecommendations(userId) {
    // Get user's reading history
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const readingHistory = JSON.parse(localStorage.getItem('readingProgress')) || {};
    
    // Analyze preferences
    const readBooks = [...favorites, ...Object.keys(readingHistory).map(Number)];
    const preferredCategories = {};
    const preferredAuthors = {};
    
    readBooks.forEach(bookId => {
        const book = booksData.find(b => b.id === bookId);
        if (book) {
            preferredCategories[book.category] = (preferredCategories[book.category] || 0) + 1;
            preferredAuthors[book.author] = (preferredAuthors[book.author] || 0) + 1;
        }
    });
    
    // Sort by preference
    const topCategories = Object.entries(preferredCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);
    
    // Get recommendations
    const recommendations = booksData
        .filter(book => 
            !readBooks.includes(book.id) &&
            (topCategories.includes(book.category) || book.rating >= 4.5)
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);
    
    return recommendations;
}

function showRecommendations() {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    const recommendations = getRecommendations();
    
    container.innerHTML = `
        <h3>🤖 Recommended for You</h3>
        <div class="recommendations-grid">
            ${recommendations.map(book => createBookCard(book)).join('')}
        </div>
    `;
    
    attachBookListeners();
}
function initSmartSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    searchInput?.addEventListener('input', debounce((e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) return;
        
        const suggestions = getSuggestions(query);
        showSuggestions(suggestions);
    }, 300));
}

function getSuggestions(query) {
    const suggestions = {
        titles: [],
        authors: [],
        categories: [],
        recent: []
    };
    
    // Title matches
    suggestions.titles = booksData
        .filter(b => b.title.toLowerCase().includes(query))
        .slice(0, 5);
    
    // Author matches
    const authors = [...new Set(booksData.map(b => b.author))];
    suggestions.authors = authors
        .filter(a => a.toLowerCase().includes(query))
        .slice(0, 3);
    
    // Category matches
    suggestions.categories = categories
        .filter(c => c.name.toLowerCase().includes(query))
        .slice(0, 3);
    
    return suggestions;
}
function showSuggestions(suggestions) {
    const container = document.getElementById('searchSuggestions');
    
    container.innerHTML = `
        ${suggestions.titles.length > 0 ? `
            <div class="suggestion-group">
                <h6>📚 Books</h6>
                ${suggestions.titles.map(b => `
                    <div class="suggestion-item" onclick="selectSuggestion('${b.title}')">
                        <img src="${b.cover}" alt="">
                        <span>${highlightMatch(b.title)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        ${suggestions.authors.length > 0 ? `
            <div class="suggestion-group">
                <h6>✍️ Authors</h6>
                ${suggestions.authors.map(a => `
                    <div class="suggestion-item" onclick="searchByAuthor('${a}')">
                        <i class="bi bi-person"></i>
                        <span>${a}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        ${suggestions.categories.length > 0 ? `
            <div class="suggestion-group">
                <h6>📂 Categories</h6>
                ${suggestions.categories.map(c => `
                    <div class="suggestion-item" onclick="filterByCategory('${c.name}')">
                        <span>${c.icon}</span>
                        <span>${c.name}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
function getSimilarBooks(bookId, limit = 4) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return [];
    
    // Calculate similarity score
    const scores = booksData
        .filter(b => b.id !== bookId)
        .map(b => {
            let score = 0;
            
            // Same category = +3 points
            if (b.category === book.category) score += 3;
            
            // Same author = +5 points
            if (b.author === book.author) score += 5;
            
            // Shared tags = +1 point each
            const sharedTags = book.tags.filter(t => b.tags.includes(t));
            score += sharedTags.length;
            
            // Similar rating = +1 point
            if (Math.abs(b.rating - book.rating) <= 0.5) score += 1;
            
            // Similar year = +1 point
            if (Math.abs(b.year - book.year) <= 20) score += 1;
            
            return { book: b, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    
    return scores.map(s => s.book);
}

function showSimilarBooks(bookId) {
    const similar = getSimilarBooks(bookId);
    
    const html = `
        <div class="similar-books">
            <h4>📚 You might also like</h4>
            <div class="similar-grid">
                ${similar.map(book => `
                    <div class="similar-card" onclick="openBookModalById(${book.id})">
                        <img src="${book.cover}" alt="${book.title}">
                        <h5>${book.title}</h5>
                        <p>${book.author}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('modalSimilarBooks').innerHTML = html;
}
const achievements = [
    { id: 'first_book', name: 'First Steps', icon: '📖', desc: 'Start reading your first book', condition: (s) => s.booksStarted >= 1 },
    { id: 'bookworm', name: 'Bookworm', icon: '🐛', desc: 'Read 5 books', condition: (s) => s.booksCompleted >= 5 },
    { id: 'speed_reader', name: 'Speed Reader', icon: '⚡', desc: 'Complete a book in one day', condition: (s) => s.oneDay === true },
    { id: 'diverse', name: 'Diverse Reader', icon: '🌈', desc: 'Read from 5 different categories', condition: (s) => s.categoriesRead >= 5 },
    { id: 'early_bird', name: 'Early Bird', icon: '🌅', desc: 'Read before 6 AM', condition: (s) => s.earlyMorning === true },
    { id: 'night_owl', name: 'Night Owl', icon: '🦉', desc: 'Read after midnight', condition: (s) => s.lateNight === true },
    { id: 'streak_7', name: 'Week Warrior', icon: '🔥', desc: '7-day reading streak', condition: (s) => s.streak >= 7 },
    { id: 'streak_30', name: 'Month Master', icon: '👑', desc: '30-day reading streak', condition: (s) => s.streak >= 30 },
    { id: 'collector', name: 'Collector', icon: '❤️', desc: 'Add 20 books to favorites', condition: (s) => s.favorites >= 20 },
    { id: 'reviewer', name: 'Critic', icon: '⭐', desc: 'Write 10 book reviews', condition: (s) => s.reviews >= 10 }
];

let userStats = JSON.parse(localStorage.getItem('userStats')) || {
    booksStarted: 0,
    booksCompleted: 0,
    categoriesRead: 0,
    streak: 0,
    favorites: 0,
    reviews: 0,
    earnedAchievements: []
};

function checkAchievements() {
    achievements.forEach(achievement => {
        if (!userStats.earnedAchievements.includes(achievement.id)) {
            if (achievement.condition(userStats)) {
                unlockAchievement(achievement);
            }
        }
    });
}

function unlockAchievement(achievement) {
    userStats.earnedAchievements.push(achievement.id);
    localStorage.setItem('userStats', JSON.stringify(userStats));
    
    showAchievementNotification(achievement);
}

function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <h4>🎉 Achievement Unlocked!</h4>
            <h5>${achievement.name}</h5>
            <p>${achievement.desc}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showAchievementsPage() {
    const earned = achievements.filter(a => userStats.earnedAchievements.includes(a.id));
    const locked = achievements.filter(a => !userStats.earnedAchievements.includes(a.id));
    
    return `
        <div class="achievements-page">
            <h2>🏆 Achievements</h2>
            <p>Earned: ${earned.length}/${achievements.length}</p>
            
            <h3>✅ Unlocked</h3>
            <div class="achievements-grid">
                ${earned.map(a => `
                    <div class="achievement-card earned">
                        <span class="icon">${a.icon}</span>
                        <h5>${a.name}</h5>
                        <p>${a.desc}</p>
                    </div>
                `).join('')}
            </div>
            
            <h3>🔒 Locked</h3>
            <div class="achievements-grid">
                ${locked.map(a => `
                    <div class="achievement-card locked">
                        <span class="icon">❓</span>
                        <h5>???</h5>
                        <p>${a.desc}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
// ========================================
// Utility Functions
// ========================================
window.openBookModalById = openBookModalById;
window.openReader = openReader;

function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastRead = localStorage.getItem('lastReadDate');
    
    if (!lastRead) {
        userStats.streak = 1;
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastRead === yesterdayStr) {
            userStats.streak++;
        } else if (lastRead !== today) {
            userStats.streak = 1; // Reset streak
        }
    }
    
    localStorage.setItem('lastReadDate', today);
    localStorage.setItem('userStats', JSON.stringify(userStats));
    
    updateStreakDisplay();
    checkAchievements();
}

function updateStreakDisplay() {
    const streakEl = document.getElementById('streakCount');
    if (streakEl) {
        streakEl.innerHTML = `
            <span class="streak-fire">🔥</span>
            <span class="streak-number">${userStats.streak}</span>
            <span class="streak-label">day streak</span>
        `;
    }
}

const leaderboardData = [
    { rank: 1, name: 'BookLover123', books: 45, time: '120h', avatar: '👨‍🎓' },
    { rank: 2, name: 'ReadingQueen', books: 42, time: '115h', avatar: '👩‍💼' },
    { rank: 3, name: 'PageTurner', books: 38, time: '100h', avatar: '🧑‍🎤' },
    { rank: 4, name: 'You', books: readingStats.booksRead.length, time: formatTime(readingStats.totalTime), avatar: '😊', isUser: true },
    { rank: 5, name: 'StoryHunter', books: 25, time: '80h', avatar: '🕵️' }
];

function showLeaderboard() {
    return `
        <div class="leaderboard">
            <h2>🏆 Leaderboard</h2>
            <div class="leaderboard-tabs">
                <button class="active">This Week</button>
                <button>This Month</button>
                <button>All Time</button>
            </div>
            <div class="leaderboard-list">
                ${leaderboardData.map(user => `
                    <div class="leaderboard-item ${user.isUser ? 'is-user' : ''}">
                        <span class="rank">${user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank-1] : user.rank}</span>
                        <span class="avatar">${user.avatar}</span>
                        <span class="name">${user.name}</span>
                        <span class="stats">📚 ${user.books} • ⏱️ ${user.time}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

let reviews = JSON.parse(localStorage.getItem('bookReviews')) || {};

function addReview(bookId, rating, reviewText) {
    if (!reviews[bookId]) {
        reviews[bookId] = [];
    }
    
    const review = {
        id: Date.now(),
        rating: rating,
        text: reviewText,
        userName: 'You',
        avatar: '😊',
        date: new Date().toISOString(),
        likes: 0,
        helpful: 0
    };
    
    reviews[bookId].push(review);
    localStorage.setItem('bookReviews', JSON.stringify(reviews));
    
    userStats.reviews++;
    checkAchievements();
    
    showToast('✅ Review submitted!');
    renderReviews(bookId);
}

function renderReviews(bookId) {
    const bookReviews = reviews[bookId] || [];
    
    // Add some sample reviews
    const sampleReviews = [
        { id: 1, rating: 5, text: 'Amazing book! Couldn\'t put it down.', userName: 'BookLover', avatar: '👨‍🎓', date: '2024-01-15', likes: 24 },
        { id: 2, rating: 4, text: 'Great read, highly recommend.', userName: 'Reader123', avatar: '👩‍💻', date: '2024-01-10', likes: 18 }
    ];
    
    const allReviews = [...bookReviews, ...sampleReviews];
    
    return `
        <div class="reviews-section">
            <h4>📝 Reviews (${allReviews.length})</h4>
            
            <div class="add-review">
                <h5>Write a Review</h5>
                <div class="star-rating-input">
                    ${[1,2,3,4,5].map(i => `
                        <i class="bi bi-star" data-rating="${i}" onclick="setRating(${i})"></i>
                    `).join('')}
                </div>
                <textarea id="reviewText" placeholder="Share your thoughts..."></textarea>
                <button class="btn btn-primary" onclick="submitReview(${bookId})">
                    Submit Review
                </button>
            </div>
            
            <div class="reviews-list">
                ${allReviews.map(r => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="avatar">${r.avatar}</span>
                            <span class="name">${r.userName}</span>
                            <span class="rating">${generateStars(r.rating)}</span>
                            <span class="date">${formatDate(r.date)}</span>
                        </div>
                        <p class="review-text">${r.text}</p>
                        <div class="review-actions">
                            <button onclick="likeReview(${r.id})">
                                👍 ${r.likes}
                            </button>
                            <button>Reply</button>
                            <button>Report</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function shareBook(book, platform) {
    const shareText = `📚 I'm reading "${book.title}" by ${book.author}. Check it out!`;
    const shareUrl = window.location.href;
    
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        copy: null
    };
    
    if (platform === 'copy') {
        navigator.clipboard.writeText(shareText + '\n' + shareUrl);
        showToast('📋 Link copied!');
        return;
    }
    
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
}

function showShareModal(book) {
    return `
        <div class="share-modal">
            <h4>📤 Share "${book.title}"</h4>
            <div class="share-buttons">
                <button onclick="shareBook(book, 'twitter')" class="share-twitter">
                    <i class="bi bi-twitter"></i> Twitter
                </button>
                <button onclick="shareBook(book, 'facebook')" class="share-facebook">
                    <i class="bi bi-facebook"></i> Facebook
                </button>
                <button onclick="shareBook(book, 'whatsapp')" class="share-whatsapp">
                    <i class="bi bi-whatsapp"></i> WhatsApp
                </button>
                <button onclick="shareBook(book, 'telegram')" class="share-telegram">
                    <i class="bi bi-telegram"></i> Telegram
                </button>
                <button onclick="shareBook(book, 'linkedin')" class="share-linkedin">
                    <i class="bi bi-linkedin"></i> LinkedIn
                </button>
                <button onclick="shareBook(book, 'copy')" class="share-copy">
                    <i class="bi bi-clipboard"></i> Copy Link
                </button>
            </div>
        </div>
    `;
}

let collections = JSON.parse(localStorage.getItem('collections')) || [
    { id: 'want_to_read', name: 'Want to Read', icon: '📚', books: [] },
    { id: 'currently_reading', name: 'Currently Reading', icon: '📖', books: [] },
    { id: 'completed', name: 'Completed', icon: '✅', books: [] }
];

function createCollection(name, icon = '📁') {
    const newCollection = {
        id: Date.now(),
        name: name,
        icon: icon,
        books: [],
        createdAt: new Date().toISOString()
    };
    
    collections.push(newCollection);
    localStorage.setItem('collections', JSON.stringify(collections));
    showToast('📁 Collection created!');
}

function addToCollection(bookId, collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (collection && !collection.books.includes(bookId)) {
        collection.books.push(bookId);
        localStorage.setItem('collections', JSON.stringify(collections));
        showToast(`Added to ${collection.name}!`);
    }
}

function showCollectionPicker(bookId) {
    return `
        <div class="collection-picker">
            <h4>Add to Collection</h4>
            ${collections.map(c => `
                <div class="collection-option" onclick="addToCollection(${bookId}, '${c.id}')">
                    <span>${c.icon}</span>
                    <span>${c.name}</span>
                    <span class="count">${c.books.length}</span>
                </div>
            `).join('')}
            <button onclick="showCreateCollectionModal()">
                ➕ Create New Collection
            </button>
        </div>
    `;
}

async function downloadForOffline(bookId) {
    const book = booksData.find(b => b.id === bookId);
    if (!book) return;
    
    // Cache book data
    const offlineBooks = JSON.parse(localStorage.getItem('offlineBooks')) || {};
    offlineBooks[bookId] = {
        ...book,
        downloadedAt: new Date().toISOString(),
        content: sampleBookContent // In real app, fetch actual content
    };
    
    localStorage.setItem('offlineBooks', JSON.stringify(offlineBooks));
    
    // Cache cover image
    if ('caches' in window) {
        const cache = await caches.open('book-covers');
        await cache.add(book.cover);
    }
    
    showToast('📥 Downloaded for offline reading!');
    updateDownloadButton(bookId, true);
}

function getOfflineBooks() {
    return JSON.parse(localStorage.getItem('offlineBooks')) || {};
}

function isOfflineAvailable(bookId) {
    const offlineBooks = getOfflineBooks();
    return !!offlineBooks[bookId];
}