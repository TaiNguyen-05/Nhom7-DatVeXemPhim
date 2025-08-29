
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