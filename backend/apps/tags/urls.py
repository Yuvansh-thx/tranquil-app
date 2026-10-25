"""Tags URL patterns."""
from rest_framework.routers import DefaultRouter
from .serializers import TagViewSet

router = DefaultRouter()
router.register(r"", TagViewSet, basename="tags")
urlpatterns = router.urls
