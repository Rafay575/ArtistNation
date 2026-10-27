const pool = require('../config/db');
const stripe = require('../config/stripe');
const { randomUUID } = require('crypto');
const { withBusinessLock, syncBusiness } = require('../utils/billingLifecycle');
const { idOf } = require('../utils/billingDates');
async function businessFor(userId) {
 const [rows]=await pool.query('SELECT b.id FROM businesses b WHERE b.user_id=?',[userId]);
 if(!rows[0]) throw new Error('Business not found');
 return rows[0].id;
}
function returnUrl() {
 const url=new URL('/admin/billings',process.env.FRONTEND_URL);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&url.hostname==='localhost')) throw new Error('Configure FRONTEND_URL');
 return url.href;
}
const handle = work => async(req,res) => {
 try { await work(req,res); } catch(error) { console.error('Billing operation failed:',error.message); res.status(503).json({error:'Billing is temporarily unavailable. Please retry or contact support.'}); }
};
exports.getBillingOverview=handle(async(req,res)=>{
 const id=await businessFor(req.user.id);
 const data=await withBusinessLock(id,async(connection,business)=>{
  const state=await syncBusiness(connection,business);
  const [users]=await connection.query('SELECT id,full_name,email,plan,billing_cycle FROM users WHERE id=?',[req.user.id]);
  const sub=state.subscriptions[0];
  return {user:users[0], business:{id,name:business.business_name,subdomain:business.subdomain,is_active:state.state==='active',grace_period_end:state.state==='active'?null:state.graceEnd,lifecycle:state.state},
   subscription:{id:sub.id,stripe_id:sub.stripe_subscription_id,status:sub.status,stripe_status:sub.stripe_status,cancel_at_period_end:sub.cancel_at_period_end,started_at:sub.started_at,expires_at:sub.expires_at,
    is_trialing:sub.status==='trialing',is_active:sub.status==='active'||sub.status==='trialing',is_pending_cancel:sub.status==='pending_cancel',is_inactive:sub.status==='inactive',can_renew:state.state!=='active'&&state.subscriptions.every(s=>['canceled','incomplete_expired'].includes(s.stripe_status))}};
 });
 if(!data) return res.sendStatus(404);
 res.json({success:true,data});
});
exports.getInvoiceHistory=handle(async(req,res)=>{
 const [invoices]=await pool.query(`SELECT ih.* FROM invoice_history ih JOIN subscriptions s ON s.id=ih.subscription_id JOIN businesses b ON b.id=s.business_id WHERE b.user_id=? ORDER BY ih.created_at DESC LIMIT 100`,[req.user.id]);
 res.json({success:true,invoices:invoices.map(invoice=>({...invoice,amount:Number(invoice.amount)}))});
});
exports.getBillingStatus=handle(async(req,res)=>{
 const [rows]=await pool.query(`SELECT MAX(s.expires_at) AS expires_at FROM subscriptions s JOIN businesses b ON b.id=s.business_id WHERE b.user_id=?`,[req.user.id]);
 const [latest]=await pool.query(`SELECT s.status,s.stripe_status,s.cancel_at_period_end FROM subscriptions s JOIN businesses b ON b.id=s.business_id WHERE b.user_id=? ORDER BY s.id DESC LIMIT 1`,[req.user.id]);
 if(!latest[0]) return res.status(404).json({error:'No subscription found'});
 const [customers]=await pool.query('SELECT DISTINCT s.stripe_customer_id FROM subscriptions s JOIN businesses b ON b.id=s.business_id WHERE b.user_id=?',[req.user.id]);
 if(customers.length!==1) throw new Error('Billing customer configuration requires review');
 const now=await require('../utils/billingClock').billingNow(customers[0].stripe_customer_id);
 const state={...require('../utils/billingDates').lifecycle(rows[0].expires_at,now),evaluatedAt:new Date(now)};
 res.json({...state,...latest[0]});
});
exports.getInvoiceDocument=handle(async(req,res)=>{
 if(!/^\d+$/.test(req.params.id)) return res.sendStatus(400);
 const [rows]=await pool.query(`SELECT ih.stripe_invoice_id,s.stripe_customer_id FROM invoice_history ih JOIN subscriptions s ON s.id=ih.subscription_id JOIN businesses b ON b.id=s.business_id WHERE ih.id=? AND b.user_id=?`,[req.params.id,req.user.id]);
 if(!rows[0]) return res.sendStatus(404);
 const invoice=await stripe.invoices.retrieve(rows[0].stripe_invoice_id);
 if(idOf(invoice.customer)!==rows[0].stripe_customer_id) return res.sendStatus(403);
 const url=invoice.invoice_pdf||invoice.hosted_invoice_url;
 if(!url) return res.json({available:false,message:'Stripe has not generated a document for this invoice yet.'});
 res.json({available:true,url,type:invoice.invoice_pdf?'pdf':'invoice'});
});
async function changeCancellation(req,res,cancel) {
 const id=await businessFor(req.user.id);
 const result=await withBusinessLock(id,async(connection,business)=>{
  let state=await syncBusiness(connection,business);
  const local=state.subscriptions[0];
  if(['canceled','incomplete_expired'].includes(local.stripe_status)) return {ended:true};
  await stripe.subscriptions.update(local.stripe_subscription_id,{cancel_at_period_end:cancel});
  state=await syncBusiness(connection,business);
  return state;
 });
 if(result?.ended) return res.status(409).json({error:'This subscription has ended. Use Renew subscription to restart.'});
 res.json({success:true,message:cancel?'Renewal canceled. Access continues through your confirmed paid-through date.':'Automatic renewal restored.',expires_at:result?.paidThrough,cancel_at_period_end:cancel});
}
exports.cancelSubscription=handle((req,res)=>changeCancellation(req,res,true));
exports.reactivateSubscription=handle((req,res)=>changeCancellation(req,res,false));
exports.createPortal=handle(async(req,res)=>{
 const id=await businessFor(req.user.id);
 const result=await withBusinessLock(id,async(connection,business)=>{
  const state=await syncBusiness(connection,business);
  const session=await stripe.billingPortal.sessions.create({customer:state.subscriptions[0].stripe_customer_id,return_url:returnUrl(),...(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?{configuration:process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID}:{})});
  return {url:session.url};
 });
 res.json(result);
});
exports.renewSubscription=handle(async(req,res)=>{
 const id=await businessFor(req.user.id);
 const result=await withBusinessLock(id,async(connection,business)=>{
  const state=await syncBusiness(connection,business);
  if(state.state==='active'||state.subscriptions.some(sub=>!['canceled','incomplete_expired'].includes(sub.stripe_status))) return {conflict:true};
  const [users]=await connection.query('SELECT plan,billing_cycle,stripe_customer_id FROM users WHERE id=?',[req.user.id]);
  const user=users[0];
  const priceId=process.env[`STRIPE_${user.plan.toUpperCase()}_${user.billing_cycle.toUpperCase()}_PRICE_ID`]||(user.plan==='starter'?process.env[user.billing_cycle==='yearly'?'STRIPE_YEARLY_PRICE_ID':'STRIPE_MONTHLY_PRICE_ID']:null);
  if(!priceId) throw new Error('Plan price is not configured for this sandbox');
  const price=await stripe.prices.retrieve(priceId);
  if(!price.active||!price.recurring||price.recurring.interval!==(user.billing_cycle==='yearly'?'year':'month')||price.recurring.interval_count!==1) throw new Error('Invalid recurring price configuration');
  const [attempts]=await connection.query('SELECT * FROM billing_checkout_attempts WHERE business_id=?',[id]);
  let attempt=attempts[0];
  if(attempt?.session_id) {
   const session=await stripe.checkout.sessions.retrieve(attempt.session_id);
   if(session.status==='open') return {url:session.url};
   if(session.status==='complete' && !state.subscriptions.some(sub=>sub.stripe_subscription_id===idOf(session.subscription))) return {conflict:true};
   await connection.query('DELETE FROM billing_checkout_attempts WHERE business_id=?',[id]); attempt=null;
  }
  if(!attempt) {
   attempt={request_id:randomUUID()};
   await connection.query('INSERT INTO billing_checkout_attempts (business_id,request_id) VALUES (?,?)',[id,attempt.request_id]);
  }
  // Commit the retry ledger before making an external request. A network or DB failure must not create a second subscription.
  await connection.commit();
  await connection.beginTransaction();
  const [stillPresent] = await connection.query('SELECT id FROM businesses WHERE id=? FOR UPDATE',[id]);
  if(!stillPresent.length) throw new Error('Account is no longer available');
  if(attempt.created_at && !attempt.session_id && Date.now()-new Date(attempt.created_at).getTime()>23*3600000) throw new Error('Unresolved checkout requires support review');
  const metadata={artistnation_business_id:String(id),artistnation_request_id:attempt.request_id,plan:user.plan,billing_cycle:user.billing_cycle};
  const session=await stripe.checkout.sessions.create({mode:'subscription',customer:state.subscriptions[0].stripe_customer_id,line_items:[{price:priceId,quantity:1}],metadata,subscription_data:{metadata},success_url:returnUrl()+'?renewed=1',cancel_url:returnUrl()}, {idempotencyKey:'billing-renew-'+attempt.request_id});
  await connection.query('UPDATE billing_checkout_attempts SET session_id=? WHERE business_id=?',[session.id,id]);
  return {url:session.url};
 });
 if(result?.conflict) return res.status(409).json({error:'A subscription already exists. Refresh billing or use Manage payment details to pay its invoice.'});
 res.json(result);
});
