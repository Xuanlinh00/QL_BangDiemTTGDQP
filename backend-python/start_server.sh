#!/bin/bash

echo "========================================"
echo "Starting TVU Python API Server"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "No virtual environment found. Using global Python."
fi

echo ""
echo "Starting server on http://localhost:8001"
echo "Press Ctrl+C to stop"
echo ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
