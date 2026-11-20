const db = require('../config/database');
const cols = 'vendor_id,vendor_name,phone_number,location,registration_date,latitude,longitude';
const list = async query => {
  const term = String(query || '').trim();
  return (await db.query(`SELECT ${cols} FROM vendors WHERE (?='' OR vendor_name LIKE CONCAT('%',?,'%') OR phone_number LIKE CONCAT('%',?,'%')) ORDER BY vendor_name`, [term,term,term]))[0];
};
const get = async key => (await db.query(`SELECT ${cols} FROM vendors WHERE vendor_id=?`, [key]))[0][0];
const create = async vals => (await db.query(
  'INSERT INTO vendors (vendor_name,phone_number,location,latitude,longitude) VALUES (?,?,?,?,?)', vals
))[0].insertId;
const update = async (key, vals) => (await db.query(
  'UPDATE vendors SET vendor_name=?,phone_number=?,location=?,latitude=?,longitude=? WHERE vendor_id=?', [...vals,key]
))[0].affectedRows;
const remove = async key => (await db.query('DELETE FROM vendors WHERE vendor_id=?', [key]))[0].affectedRows;
module.exports = { list, get, create, update, remove };
