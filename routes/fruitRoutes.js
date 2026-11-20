const r=require('express').Router();
const c=require('../controllers/fruitController');
const w=require('../utils/asyncHandler');


r.get('/',w(c.list));
r.get('/:id',w(c.get));
r.post('/',w(c.create));
r.put('/:id',w(c.update));
r.delete('/:id',w(c.remove));

module.exports=r;
