FROM node:20
WORKDIR /app
RUN npm i -g pnpm
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build
CMD ["node", "dist/main.js"]