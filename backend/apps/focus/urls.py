from .serializers import FocusSessionViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"sessions", FocusSessionViewSet, basename="focus-sessions")
urlpatterns = router.urls
