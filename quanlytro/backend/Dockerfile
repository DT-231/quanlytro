# Sử dụng Python 3.13 làm base image
FROM python:3.13-slim

# Thiết lập working directory
WORKDIR /app

# Cài đặt dependencies hệ thống cần thiết cho psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt và cài đặt Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code backend vào container
COPY . .

# Expose port 8000 cho FastAPI
EXPOSE 8000

# Chạy migrations và start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]
