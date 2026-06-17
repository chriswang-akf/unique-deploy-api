FROM node:18-alpine

WORKDIR /app

# 复制依赖文件并安装
COPY package.json ./
RUN npm install --production

# 复制源码
COPY src/ ./src/
COPY .env.example ./.env.example

# 数据目录
RUN mkdir -p /app/data

EXPOSE 3399

CMD ["node", "src/index.js"]
