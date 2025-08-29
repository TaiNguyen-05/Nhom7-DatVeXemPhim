/**
 * Movie Booking System - Main JavaScript
 * Tối ưu hóa hiệu suất và trải nghiệm người dùng
 */

class MovieBookingApp {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupServiceWorker();
    }

    init() {
        console.log('🎬 MovieBooking App đang khởi tạo...');
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.loadingStates = new Set();
    }

    /**
     * Thiết lập các event listeners
     */
    setupEventListeners() {
        // Lazy loading cho images
        this.setupLazyLoading();
        
        // Debounce cho search
        this.setupSearchDebounce();
        
        // Infinite scroll cho danh sách phim
        this.setupInfiniteScroll();
        
        // Preload cho navigation
        this.setupPreloadNavigation();
        
        // Offline detection
        this.setupOfflineDetection();
        
        // Logout functionality
        this.setupLogout();
    }

    /**
     * Lazy loading cho images
     */
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    /**
     * Debounce cho search input
     */
    setupSearchDebounce() {
        const searchInput = document.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.performSearch(e.target.value);
            }, 300));
        }
    }

    /**
     * Infinite scroll
     */
    setupInfiniteScroll() {
        const movieList = document.querySelector('.movie-list');
        if (movieList) {
            const scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadMoreMovies();
                    }
                });
            });

            // Tạo sentinel element
            const sentinel = document.createElement('div');
            sentinel.className = 'scroll-sentinel';
            movieList.appendChild(sentinel);
            scrollObserver.observe(sentinel);
        }
    }

    /**
     * Preload navigation
     */
    setupPreloadNavigation() {
        document.querySelectorAll('a[data-preload]').forEach(link => {
            link.addEventListener('mouseenter', () => {
                this.preloadPage(link.href);
            });
        });
    }

    /**
     * Offline detection
     */
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showNotification('Đã kết nối lại internet', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showNotification('Đã mất kết nối internet', 'warning');
        });
    }

    /**
     * Intersection Observer cho animations
     */
    setupIntersectionObserver() {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            animationObserver.observe(el);
        });
    }

    /**
     * Service Worker setup
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(registration => {
                    console.log('Service Worker đã đăng ký:', registration);
                })
                .catch(error => {
                    console.log('Service Worker đăng ký thất bại:', error);
                });
        }
    }

    /**
     * API calls với caching
     */
    async apiCall(endpoint, options = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        
        // Kiểm tra cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 phút
                return cached.data;
            }
        }

        try {
            const response = await fetch(endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Lưu vào cache
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    /**
     * Search với debounce
     */
    async performSearch(query) {
        if (query.length < 2) return;

        try {
            this.showLoading('search-results');
            const results = await this.apiCall(`/api/search/?q=${encodeURIComponent(query)}`);
            this.updateSearchResults(results);
        } catch (error) {
            this.showError('Tìm kiếm thất bại');
        } finally {
            this.hideLoading('search-results');
        }
    }

    /**
     * Load thêm phim
     */
    async loadMoreMovies() {
        if (this.loadingStates.has('movies')) return;

        try {
            this.loadingStates.add('movies');
            const page = Math.floor(document.querySelectorAll('.movie-card').length / 12) + 1;
            const movies = await this.apiCall(`/api/movies/?page=${page}`);
            this.appendMovies(movies);
        } catch (error) {
            this.showError('Không thể tải thêm phim');
        } finally {
            this.loadingStates.delete('movies');
        }
    }

    /**
     * Preload page
     */
    async preloadPage(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            // Lưu vào cache để sử dụng sau
            this.cache.set(url, { html, timestamp: Date.now() });
        } catch (error) {
            console.log('Preload failed:', error);
        }
    }

    /**
     * Sync offline data
     */
    async syncOfflineData() {
        const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
        
        for (const data of offlineData) {
            try {
                await this.apiCall(data.endpoint, data.options);
                console.log('Synced:', data);
            } catch (error) {
                console.error('Sync failed:', data, error);
            }
        }

        localStorage.removeItem('offlineData');
    }

    /**
     * Utility functions
     */
    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.debounceTimers.get(func));
            this.debounceTimers.set(func, setTimeout(() => func.apply(this, args), wait));
        };
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    updateSearchResults(results) {
        const container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = results.map(movie => `
                <div class="movie-card animate-on-scroll">
                    <img data-src="${movie.poster}" alt="${movie.title}" class="lazy">
                    <h3>${movie.title}</h3>
                    <p>${movie.description}</p>
                </div>
            `).join('');
        }
    }

    appendMovies(movies) {
        const container = document.querySelector('.movie-list');
        if (container) {
            movies.forEach(movie => {
                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card animate-on-scroll';
                movieCard.innerHTML = `
                    <img data-src="${movie.poster}" alt="${movie.title}" class="lazy">
                    <h3>${movie.title}</h3>
                    <p>${movie.description}</p>
                `;
                container.appendChild(movieCard);
            });
        }
    }

    /**
     * Setup logout functionality
     */
    setupLogout() {
        const logoutLinks = document.querySelectorAll('.js-logout-link');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            // Hiển thị loading
            this.showNotification('Đang đăng xuất...', 'info');
            
            // Gọi API logout
            const response = await fetch('/logout/', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    // Xóa cache và localStorage
                    this.clearUserData();
                    
                    // Hiển thị thông báo thành công
                    this.showNotification(data.message, 'success');
                    
                    // Chuyển hướng về trang chủ
                    setTimeout(() => {
                        window.location.href = data.redirect_url || '/';
                    }, 1000);
                } else {
                    throw new Error(data.message || 'Logout failed');
                }
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
        }
    }

    /**
     * Clear user data after logout
     */
    clearUserData() {
        // Xóa cache
        this.cache.clear();
        
        // Xóa localStorage
        localStorage.removeItem('offlineData');
        localStorage.removeItem('userPreferences');
        
        // Xóa loading states
        this.loadingStates.clear();
        
        // Xóa debounce timers
        this.debounceTimers.clear();
    }
}

// Khởi tạo app khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.movieApp = new MovieBookingApp();
});

// Export cho module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovieBookingApp;
}
