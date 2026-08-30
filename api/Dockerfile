FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ingestion ingestion
COPY module1_reserve_mapping module1_reserve_mapping
COPY module2_production_forecast module2_production_forecast
COPY module3_recommendations module3_recommendations
COPY api api
COPY db db

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]