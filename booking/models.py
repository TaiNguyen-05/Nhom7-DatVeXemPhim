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