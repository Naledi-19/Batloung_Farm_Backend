const db = require('../config/database');
const topFruits = async() => (await db.query(`SELECT f.fruit_id,f.fruit_name,
    COALESCE(SUM(sd.quantity),0) AS boxes_sold FROM fruits f
    LEFT JOIN sales_details sd ON sd.fruit_id=f.fruit_id
    GROUP BY f.fruit_id,f.fruit_name ORDER BY boxes_sold DESC,f.fruit_name LIMIT 5`))[0];
const revenue = async(start,end) => (await db.query(`SELECT
    COALESCE(SUM(total_amount),0) AS sales_revenue,
    COALESCE(SUM(amount_paid),0) AS payments_received
    FROM v_sales_summary WHERE sale_date>=? AND sale_date<DATE_ADD(?,INTERVAL 1 DAY)`,
    [start,end]))[0][0];
const topVendor = async() => (await db.query(`SELECT v.vendor_id,v.vendor_name,
    SUM(sd.quantity) AS boxes_purchased FROM vendors v
    JOIN sales s ON s.vendor_id=v.vendor_id JOIN sales_details sd ON sd.sale_id=s.sale_id
    GROUP BY v.vendor_id,v.vendor_name ORDER BY boxes_purchased DESC,v.vendor_id LIMIT 1`))[0][0] || null;
const inventory = async() => (await db.query(`SELECT f.fruit_name,st.packaging_size,
    st.available_quantity FROM stock st JOIN fruits f ON f.fruit_id=st.fruit_id
    ORDER BY f.fruit_name,FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')`))[0];
const outstanding = async() => (await db.query(`SELECT * FROM v_vendor_balances
    ORDER BY outstanding_balance DESC`))[0];
module.exports={topFruits,revenue,topVendor,inventory,outstanding};
