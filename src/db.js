const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || 'data/deploy.db';
let db = null;

/**
 * 初始化数据库（异步）
 */
async function initDB() {
  const SQL = await initSqlJs();

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 如果数据库文件存在，加载它
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS deployments (
      id TEXT PRIMARY KEY,
      domain TEXT,
      admin_email TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'lite',
      remark TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      access_url TEXT,
      admin_url TEXT,
      logs TEXT NOT NULL DEFAULT '[]',
      api_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_deployments_api_key ON deployments(api_key)`);

  saveDB();
  console.log(`[DB] 数据库已初始化: ${DB_PATH}`);
  return db;
}

/**
 * 保存数据库到文件
 */
function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * 获取数据库实例
 */
function getDB() {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDB()');
  }
  return db;
}

module.exports = { initDB, getDB, saveDB };
