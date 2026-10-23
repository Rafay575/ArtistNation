const DAY = 86400000;
const idOf = value => typeof value === 'string' ? value : value?.id;
function invoiceSubscription(invoice) {
 return idOf(invoice.parent?.subscription_details?.subscription || invoice.subscription);
}
function paidInvoiceEnd(invoice, subscriptionId) {
 if (invoice.status !== 'paid' || invoiceSubscription(invoice) !== subscriptionId) return 0;
 const ends = (invoice.lines?.data || []).filter(line => {
  const parent = line.parent?.subscription_item_details;
  return (idOf(parent?.subscription || line.subscription) === subscriptionId || line.type === 'subscription')
   && !(parent?.proration ?? line.proration);
 }).map(line => Number(line.period?.end || 0));
 return Math.max(0, ...ends);
}
function lifecycle(expiresAt, now = Date.now()) {
 const end = expiresAt ? new Date(expiresAt).getTime() : NaN;
 if (!Number.isFinite(end)) return { state: 'unavailable', paidThrough: null, graceEnd: null };
 const grace = end + 30 * DAY;
 return { state: now < end ? 'active' : now < grace ? 'grace' : 'expired', paidThrough: new Date(end), graceEnd: new Date(grace) };
}
function subscriptionPeriodEnd(subscription) {
 const periods = (subscription.items?.data || []).map(item => item.current_period_end).filter(Number.isFinite);
 return periods.length ? Math.min(...periods) : subscription.current_period_end || subscription.trial_end || null;
}
module.exports = { DAY, idOf, invoiceSubscription, paidInvoiceEnd, lifecycle, subscriptionPeriodEnd };
