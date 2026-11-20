const db=require('../config/database');
const all=async()=> (await db.query(`SELECT st.stock_id,st.fruit_id,f.fruit_name,st.packaging_size,st.available_quantity
 FROM stock st JOIN fruits f ON f.fruit_id=st.fruit_id
 ORDER BY f.fruit_name,FIELD(st.packaging_size,'SMALL','MEDIUM','LARGE')`))[0];
const low=async threshold=> (await db.query(`SELECT st.stock_id,f.fruit_name,st.packaging_size,st.available_quantity
 FROM stock st JOIN fruits f ON f.fruit_id=st.fruit_id WHERE st.available_quantity<=?
 ORDER BY st.available_quantity,f.fruit_name`,[threshold]))[0];
module.exports={all,low};
