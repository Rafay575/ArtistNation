function connectStatus(account) {
  const requirements = account.requirements || {};
  const due = [...new Set([...(requirements.currently_due || []), ...(requirements.past_due || [])])];
  const pendingVerification = requirements.pending_verification || [];
  const connected = account.type === 'standard' && !!account.charges_enabled && !!account.payouts_enabled;
  let status;
  if (account.type !== 'standard') status = 'migration_required';
  else if (connected) status = 'active';
  else if (!due.length && (requirements.disabled_reason === 'requirements.pending_verification' || pendingVerification.length)) status = 'under_review';
  else if (requirements.disabled_reason || requirements.past_due?.length || account.details_submitted) status = 'restricted';
  else status = 'pending';
  return {
    connected, status,
    // Keep the existing database enum; the API carries the more detailed review state.
    databaseStatus: connected ? 'active' : status === 'restricted' ? 'restricted' : 'pending',
    accountId: account.id,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    requirements: due,
    pendingVerification,
    action: status === 'migration_required' ? 'support'
      : !connected && status !== 'under_review' && !requirements.disabled_reason?.startsWith('rejected.')
        && (!account.details_submitted || due.length > 0) ? 'onboard' : 'dashboard',
  };
}
module.exports = { connectStatus };
