const db = require('../config/database');
const model = require('../models/fruitModel');
const { check, id, required, text, money, decimal, HttpError } = require('../utils/helpers');
const PACKS = ['SMALL', 'MEDIUM', 'LARGE'];

function values(body) {
    required(body, ['fruit_name', 'small_price', 'medium_price', 'large_price']);
    const status = body.status || 'ACTIVE';
    check(['ACTIVE', 'INACTIVE'].includes(status), 'status must be ACTIVE or INACTIVE');
    const prices = PACKS.map(pack => money(body[pack.toLowerCase()+'_price'], pack.toLowerCase()+'_price'));
    check(new Set(prices).size === 3, 'Each package size must have a different price');
    const description = body.description == null ? null : String(body.description).trim();
    check(description === null || description.length <= 255, 'description too long');
    return { name: text(body.fruit_name, 'fruit_name', 80), description, status, prices };
}

exports.list = async (req, res) => res.json(await model.list());
exports.get = async (req, res) => {
    const row = await model.get(id(req.params.id));
    if (!row) throw new HttpError(404, 'Fruit not found');
    res.json(row);
};

exports.create = async (req, res) => {
    const v = values(req.body);
    const conn = await db.getConnection();
    let fruitId;
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            'INSERT INTO fruits (fruit_name,description,status) VALUES (?,?,?)',
            [v.name,v.description,v.status]
        );
        fruitId = result.insertId;
        for (let i=0;i<PACKS.length;i++) {
            await conn.query(
                'INSERT INTO fruit_prices (fruit_id,packaging_size,selling_price) VALUES (?,?,?)',
                [fruitId,PACKS[i],decimal(v.prices[i])]
            );
            await conn.query(
                'INSERT INTO stock (fruit_id,packaging_size,available_quantity) VALUES (?,?,0)',
                [fruitId,PACKS[i]]
            );
        }
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally { conn.release(); }
    res.status(201).json(await model.get(fruitId));
};

exports.update = async (req, res) => {
    const fruitId = id(req.params.id);
    const v = values(req.body);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [found] = await conn.query('SELECT fruit_id FROM fruits WHERE fruit_id=? FOR UPDATE',[fruitId]);
        if (!found.length) throw new HttpError(404,'Fruit not found');
        await conn.query(
            'UPDATE fruits SET fruit_name=?,description=?,status=? WHERE fruit_id=?',
            [v.name,v.description,v.status,fruitId]
        );
        // Use temporary, distinct valid prices so even swapping SMALL/MEDIUM prices
        // cannot cause an intermediate UNIQUE(fruit_id,selling_price) collision.
        const [existingPrices] = await conn.query(
            'SELECT packaging_size,selling_price FROM fruit_prices WHERE fruit_id=? FOR UPDATE',
            [fruitId]
        );
        check(existingPrices.length===3,'Fruit must have three package prices',409);
        const unavailable = new Set([
            ...existingPrices.map(row => Math.round(Number(row.selling_price)*100)),
            ...v.prices
        ]);
        const temporary = [];
        for (let candidate=9999999999;candidate>=0 && temporary.length<3;candidate--) {
            if (!unavailable.has(candidate)) {
                temporary.push(candidate);
                unavailable.add(candidate);
            }
        }
        check(temporary.length===3,'No temporary price values available',409);
        for (let i=0;i<PACKS.length;i++) {
            await conn.query(
                'UPDATE fruit_prices SET selling_price=? WHERE fruit_id=? AND packaging_size=?',
                [decimal(temporary[i]),fruitId,PACKS[i]]
            );
        }
        for (let i=0;i<PACKS.length;i++) {
            await conn.query(
                'UPDATE fruit_prices SET selling_price=? WHERE fruit_id=? AND packaging_size=?',
                [decimal(v.prices[i]),fruitId,PACKS[i]]
            );
        }
        await conn.commit();
    } catch(error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
    res.json(await model.get(fruitId));
};

exports.remove = async (req, res) => {
    const fruitId = id(req.params.id);
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [found] = await conn.query('SELECT fruit_id FROM fruits WHERE fruit_id=? FOR UPDATE',[fruitId]);
        if (!found.length) throw new HttpError(404,'Fruit not found');
        const [[refs]] = await conn.query(`SELECT
            (SELECT COUNT(*) FROM purchase_details WHERE fruit_id=?) +
            (SELECT COUNT(*) FROM sales_details WHERE fruit_id=?) AS total`,[fruitId,fruitId]);
        check(Number(refs.total) === 0,'Cannot delete fruit with purchase or sales history',409);
        const [[stock]] = await conn.query('SELECT COALESCE(SUM(available_quantity),0) AS quantity FROM stock WHERE fruit_id=?',[fruitId]);
        check(Number(stock.quantity) === 0,'Cannot delete fruit while stock remains',409);
        await conn.query('DELETE FROM stock WHERE fruit_id=?',[fruitId]);
        await conn.query('DELETE FROM fruit_prices WHERE fruit_id=?',[fruitId]);
        await conn.query('DELETE FROM fruits WHERE fruit_id=?',[fruitId]);
        await conn.commit();
    } catch(error) {await conn.rollback();throw error;}
    finally {conn.release();}
    res.json({message:'Fruit deleted'});
};
