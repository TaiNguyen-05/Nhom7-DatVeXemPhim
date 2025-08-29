/**
 * Enhanced Booking Extras JavaScript
 * Cải thiện trải nghiệm chọn suất chiếu và đặt vé
 */

class EnhancedBookingSystem {
    constructor() {
        this.currentDate = null;
        this.selectedShowtime = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('🎬 Enhanced Booking System đang khởi tạo...');
        this.setupDateNavigation();
        this.setupShowtimeCards();
        this.setupAnimations();
        this.setupAccessibility();
        this.setupPerformanceOptimizations();
    }

    /**
     * Thiết lập điều hướng ngày
     */
    setupDateNavigation() {
        const dateTabs = document.querySelectorAll('.date-tab');
        if (!dateTabs.length) return;

        dateTabs.forEach((tab, index) => {
            // Thêm hiệu ứng ripple khi click
            tab.addEventListener('click', (e) => this.handleDateTabClick(e, tab));
            
            // Thêm keyboard navigation
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleDateTabClick(e, tab);
                }
            });

            // Thêm hiệu ứng hover 3D
            tab.addEventListener('mouseenter', () => this.add3DHoverEffect(tab));
            tab.addEventListener('mouseleave', () => this.remove3DHoverEffect(tab));
        });

        // Tự động chọn ngày đầu tiên
        if (dateTabs.length > 0) {
            this.selectDateTab(dateTabs[0]);
        }
    }

    /**
     * Xử lý click vào tab ngày
     */
    handleDateTabClick(e, tab) {
        const dateKey = tab.dataset.date;
        
        // Tạo hiệu ứng ripple
        this.createRippleEffect(e, tab);
        
        // Chuyển đổi tab
        this.selectDateTab(tab);
        
        // Hiển thị suất chiếu tương ứng
        this.showShowtimesForDate(dateKey);
        
        // Smooth scroll
        this.smoothScrollToShowtimes();
    }

    /**
     * Chọn tab ngày
     */
    selectDateTab(selectedTab) {
        // Cập nhật trạng thái active
        document.querySelectorAll('.date-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        });
        
        selectedTab.classList.add('active');
        selectedTab.setAttribute('aria-selected', 'true');
        
        // Lưu ngày hiện tại
        this.currentDate = selectedTab.dataset.date;
        
        // Thêm hiệu ứng selection
        this.addSelectionEffect(selectedTab);
    }

    /**
     * Hiển thị suất chiếu cho ngày được chọn
     */
    showShowtimesForDate(dateKey) {
        const allShowtimeContents = document.querySelectorAll('.showtime-content');
        const targetContent = document.getElementById(`showtime-${dateKey}`);
        
        if (!targetContent) return;

        // Ẩn tất cả nội dung
        allShowtimeContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        // Hiển thị nội dung được chọn với animation
        targetContent.style.display = 'block';
        setTimeout(() => {
            targetContent.classList.add('active');
            this.animateShowtimeCards(targetContent);
        }, 50);
    }

    /**
     * Animation cho các card suất chiếu
     */
    animateShowtimeCards(container) {
        const cards = container.querySelectorAll('.showtime-card');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Thiết lập các card suất chiếu
     */
    setupShowtimeCards() {
        const showtimeCards = document.querySelectorAll('.showtime-card');
        
        showtimeCards.forEach(card => {
            // Thêm hiệu ứng hover 3D
            card.addEventListener('mouseenter', () => this.addCard3DEffect(card));
            card.addEventListener('mouseleave', () => this.removeCard3DEffect(card));
            
            // Thêm hiệu ứng click
            card.addEventListener('click', () => this.handleShowtimeCardClick(card));
            
            // Thêm keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleShowtimeCardClick(card);
                }
            });
        });
    }

    /**
     * Xử lý click vào card suất chiếu
     */
    handleShowtimeCardClick(card) {
        // Thêm hiệu ứng click
        this.addClickEffect(card);
        
        // Lưu suất chiếu được chọn
        this.selectedShowtime = card;
        
        // Highlight card được chọn
        this.highlightSelectedCard(card);
        
        // Tự động scroll đến nút đặt vé
        this.scrollToBookButton(card);
    }

    /**
     * Highlight card được chọn
     */
    highlightSelectedCard(selectedCard) {
        // Bỏ highlight tất cả cards
        document.querySelectorAll('.showtime-card').forEach(card => {
            card.classList.remove('selected-highlight');
            card.style.borderColor = 'transparent';
        });
        
        // Highlight card được chọn
        selectedCard.classList.add('selected-highlight');
        selectedCard.style.borderColor = '#007bff';
        selectedCard.style.borderWidth = '3px';
    }

    /**
     * Thiết lập các animation
     */
    setupAnimations() {
        // Intersection Observer cho animation khi scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe các elements cần animation
        document.querySelectorAll('.showtime-card, .date-tab, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Thiết lập accessibility
     */
    setupAccessibility() {
        // Thêm ARIA labels
        document.querySelectorAll('.date-tab').forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        // Thêm ARIA cho showtime cards
        document.querySelectorAll('.showtime-card').forEach(card => {
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Suất chiếu ${card.querySelector('.showtime-time')?.textContent}`);
        });

        // Keyboard navigation cho date tabs
        this.setupKeyboardNavigation();
    }

    /**
     * Thiết lập keyboard navigation
     */
    setupKeyboardNavigation() {
        const dateTabs = document.querySelectorAll('.date-tab');
        
        dateTabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => {
                let targetIndex;
                
                switch(e.key) {
                    case 'ArrowLeft':
                        targetIndex = index > 0 ? index - 1 : dateTabs.length - 1;
                        break;
                    case 'ArrowRight':
                        targetIndex = index < dateTabs.length - 1 ? index + 1 : 0;
                        break;
                    case 'Home':
                        targetIndex = 0;
                        break;
                    case 'End':
                        targetIndex = dateTabs.length - 1;
                        break;
                    default:
                        return;
                }
                
                e.preventDefault();
                dateTabs[targetIndex].focus();
                this.handleDateTabClick(e, dateTabs[targetIndex]);
            });
        });
    }

    /**
     * Thiết lập tối ưu hóa performance
     */
    setupPerformanceOptimizations() {
        // Debounce scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScrollOptimization();
            }, 100);
        });

        // Lazy load images
        this.setupLazyLoading();
        
        // Responsive behavior
        this.setupResponsiveBehavior();
        this.setupTouchOptimizations();
        this.setupViewportOptimizations();
    }

    /**
     * Xử lý tối ưu hóa scroll
     */
    handleScrollOptimization() {
        // Pause animations khi scroll
        document.body.classList.add('scrolling');
        
        setTimeout(() => {
            document.body.classList.remove('scrolling');
        }, 150);
    }

    /**
     * Thiết lập lazy loading
     */
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Thiết lập responsive behavior
     */
    setupResponsiveBehavior() {
        // Theo dõi thay đổi kích thước màn hình
        window.addEventListener('resize', this.debounce(() => {
            this.adjustLayout();
        }, 250));

        // Khởi tạo layout
        this.adjustLayout();
    }

    /**
     * Thiết lập touch optimizations
     */
    setupTouchOptimizations() {
        // Tối ưu hóa cho thiết bị cảm ứng
        if ('ontouchstart' in window) {
            this.optimizeForTouch();
        }
    }

    /**
     * Thiết lập viewport optimizations
     */
    setupViewportOptimizations() {
        // Tối ưu hóa viewport
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }

    /**
     * Điều chỉnh layout theo kích thước màn hình
     */
    adjustLayout() {
        const width = window.innerWidth;
        const seatsGrid = document.querySelector('.seats-grid');
        const sidebar = document.querySelector('.booking-summary-sidebar');
        
        if (!seatsGrid || !sidebar) return;

        if (width <= 992) {
            // Mobile layout
            this.applyMobileLayout();
        } else if (width <= 1200) {
            // Tablet layout
            this.applyTabletLayout();
        } else {
            // Desktop layout
            this.applyDesktopLayout();
        }
    }

    /**
     * Áp dụng mobile layout
     */
    applyMobileLayout() {
        const seats = document.querySelectorAll('.seat');
        const container = document.querySelector('.container-fluid');
        
        if (container) {
            container.classList.add('mobile-layout');
            container.classList.remove('tablet-layout', 'desktop-layout');
        }

        // Tối ưu hóa kích thước ghế cho mobile
        seats.forEach(seat => {
            seat.style.width = '32px';
            seat.style.height = '32px';
            seat.style.fontSize = '9px';
        });

        // Ẩn sidebar trên mobile
        const sidebar = document.querySelector('.booking-summary-sidebar');
        if (sidebar) {
            sidebar.style.position = 'static';
            sidebar.style.marginTop = '20px';
        }
    }

    /**
     * Áp dụng tablet layout
     */
    applyTabletLayout() {
        const seats = document.querySelectorAll('.seat');
        const container = document.querySelector('.container-fluid');
        
        if (container) {
            container.classList.add('tablet-layout');
            container.classList.remove('mobile-layout', 'desktop-layout');
        }
        
        seats.forEach(seat => {
            seat.style.width = '38px';
            seat.style.height = '38px';
            seat.style.fontSize = '11px';
        });
    }

    /**
     * Áp dụng desktop layout
     */
    applyDesktopLayout() {
        const seats = document.querySelectorAll('.seat');
        const container = document.querySelector('.container-fluid');
        
        if (container) {
            container.classList.add('desktop-layout');
            container.classList.remove('mobile-layout', 'tablet-layout');
        }

        seats.forEach(seat => {
            seat.style.width = '45px';
            seat.style.height = '45px';
            seat.style.fontSize = '12px';
        });
    }

    /**
     * Tối ưu hóa cho touch devices
     */
    optimizeForTouch() {
        // Tăng kích thước vùng touch cho ghế
        const seats = document.querySelectorAll('.seat');
        seats.forEach(seat => {
            seat.style.minHeight = '44px'; // Apple's recommended touch target size
            seat.style.minWidth = '44px';
        });

        // Thêm padding cho các button
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.minHeight = '44px';
            button.style.padding = '12px 20px';
        });
    }

    /**
     * Xử lý scroll optimization cho sticky sidebar
     */
    handleScrollOptimization() {
        // Pause animations khi scroll
        document.body.classList.add('scrolling');
        
        setTimeout(() => {
            document.body.classList.remove('scrolling');
        }, 150);

        // Tối ưu hóa sticky sidebar
        this.optimizeStickySidebar();
    }

    /**
     * Tối ưu hóa sticky sidebar
     */
    optimizeStickySidebar() {
        const sidebar = document.querySelector('.booking-summary-sidebar');
        if (sidebar && window.innerWidth > 992) {
            const scrollTop = window.pageYOffset;
            const sidebarTop = sidebar.offsetTop;
            
            if (scrollTop > sidebarTop) {
                sidebar.style.position = 'fixed';
                sidebar.style.top = '20px';
            } else {
                sidebar.style.position = 'static';
            }
        }
    }

    /**
     * Utility function: Debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Tạo hiệu ứng ripple
     */
    createRippleEffect(e, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;

        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Thêm hiệu ứng hover 3D
     */
    add3DHoverEffect(element) {
        element.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(5deg) translateZ(20px)';
        element.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
    }

    /**
     * Bỏ hiệu ứng hover 3D
     */
    remove3DHoverEffect(element) {
        element.style.transform = '';
        element.style.boxShadow = '';
    }

    /**
     * Thêm hiệu ứng 3D cho card
     */
    addCard3DEffect(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        });
    }

    /**
     * Bỏ hiệu ứng 3D cho card
     */
    removeCard3DEffect(card) {
        card.style.transform = '';
        card.removeEventListener('mousemove', () => {});
    }

    /**
     * Thêm hiệu ứng click
     */
    addClickEffect(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }

    /**
     * Thêm hiệu ứng selection
     */
    addSelectionEffect(element) {
        element.style.animation = 'selection-pulse 0.6s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    }

    /**
     * Smooth scroll đến showtimes
     */
    smoothScrollToShowtimes() {
        const showtimeGrid = document.querySelector('.showtime-grid');
        if (showtimeGrid) {
            showtimeGrid.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Scroll đến nút đặt vé
     */
    scrollToBookButton(card) {
        const bookButton = card.querySelector('.book-button');
        if (bookButton) {
            bookButton.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Hiển thị loading state
     */
    showLoadingState(element) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        element.classList.add('loading-state');
        
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner-enhanced"></div>
                <span>Đang xử lý...</span>
            </div>
        `;
        
        // Tự động ẩn loading sau 3 giây
        setTimeout(() => {
            this.hideLoadingState(element, originalContent);
        }, 3000);
    }

    /**
     * Ẩn loading state
     */
    hideLoadingState(element, originalContent) {
        this.isLoading = false;
        element.classList.remove('loading-state');
        element.innerHTML = originalContent;
    }

    /**
     * Hiển thị notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Thêm styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 9999;
            min-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animation in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Auto hide
        setTimeout(() => {
            this.hideNotification(notification);
        }, duration);
    }

    /**
     * Ẩn notification
     */
    hideNotification(notification) {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    /**
     * Lấy icon cho notification
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Lấy màu cho notification
     */
    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #28a745, #20c997)',
            error: 'linear-gradient(135deg, #dc3545, #c82333)',
            warning: 'linear-gradient(135deg, #ffc107, #e0a800)',
            info: 'linear-gradient(135deg, #17a2b8, #138496)'
        };
        return colors[type] || colors.info;
    }

    /**
     * Kiểm tra suất chiếu
     */
    checkShowtimes() {
        const button = event.target;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang kiểm tra...';
        button.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            
            this.showNotification('Đã kiểm tra xong. Vẫn chưa có suất chiếu mới.', 'info');
        }, 2000);
    }

    /**
     * Thêm vào danh sách yêu thích
     */
    addToWishlist() {
        this.showNotification('Đã thêm vào danh sách yêu thích!', 'success');
    }

    /**
     * Chia sẻ phim
     */
    shareMovie() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                text: 'Xem phim này tại rạp của chúng tôi!',
                url: window.location.href
            }).catch(() => {
                this.fallbackShare();
            });
        } else {
            this.fallbackShare();
        }
    }

    /**
     * Fallback cho chia sẻ
     */
    fallbackShare() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            this.showNotification('Đã sao chép link vào clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Không thể chia sẻ. Vui lòng thử lại!', 'error');
        });
    }
}

