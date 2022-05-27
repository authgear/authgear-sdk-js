FROM node:16.13.2 as build
WORKDIR /project
COPY . .
RUN npm ci && npm run bundle:web-module
WORKDIR /project/example/reactweb
RUN npm ci && npm run build
FROM nginx:1.20.2
COPY --from=build /project/example/reactweb/dist /usr/share/nginx/html
COPY ./example/reactweb/nginx.conf /etc/nginx/nginx.conf
