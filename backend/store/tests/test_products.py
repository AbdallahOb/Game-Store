import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from store.models import Product


@pytest.fixture
def auth_client(django_user_model):
    user = django_user_model.objects.create_user(username="alice", password="pass12345")
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def products(db):
    return [
        Product.objects.create(title=f"Item {i}", description="desc", price=10 + i, location="JO" if i % 2 == 0 else "SA")
        for i in range(15)
    ]


@pytest.mark.django_db
class TestProductList:
    def test_requires_authentication(self, products):
        response = APIClient().get(reverse("product-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_default_pagination(self, auth_client, products):
        response = auth_client.get(reverse("product-list"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 15
        assert len(response.data["results"]) == 10

    def test_page_size_param(self, auth_client, products):
        response = auth_client.get(reverse("product-list"), {"page_size": 5, "page": 2})
        assert len(response.data["results"]) == 5

    def test_filter_by_location(self, auth_client, products):
        response = auth_client.get(reverse("product-list"), {"location": "JO"})
        assert response.data["count"] == 8
        assert all(item["location"] == "JO" for item in response.data["results"])

    def test_invalid_location_returns_400(self, auth_client, products):
        response = auth_client.get(reverse("product-list"), {"location": "XX"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestProductDetail:
    def test_returns_product(self, auth_client, products):
        response = auth_client.get(reverse("product-detail", args=[products[0].id]))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Item 0"

    def test_unknown_product_returns_404(self, auth_client, products):
        response = auth_client.get(reverse("product-detail", args=[999999]))
        assert response.status_code == status.HTTP_404_NOT_FOUND
