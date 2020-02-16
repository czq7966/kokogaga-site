FROM node:10.14.1
RUN mkdir app \
    &&  cd /app \
    &&  npm install adhoc-cast-signaler-server-promethean-redis \
    &&  cd /app/node_modules/adhoc-cast-signaler-server-promethean-redis \
    &&  npm install -g forever  \
    &&  npm install
COPY ./config.json /app/node_modules/adhoc-cast-signaler-server-promethean-redis  
WORKDIR /app/node_modules/adhoc-cast-signaler-server-promethean-redis
EXPOSE 2770
CMD ["forever", "dist/server/index.js"]