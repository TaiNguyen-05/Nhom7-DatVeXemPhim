from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import os

class UserProfile(models.Model):
    USER_TYPES = [
        ('customer', 'Khách hàng'),
        ('staff', 'Nhân viên'),
        ('admin', 'Quản trị viên'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='customer')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Hồ sơ người dùng"
        verbose_name_plural = "Hồ sơ người dùng"
    
    def __str__(self):
        return f"{self.user.username} - {self.get_user_type_display()}"

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Thể loại phim"
        verbose_name_plural = "Thể loại phim"
    
    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.IntegerField(help_text="Thời lượng phim (phút)")
    release_date = models.DateField()
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, related_name='movies')
    rating = models.DecimalField(max_digits=3, decimal_places=1, validators=[MinValueValidator(0), MaxValueValidator(5)])
    price = models.DecimalField(max_digits=10, decimal_places=0)
    poster = models.ImageField(upload_to='posters/', blank=True, null=True)
    trailer_url = models.URLField(blank=True, null=True, help_text="URL video YouTube (cũ)")
    video_file = models.FileField(upload_to='videos/', blank=True, null=True, help_text="File video trailer (MP4, WebM, OGV)")
    is_active = models.BooleanField(default=True)
    is_hot = models.BooleanField(default=False, help_text="Phim đang hot")
    views_count = models.IntegerField(default=0, help_text="Số lượt xem")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Phim"
        verbose_name_plural = "Phim"
        ordering = ['-release_date']
    
    def __str__(self):
        return self.title
    
    def get_trailer_embed_url(self):
        """Chuyển đổi URL YouTube thành URL embed"""
        if self.trailer_url:
            if 'youtube.com/watch?v=' in self.trailer_url:
                video_id = self.trailer_url.split('v=')[1]
                return f"https://www.youtube.com/embed/{video_id}"
            elif 'youtu.be/' in self.trailer_url:
                video_id = self.trailer_url.split('youtu.be/')[1]
                return f"https://www.youtube.com/embed/{video_id}"
        return None
    
    def has_video(self):
        """Kiểm tra xem phim có video trailer không"""
        return bool(self.video_file or self.trailer_url)
    
class Cinema(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Rạp chiếu phim"
        verbose_name_plural = "Rạp chiếu phim"
    
    def __str__(self):
        return self.name

class Screen(models.Model):
    name = models.CharField(max_length=100)
    cinema = models.ForeignKey(Cinema, on_delete=models.CASCADE, related_name='screens')
    capacity = models.IntegerField()
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Phòng chiếu"
        verbose_name_plural = "Phòng chiếu"
    
    def __str__(self):
        return f"{self.cinema.name} - {self.name}"
    
class ShowTime(models.Model):
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='show_times')
    screen = models.ForeignKey(Screen, on_delete=models.CASCADE, related_name='show_times')
    date = models.DateField()
    time = models.TimeField()
    price = models.DecimalField(max_digits=10, decimal_places=0)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Suất chiếu"
        verbose_name_plural = "Suất chiếu"
        ordering = ['date', 'time']
    
    def __str__(self):
        return f"{self.movie.title} - {self.date} {self.time}"

class Seat(models.Model):
    SEAT_STATUS = [
        ('available', 'Còn trống'),
        ('booked', 'Đã đặt'),
        ('reserved', 'Đã giữ'),
    ]
    
    show_time = models.ForeignKey(ShowTime, on_delete=models.CASCADE, related_name='seats')
    seat_number = models.CharField(max_length=10)
    status = models.CharField(max_length=10, choices=SEAT_STATUS, default='available')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Ghế"
        verbose_name_plural = "Ghế"
        unique_together = ['show_time', 'seat_number']
    
    def __str__(self):
        return f"{self.show_time} - Ghế {self.seat_number}"
    
class BankAccount(models.Model):
    BANK_CHOICES = [
        ('VCB', 'Vietcombank'),
        ('TCB', 'Techcombank'),
        ('BIDV', 'BIDV'),
        ('ACB', 'ACB'),
        ('MB', 'MB Bank'),
        ('VPB', 'VPBank'),
        ('AGB', 'Agribank'),
        ('SCB', 'Sacombank'),
        ('TPB', 'TPBank'),
        ('VIB', 'VIB'),
        ('OCB', 'OCB'),
        ('MSB', 'MSB'),
        ('HDB', 'HDBank'),
        ('SHB', 'SHB'),
        ('STB', 'Sacombank'),
    ]
    
    bank_name = models.CharField(max_length=50, choices=BANK_CHOICES)
    account_number = models.CharField(max_length=20, unique=True)
    account_holder = models.CharField(max_length=200)
    branch = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = "Tài khoản ngân hàng"
        verbose_name_plural = "Tài khoản ngân hàng"
        ordering = ['bank_name', 'account_number']
    
    def __str__(self):
        return f"{self.get_bank_name_display()} - {self.account_number}"

class Payment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Tiền mặt'),
        ('bank_transfer', 'Chuyển khoản ngân hàng'),
        ('credit_card', 'Thẻ tín dụng'),
        ('momo', 'Ví MoMo'),
        ('zalopay', 'Ví ZaloPay'),
        ('vnpay', 'VNPay'),
    ]
    
    PAYMENT_STATUS = [
        ('pending', 'Chờ thanh toán'),
        ('processing', 'Đang xử lý'),
        ('completed', 'Hoàn thành'),
        ('failed', 'Thất bại'),
        ('cancelled', 'Đã hủy'),
        ('refunded', 'Đã hoàn tiền'),
    ]
    
    booking = models.OneToOneField('Booking', on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True, null=True, help_text="Mã giao dịch từ cổng thanh toán")
    payment_date = models.DateTimeField(blank=True, null=True)
    
    # Banking information
    bank_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, blank=True, null=True, help_text="Tài khoản ngân hàng được chọn")
    sender_account = models.CharField(max_length=20, blank=True, null=True, help_text="Số tài khoản người gửi")
    sender_name = models.CharField(max_length=200, blank=True, null=True, help_text="Tên người gửi")
    transfer_content = models.CharField(max_length=200, blank=True, null=True, help_text="Nội dung chuyển khoản")
    
    # MoMo payment information
    phone_number = models.CharField(max_length=15, blank=True, null=True, help_text="Số điện thoại MoMo")
    
    # VNPay payment information
    card_number = models.CharField(max_length=20, blank=True, null=True, help_text="Số thẻ VNPay")
    card_holder = models.CharField(max_length=200, blank=True, null=True, help_text="Tên chủ thẻ VNPay")
    
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.id} - {self.booking.user.username} - {self.amount} VNĐ"
