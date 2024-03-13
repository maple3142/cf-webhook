FROM oven/bun:1
WORKDIR /app
COPY ./src ./src
COPY wrangler.toml ./
# currently, only memory is supported on bun
ENV BACKING_STORAGE=memory
CMD ["bun", "run", "./src/bun-entry.ts"]
