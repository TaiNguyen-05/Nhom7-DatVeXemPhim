from django import forms
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from django.contrib.auth.models import User
from .models import Booking, Review, Movie, Seat, UserProfile, Payment, BankAccount

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True, widget=forms.EmailInput(attrs={
        'class': 'form-control',
        'placeholder': 'Nhập email của bạn'
    }))
    first_name = forms.CharField(max_length=30, required=True, label='Họ', widget=forms.TextInput(attrs={
        'class': 'form-control',
        'placeholder': 'Nhập họ của bạn'
    }))
    last_name = forms.CharField(max_length=30, required=True, label='Tên', widget=forms.TextInput(attrs={
        'class': 'form-control',
        'placeholder': 'Nhập tên của bạn'
    }))
    phone = forms.CharField(max_length=15, required=False, label='Số điện thoại', widget=forms.TextInput(attrs={
        'class': 'form-control',
        'placeholder': 'Nhập số điện thoại (tùy chọn)'
    }))
    address = forms.CharField(widget=forms.Textarea(attrs={
        'rows': 3, 
        'class': 'form-control',
        'placeholder': 'Nhập địa chỉ của bạn (tùy chọn)'
    }), required=False, label='Địa chỉ')
    date_of_birth = forms.DateField(required=False, label='Ngày sinh', widget=forms.DateInput(attrs={
        'type': 'date',
        'class': 'form-control',
    }))
    
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nhập tên đăng nhập'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cập nhật CSS classes cho các trường password
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Nhập mật khẩu'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Xác nhận mật khẩu'
        })
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        
        if commit:
            user.save()