import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestAuth:
    def test_login_returns_access_and_refresh_tokens(self, django_user_model):
        django_user_model.objects.create_user(username="alice", password="pass12345")

        response = APIClient().post(
            reverse("token-obtain-pair"), {"username": "alice", "password": "pass12345"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_wrong_password_is_rejected(self, django_user_model):
        django_user_model.objects.create_user(username="alice", password="pass12345")

        response = APIClient().post(
            reverse("token-obtain-pair"), {"username": "alice", "password": "wrong"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_returns_new_access_token(self, django_user_model):
        django_user_model.objects.create_user(username="alice", password="pass12345")
        login = APIClient().post(
            reverse("token-obtain-pair"), {"username": "alice", "password": "pass12345"}
        )

        response = APIClient().post(reverse("token-refresh"), {"refresh": login.data["refresh"]})

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
