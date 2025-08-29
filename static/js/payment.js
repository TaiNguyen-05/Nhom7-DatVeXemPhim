/**
 * Payment System JavaScript
 * Tối ưu hóa cho hệ thống thanh toán
 */

class PaymentSystem {
    constructor() {
        this.selectedMethod = null;
        this.paymentData = {};
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    init() {
        console.log('💳 Payment System đang khởi tạo...');
        this.setupPaymentMethods();
        this.setupFormValidation();
        this.setupRealTimeValidation();
        this.setupOfflineSupport();
        this.setupSecurityFeatures();
    }

    /**
     * Thiết lập phương thức thanh toán
     */
    setupPaymentMethods() {
        const methodCards = document.querySelectorAll('.payment-method-card');
        
        methodCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectPaymentMethod(card);
            });

            // Keyboard navigation
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectPaymentMethod(card);
                }
            });
        });
    }

    /**
     * Chọn phương thức thanh toán
     */
    selectPaymentMethod(card) {
        // Bỏ chọn tất cả
        document.querySelectorAll('.payment-method-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Chọn method mới
        card.classList.add('selected');
        this.selectedMethod = card.dataset.method;

        // Hiển thị form tương ứng
        this.showPaymentForm(this.selectedMethod);

        // Lưu vào localStorage
        localStorage.setItem('selectedPaymentMethod', this.selectedMethod);
    }

    /**
     * Hiển thị form thanh toán
     */
    showPaymentForm(method) {
        // Ẩn tất cả forms
        document.querySelectorAll('.payment-form').forEach(form => {
            form.style.display = 'none';
        });

        // Hiển thị form được chọn
        const selectedForm = document.querySelector(`#${method}-form`);
        if (selectedForm) {
            selectedForm.style.display = 'block';
            this.initializeFormValidation(selectedForm);
        }
    }

    /**
     * Thiết lập validation form
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('.payment-form');
        forms.forEach(form => {
            this.initializeFormValidation(form);
        });
    }

    /**
     * Khởi tạo validation cho form
     */
    initializeFormValidation(form) {
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', () => this.validatePaymentField(input));
            input.addEventListener('input', this.debounce(() => this.validatePaymentField(input), 300));
            
            // Format input theo loại
            this.setupInputFormatting(input);
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validatePaymentForm(form)) {
                this.processPayment(form);
            }
        });
    }

    /**
     * Thiết lập format input
     */
    setupInputFormatting(input) {
        const type = input.dataset.format || input.type;
        
        switch (type) {
            case 'card-number':
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/(\d{4})/g, '$1 ').trim();
                    e.target.value = value.substring(0, 19);
                });
                break;
                
            case 'expiry':
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    e.target.value = value.substring(0, 5);
                });
                break;
                
            case 'cvv':
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
                });
                break;
                
            case 'phone':
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
                });
                break;
        }
    }

    /**
     * Validate field thanh toán
     */
    validatePaymentField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        const type = field.dataset.format || field.type;
        let isValid = true;
        let errorMessage = '';

        // Xóa error cũ
        this.removeFieldError(field);

        // Validation rules
        switch (type) {
            case 'card-number':
                if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Số thẻ phải có 16 chữ số';
                } else if (!this.luhnCheck(value.replace(/\s/g, ''))) {
                    isValid = false;
                    errorMessage = 'Số thẻ không hợp lệ';
                }
                break;
                
            case 'expiry':
                if (!/^\d{2}\/\d{2}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Định dạng MM/YY';
                } else {
                    const [month, year] = value.split('/');
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear() % 100;
                    const currentMonth = currentDate.getMonth() + 1;
                    
                    if (parseInt(month) < 1 || parseInt(month) > 12) {
                        isValid = false;
                        errorMessage = 'Tháng không hợp lệ';
                    } else if (parseInt(year) < currentYear || 
                              (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
                        isValid = false;
                        errorMessage = 'Thẻ đã hết hạn';
                    }
                }
                break;
                
            case 'cvv':
                if (!/^\d{3,4}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'CVV phải có 3-4 chữ số';
                }
                break;
                
            case 'phone':
                if (!/^[0-9]{10,11}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Số điện thoại không hợp lệ';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Luhn algorithm check cho số thẻ
     */
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i]);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    /**
     * Validate toàn bộ form
     */
    validatePaymentForm(form) {
        const inputs = form.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validatePaymentField(input)) {
                isValid = false;
            }
        });

        if (!this.selectedMethod) {
            this.showNotification('Vui lòng chọn phương thức thanh toán', 'error');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Xử lý thanh toán
     */
    async processPayment(form) {
        try {
            this.showLoading('pay-button');
            
            const formData = new FormData(form);
            formData.append('payment_method', this.selectedMethod);
            formData.append('amount', this.getPaymentAmount());
            
            // Thêm security token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            formData.append('csrfmiddlewaretoken', csrfToken);

            const response = await fetch('/api/payments/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.handlePaymentSuccess(result);
            } else {
                const error = await response.json();
                this.handlePaymentError(error);
            }
        } catch (error) {
            console.error('Payment failed:', error);
            this.handleOfflinePayment(form);
        } finally {
            this.hideLoading('pay-button');
        }
    }

    /**
     * Xử lý thanh toán thành công
     */
    handlePaymentSuccess(result) {
        this.showNotification('Thanh toán thành công!', 'success');
        
        // Redirect đến trang xác nhận
        setTimeout(() => {
            window.location.href = `/payment/confirmation/${result.payment_id}/`;
        }, 1500);
    }

    /**
     * Xử lý lỗi thanh toán
     */
    handlePaymentError(error) {
        let message = 'Thanh toán thất bại';
        
        if (error.detail) {
            message = error.detail;
        } else if (error.message) {
            message = error.message;
        }

        this.showNotification(message, 'error');
        
        // Retry logic
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.showNotification(`Thử lại lần ${this.retryCount}/${this.maxRetries}`, 'info');
        }
    }

    /**
     * Xử lý thanh toán offline
     */
    handleOfflinePayment(form) {
        const offlineData = {
            timestamp: Date.now(),
            method: this.selectedMethod,
            data: Object.fromEntries(new FormData(form)),
            retryCount: 0
        };

        // Lưu vào localStorage
        const offlinePayments = JSON.parse(
            localStorage.getItem('offlinePayments') || '[]'
        );
        offlinePayments.push(offlineData);
        localStorage.setItem('offlinePayments', JSON.stringify(offlinePayments));

        this.showNotification(
            'Đã lưu thanh toán offline. Sẽ xử lý khi có internet.', 
            'info'
        );
    }

    /**
     * Real-time validation
     */
    setupRealTimeValidation() {
        // Card type detection
        const cardInput = document.querySelector('input[data-format="card-number"]');
        if (cardInput) {
            cardInput.addEventListener('input', (e) => {
                const cardType = this.detectCardType(e.target.value);
                this.updateCardTypeDisplay(cardType);
            });
        }

        // Real-time amount calculation
        this.setupAmountCalculation();
    }

    /**
     * Detect loại thẻ
     */
    detectCardType(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        if (/^4/.test(cleanNumber)) return 'visa';
        if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
        if (/^3[47]/.test(cleanNumber)) return 'amex';
        if (/^6/.test(cleanNumber)) return 'discover';
        
        return 'unknown';
    }

    /**
     * Cập nhật hiển thị loại thẻ
     */
    updateCardTypeDisplay(cardType) {
        const cardTypeDisplay = document.querySelector('.card-type-display');
        if (cardTypeDisplay) {
            cardTypeDisplay.innerHTML = `
                <i class="fab fa-cc-${cardType}"></i>
                <span>${cardType.toUpperCase()}</span>
            `;
        }
    }

    /**
     * Thiết lập tính toán số tiền
     */
    setupAmountCalculation() {
        const amountInputs = document.querySelectorAll('input[data-affects-total]');
        amountInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateTotalAmount();
            });
        });
    }

    /**
     * Cập nhật tổng tiền
     */
    updateTotalAmount() {
        const baseAmount = parseFloat(document.querySelector('[data-base-amount]')?.dataset.baseAmount || 0);
        const additionalAmounts = Array.from(document.querySelectorAll('input[data-affects-total]'))
            .map(input => parseFloat(input.value) || 0);
        
        const total = baseAmount + additionalAmounts.reduce((sum, amount) => sum + amount, 0);
        
        const totalDisplay = document.querySelector('.total-amount');
        if (totalDisplay) {
            totalDisplay.textContent = total.toLocaleString('vi-VN') + ' VNĐ';
        }
    }

    /**
     * Thiết lập offline support
     */
    setupOfflineSupport() {
        // Lưu trạng thái thanh toán
        window.addEventListener('beforeunload', () => {
            this.savePaymentState();
        });

        // Khôi phục trạng thái
        this.restorePaymentState();
    }

    /**
     * Lưu trạng thái thanh toán
     */
    savePaymentState() {
        const state = {
            selectedMethod: this.selectedMethod,
            formData: this.getFormData(),
            timestamp: Date.now()
        };
        localStorage.setItem('paymentState', JSON.stringify(state));
    }

    /**
     * Khôi phục trạng thái thanh toán
     */
    restorePaymentState() {
        const state = JSON.parse(localStorage.getItem('paymentState') || '{}');
        
        if (state.selectedMethod && state.timestamp) {
            // Chỉ khôi phục nếu dữ liệu không quá cũ (30 phút)
            if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                this.selectedMethod = state.selectedMethod;
                this.restoreFormData(state.formData);
            }
        }
    }

    /**
     * Thiết lập tính năng bảo mật
     */
    setupSecurityFeatures() {
        // Mask sensitive data
        this.setupDataMasking();
        
        // Prevent form resubmission
        this.preventFormResubmission();
        
        // Secure input handling
        this.setupSecureInputs();
    }

    /**
     * Mask dữ liệu nhạy cảm
     */
    setupDataMasking() {
        const sensitiveInputs = document.querySelectorAll('input[data-sensitive]');
        sensitiveInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value.length > 4) {
                    input.dataset.originalValue = input.value;
                    input.value = '*'.repeat(input.value.length - 4) + input.value.slice(-4);
                }
            });
            
            input.addEventListener('focus', () => {
                if (input.dataset.originalValue) {
                    input.value = input.dataset.originalValue;
                }
            });
        });
    }

    /**
     * Ngăn form resubmission
     */
    preventFormResubmission() {
        const forms = document.querySelectorAll('.payment-form');
        forms.forEach(form => {
            form.addEventListener('submit', () => {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Đang xử lý...';
                }
            });
        });
    }

    /**
     * Thiết lập input bảo mật
     */
    setupSecureInputs() {
        // Prevent paste on sensitive fields
        const sensitiveInputs = document.querySelectorAll('input[data-no-paste]');
        sensitiveInputs.forEach(input => {
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                this.showNotification('Không được phép paste vào trường này', 'warning');
            });
        });

        // Auto-clear sensitive fields
        const autoClearInputs = document.querySelectorAll('input[data-auto-clear]');
        autoClearInputs.forEach(input => {
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    input.value = '';
                }, 5000); // Clear sau 5 giây
            });
        });
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
            element.textContent = 'Thanh toán';
        }
    }

    showNotification(message, type = 'info') {
        if (window.movieApp && window.movieApp.showNotification) {
            window.movieApp.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    getPaymentAmount() {
        return parseFloat(document.querySelector('[data-base-amount]')?.dataset.baseAmount || 0);
    }

    getFormData() {
        const forms = document.querySelectorAll('.payment-form');
        const data = {};
        
        forms.forEach(form => {
            const formData = new FormData(form);
            formData.forEach((value, key) => {
                data[key] = value;
            });
        });
        
        return data;
    }

    restoreFormData(data) {
        Object.keys(data).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    removeFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.classList.remove('is-invalid');
    }

    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
        field.classList.add('is-invalid');
    }
}

// Khởi tạo Payment System khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.payment-method-card')) {
        window.paymentSystem = new PaymentSystem();
    }
});

// Export cho module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentSystem;
}
