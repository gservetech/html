FROM node:20-alpine

WORKDIR /app

RUN echo ">>> Installing dependencies..."
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && echo ">>> Dependencies installed."

RUN echo ">>> Copying application files..."
COPY fb-automation/ fb-automation/
COPY utils/ utils/
COPY config.js ./
RUN echo ">>> Files copied."

RUN mkdir -p fb-automation/posted fb-automation/logs && echo ">>> Directories ready."

CMD ["node", "fb-automation/scheduler.js"]
