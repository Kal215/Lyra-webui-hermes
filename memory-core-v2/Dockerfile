FROM python:3.11-slim

WORKDIR /app
COPY . /app/

# Install dependencies (you can add a requirements.txt if needed)
RUN pip install --no-cache-dir mem0ai qdrant-client fastapi uvicorn pydantic

# Patch host to 0.0.0.0 for Docker
RUN sed -i "s/'127.0.0.1', 20129/'0.0.0.0', 20129/g" memory_service.py

CMD ["python", "memory_service.py"]
