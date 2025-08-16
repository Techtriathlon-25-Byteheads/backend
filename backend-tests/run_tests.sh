#!/bin/bash

# Backend Test Runner
# Usage: ./run_tests.sh [optional_url]

echo "Backend Test Runner"
echo "==================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed. Please install Python 3 to run the tests."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

# Run the tests
echo "Running backend tests..."
if [ $# -eq 0 ]; then
    python3 backend_test.py
else
    python3 backend_test.py "$1"
fi

echo "Tests completed!"