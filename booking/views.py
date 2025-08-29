
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator
from django.db.models import Q, Avg, Count
from django.utils import timezone
from .models import *
from .forms import *

# """Kiểm tra user có phải là staff hoặc admin không"""
def is_staff_or_admin(user):
    return user.is_authenticated and (user.is_staff or hasattr(user, 'profile') and user.profile.user_type in ['staff', 'admin'])


def home(request):
    #Trang chủ hiển thị danh sách phim
    movies = Movie.objects.filter(is_active=True)
    
    # Xử lý tìm kiếm và lọc
    search_form = MovieSearchForm(request.GET)
    if search_form.is_valid():
        search = search_form.cleaned_data.get('search')
        genre = search_form.cleaned_data.get('genre')
        sort_by = search_form.cleaned_data.get('sort_by', 'latest')
        
        if search:
            movies = movies.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        if genre:
            movies = movies.filter(genre=genre)
        
         # Sắp xếp
        if sort_by == 'latest':
            movies = movies.order_by('-release_date')
        elif sort_by == 'rating':
            movies = movies.order_by('-rating')
        elif sort_by == 'views':
            movies = movies.order_by('-views_count')
        elif sort_by == 'price_low':
            movies = movies.order_by('price')
        elif sort_by == 'price_high':
            movies = movies.order_by('-price')
    else:
        movies = movies.order_by('-release_date')

         # Phim hot
    hot_movies = Movie.objects.filter(is_active=True, is_hot=True).order_by('-views_count')[:6]
    
    # Phân trang
    paginator = Paginator(movies, 8)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search_form': search_form,
        'genres': Genre.objects.all(),
        'hot_movies': hot_movies,
    }
    return render(request, 'registration/home.html', context)

def movie_detail(request, movie_id):
    # """Chi tiết phim"""
    movie = get_object_or_404(Movie, id=movie_id)
    # Tăng lượt xem
    movie.views_count += 1
    movie.save()
    
    show_times = ShowTime.objects.filter(movie=movie).order_by('date', 'time')
    reviews = Review.objects.filter(movie=movie).order_by('-created_at')
    
    # Kiểm tra user đã đánh giá chưa
    user_review = None
    if request.user.is_authenticated:
        user_review = Review.objects.filter(user=request.user, movie=movie).first()
    
    if request.method == 'POST' and request.user.is_authenticated:
        if user_review:
            # Cập nhật đánh giá
            review_form = ReviewEditForm(request.POST, instance=user_review)
        else:
            # Tạo đánh giá mới
            review_form = ReviewForm(request.POST)
        
        if review_form.is_valid():
            review = review_form.save(commit=False)
            review.user = request.user
            review.movie = movie
            review.save()
            
            # Cập nhật rating trung bình của phim
            avg_rating = Review.objects.filter(movie=movie).aggregate(Avg('rating'))['rating__avg']
            movie.rating = round(avg_rating, 1) if avg_rating else 0
            movie.save()
            
            messages.success(request, 'Đánh giá của bạn đã được cập nhật!')
            return redirect('movie_detail', movie_id=movie.id)
    
    # Form cho đánh giá
    if user_review:
        review_form = ReviewEditForm(instance=user_review)
    else:
        review_form = ReviewForm()
    
    context = {
        'movie': movie,
        'show_times': show_times,
        'reviews': reviews,
        'user_review': user_review,
        'review_form': review_form,
    }
    
    return render(request, 'booking/movie_detail.html', context)

def booking_info(request, movie_id):
    # """Trang thông tin phim và đặt vé"""
    movie = get_object_or_404(Movie, id=movie_id)
    
    # Tăng lượt xem
    movie.views_count += 1
    movie.save()
    
    # Lấy tất cả suất chiếu của phim này
    show_times = ShowTime.objects.filter(movie=movie).order_by('date', 'time')
    
    # Nhóm suất chiếu theo ngày
    show_times_by_date = {}
    for show_time in show_times:
        date_key = show_time.date.strftime('%Y-%m-%d')
        if date_key not in show_times_by_date:
            show_times_by_date[date_key] = []
        show_times_by_date[date_key].append(show_time)
    
    context = {
        'movie': movie,
        'show_times_by_date': show_times_by_date,
    }
    
    return render(request, 'booking/booking_info.html', context)

