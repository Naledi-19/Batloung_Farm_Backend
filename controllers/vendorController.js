const model = require('../models/vendorModel');
const { id, required, text, HttpError } = require('../utils/helpers');
const { coordinates } = require('../utils/coordinates');
function values(body) {
  required(body,['vendor_name','phone_number','location']);
  return [
    text(body.vendor_name,'vendor_name',120),
    text(body.phone_number,'phone_number',25),
    text(body.location,'location',150),
    ...coordinates(body)
  ];
}
exports.list = async(req,res) => res.json(await model.list(req.query.search));
exports.get = async(req,res) => {const row=await model.get(id(req.params.id));if(!row)throw new HttpError(404,'Vendor not found');res.json(row);};
exports.create = async(req,res) => {const key=await model.create(values(req.body));res.status(201).json(await model.get(key));};
exports.update = async(req,res) => {const key=id(req.params.id);if(!(await model.update(key,values(req.body))))throw new HttpError(404,'Vendor not found');res.json(await model.get(key));};

exports.remove = async(req,res) => {
  const key = id(req.params.id);
  if (!(await model.remove(key))) throw new HttpError(404, 'Vendor not found');
  res.json({message:'Vendor deleted'});
};
