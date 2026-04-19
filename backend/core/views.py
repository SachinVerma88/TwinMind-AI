from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import groq_client
from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
    SuggestionsRequestSerializer,
    SuggestionsResponseSerializer,
    TranscribeResponseSerializer,
)


class TranscribeView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        audio_file = request.FILES.get("audio")
        if not audio_file:
            return Response({"detail": "Missing audio file"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            text = groq_client.transcribe_audio(audio_file, audio_file.name or "audio.webm")
        except Exception:
            text = "Transcription unavailable. Check EXTERNAL_API_KEY in backend/.env and audio format."
        serializer = TranscribeResponseSerializer(data={"text": text})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class SuggestionsView(APIView):
    def post(self, request):
        request_serializer = SuggestionsRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        transcript = request_serializer.validated_data.get("transcript") or ""
        prompt = request_serializer.validated_data.get("prompt") or ""
        suggestions_data = groq_client.fallback_suggestions(transcript)
        # Only call the model when there is transcript text; avoids useless API calls and
        # odd empty-context completions. Fallback still returns three usable placeholders.
        if transcript.strip() and prompt.strip():
            try:
                content = groq_client.suggestions_completion(prompt)
                suggestions_data = groq_client.parse_suggestions_json(content)
            except Exception:
                pass
        suggestions_payload = {"suggestions": suggestions_data}
        response_serializer = SuggestionsResponseSerializer(data=suggestions_payload)
        if not response_serializer.is_valid():
            suggestions_payload = {"suggestions": groq_client.fallback_suggestions(transcript)}
            response_serializer = SuggestionsResponseSerializer(data=suggestions_payload)
            response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.validated_data)


class ChatView(APIView):
    def post(self, request):
        request_serializer = ChatRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        prompt = request_serializer.validated_data["prompt"]
        try:
            response_text = groq_client.chat_completion(prompt, system_content=None)
        except Exception:
            response_text = "Chat unavailable. Check EXTERNAL_API_KEY in backend/.env and try again."
        serializer = ChatResponseSerializer(data={"response": response_text})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)
