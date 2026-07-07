# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set working directory in the container
WORKDIR /app

# Copy requirements file first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 7860 for Hugging Face Spaces
EXPOSE 7860

# Run the application using gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:app"]
