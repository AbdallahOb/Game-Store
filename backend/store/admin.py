from django.contrib import admin

from .models import Order, Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "price", "location")
    list_filter = ("location",)
    search_fields = ("title",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "product", "price", "location", "created_at")
    list_filter = ("location",)
