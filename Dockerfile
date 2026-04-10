FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @cloudcli-ai/cloudcli better-sqlite3

ENV NODE_PATH=/usr/local/lib/node_modules
ENV VITE_IS_PLATFORM=true
ENV DATABASE_PATH=/root/.cloudcli/auth.db

WORKDIR /app
COPY seed-user.js /usr/local/bin/seed-user.js

EXPOSE 3001

CMD ["sh", "-c", "node /usr/local/bin/seed-user.js && cloudcli start"]

