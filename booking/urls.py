from django.urls import path, include
from django.contrib import admin
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('movie/<int:movie_id>/', views.movie_detail, name='movie_detail'),
    path('movie/<int:movie_id>/booking/', views.booking_info, name='booking_info'),
    path('booking/<int:show_time_id>/', views.booking_seats, name='booking_seats'),
    path('booking/confirmation/<int:booking_id>/', views.booking_confirmation, name='booking_confirmation'),
    path('payment/method/<int:booking_id>/', views.payment_method, name='payment_method'),
    path('payment/bank-transfer/<int:booking_id>/', views.bank_transfer, name='bank_transfer'),
    path('payment/momo/<int:booking_id>/', views.momo_payment, name='momo_payment'),
    path('payment/vnpay/<int:booking_id>/', views.vnpay_payment, name='vnpay_payment'),
    path('payment/confirmation/<int:booking_id>/', views.payment_confirmation, name='payment_confirmation'),
    path('print-ticket/<int:booking_id>/', views.print_ticket, name='print_ticket'),
    path('my-bookings/', views.my_bookings, name='my_bookings'),
    path('login/', views.custom_login, name='login'),
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin-dashboard/booking/<int:booking_id>/update-status/', views.update_booking_status, name='update_booking_status'),
    path('review/<int:movie_id>/', views.add_review, name='add_review'),
    path('review/<int:review_id>/edit/', views.edit_review, name='edit_review'),
    path('review/<int:review_id>/delete/', views.delete_review, name='delete_review'),
    path('get-seats/<int:show_time_id>/', views.get_seats_ajax, name='get_seats_ajax'),
    path('logout/', views.custom_logout, name='logout'),
] 