const express = require('express');
const router = express.Router();
const { getDB, saveDB } = require('../db');

/**
 * POST /api/deploy
 * 客户发起部署请求
 */
router.post('/deploy', (req, res) => {
  try {
    const { domain, admin_email, mode, remark } = req.body;
    const db = getDB();

    if (!admin_email) {
      return res.status(400).json({ code: 400, message: 'admin_email 为必填字段' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin_email)) {
      return res.status(400).json({ code: 400, message: 'admin_email 格式不正确' });
    }

    const deployMode = mode || 'lite';
    if (!['lite', 'full'].includes(deployMode)) {
      return res.status(400).json({ code: 400, message: 'mode 必须为 lite 或 full' });
    }

    const deployId = 'DEP' + Date.now().toString(36).toUpperCase() +
                     Math.random().toString(36).substring(2, 6).toUpperCase();

    const apiKey = req.headers['x-api-key'];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logs = JSON.stringify([`[${now}] 部署请求已提交，等待处理`]);

    db.run(
      `INSERT INTO deployments (id, domain, admin_email, mode, remark, status, logs, api_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [deployId, domain || null, admin_email, deployMode, remark || null, logs, apiKey, now, now]
    );
    saveDB();

    const estimatedTime = deployMode === 'full' ? '60分钟' : '30分钟';

    res.json({
      code: 0, message: '部署请求已提交',
      data: { deploy_id: deployId, status: 'pending', estimated_time: estimatedTime }
    });

  } catch (err) {
    console.error('[POST /api/deploy] 错误:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

/**
 * GET /api/deploy/:deploy_id
 * 查询部署进度
 */
router.get('/deploy/:deploy_id', (req, res) => {
  try {
    const db = getDB();
    const { deploy_id } = req.params;

    const stmt = db.prepare(`SELECT * FROM deployments WHERE id = ?`);
    stmt.bind([deploy_id]);
    const row = stmt.getAsObject();

    if (!row || !row.id) {
      return res.status(404).json({ code: 404, message: '部署单不存在', data: null });
    }

    res.json({
      code: 0, message: 'success',
      data: {
        deploy_id: row.id,
        status: row.status,
        access_url: row.access_url,
        admin_url: row.admin_url,
        logs: JSON.parse(row.logs || '[]'),
        created_at: row.created_at,
        completed_at: row.completed_at,
        domain: row.domain,
        mode: row.mode,
        remark: row.remark
      }
    });

  } catch (err) {
    console.error('[GET /api/deploy/:id] 错误:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
