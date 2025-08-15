# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the Prisma schema
COPY prisma ./prisma/

# Generate the Prisma client
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code to JavaScript
RUN npm run build

# Copy the entrypoint script
COPY entrypoint.sh .
RUN chmod +x ./entrypoint.sh

# The application will run on port 3000, make it available
EXPOSE 3000

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"]

# Define the command to run the application
CMD [ "node", "dist/index.js" ]
