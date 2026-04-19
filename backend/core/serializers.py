from rest_framework import serializers


class TranscribeResponseSerializer(serializers.Serializer):
    text = serializers.CharField()


class SuggestionSerializer(serializers.Serializer):
    preview = serializers.CharField()
    fullPrompt = serializers.CharField()


class SuggestionsRequestSerializer(serializers.Serializer):
    # Empty transcript is valid (e.g. before first recording chunk); backend uses fallbacks.
    transcript = serializers.CharField(allow_blank=True, required=False, default="")
    prompt = serializers.CharField(allow_blank=True, required=False, default="")


class SuggestionsResponseSerializer(serializers.Serializer):
    suggestions = SuggestionSerializer(many=True)


class ChatRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField()


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
