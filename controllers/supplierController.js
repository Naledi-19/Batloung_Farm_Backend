const model = require('../models/supplierModel');
const { id, required, text, check, HttpError } = require('../utils/helpers');
const { coordinates } = require('../utils/coordinates');
const provinces = ['Gauteng','Free State','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West'];
function values(body) {
  required(body, ['business_name','contact_person','phone','province','address']);
  check(provinces.includes(body.province), 'Invalid South African province');
  return [
    text(body.business_name,'business_name',120),
    text(body.contact_person,'contact_person',100),
    text(body.phone,'phone',25),
    body.province,
    text(body.address,'address',255),
    ...coordinates(body)
  ];
}
exports.list = async (req,res) => res.json(await model.list());
exports.get = async (req,res) => {const row=await model.get(id(req.params.id));if(!row)throw new HttpError(404,'Supplier not found');res.json(row);};
exports.create = async (req,res) => {const key=await model.create(values(req.body));res.status(201).json(await model.get(key));};
exports.update = async (req,res) => {const key=id(req.params.id);if(!(await model.update(key,values(req.body))))throw new HttpError(404,'Supplier not found');res.json(await model.get(key));};
exports.remove = async (req,res) => {const key=id(req.params.id);if(!(await model.remove(key)))throw new HttpError(404,'Supplier not found');res.json({message:'Supplier deleted'});};
