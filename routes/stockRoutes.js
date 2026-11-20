const r=require('express').Router();
const c=require('../controllers/stockController');
const w=require('../utils/asyncHandler');


r.get('/low',w(c.low));
r.get('/',w(c.list));

module.exports=r;
