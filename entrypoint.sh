#!/bin/sh

# This script ensures the database is ready and migrations are applied before starting the application.

echo "Running Prisma migrations..."
# The --schema flag is needed if the schema is not in the default location relative to the command.
npx prisma migrate deploy

echo "Migrations complete. Starting the application..."

# Execute the main container command (from the Dockerfile CMD)
exec "$@"
