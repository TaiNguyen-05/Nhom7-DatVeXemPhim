
# """Kiểm tra user có phải là staff hoặc admin không"""
def is_staff_or_admin(user):
    return user.is_authenticated and (user.is_staff or hasattr(user, 'profile') and user.profile.user_type in ['staff', 'admin'])