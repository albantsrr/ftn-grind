#!/bin/bash

# Script pour créer des données de test complètes
# Usage: ./setup_test_data.sh

echo "========================================="
echo "  FortiFlow - Setup Test Data"
echo "========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "seed_routines.py" ]; then
    echo "❌ Error: Run this script from the backend directory"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "Please run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if database exists
if [ ! -f "fortiflow.db" ]; then
    echo "⚠️  Warning: Database not found. It will be created when you start the backend."
    echo "Please start the backend first with: uvicorn main:app --reload --port 3000"
    exit 1
fi

echo "✓ Database found"
echo ""

# Step 1: Create routines
echo "🔧 Step 1: Creating 30 test routines for user 'albant'..."
echo ""
python seed_routines.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to create routines"
    echo "Make sure user 'albant' exists (register in the app first)"
    exit 1
fi

echo ""
echo "✅ Routines created successfully!"
echo ""

# Step 2: Add ratings
echo "🔧 Step 2: Adding random ratings to public routines..."
echo ""
python seed_ratings.py

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Failed to add ratings (this is optional)"
    echo "You may need to create another user account first"
else
    echo ""
    echo "✅ Ratings added successfully!"
fi

echo ""
echo "========================================="
echo "  ✅ Test data setup complete!"
echo "========================================="
echo ""
echo "You can now:"
echo "  1. Go to http://localhost:5173/"
echo "  2. Login as 'albant'"
echo "  3. Check 'Mes Routines' to see your private routines"
echo "  4. Go to 'Communauté' to see public routines"
echo "  5. Test search, filters, and ratings!"
echo ""
