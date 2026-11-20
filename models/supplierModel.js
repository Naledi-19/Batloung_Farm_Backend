const db = require('../config/database');
const list = async () => (await db.query('SELECT * FROM suppliers ORDER BY business_name'))[0];
const get = async key => (await db.query('SELECT * FROM suppliers WHERE supplier_id=?', [key]))[0][0];
const create = async vals => (await db.query(
  'INSERT INTO suppliers (business_name,contact_person,phone,province,address,latitude,longitude) VALUES (?,?,?,?,?,?,?)', vals
))[0].insertId;
const update = async (key, vals) => (await db.query(
  'UPDATE suppliers SET business_name=?,contact_person=?,phone=?,province=?,address=?,latitude=?,longitude=? WHERE supplier_id=?', [...vals, key]
))[0].affectedRows;
const remove = async key => (await db.query('DELETE FROM suppliers WHERE supplier_id=?', [key]))[0].affectedRows;
module.exports = { list, get, create, update, remove };
