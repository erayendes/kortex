FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV DB_PATH=./data/kortex.db
RUN mkdir -p data && ./node_modules/.bin/drizzle-kit migrate && npm run build

EXPOSE 8080
ENV PORT=8080

CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit migrate && node_modules/.bin/next start"]
