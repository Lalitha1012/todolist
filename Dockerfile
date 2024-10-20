# Use an official Node.js runtime as a parent image
FROM node:20-alpine3.16

RUN apk update && apk upgrade

RUN apk add --no-cache sqlite~=3.40.1-r1

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Define the command to run your app
CMD ["npm","start"]
