const db = require('../config/database');
const model = require('../models/salesModel');
const {id,required,validateItems,check,money,cents,decimal,HttpError,paymentMethod} = require('../utils/helpers');
const RECEIVED_METHODS = ['CASH','MPESA','ECOCASH','CARD_BANK','MOBILE_MONEY'];
exports.list = async(req,res) => res.json(await model.list());
exports.get = async(req,res) => {
    const sale = await model.get(id(req.params.id));
    if (!sale) throw new HttpError(404,'Sale not found');
    res.json(sale);
};

exports.create = async(req,res) => {
    required(req.body,['vendor_id','items']);
    const vendorId = id(req.body.vendor_id,'vendor_id');
    const items = validateItems(req.body.items)
        .sort((a,b)=>a.fruit_id-b.fruit_id || a.packaging_size.localeCompare(b.packaging_size));
    const method = paymentMethod(req.body.payment_method);
    const paid = req.body.amount_paid === undefined ? 0 : money(req.body.amount_paid,'amount_paid',true);
    check(paid === 0 || RECEIVED_METHODS.includes(method),'A received payment requires CASH, MPESA, ECOCASH, CARD_BANK or MOBILE_MONEY');
    const conn = await db.getConnection();
    let saleId;
    try {
        await conn.beginTransaction();
        const [vendors] = await conn.query('SELECT vendor_id FROM vendors WHERE vendor_id=?',[vendorId]);
        check(vendors.length,'Vendor not found',404);
        let total = 0;
        for (const item of items) {
            const [price] = await conn.query(`SELECT f.status,fp.selling_price
                FROM fruit_prices fp JOIN fruits f ON f.fruit_id=fp.fruit_id
                WHERE fp.fruit_id=? AND fp.packaging_size=? FOR UPDATE`,[item.fruit_id,item.packaging_size]);
            check(price.length && price[0].status==='ACTIVE',`Fruit ${item.fruit_id} or package unavailable`);
            const [rows] = await conn.query(`SELECT available_quantity FROM stock
                WHERE fruit_id=? AND packaging_size=? FOR UPDATE`,[item.fruit_id,item.packaging_size]);
            check(rows.length && rows[0].available_quantity >= item.quantity,
                `Insufficient ${item.packaging_size} stock for fruit ${item.fruit_id}`,409);
            item.price = cents(price[0].selling_price);
            check(item.price > 0,'Selling price must be positive');
            total += item.quantity * item.price;
            check(Number.isSafeInteger(total) && total<=999999999999,
                'Sale amount exceeds supported range');
        }
        check(paid<=total,'amount_paid cannot exceed total_amount');
        const [result] = await conn.query('INSERT INTO sales (vendor_id) VALUES (?)',[vendorId]);
        saleId = result.insertId;
        for (const item of items) {
            const [updated] = await conn.query(`UPDATE stock
                SET available_quantity=available_quantity-?
                WHERE fruit_id=? AND packaging_size=? AND available_quantity>=?`,
                [item.quantity,item.fruit_id,item.packaging_size,item.quantity]);
            check(updated.affectedRows===1,'Stock changed while processing sale',409);
            await conn.query(`INSERT INTO sales_details
                (sale_id,fruit_id,packaging_size,quantity,unit_price)
                VALUES (?,?,?,?,?)`,[saleId,item.fruit_id,item.packaging_size,item.quantity,decimal(item.price)]);
        }
        if (paid > 0) {
            await conn.query(`INSERT INTO payments (sale_id,payment_method,amount)
                VALUES (?,?,?)`,[saleId,method,decimal(paid)]);
        }
        await conn.commit();
    } catch(error) {await conn.rollback();throw error;}
    finally {conn.release();}
    res.status(201).json(await model.get(saleId));
};

exports.addPayment = async(req,res) => {
    required(req.body,['amount','payment_method']);
    const saleId = id(req.params.id,'sale_id');
    const amount = money(req.body.amount,'amount');
    const method = paymentMethod(req.body.payment_method);
    check(RECEIVED_METHODS.includes(method),'A received payment cannot use CREDIT');
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // Lock the sale before computing cumulative payments to prevent concurrent overpayments.
        const [sales] = await conn.query('SELECT sale_id FROM sales WHERE sale_id=? FOR UPDATE',[saleId]);
        if (!sales.length) throw new HttpError(404,'Sale not found');
        const [[salesTotal]] = await conn.query(`SELECT COALESCE(SUM(quantity*unit_price),0) AS total
            FROM sales_details WHERE sale_id=?`,[saleId]);
        const [[paidTotal]] = await conn.query(`SELECT COALESCE(SUM(amount),0) AS paid
            FROM payments WHERE sale_id=?`,[saleId]);
        check(cents(paidTotal.paid)+amount<=cents(salesTotal.total),
            'Payment exceeds outstanding balance');
        await conn.query(`INSERT INTO payments (sale_id,payment_method,amount) VALUES (?,?,?)`,
            [saleId,method,decimal(amount)]);
        await conn.commit();
    } catch(error) {await conn.rollback();throw error;}
    finally {conn.release();}
    res.json(await model.get(saleId));
};
