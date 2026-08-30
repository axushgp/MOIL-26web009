FROM node:20-slim

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts artifacts
COPY lib lib
COPY scripts scripts
RUN corepack enable && pnpm install --frozen-lockfile
RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/moil-mrip run build

EXPOSE 3000
CMD ["sh", "-c", "PORT=3000 BASE_PATH=/ pnpm --filter @workspace/moil-mrip run serve"]