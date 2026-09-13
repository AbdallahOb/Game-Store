import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from store.models import Order, Product


@pytest.fixture
def auth_client(django_user_model):
    user = django_user_model.objects.create_user(username="alice", password="pass12345")
    client = APIClient()
    client.force_authenticate(user=user)
    return client, user


@pytest.fixture
def product(db):
    return Product.objects.create(title="Sword", description="desc", price="150.00", location="JO")


@pytest.mark.django_db
class TestPurchaseFlow:
    def test_requires_authentication(self, product):
        response = APIClient().post(reverse("order-create"), {"product_id": product.id})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_buy_creates_order_and_returns_receipt(self, auth_client, product):
        client, user = auth_client
        response = client.post(reverse("order-create"), {"product_id": product.id})

        assert response.status_code == status.HTTP_201_CREATED
        assert Order.objects.count() == 1

        order = Order.objects.get()
        assert order.user == user
        assert order.product == product
        assert str(order.price) == "150.00"

        assert response.data["product_title"] == "Sword"
        assert response.data["buyer"] == "alice"
        assert response.data["location"] == "JO"

    def test_buy_missing_product_id_returns_400(self, auth_client):
        client, _ = auth_client
        response = client.post(reverse("order-create"), {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_buy_unknown_product_returns_404(self, auth_client):
        client, _ = auth_client
        response = client.post(reverse("order-create"), {"product_id": 999999})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_receipt_snapshots_price_at_purchase_time(self, auth_client, product):
        client, _ = auth_client
        client.post(reverse("order-create"), {"product_id": product.id})

        product.price = "999.00"
        product.save()

        order = Order.objects.get()
        response = client.get(reverse("order-detail", args=[order.id]))
        assert response.data["price"] == "150.00"


@pytest.mark.django_db
class TestOrderDetail:
    def test_only_owner_can_view_receipt(self, auth_client, product, django_user_model):
        client, _ = auth_client
        create_response = client.post(reverse("order-create"), {"product_id": product.id})
        order_id = create_response.data["id"]

        other_client = APIClient()
        other_user = django_user_model.objects.create_user(username="bob", password="pass12345")
        other_client.force_authenticate(user=other_user)

        response = other_client.get(reverse("order-detail", args=[order_id]))
        assert response.status_code == status.HTTP_404_NOT_FOUND
