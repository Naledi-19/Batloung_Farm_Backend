const db = require('../config/database');
const model = require('../models/purchaseModel');
const {id,required,validateItems,check,HttpError,decimal} = require('../utils/helpers');
exports.list = async(req,res) => res.json(await model.list());
exports.get = async(req,res) => {
    const result = await model.get(id(req.params.id));
    if (!result) throw new HttpError(404,'Purchase not found');
    res.json(result);
};
exports.create = async(req,res) => {
    required(req.body,['supplier_id','items']);
    const supplierId = id(req.body.supplier_id,'supplier_id');
    const items = validateItems(req.body.items,true)
        .sort((a,b)=>a.fruit_id-b.fruit_id || a.packaging_size.localeCompare(b.packaging_size));
    const cost = items.reduce((sum,item)=>sum + item.quantity*item.unit_cost,0);
    check(Number.isSafeInteger(cost) && cost <= 999999999999,'Purchase amount exceeds supported range');
    const conn = await db.getConnection();
    let purchaseId;
    try {
        await conn.beginTransaction();
        const [supplier] = await conn.query('SELECT supplier_id FROM suppliers WHERE supplier_id=?',[supplierId]);
        check(supplier.length,'Supplier does not exist',404);
        // Validate and lock every relevant package before writing purchase records.
        for (const item of items) {
            const [price] = await conn.query(`SELECT f.status FROM fruit_prices fp
                JOIN fruits f ON f.fruit_id=fp.fruit_id
                WHERE fp.fruit_id=? AND fp.packaging_size=? FOR UPDATE`,[item.fruit_id,item.packaging_size]);
            check(price.length && price[0].status==='ACTIVE',`Fruit ${item.fruit_id} or package unavailable`);
            const [stock] = await conn.query(`SELECT available_quantity FROM stock
                WHERE fruit_id=? AND packaging_size=? FOR UPDATE`,[item.fruit_id,item.packaging_size]);
            check(stock.length,`Stock row missing for fruit ${item.fruit_id} (${item.packaging_size})`,409);
        }
        const [result] = await conn.query('INSERT INTO purchases (supplier_id) VALUES (?)',[supplierId]);
        purchaseId = result.insertId;
        for (const item of items) {
            await conn.query(`INSERT INTO purchase_details
                (purchase_id,fruit_id,quantity,unit_cost,packaging_size)
                VALUES (?,?,?,?,?)`,[purchaseId,item.fruit_id,item.quantity,decimal(item.unit_cost),item.packaging_size]);
            const [updated] = await conn.query(`UPDATE stock
                SET available_quantity=available_quantity+?
                WHERE fruit_id=? AND packaging_size=?`,[item.quantity,item.fruit_id,item.packaging_size]);
            check(updated.affectedRows===1,'Stock row missing',409);
        }
        await conn.commit();
    } catch(error) {await conn.rollback();throw error;}
    finally {conn.release();}
    res.status(201).json(await model.get(purchaseId));
};
