/**
 * API Key 鉴权中间件
 */
module.exports = function authMiddleware(req, res, next) {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.warn('[WARN] API_KEY 未设置，认证已绕过（仅开发环境）');
    return next();
  }

  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ code: 401, message: '缺少 API Key，请在 Header 中传入 X-API-Key' });
  }
  if (key !== API_KEY) {
    return res.status(403).json({ code: 403, message: 'API Key 无效' });
  }
  next();
};
