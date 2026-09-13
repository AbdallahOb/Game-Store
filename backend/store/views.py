"""
Plain functions, not DRF's generic classes - @api_view is the only "magic": it
marks a function as a view for the given HTTP method(s) and gives it a parsed
request.data / request.query_params. Auth isn't mentioned below because
IsAuthenticated is the project-wide default (see config/settings.py).
"""

from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Order, Product
from .serializers import ProductSerializer

VALID_LOCATIONS = {"JO", "SA"}


def _int_param(request, name, default):
    """Read a query param as an int, falling back to `default` if it's missing or invalid."""
    try:
        return int(request.query_params.get(name, default))
    except (TypeError, ValueError):
        return default


def _receipt(order):
    """The JSON shape returned both right after a purchase and when re-fetching a receipt."""
    return {
        "id": order.id,
        "product": order.product_id,
        "product_title": order.product.title,
        "price": str(order.price),
        "location": order.location,
        "buyer": order.user.username,
        "created_at": order.created_at,
    }


@api_view(["GET"])
def product_list(request):
    """GET /api/products/?page=&page_size=&location=JO|SA"""
    products = Product.objects.order_by("id")

    location = request.query_params.get("location")
    if location:
        location = location.upper()
        if location not in VALID_LOCATIONS:
            return Response({"detail": "location must be JO or SA"}, status=400)
        products = products.filter(location=location)

    page_size = min(_int_param(request, "page_size", 10), 50)
    paginator = Paginator(products, page_size)
    page = paginator.get_page(_int_param(request, "page", 1))

    return Response(
        {
            "count": paginator.count,
            "page": page.number,
            "total_pages": paginator.num_pages,
            "results": ProductSerializer(page.object_list, many=True).data,
        }
    )


@api_view(["GET"])
def product_detail(request, product_id):
    """GET /api/products/{id}/"""
    product = get_object_or_404(Product, id=product_id)
    return Response(ProductSerializer(product).data)


@api_view(["POST"])
def buy_product(request):
    """POST /api/orders/ {"product_id": <id>} -> creates the order, returns the receipt."""
    product_id = request.data.get("product_id")
    if not product_id:
        return Response({"detail": "product_id is required"}, status=400)

    product = get_object_or_404(Product, id=product_id)

    order = Order.objects.create(
        user=request.user,
        product=product,
        price=product.price,
        location=product.location,
    )

    return Response(_receipt(order), status=201)


@api_view(["GET"])
def order_detail(request, order_id):
    """GET /api/orders/{id}/ - only the buyer who made the order can see it."""
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return Response(_receipt(order))
