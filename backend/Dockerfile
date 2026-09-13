# Build context is the repo root (see docker-compose.yml) so this image can
# also pick up the top-level items.csv - everything is copied to the same
# relative layout it has in the repo, so paths (e.g. the CSV importer's
# default path) work unchanged whether the app runs locally or in Docker.

FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY items.csv items.csv

WORKDIR /app/backend
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
