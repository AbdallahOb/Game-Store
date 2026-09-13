from rest_framework import serializers

from .models import Product


# Order has no serializer class - views.py builds its JSON by hand (see _receipt()).
# One model, one simple serializer felt clearer than two for symmetry's sake.
class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = ["id", "title", "description", "price", "location"]
