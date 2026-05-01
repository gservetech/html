FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

RUN mkdir -p fb-automation/posted fb-automation/logs

CMD ["node", "fb-automation/scheduler.js"]