@login_required
def booking_seats(request, show_time_id):
    # """Đặt ghế cho suất chiếu"""
    show_time = get_object_or_404(ShowTime, id=show_time_id)
    
    if request.method == 'POST':
        try:
            # Lấy danh sách seat IDs từ form
            seat_ids = request.POST.getlist('seats')
            
            if not seat_ids:
                messages.error(request, 'Vui lòng chọn ít nhất một ghế!')
                return redirect('booking_seats', show_time_id=show_time_id)
            
            # Lấy các seat objects
            selected_seats = Seat.objects.filter(id__in=seat_ids, show_time=show_time)
            
            # Kiểm tra số lượng ghế
            if len(selected_seats) != len(seat_ids):
                messages.error(request, 'Có ghế không tồn tại!')
                return redirect('booking_seats', show_time_id=show_time_id)
            
            # Kiểm tra ghế có còn trống không
            for seat in selected_seats:
                if seat.status != 'available':
                    messages.error(request, f'Ghế {seat.seat_number} đã được đặt!')
                    return redirect('booking_seats', show_time_id=show_time_id)
            
            # Tạo booking
            total_amount = show_time.price * len(selected_seats)
            booking = Booking.objects.create(
                user=request.user,
                show_time=show_time,
                total_amount=total_amount,
                payment_status='pending',
                booking_status='pending'
            )
            
            # Thêm ghế vào booking
            booking.seats.set(selected_seats)
            
            # Cập nhật trạng thái ghế
            for seat in selected_seats:
                seat.status = 'booked'
                seat.save()
            
            messages.success(request, 'Đặt vé thành công!')
            return redirect('booking_confirmation', booking_id=booking.id)
                
        except Exception as e:
            messages.error(request, f'Có lỗi xảy ra: {str(e)}')
            return redirect('booking_seats', show_time_id=show_time_id)
    
    # Lấy danh sách ghế
    seats = Seat.objects.filter(show_time=show_time).order_by('seat_number')
    
    context = {
        'show_time': show_time,
        'seats': seats,
    }
    return render(request, 'booking/booking_seats.html', context)

@login_required
def booking_confirmation(request, booking_id):
    # """Xác nhận đặt vé"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    # Lấy thông tin payment nếu có
    try:
        payment = Payment.objects.get(booking=booking)
    except Payment.DoesNotExist:
        payment = None
    
    context = {
        'booking': booking,
        'payment': payment,
    }
    return render(request, 'booking/booking_confirmation.html', context)

@login_required
def payment_method(request, booking_id):
    """Chọn phương thức thanh toán"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    if request.method == 'POST':
        form = PaymentMethodForm(request.POST)
        if form.is_valid():
            payment_method = form.cleaned_data['payment_method']
            
            # Tạo hoặc cập nhật payment
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={
                    'amount': booking.total_amount,
                    'payment_method': payment_method,
                    'payment_status': 'pending'
                }
            )
            
            if not created:
                payment.payment_method = payment_method
                payment.save()
            
            # Chuyển hướng đến trang thanh toán tương ứng
            if payment_method == 'bank_transfer':
                return redirect('bank_transfer', booking_id=booking_id)
            elif payment_method == 'momo':
                return redirect('momo_payment', booking_id=booking_id)
            elif payment_method == 'vnpay':
                return redirect('vnpay_payment', booking_id=booking_id)
            elif payment_method == 'cash':
                return redirect('payment_confirmation', booking_id=booking_id)
            else:
                # Các phương thức thanh toán khác (có thể mở rộng sau)
                messages.info(request, 'Phương thức thanh toán này sẽ được hỗ trợ sớm nhất!')
                return redirect('payment_method', booking_id=booking_id)
    else:
        form = PaymentMethodForm()
    
    context = {
        'booking': booking,
        'form': form,
    }
    return render(request, 'booking/payment_method.html', context)

@login_required
def momo_payment(request, booking_id):
    # """Thanh toán qua MoMo"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    try:
        payment = Payment.objects.get(booking=booking)
    except Payment.DoesNotExist:
        messages.error(request, 'Không tìm thấy thông tin thanh toán!')
        return redirect('payment_method', booking_id=booking_id)
    
    if request.method == 'POST':
        form = MomoPaymentForm(request.POST, instance=payment)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.payment_status = 'processing'
            payment.save()
            
            messages.success(request, 'Thông tin thanh toán MoMo đã được ghi nhận!')
            return redirect('payment_confirmation', booking_id=booking_id)
    else:
        form = MomoPaymentForm(instance=payment)
    
    context = {
        'booking': booking,
        'payment': payment,
        'form': form,
    }
    return render(request, 'booking/momo_payment.html', context)

