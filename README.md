# DiscDoor CDN service

This microservice is responsible for providing a Content Delivery Network (CDN) service.

## System requirements

* NodeJS v16 or newer.
* Docker (if you wish to dockerize)

## Installing dependencies
To install all project dependencies, run `npm install` inside the project folder.

## Running
Below are instructions to help you run `dd-cdn`.

### Development
To run a development server, execute the following commands.
- `npm run dev`

### Production (local)
To run this for production locally, run the following commands.
- `npm run start`

### Production (dockerized, preferred)
Simply create an image from the Dockerfile included here.

To do this, run `docker build -t dd-cdn .` in the repository root.

Then you can create a container based on this image.