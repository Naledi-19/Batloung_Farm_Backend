const db = require('../config/database');
const list = async() => (await db.query(`
    SELECT * FROM v_sales_summary ORDER BY sale_date DESC,sale_id DESC`))[0];
const get = async(saleId) => {
    const [rows] = await db.query('SELECT * FROM v_sales_summary WHERE sale_id=?',[saleId]);
    if (!rows.length) return null;
    const [items] = await db.query(`SELECT sd.*,f.fruit_name FROM sales_details sd
        JOIN fruits f ON f.fruit_id=sd.fruit_id WHERE sd.sale_id=?`,[saleId]);
    return {...rows[0],items};
};
module.exports={list,get};
