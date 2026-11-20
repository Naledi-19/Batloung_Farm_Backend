const r=require('express').Router();

const c=require('../controllers/purchaseController');
const w=require('../utils/asyncHandler');


r.get('/',w(c.list));
r.get('/:id',w(c.get));
r.post('/',w(c.create));


module.exports=r;
