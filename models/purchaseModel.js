const db = require('../config/database');
const list = async () => (await db.query(`
    SELECT p.purchase_id,p.supplier_id,s.business_name,p.purchase_date,pt.total_amount
    FROM purchases p JOIN suppliers s ON s.supplier_id=p.supplier_id
    JOIN v_purchase_totals pt ON pt.purchase_id=p.purchase_id
    ORDER BY p.purchase_date DESC,p.purchase_id DESC`))[0];
const get = async (purchaseId) => {
    const [rows] = await db.query(`SELECT p.purchase_id,p.supplier_id,p.purchase_date,
        s.business_name,pt.total_amount FROM purchases p
        JOIN suppliers s ON s.supplier_id=p.supplier_id
        JOIN v_purchase_totals pt ON pt.purchase_id=p.purchase_id
        WHERE p.purchase_id=?`,[purchaseId]);
    if (!rows.length) return null;
    const [items] = await db.query(`SELECT pd.*,f.fruit_name FROM purchase_details pd
        JOIN fruits f ON f.fruit_id=pd.fruit_id WHERE pd.purchase_id=?`,[purchaseId]);
    return {...rows[0],items};
};
module.exports={list,get};
