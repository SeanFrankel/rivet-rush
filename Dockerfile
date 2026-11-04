FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 BIND_ADDRESS=0.0.0.0
WORKDIR /game
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY index.html arena.css match.js protocol.js replay.js online.js yard.js sound.js THIRD_PARTY.md ./
COPY assets ./assets
COPY server ./server
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/host.js"]
