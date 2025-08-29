
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