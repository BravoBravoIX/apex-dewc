
# === frontend/Dockerfile ===
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use Nginx to serve the production build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
#COPY ./nginx/nginx.conf /etc/nginx/nginx.conf  # Ensure this path is correct
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
ENV REACT_APP_MQTT_BROKER=ws://mqtt:9001
