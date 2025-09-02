# backend/app/metrics.py
"""
Metrics module for the FastAPI chat application.
This module handles logging of metrics such as session activity, response times, and error rates.
"""

import time

metrics_log = []

def log_metrics(session_id, message, response):
    entry = {
        "session_id": session_id,
        "message": message,
        "response": response,
        "timestamp": time.time()
    }
    metrics_log.append(entry)
    # To extend: write to PostgreSQL or emit Prometheus metrics, etc.
