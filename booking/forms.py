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
            # Tạo UserProfile
            UserProfile.objects.create(
                user=user,
                phone=self.cleaned_data.get('phone', ''),
                address=self.cleaned_data.get('address', ''),
                date_of_birth=self.cleaned_data.get('date_of_birth')
            )
        return user
    
class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=True, label='Họ')
    last_name = forms.CharField(max_length=30, required=True, label='Tên')
    email = forms.EmailField(required=True, label='Email')
    
    class Meta:
        model = UserProfile
        fields = ('phone', 'address', 'date_of_birth', 'avatar')
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.user:
            self.fields['first_name'].initial = self.instance.user.first_name
            self.fields['last_name'].initial = self.instance.user.last_name
            self.fields['email'].initial = self.instance.user.email
    
    def save(self, commit=True):
        profile = super().save(commit=False)
        if commit:
            # Cập nhật thông tin User
            user = profile.user
            user.first_name = self.cleaned_data['first_name']
            user.last_name = self.cleaned_data['last_name']
            user.email = self.cleaned_data['email']
            user.save()
            profile.save()
        return profile
    
        
class CustomPasswordChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})

class BankTransferForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = ['bank_account', 'sender_account', 'sender_name', 'transfer_content']
        widgets = {
            'bank_account': forms.Select(attrs={
                'class': 'form-control',
                'id': 'bank_account'
            }),
            'sender_account': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nhập số tài khoản của bạn',
                'maxlength': '20'
            }),
            'sender_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nhập tên chủ tài khoản',
                'maxlength': '200'
            }),
            'transfer_content': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nội dung chuyển khoản (tùy chọn)',
                'maxlength': '200'
            }),
        }
        labels = {
            'bank_account': 'Chọn ngân hàng',
            'sender_account': 'Số tài khoản người gửi',
            'sender_name': 'Tên người gửi',
            'transfer_content': 'Nội dung chuyển khoản'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Chỉ hiển thị các tài khoản ngân hàng đang hoạt động
        self.fields['bank_account'].queryset = BankAccount.objects.filter(is_active=True)
        
        # Tạo nội dung chuyển khoản mặc định
        if not self.instance.pk:
            self.fields['transfer_content'].initial = 'Thanh toan ve phim'

class PaymentMethodForm(forms.Form):
    PAYMENT_CHOICES = [
        ('cash', 'Tiền mặt'),
        ('bank_transfer', 'Chuyển khoản ngân hàng'),
        ('credit_card', 'Thẻ tín dụng'),
        ('momo', 'Ví MoMo'),
        ('zalopay', 'Ví ZaloPay'),
        ('vnpay', 'VNPay'),
    ]
    
    payment_method = forms.ChoiceField(
        choices=PAYMENT_CHOICES,
        widget=forms.RadioSelect(attrs={'class': 'payment-method-radio'}),
        label='Phương thức thanh toán'
    )
class BookingForm(forms.Form):
    seats = forms.ModelMultipleChoiceField(
        queryset=Seat.objects.none(),
        widget=forms.CheckboxSelectMultiple(),
        required=True,
        help_text="Chọn ghế bạn muốn đặt"
    )
    
    def __init__(self, *args, **kwargs):
        show_time = kwargs.pop('show_time', None)
        super().__init__(*args, **kwargs)
        if show_time:
            self.fields['seats'].queryset = Seat.objects.filter(show_time=show_time, status='available')
class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment']
        widgets = {
            'rating': forms.HiddenInput(),  # Sử dụng hidden input để lưu rating
            'comment': forms.Textarea(attrs={
                'rows': 4, 
                'placeholder': 'Viết bình luận của bạn về bộ phim này...',
                'class': 'form-control',
                'maxlength': '1000'
            }),
        }
        labels = {
            'rating': 'Đánh giá',
            'comment': 'Bình luận'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['comment'].widget.attrs.update({
            'class': 'form-control',
            'style': 'resize: vertical;'
        })
    
    def clean_comment(self):
        comment = self.cleaned_data.get('comment')
        if comment and len(comment.strip()) < 10:
            raise forms.ValidationError('Bình luận phải có ít nhất 10 ký tự.')
        return comment.strip()
    
    def clean_rating(self):
        rating = self.cleaned_data.get('rating')
        if not rating or rating < 1 or rating > 5:
            raise forms.ValidationError('Vui lòng chọn đánh giá từ 1-5 sao.')
        return rating
class ReviewEditForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['rating', 'comment']
        widgets = {
            'rating': forms.HiddenInput(),  # Sử dụng hidden input để lưu rating
            'comment': forms.Textarea(attrs={
                'rows': 4,
                'class': 'form-control',
                'maxlength': '1000'
            }),
        }
        labels = {
            'rating': 'Đánh giá',
            'comment': 'Bình luận'
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['comment'].widget.attrs.update({
            'class': 'form-control',
            'style': 'resize: vertical;'
        })
    
    def clean_comment(self):
        comment = self.cleaned_data.get('comment')
        if comment and len(comment.strip()) < 10:
            raise forms.ValidationError('Bình luận phải có ít nhất 10 ký tự.')
        return comment.strip()
    
    def clean_rating(self):
        rating = self.cleaned_data.get('rating')
        if not rating or rating < 1 or rating > 5:
            raise forms.ValidationError('Vui lòng chọn đánh giá từ 1-5 sao.')
        return rating
class MovieSearchForm(forms.Form):
    search = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'placeholder': 'Tìm kiếm phim...',
            'class': 'form-control'
        })
    )
    genre = forms.ModelChoiceField(
        queryset=Movie.objects.none(),
        required=False,
        empty_label="Tất cả thể loại",
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    sort_by = forms.ChoiceField(
        choices=[
            ('latest', 'Mới nhất'),
            ('rating', 'Đánh giá cao'),
            ('views', 'Xem nhiều'),
            ('price_low', 'Giá thấp'),
            ('price_high', 'Giá cao'),
        ],
        required=False,
        initial='latest',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from .models import Genre
        self.fields['genre'].queryset = Genre.objects.all()
