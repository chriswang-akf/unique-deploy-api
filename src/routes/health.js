const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * 健康检查接口
 */
router.get('/health', (req, res) => {
  const pkg = require('../../package.json');

  res.json({
    code: 0,
    message: 'success',
    data: {
      service: process.env.SERVICE_NAME || 'unique-deploy-api',
      status: 'healthy',
      version: process.env.SERVICE_VERSION || pkg.version,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
