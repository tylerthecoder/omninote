#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

rm -rf ../temp-build
mkdir ../temp-build
cp -r ../tt-services ../temp-build/
cp -r ../planner ../temp-build/
cp .dockerignore ../temp-build/planner/

# Define variables
DOCKER_USERNAME="tylerthecoder"
IMAGE_NAME="omninote"
TAG="latest"

# Build the Docker image
echo "Building Docker image..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$TAG -f ./Dockerfile ../temp-build

rm -rf ../temp-build

# Push the image to Docker Hub
echo "Pushing image to Docker Hub..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$TAG

echo "Build and push completed successfully!"
