FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

RUN mkdir -p fb-automation/posted fb-print-automation/posted fb-royalking-automation/posted \
    fb-automation/logs fb-print-automation/logs fb-royalking-automation/logs

CMD ["node", "start-all-schedulers.js"]
