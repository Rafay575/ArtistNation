const stripe = require('../config/stripe');
const pool = require('../config/db');
const Joi = require('joi');
const { createHash } = require('crypto');
const { getBusinessByUserId, updateStripeAccount, findBusinessBySubdomain } = require('../models/business');
const { siteUrl } = require('../utils/onboardingValidation');
const { priceCart, fulfill } = require('../utils/storeCheckout');
const schema = Joi.object({
 requestId: Joi.string().guid({version:'uuidv4'}).required(),
 items: Joi.array().min(1).max(50).items(Joi.object({id:Joi.string().max(100).required(),title:Joi.string().max(200).required(),image:Joi.string().max(2000).required(),quantity:Joi.number().integer().min(1).max(99).required()})).required(),
 fanInfo: Joi.object({firstName:Joi.string().trim().max(100).required(),lastName:Joi.string().trim().max(100).required(),email:Joi.string().email().max(100).required(),phone:Joi.string().trim().max(50).required(),street:Joi.string().trim().max(255).required(),city:Joi.string().trim().max(100).required(),postalCode:Joi.string().trim().max(20).required(),pickupLocation:Joi.string().trim().max(255).required()}).required()
});
const ready = a => a.type === 'standard' && a.charges_enabled && a.payouts_enabled;
const missing = e => ['resource_missing','account_invalid'].includes(e.code);
exports.createPaymentIntent = async (req,res,next) => {
 try {
  const result = schema.validate(req.body);
  if(result.error) return res.status(400).json({error:result.error.message});
  const {requestId,items:requested,fanInfo} = result.value;
  const business = await findBusinessBySubdomain(req.params.subdomain);
  if(!business?.is_active || business.user_id !== req.fan.artist_id || !business.stripe_account_id) return res.status(403).json({error:'Artist payments unavailable'});
  const account = await stripe.accounts.retrieve(business.stripe_account_id);
  if(!ready(account)) return res.status(409).json({error:'Artist must complete Standard Stripe onboarding'});
  const hash = createHash('sha256').update(JSON.stringify(result.value)).digest('hex');
  const [existing] = await pool.query('SELECT * FROM store_checkouts WHERE id = ?', [requestId]);
  let checkout = existing[0];
  if(!checkout) {
   const [sections] = await pool.query("SELECT s.id,s.content FROM website_sections s JOIN website_pages p ON p.id=s.page_id WHERE p.user_id=? AND p.slug='home' AND s.type='store'",[business.user_id]);
   let items;
   try { items=priceCart(sections,requested); } catch(e) { return res.status(400).json({error:e.message}); }
   const [locations]=await pool.query('SELECT id FROM pickup_locations WHERE user_id=? AND name=? AND is_active=1',[business.user_id,fanInfo.pickupLocation]);
   if(!locations.length) return res.status(400).json({error:'Select an available pickup location'});
   const amount=items.reduce((sum,i)=>sum+Math.round(i.price*100)*i.quantity,0);
   if(!Number.isSafeInteger(amount)||amount>99999999) return res.status(400).json({error:'Cart exceeds payment limit'});
   await pool.query('INSERT IGNORE INTO store_checkouts (id,fan_id,business_id,artist_id,stripe_account_id,request_hash,payload,amount) VALUES (?,?,?,?,?,?,?,?)',[requestId,req.fan.id,business.id,business.user_id,account.id,hash,JSON.stringify({...fanInfo,items}),amount]);
   const [saved]=await pool.query('SELECT * FROM store_checkouts WHERE id=?',[requestId]); checkout=saved[0];
  }
  if(checkout.fan_id!==req.fan.id||checkout.business_id!==business.id||checkout.request_hash!==hash||checkout.stripe_account_id!==account.id) return res.status(409).json({error:'Checkout changed. Start a new checkout.'});
  if(Date.now()-new Date(checkout.created_at).getTime()>23*3600000) return res.status(409).json({error:'Checkout expired. Please retry.',code:'CHECKOUT_EXPIRED'});
  const data=typeof checkout.payload==='string'?JSON.parse(checkout.payload):checkout.payload;
  const origin=siteUrl(business).replace(/\/$/,'');
  // Direct charge: payment objects and processing fees belong to the artist.
  const session=checkout.session_id
   ?await stripe.checkout.sessions.retrieve(checkout.session_id,{}, {stripeAccount:account.id})
   :await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],client_reference_id:requestId,customer_email:data.email,
    line_items:data.items.map(i=>({quantity:i.quantity,price_data:{currency:'usd',unit_amount:Math.round(i.price*100),product_data:{name:i.title}}})),
    success_url:origin+'/?checkout_session={CHECKOUT_SESSION_ID}',cancel_url:origin+'/?checkout_cancelled=1'
   },{stripeAccount:account.id,idempotencyKey:'store-'+requestId});
  await pool.query('UPDATE store_checkouts SET session_id=? WHERE id=?',[session.id,requestId]);
  if(session.status==='expired') return res.status(409).json({error:'Checkout expired. Please retry.',code:'CHECKOUT_EXPIRED'});
  if(session.status!=='open'||!session.url) return res.status(409).json({error:'Checkout completed or expired. Check your orders before starting again.'});
  res.json({url:session.url});
 } catch(e){next(e);}
};
exports.confirmCheckout=async(req,res,next)=>{
 try {
  if(!/^cs_[a-zA-Z0-9_]+$/.test(req.params.sessionId)) return res.sendStatus(400);
  const business=await findBusinessBySubdomain(req.params.subdomain);
  const [rows]=await pool.query('SELECT * FROM store_checkouts WHERE session_id=? AND fan_id=? AND business_id=?',[req.params.sessionId,req.fan.id,business.id]);
  if(!rows[0]) return res.sendStatus(404);
  const session=await stripe.checkout.sessions.retrieve(req.params.sessionId,{}, {stripeAccount:rows[0].stripe_account_id});
  const orderId=await fulfill(session,rows[0].stripe_account_id);
  res.json({paid:!!orderId,orderId});
 }catch(e){next(e);}
};
exports.createConnectAccountLink=async(req,res,next)=>{
 try {
  const business=await getBusinessByUserId(req.user.id);
  if(!business) return res.status(404).json({error:'Business not found'});
  const base=new URL('/admin/payment-integration',process.env.FRONTEND_URL);
  if(base.protocol!=='https:'&&!(base.protocol==='http:'&&base.hostname==='localhost')) throw new Error('Configure a secure FRONTEND_URL');
  let account;
  if(business.stripe_account_id){
   try{account=await stripe.accounts.retrieve(business.stripe_account_id);}catch(e){if(missing(e)) return res.status(409).json({error:'This connection belongs to another Stripe environment. Contact support to migrate.'});throw e;}
   if(account.type!=='standard') return res.status(409).json({error:'Existing Express accounts require migration to Standard. Contact support; your current connection is preserved.'});
  }else{
   account=await stripe.accounts.create({type:'standard',email:req.user.email},{idempotencyKey:'standard-'+business.id});
   await updateStripeAccount(business.id,account.id,'pending');
  }
  const link=await stripe.accountLinks.create({account:account.id,type:'account_onboarding',refresh_url:base.href+'?refresh=true',return_url:base.href+'?success=true'});
  res.json({url:link.url});
 }catch(e){next(e);}
};
exports.getConnectStatus=async(req,res,next)=>{
 try{
  const business=await getBusinessByUserId(req.user.id);
  if(!business?.stripe_account_id) return res.json({connected:false,status:null});
  let account;
  try{account=await stripe.accounts.retrieve(business.stripe_account_id);}catch(e){if(missing(e)) return res.json({connected:false,status:'migration_required'});throw e;}
  const connected=ready(account);
  const status=connected?'active':account.requirements?.disabled_reason?'restricted':'pending';
  await updateStripeAccount(business.id,account.id,status);
  res.json({connected,status:account.type==='standard'?status:'migration_required',accountId:account.id,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,requirements:account.requirements?.currently_due||[]});
 }catch(e){next(e);}
};
exports.getPublicStripeStatus=async(req,res,next)=>{
 try{
  const business=await findBusinessBySubdomain(req.params.subdomain);
  if(!business) return res.sendStatus(404);
  if(!business.is_active||!business.stripe_account_id) return res.json({connected:false});
  try{res.json({connected:ready(await stripe.accounts.retrieve(business.stripe_account_id))});}catch(e){if(missing(e)) return res.json({connected:false});throw e;}
 }catch(e){next(e);}
};
