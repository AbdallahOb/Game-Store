import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from store.models import Product

VALID_LOCATIONS = {"JO", "SA"}


class Command(BaseCommand):
    help = "Import digital game items from a CSV file (id, title, description, price, location)."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            nargs="?",
            default=str(Path(__file__).resolve().parents[4] / "items.csv"),
            help="Path to the CSV file (defaults to the repo-root items.csv).",
        )

    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])
        if not csv_path.exists():
            raise CommandError(f"CSV file not found: {csv_path}")

        created, updated, skipped = 0, 0, 0

        with csv_path.open(newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row_number, row in enumerate(reader, start=2):
                try:
                    product_id = int(row["id"])
                    price = Decimal(row["price"])
                    location = row["location"].strip().upper()
                    if location not in VALID_LOCATIONS:
                        raise ValueError(f"invalid location '{location}'")
                except (KeyError, ValueError, InvalidOperation) as exc:
                    self.stderr.write(f"Row {row_number}: skipped ({exc})")
                    skipped += 1
                    continue

                # Keyed on the CSV's own id (used directly as the PK) with update_or_create,
                # so re-running this after editing the CSV updates rows instead of duplicating them.
                _, was_created = Product.objects.update_or_create(
                    id=product_id,
                    defaults={
                        "title": row["title"].strip(),
                        "description": row.get("description", "").strip(),
                        "price": price,
                        "location": location,
                    },
                )
                created += was_created
                updated += not was_created

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete: {created} created, {updated} updated, {skipped} skipped."
            )
        )
