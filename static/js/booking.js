/**
 * Booking System JavaScript
 * Tối ưu hóa cho trang đặt vé
 */

class BookingSystem {
    constructor() {
        this.selectedSeats = new Set();
        this.bookingData = {};
        this.seatMap = new Map();
        this.init();
    }

    init() {
        console.log('🎫 Booking System đang khởi tạo...');
        this.setupSeatSelection();
        this.setupFormValidation();
        this.setupRealTimeUpdates();
        this.setupOfflineSupport();
        this.setupPerformanceOptimizations();
    }

    /**
     * Thiết lập chọn ghế
     */
    setupSeatSelection() {
        const seatContainer = document.querySelector('.seats-container');
        if (!seatContainer) return;

        // Sử dụng event delegation để tối ưu performance
        seatContainer.addEventListener('click', (e) => {
            const seat = e.target.closest('.seat');
            if (!seat) return;

            this.toggleSeat(seat);
        });

        // Keyboard navigation
        seatContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const seat = e.target.closest('.seat');
                if (seat) {
                    this.toggleSeat(seat);
                }
            }
        });
    }

    /**
     * Toggle ghế được chọn
     */
    toggleSeat(seat) {
        if (seat.classList.contains('booked')) {
            this.showNotification('Ghế này đã được đặt', 'warning');
            return;
        }

        const seatId = seat.dataset.seatId;
        
        if (this.selectedSeats.has(seatId)) {
            this.selectedSeats.delete(seatId);
            seat.classList.remove('selected');
        } else {
            // Kiểm tra giới hạn ghế
            if (this.selectedSeats.size >= 10) {
                this.showNotification('Chỉ được chọn tối đa 10 ghế', 'warning');
                return;
            }
            
            this.selectedSeats.add(seatId);
            seat.classList.add('selected');
        }

        this.updateBookingSummary();
        this.saveToLocalStorage();
    }

    /**
     * Cập nhật tổng quan đặt vé
     */
    updateBookingSummary() {
        const summaryContainer = document.querySelector('.booking-summary');
        if (!summaryContainer) return;

        const totalSeats = this.selectedSeats.size;
        const pricePerSeat = parseFloat(document.querySelector('[data-price]')?.dataset.price || 0);
        const totalPrice = totalSeats * pricePerSeat;

        summaryContainer.innerHTML = `
            <div class="summary-item">
                <strong>Số ghế đã chọn:</strong> ${totalSeats}
            </div>
            <div class="summary-item">
                <strong>Giá mỗi ghế:</strong> ${pricePerSeat.toLocaleString('vi-VN')} VNĐ
            </div>
            <div class="summary-item">
                <strong>Tổng tiền:</strong> 
                <span class="price-highlight">${totalPrice.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div class="summary-item">
                <strong>Ghế:</strong> ${Array.from(this.selectedSeats).join(', ')}
            </div>
        `;

        // Cập nhật nút đặt vé
        const bookButton = document.querySelector('#book-button');
        if (bookButton) {
            bookButton.disabled = totalSeats === 0;
            bookButton.textContent = totalSeats === 0 ? 'Chọn ghế để đặt vé' : `Đặt vé (${totalSeats} ghế)`;
        }
    }

    /**
     * Thiết lập validation form
     */
    setupFormValidation() {
        const form = document.querySelector('#booking-form');
        if (!form) return;

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', this.debounce(() => this.validateField(input), 300));
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.submitBooking();
            }
        });
    }

    /**
     * Validate từng field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Xóa error cũ
        this.removeFieldError(field);

        // Validation rules
        switch (fieldName) {
            case 'customer_name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Tên phải có ít nhất 2 ký tự';
                }
                break;
            case 'customer_phone':
                if (!/^[0-9]{10,11}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Số điện thoại không hợp lệ';
                }
                break;
            case 'customer_email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Email không hợp lệ';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Validate toàn bộ form
     */
    validateForm() {
        const form = document.querySelector('#booking-form');
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (this.selectedSeats.size === 0) {
            this.showNotification('Vui lòng chọn ít nhất 1 ghế', 'error');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Hiển thị lỗi field
     */
    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
        field.classList.add('is-invalid');
    }

    /**
     * Xóa lỗi field
     */
    removeFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.classList.remove('is-invalid');
    }

    /**
     * Submit booking
     */
    async submitBooking() {
        if (this.selectedSeats.size === 0) {
            this.showNotification('Vui lòng chọn ghế', 'error');
            return;
        }

        const form = document.querySelector('#booking-form');
        const formData = new FormData(form);
        
        // Thêm thông tin ghế
        formData.append('seats', JSON.stringify(Array.from(this.selectedSeats)));
        formData.append('total_price', this.calculateTotalPrice());

        try {
            this.showLoading('book-button');
            
            const response = await fetch('/api/bookings/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.handleBookingSuccess(result);
            } else {
                const error = await response.json();
                this.handleBookingError(error);
            }
        } catch (error) {
            console.error('Booking failed:', error);
            this.handleOfflineBooking(formData);
        } finally {
            this.hideLoading('book-button');
        }
    }

    /**
     * Xử lý đặt vé thành công
     */
    handleBookingSuccess(result) {
        this.showNotification('Đặt vé thành công!', 'success');
        
        // Redirect đến trang xác nhận
        setTimeout(() => {
            window.location.href = `/booking/confirmation/${result.booking_id}/`;
        }, 1500);
    }

    /**
     * Xử lý lỗi đặt vé
     */
    handleBookingError(error) {
        let message = 'Đặt vé thất bại';
        
        if (error.detail) {
            message = error.detail;
        } else if (error.message) {
            message = error.message;
        }

        this.showNotification(message, 'error');
    }

    /**
     * Xử lý đặt vé offline
     */
    handleOfflineBooking(formData) {
        const offlineData = {
            timestamp: Date.now(),
            data: Object.fromEntries(formData),
            seats: Array.from(this.selectedSeats)
        };

        // Lưu vào localStorage
        const offlineBookings = JSON.parse(
            localStorage.getItem('offlineBookings') || '[]'
        );
        offlineBookings.push(offlineData);
        localStorage.setItem('offlineBookings', JSON.stringify(offlineBookings));

        this.showNotification(
            'Đã lưu đặt vé offline. Sẽ đồng bộ khi có internet.', 
            'info'
        );
    }

    /**
     * Thiết lập real-time updates
     */
    setupRealTimeUpdates() {
        // WebSocket hoặc Server-Sent Events cho real-time updates
        if ('WebSocket' in window) {
            this.setupWebSocket();
        } else {
            this.setupPolling();
        }
    }

    /**
     * Thiết lập WebSocket
     */
    setupWebSocket() {
        try {
            const ws = new WebSocket(`ws://${window.location.host}/ws/booking/`);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.setupPolling(); // Fallback to polling
            };
        } catch (error) {
            console.log('WebSocket không khả dụng, sử dụng polling');
            this.setupPolling();
        }
    }

    /**
     * Thiết lập polling
     */
    setupPolling() {
        setInterval(() => {
            this.checkSeatAvailability();
        }, 10000); // Check mỗi 10 giây
    }

    /**
     * Kiểm tra tình trạng ghế
     */
    async checkSeatAvailability() {
        try {
            const response = await fetch('/api/seats/availability/');
            const data = await response.json();
            
            this.updateSeatAvailability(data);
        } catch (error) {
            console.log('Không thể kiểm tra tình trạng ghế');
        }
    }

    /**
     * Cập nhật tình trạng ghế
     */
    updateSeatAvailability(data) {
        data.seats.forEach(seat => {
            const seatElement = document.querySelector(`[data-seat-id="${seat.id}"]`);
            if (seatElement) {
                seatElement.className = `seat ${seat.status}`;
                seatElement.dataset.status = seat.status;
            }
        });
    }

    /**
     * Thiết lập offline support
     */
    setupOfflineSupport() {
        // Lưu trạng thái vào localStorage
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });

        // Khôi phục trạng thái khi load lại trang
        this.restoreFromLocalStorage();
    }

    /**
     * Lưu vào localStorage
     */
    saveToLocalStorage() {
        const data = {
            selectedSeats: Array.from(this.selectedSeats),
            timestamp: Date.now()
        };
        localStorage.setItem('bookingState', JSON.stringify(data));
    }

    /**
     * Khôi phục từ localStorage
     */
    restoreFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('bookingState') || '{}');
        
        if (data.selectedSeats && data.timestamp) {
            // Chỉ khôi phục nếu dữ liệu không quá cũ (1 giờ)
            if (Date.now() - data.timestamp < 60 * 60 * 1000) {
                data.selectedSeats.forEach(seatId => {
                    const seat = document.querySelector(`[data-seat-id="${seatId}"]`);
                    if (seat && !seat.classList.contains('booked')) {
                        this.selectedSeats.add(seatId);
                        seat.classList.add('selected');
                    }
                });
                this.updateBookingSummary();
            }
        }
    }

    /**
     * Thiết lập tối ưu hóa performance
     */
    setupPerformanceOptimizations() {
        // Virtual scrolling cho danh sách ghế dài
        this.setupVirtualScrolling();
        
        // Debounce cho các input
        this.setupInputDebouncing();
        
        // Lazy loading cho hình ảnh
        this.setupImageLazyLoading();
    }

    /**
     * Virtual scrolling
     */
    setupVirtualScrolling() {
        const seatContainer = document.querySelector('.seats-container');
        if (!seatContainer || seatContainer.children.length < 100) return;

        // Implement virtual scrolling cho danh sách ghế dài
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.display = 'block';
                } else {
                    entry.target.style.display = 'none';
                }
            });
        });

        seatContainer.querySelectorAll('.seat').forEach(seat => {
            observer.observe(seat);
        });
    }

    /**
     * Input debouncing
     */
    setupInputDebouncing() {
        const inputs = document.querySelectorAll('input[data-debounce]');
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce((e) => {
                this.handleInputChange(e.target);
            }, 300));
        });
    }

    /**
     * Image lazy loading
     */
    setupImageLazyLoading() {
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
     * Utility functions
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

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
            element.textContent = 'Đặt vé';
        }
    }

    showNotification(message, type = 'info') {
        // Sử dụng notification system từ main.js
        if (window.movieApp && window.movieApp.showNotification) {
            window.movieApp.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    calculateTotalPrice() {
        const pricePerSeat = parseFloat(
            document.querySelector('[data-price]')?.dataset.price || 0
        );
        return this.selectedSeats.size * pricePerSeat;
    }
}

// Khởi tạo Booking System khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.seats-container')) {
        window.bookingSystem = new BookingSystem();
    }
});

// Export cho module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingSystem;
}
