from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Genre, Movie, Cinema, Screen, ShowTime, Seat, Booking, Payment, Review, BankAccount

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Hồ sơ người dùng'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_user_type', 'is_staff', 'is_active')
    list_filter = ('profile__user_type', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    def get_user_type(self, obj):
        return obj.profile.get_user_type_display() if hasattr(obj, 'profile') else 'Khách hàng'
    get_user_type.short_description = 'Loại người dùng'

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'phone', 'created_at')
    list_filter = ('user_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'genre', 'duration', 'release_date', 'rating', 'price', 'is_active', 'is_hot', 'views_count')
    list_filter = ('genre', 'is_active', 'is_hot', 'release_date')
    search_fields = ('title', 'description')
    list_editable = ('is_active', 'is_hot', 'rating', 'price')
    readonly_fields = ('created_at', 'updated_at', 'views_count')
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('title', 'description', 'duration', 'release_date', 'genre')
        }),
        ('Đánh giá & Giá', {
            'fields': ('rating', 'price', 'views_count')
        }),
        ('Trạng thái', {
            'fields': ('is_active', 'is_hot')
        }),
        ('Media', {
            'fields': ('poster', 'video_file', 'trailer_url')
        }),
        ('Thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Cinema)
class CinemaAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'created_at')
    search_fields = ('name', 'address', 'phone')
    readonly_fields = ('created_at',)

@admin.register(Screen)
class ScreenAdmin(admin.ModelAdmin):
    list_display = ('name', 'cinema', 'capacity', 'created_at')
    list_filter = ('cinema',)
    search_fields = ('name', 'cinema__name')
    readonly_fields = ('created_at',)

@admin.register(ShowTime)
class ShowTimeAdmin(admin.ModelAdmin):
    list_display = ('movie', 'screen', 'date', 'time', 'price', 'created_at')
    list_filter = ('movie', 'screen__cinema', 'date')
    search_fields = ('movie__title', 'screen__name', 'screen__cinema__name')
    readonly_fields = ('created_at',)
    date_hierarchy = 'date'

@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('show_time', 'seat_number', 'status', 'created_at')
    list_filter = ('status', 'show_time__movie', 'show_time__screen__cinema')
    search_fields = ('seat_number', 'show_time__movie__title')
    readonly_fields = ('created_at',)

class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'show_time', 'total_amount', 'payment_status', 'booking_status', 'booking_date', 'is_expired_display')
    list_filter = ('payment_status', 'booking_status', 'booking_date', 'show_time__movie')
    search_fields = ('user__username', 'show_time__movie__title')
    readonly_fields = ('booking_date', 'updated_at', 'expiry_date')
    filter_horizontal = ('seats',)
    inlines = [PaymentInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'show_time__movie')
    
    def is_expired_display(self, obj):
        if obj.expiry_date is None:
            return 'Chưa có thời hạn'
        if obj.is_expired():
            return 'Hết hạn'
        return 'Còn hiệu lực'
    is_expired_display.short_description = 'Trạng thái hết hạn'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('booking', 'amount', 'payment_method', 'payment_status', 'payment_date', 'created_at')
    list_filter = ('payment_method', 'payment_status', 'created_at')
    search_fields = ('booking__user__username', 'transaction_id')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('booking', 'amount', 'payment_method', 'payment_status', 'transaction_id', 'payment_date')
        }),
        ('Thông tin chuyển khoản', {
            'fields': ('bank_account', 'sender_account', 'sender_name', 'transfer_content'),
            'classes': ('collapse',)
        }),
        ('Thông tin MoMo', {
            'fields': ('phone_number',),
            'classes': ('collapse',)
        }),
        ('Thông tin VNPay', {
            'fields': ('card_number', 'card_holder'),
            'classes': ('collapse',)
        }),
        ('Ghi chú', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Thời gian', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('bank_name', 'account_number', 'account_holder', 'branch', 'is_active', 'created_at')
    list_filter = ('bank_name', 'is_active', 'created_at')
    search_fields = ('account_number', 'account_holder', 'branch')
    readonly_fields = ('created_at',)
    list_editable = ('is_active',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'rating', 'created_at')
    list_filter = ('rating', 'created_at', 'movie')
    search_fields = ('user__username', 'movie__title', 'comment')
    readonly_fields = ('created_at', 'updated_at') 