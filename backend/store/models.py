from django.conf import settings
from django.db import models


class Product(models.Model):
    LOCATION_CHOICES = [
        ("JO", "Jordan"),
        ("SA", "Saudi Arabia"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=2, choices=LOCATION_CHOICES)

    def __str__(self):
        return f"{self.title} ({self.location})"


class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="orders")
    # price/location are copied from the product at purchase time (not read live via
    # `product.price`), so a receipt stays correct even if the product changes later.
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=2, choices=Product.LOCATION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.product.title} - {self.user}"
