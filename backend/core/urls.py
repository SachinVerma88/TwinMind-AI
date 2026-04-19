from django.urls import path

from .views import ChatView, SuggestionsView, TranscribeView

urlpatterns = [
    path("transcribe/", TranscribeView.as_view(), name="transcribe"),
    path("suggestions/", SuggestionsView.as_view(), name="suggestions"),
    path("chat/", ChatView.as_view(), name="chat"),
]