// Khởi tạo hệ thống khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedBookingSystem = new EnhancedBookingSystem();
});

// Global functions cho template
window.checkShowtimes = function() {
    if (window.enhancedBookingSystem) {
        window.enhancedBookingSystem.checkShowtimes();
    }
};

window.addToWishlist = function() {
    if (window.enhancedBookingSystem) {
        window.enhancedBookingSystem.addToWishlist();
    }
};

window.shareMovie = function() {
    if (window.enhancedBookingSystem) {
        window.enhancedBookingSystem.shareMovie();
    }
};

// Thêm CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes selection-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    .scrolling * {
        animation-play-state: paused !important;
    }
    
    .selected-highlight {
        border-color: #007bff !important;
        box-shadow: 0 0 0 3px rgba(0,123,255,0.3) !important;
    }
    
    .loading-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    /* Responsive Layout Classes */
    .mobile-layout .seats-grid {
        gap: 3px;
    }
    
    .mobile-layout .seat {
        width: 32px !important;
        height: 32px !important;
        font-size: 9px !important;
    }
    
    .tablet-layout .seat {
        width: 38px !important;
        height: 38px !important;
        font-size: 11px !important;
    }
    
    .desktop-layout .seat {
        width: 45px !important;
        height: 45px !important;
        font-size: 12px !important;
    }
`;
document.head.appendChild(style);

// Export cho sử dụng global
window.EnhancedBookingSystem = EnhancedBookingSystem;
window.BookingResponsive = EnhancedBookingSystem; // Backward compatibility
