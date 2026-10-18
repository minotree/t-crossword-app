# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /workspace
RUN npm install --global pnpm@10.34.7
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY packages/core ./packages/core
COPY packages/data ./packages/data
COPY apps/toss-api ./apps/toss-api
RUN pnpm --filter @t-crossword/toss-api... install --frozen-lockfile
RUN pnpm --filter @t-crossword/toss-api build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/toss-api/dist ./dist
COPY --from=build --chown=node:node /workspace/apps/toss-api/package.json ./package.json
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz',{signal:AbortSignal.timeout(4000)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