@login_required
def vnpay_payment(request, booking_id):
    # """Thanh toán qua VNPay"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    try:
        payment = Payment.objects.get(booking=booking)
    except Payment.DoesNotExist:
        messages.error(request, 'Không tìm thấy thông tin thanh toán!')
        return redirect('payment_method', booking_id=booking_id)
    
    if request.method == 'POST':
        form = VNPayPaymentForm(request.POST, instance=payment)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.payment_status = 'processing'
            payment.save()
            
            messages.success(request, 'Thông tin thanh toán VNPay đã được ghi nhận!')
            return redirect('payment_confirmation', booking_id=booking_id)
    else:
        form = VNPayPaymentForm(instance=payment)
    
    context = {
        'booking': booking,
        'payment': payment,
        'form': form,
    }
    return render(request, 'booking/vnpay_payment.html', context)

@login_required
def bank_transfer(request, booking_id):
    # """Thanh toán chuyển khoản ngân hàng"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    try:
        payment = Payment.objects.get(booking=booking)
    except Payment.DoesNotExist:
        messages.error(request, 'Không tìm thấy thông tin thanh toán!')
        return redirect('payment_method', booking_id=booking_id)
    
    if request.method == 'POST':
        form = BankTransferForm(request.POST, instance=payment)
        if form.is_valid():
            payment = form.save(commit=False)
            payment.payment_status = 'processing'
            payment.save()
            
            messages.success(request, 'Thông tin chuyển khoản đã được ghi nhận!')
            return redirect('payment_confirmation', booking_id=booking_id)
    else:
        form = BankTransferForm(instance=payment)
    
    # Lấy thông tin tài khoản ngân hàng
    bank_accounts = BankAccount.objects.filter(is_active=True)
    
    context = {
        'booking': booking,
        'payment': payment,
        'form': form,
        'bank_accounts': bank_accounts,
    }
    return render(request, 'booking/bank_transfer.html', context)

@login_required
def payment_confirmation(request, booking_id):
    """Xác nhận thanh toán"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    
    try:
        payment = Payment.objects.get(booking=booking)
    except Payment.DoesNotExist:
        messages.error(request, 'Không tìm thấy thông tin thanh toán!')
        return redirect('payment_method', booking_id=booking_id)
    
    # Cập nhật trạng thái booking nếu cần
    if payment.payment_status == 'processing':
        # Đối với tiền mặt, tự động hoàn thành
        if payment.payment_method == 'cash':
            payment.payment_status = 'completed'
            payment.payment_date = timezone.now()
            payment.save()
            
            # Cập nhật trạng thái booking
            booking.payment_status = 'paid'
            booking.booking_status = 'confirmed'
            booking.save()
            
            messages.success(request, 'Thanh toán tiền mặt đã hoàn thành!')
        else:
            # Đối với các phương thức khác, giữ nguyên trạng thái processing
            messages.info(request, 'Thanh toán đang được xử lý. Vui lòng chờ xác nhận!')
    
    context = {
        'booking': booking,
        'payment': payment,
    }
    return render(request, 'booking/payment_confirmation.html', context)

@login_required
def print_ticket(request, booking_id):
    # """In vé xem phim"""
    booking = get_object_or_404(Booking, id=booking_id, user=request.user)
    return render(request, 'booking/print_ticket.html', {'booking': booking})

@login_required
def my_bookings(request):
    # """Danh sách đặt vé của người dùng"""
    bookings = Booking.objects.filter(user=request.user).order_by('-booking_date')
    return render(request, 'booking/my_bookings.html', {'bookings': bookings})

def register(request):
    # """Đăng ký tài khoản"""
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Đăng ký thành công! Vui lòng đăng nhập.')
            return redirect('login')
    else:
        form = UserRegistrationForm()
    
    return render(request, 'registration/register.html', {'form': form})

def custom_login(request):
    # """View login tùy chỉnh"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Chào mừng bạn quay trở lại, {user.username}!')
            return redirect('home')
        else:
            messages.error(request, 'Tên đăng nhập hoặc mật khẩu không đúng!')
    
    return render(request, 'registration/login.html')

