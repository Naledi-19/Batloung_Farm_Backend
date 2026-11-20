const db = require('../config/database');

// Preserve the original React API response format using a normalized price join.
const base = `SELECT f.fruit_id, f.fruit_name, f.description, f.status,
    MAX(CASE WHEN fp.packaging_size='SMALL' THEN fp.selling_price END) AS small_price,
    MAX(CASE WHEN fp.packaging_size='MEDIUM' THEN fp.selling_price END) AS medium_price,
    MAX(CASE WHEN fp.packaging_size='LARGE' THEN fp.selling_price END) AS large_price
  FROM fruits f LEFT JOIN fruit_prices fp ON fp.fruit_id=f.fruit_id`;
const group = ` GROUP BY f.fruit_id,f.fruit_name,f.description,f.status`;
const list = async () => (await db.query(base + group + ' ORDER BY f.fruit_name'))[0];
const get = async (fruitId) => (await db.query(base + ' WHERE f.fruit_id=?' + group, [fruitId]))[0][0];
module.exports = { list, get };
