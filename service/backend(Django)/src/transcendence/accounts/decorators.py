from django.shortcuts import redirect

def redirect_if_authenticated(view_func):
        def wrapper(request, *args, **kwargs):
            if request.user.is_authenticated:
                return redirect('index:index')
            else:
                return view_func(request, *args, **kwargs)
        return wrapper