@login_required
def profile(request):
    # """Quản lý thông tin tài khoản"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Cập nhật thông tin thành công!')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile)
    
    context = {
        'form': form,
        'profile': profile,
    }
    return render(request, 'registration/profile.html', context)

@login_required
def change_password(request):
    # """Đổi mật khẩu"""
    if request.method == 'POST':
        form = CustomPasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Đổi mật khẩu thành công!')
            return redirect('profile')
    else:
        form = CustomPasswordChangeForm(request.user)
    
    return render(request, 'registration/change_password.html', {'form': form})

@login_required
def add_review(request, movie_id):
    # """Thêm đánh giá mới"""
    movie = get_object_or_404(Movie, id=movie_id)
    
    # Kiểm tra user đã đánh giá chưa
    existing_review = Review.objects.filter(user=request.user, movie=movie).first()
    if existing_review:
        messages.warning(request, 'Bạn đã đánh giá phim này rồi!')
        return redirect('movie_detail', movie_id=movie_id)
    
    if request.method == 'POST':
        form = ReviewForm(request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.user = request.user
            review.movie = movie
            review.save()
            
            # Cập nhật rating trung bình của phim
            avg_rating = Review.objects.filter(movie=movie).aggregate(Avg('rating'))['rating__avg']
            movie.rating = round(avg_rating, 1) if avg_rating else 0
            movie.save()
            
            messages.success(request, 'Đánh giá đã được thêm thành công!')
            return redirect('movie_detail', movie_id=movie_id)
    else:
        form = ReviewForm()
    
    context = {
        'movie': movie,
        'form': form,
    }
    return render(request, 'booking/add_review.html', context)

@login_required
def edit_review(request, review_id):
    # """Chỉnh sửa đánh giá"""
    review = get_object_or_404(Review, id=review_id, user=request.user)
    
    if request.method == 'POST':
        form = ReviewEditForm(request.POST, instance=review)
        if form.is_valid():
            review = form.save()
            
            # Cập nhật rating trung bình của phim
            avg_rating = Review.objects.filter(movie=review.movie).aggregate(Avg('rating'))['rating__avg']
            review.movie.rating = round(avg_rating, 1) if avg_rating else 0
            review.movie.save()
            
            messages.success(request, 'Đánh giá đã được cập nhật thành công!')
            return redirect('movie_detail', movie_id=review.movie.id)
    else:
        form = ReviewEditForm(instance=review)
    
    context = {
        'review': review,
        'movie': review.movie,
        'form': form,
    }
    return render(request, 'booking/edit_review.html', context)

@login_required
@require_POST
def delete_review(request, review_id):
    """Xóa bình luận"""
    review = get_object_or_404(Review, id=review_id, user=request.user)
    movie_id = review.movie.id
    review.delete()
    
    # Cập nhật rating trung bình của phim
    movie = review.movie
    avg_rating = Review.objects.filter(movie=movie).aggregate(Avg('rating'))['rating__avg']
    movie.rating = round(avg_rating, 1) if avg_rating else 0
    movie.save()
    
    messages.success(request, 'Đã xóa bình luận!')
    return redirect('movie_detail', movie_id=movie_id)

@login_required
@user_passes_test(is_staff_or_admin)
def admin_dashboard(request):
    # """Dashboard cho admin/staff"""
    from django.utils import timezone
    from datetime import datetime, timedelta
    
    # Thống kê cơ bản
    total_movies = Movie.objects.count()
    total_bookings = Booking.objects.count()
    total_users = UserProfile.objects.count()
    
    # Đặt vé hôm nay
    today = timezone.now().date()
    today_bookings = Booking.objects.filter(booking_date__date=today).count()
    
    # Thống kê trạng thái thanh toán chi tiết
    paid_bookings = Booking.objects.filter(payment_status='paid').count()
    processing_bookings = Booking.objects.filter(payment_status='processing').count()
    pending_bookings = Booking.objects.filter(payment_status='pending').count()
    expired_bookings = Booking.objects.filter(payment_status='expired').count()
    cancelled_bookings = Booking.objects.filter(payment_status='cancelled').count()
    refunded_bookings = Booking.objects.filter(payment_status='refunded').count()
    
    # Tính phần trăm
    total_booking_count = total_bookings if total_bookings > 0 else 1
    paid_percentage = (paid_bookings / total_booking_count) * 100
    processing_percentage = (processing_bookings / total_booking_count) * 100
    pending_percentage = (pending_bookings / total_booking_count) * 100
    expired_percentage = (expired_bookings / total_booking_count) * 100
    cancelled_percentage = (cancelled_bookings / total_booking_count) * 100
    refunded_percentage = (refunded_bookings / total_booking_count) * 100
    
    # Đặt vé gần đây
    recent_bookings = Booking.objects.select_related(
        'user', 'show_time__movie', 'show_time__movie__genre'
    ).prefetch_related('seats').order_by('-booking_date')[:10]
    
    # Thống kê theo tháng (6 tháng gần nhất)
    six_months_ago = timezone.now() - timedelta(days=180)
    monthly_stats = Booking.objects.filter(
        booking_date__gte=six_months_ago
    ).values('booking_date__month').annotate(
        count=Count('id')
    ).order_by('booking_date__month')
    
    # Phim hot
    hot_movies = Movie.objects.filter(is_hot=True, is_active=True).order_by('-views_count')[:5]
    
    # Người dùng mới (7 ngày gần nhất)
    week_ago = timezone.now() - timedelta(days=7)
    recent_users = UserProfile.objects.filter(
        created_at__gte=week_ago
    ).select_related('user').order_by('-created_at')[:5]
    
    context = {
        'total_movies': total_movies,
        'total_bookings': total_bookings,
        'total_users': total_users,
        'today_bookings': today_bookings,
        'paid_bookings': paid_bookings,
        'processing_bookings': processing_bookings,
        'pending_bookings': pending_bookings,
        'expired_bookings': expired_bookings,
        'cancelled_bookings': cancelled_bookings,
        'refunded_bookings': refunded_bookings,
        'paid_percentage': round(paid_percentage, 1),
        'processing_percentage': round(processing_percentage, 1),
        'pending_percentage': round(pending_percentage, 1),
        'expired_percentage': round(expired_percentage, 1),
        'cancelled_percentage': round(cancelled_percentage, 1),
        'refunded_percentage': round(refunded_percentage, 1),
        'recent_bookings': recent_bookings,
        'monthly_stats': monthly_stats,
        'hot_movies': hot_movies,
        'recent_users': recent_users,
    }
    return render(request, 'registration/admin_dashboard.html', context)

@login_required
@user_passes_test(is_staff_or_admin)
@require_POST
def update_booking_status(request, booking_id):
    # """Cập nhật trạng thái booking trực tiếp từ admin dashboard"""
    import json
    
    booking = get_object_or_404(Booking, id=booking_id)
    
    # Xử lý cả POST data thông thường và JSON data
    if request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Dữ liệu JSON không hợp lệ'
            }, status=400)
    else:
        new_status = request.POST.get('status')
    
    if new_status in dict(Booking.PAYMENT_STATUS):
        booking.payment_status = new_status
        
        # Cập nhật trạng thái booking tương ứng
        if new_status == 'paid':
            booking.booking_status = 'confirmed'
        elif new_status == 'cancelled':
            booking.booking_status = 'cancelled'
        elif new_status == 'refunded':
            booking.booking_status = 'cancelled'
        else:
            booking.booking_status = 'pending'
        
        booking.save()
        
        return JsonResponse({
            'success': True,
            'message': f'Đã cập nhật trạng thái thành: {dict(Booking.PAYMENT_STATUS)[new_status]}',
            'new_status': new_status,
            'new_status_display': dict(Booking.PAYMENT_STATUS)[new_status]
        })
    else:
        return JsonResponse({
            'success': False,
            'error': 'Trạng thái không hợp lệ'
        }, status=400)

def get_seats_ajax(request, show_time_id):
    """API để lấy trạng thái ghế"""
    show_time = get_object_or_404(ShowTime, id=show_time_id)
    seats = Seat.objects.filter(show_time=show_time)
    
    seat_data = []
    for seat in seats:
        seat_data.append({
            'id': seat.id,
            'seat_number': seat.seat_number,
            'status': seat.status,
        })
    
    return JsonResponse({'seats': seat_data})

def custom_logout(request):
    """View logout tùy chỉnh"""
    logout(request)
    messages.success(request, 'Bạn đã đăng xuất thành công!')
    
    # Kiểm tra nếu là AJAX request
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'message': 'Đăng xuất thành công!',
            'redirect_url': '/'
        })
    
    return redirect('home')