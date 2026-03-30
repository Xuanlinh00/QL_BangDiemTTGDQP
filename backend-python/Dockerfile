# Use Python 3.11 slim image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for image processing and PDF handling
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-vie \
    tesseract-ocr-eng \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (will be overridden by PORT env on Render)
EXPOSE 8000

# Start application (PORT env variable will be used by main.py if set)
CMD ["python", "-m", "app.main"]
