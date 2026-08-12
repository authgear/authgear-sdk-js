FROM node:20-bullseye as build
WORKDIR /project
COPY . .
# engine-strict requires npm to be new enough to understand min-release-age;
# the npm bundled with this base image is too old, so upgrade it explicitly.
RUN npm install -g npm@^11.10.0
RUN npm ci && npm run bundle:web-module
WORKDIR /project/example/reactweb
RUN npm ci && npm run build
FROM nginx:1.20.2
COPY --from=build /project/example/reactweb/dist /usr/share/nginx/html
COPY ./example/reactweb/nginx.conf /etc/nginx/nginx.conf
