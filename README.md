# # My Todo App

This project is a simple Todo application built with Node.js and Express.js, using SQLite as the database. The application is containerized using Docker, allowing for easy deployment and management.

## Prerequisites

To run this application, you need to have Docker installed on your system. You can download and install Docker from [Docker's official website](https://www.docker.com/products/docker-desktop).
 
 or 

 - **Node.js**: A JavaScript runtime that allows you to run JavaScript on the server side. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Node.js package manager, which is installed automatically with Node.js. It's used to install project dependencies.


## Docker Setup

The Dockerfile provided in this repository is used to create a Docker image for the application. It uses the official Node.js runtime as a base image and installs necessary dependencies.

## Installing Node Packages

``` 
npm install

``` 


## Running Application

````
npm start

````

## Build a docker image

``````
docker build -t my-todo-app .

```````
## Run a docker image

````````
docker run -p 5000:5000 my-todo-app

````````
