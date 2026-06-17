require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const authMiddleware = require('./auth');
const deployRoutes = require('./routes/deploy');
const healthRoutes = require('./routes/health');

const PORT = process.env.PORT || 3399;

async function main() {
  // 初始化数据库
  await initDB();

  const app = express();

  app.use(cors());
  app.use(express.json());

  // 请求日志
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  // 公开路由（健康检查）
  app.use('/api', healthRoutes);

  // 需鉴权的路由
  app.use('/api', authMiddleware, deployRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).json({ code: 404, message: `路径 ${req.method} ${req.originalUrl} 不存在` });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] 尤尼简历部署服务 → http://0.0.0.0:${PORT}`);
    console.log(`[API] 健康检查  → GET  /api/health`);
    console.log(`[API] 部署接口  → POST /api/deploy`);
    console.log(`[API] 状态查询  → GET  /api/deploy/:id`);
  });
}

main().catch(err => {
  console.error('[FATAL] 启动失败:', err);
  process.exit(1);
});
