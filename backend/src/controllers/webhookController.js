const stripe = require('../config/stripe');
const pool = require('../config/db');
const { invoiceSubscription } = require('../utils/billingDates');
const { withBusinessLock, syncBusiness, attachCheckout } = require('../utils/billingLifecycle');
async function handleStripeWebhook(req,res) {
 let event;
 try {event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);} catch {return res.status(400).json({error:'Invalid Stripe signature'});}
 // Connected-account events belong exclusively to the Connect webhook.
 if(event.account) return res.status(400).json({error:'Platform events only'});
 const object=event.data.object;
 const relevant=event.type.startsWith('customer.subscription.')||event.type.startsWith('invoice.')||event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded';
 if(!relevant) return res.json({received:true});
 try {
  const subId=event.type.startsWith('customer.subscription.')?object.id:invoiceSubscription(object);
  const [rows]=subId?await pool.query('SELECT business_id FROM subscriptions WHERE stripe_subscription_id=?',[subId]):[[]];
  const metadataId=Number(object.metadata?.artistnation_business_id);
  const businessId=rows[0]?.business_id||(Number.isInteger(metadataId)&&metadataId>0?metadataId:null);
  if(!businessId) {
   if (subId) {
    const [archived] = await pool.query("SELECT id FROM expired_account_records WHERE JSON_SEARCH(billing_record,'one',?) IS NOT NULL LIMIT 1", [subId]);
    if (archived.length) return res.json({received:true});
   }
   // A signup event may arrive before the signup transaction commits. Stripe must retry it.
   if(object.metadata?.artistnation_signup==='1') return res.sendStatus(503);
   return res.json({received:true});
  }
  await withBusinessLock(businessId,async(connection,business)=>{
   if(event.type.startsWith('checkout.session.')) await attachCheckout(connection,business,object);
   await syncBusiness(connection,business);
  });
  res.json({received:true});
 }catch(error){console.error('Platform billing webhook failed:',error.message);res.sendStatus(500);}
}
module.exports={handleStripeWebhook};
