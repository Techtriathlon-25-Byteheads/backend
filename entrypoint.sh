#!/bin/sh

# This script ensures the database is ready and the schema is pushed before starting the application.

# --- Retry logic for db push ---
RETRY_COUNT=0
MAX_RETRIES=5

until [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
  echo "Pushing Prisma schema to database (Attempt: $((RETRY_COUNT+1)))..."
  npx prisma db push
  if [ $? -eq 0 ]; then
    echo "Schema pushed successfully."
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "DB push failed after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi

  echo "DB push failed. Retrying in 5 seconds..."
  sleep 5
done

# --- Seeding and Starting --- 
echo "Seeding the database..."
npm run seed

echo "Seeding complete. Starting the application..."

# Execute the main container command (from the Dockerfile CMD)
exec "$@"
