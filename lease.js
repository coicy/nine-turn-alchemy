(function (root) {
  'use strict';

  const E = root.AlchemyEconomy || (typeof require === 'function' ? require('./economy.js') : null);
  const schedule = [[7, 40], [14, 120], [21, 120], [28, 120]];
  const procurement = Object.freeze({firstDay:15, lastDay:21, minimum:120, premium:20, featuredTurn:9, featuredPremium:120});

  function ensure(campaign) {
    if (!campaign.lease) {
      const firstDay = campaign.day + (campaign.phase === 'open' ? 0 : 1);
      campaign.lease = {
        terms: schedule.filter(([day]) => day >= firstDay)
          .map(([day, amount]) => ({day, amount, paid:0, paidDay:null})),
        purchase: null
      };
    }
    return campaign.lease;
  }

  function amountLeft(term) {
    return term.amount - term.paid;
  }

  function unpaid(campaign) {
    return (campaign.lease?.terms || [])
      .filter(term => term.day <= campaign.day && amountLeft(term) > 0);
  }

  function closingQuote(campaign) {
    const terms = unpaid(campaign);
    const due = terms.reduce((total, term) => total + amountLeft(term), 0);
    const coins = Math.max(0, campaign.economy?.coins || 0);
    const payment = Math.min(due, coins);
    return {due, payment, balance:coins - payment, remaining:due - payment,
      graceDay:terms.length ? terms[0].day + 2 : null};
  }

  function collectRent(campaign) {
    const quote = closingQuote(campaign);
    if (!quote.due) return null;
    const e = E.ensure(campaign);
    let unallocated = quote.payment;
    for (const term of unpaid(campaign)) {
      const amount = Math.min(unallocated, amountLeft(term));
      term.paid += amount;
      unallocated -= amount;
      if (!amountLeft(term)) term.paidDay = campaign.day;
    }
    e.coins -= quote.payment;
    e.spent += quote.payment;
    E.recordCash(campaign,"铺租",e.coins+quote.payment,campaign.day);
    root.AlchemyGameFeel?.emit('rent-paid',{day:campaign.day,payment:quote.payment,remaining:quote.remaining,tier:'medium'});
    return quote;
  }

  function canOffer(campaign) {
    return !!campaign.lease && !campaign.lease.purchase &&
      campaign.phase === 'open' && campaign.day >= procurement.firstDay &&
      campaign.day <= procurement.lastDay;
  }

  function purchaseQuote(campaign, id) {
    if (!canOffer(campaign)) return null;
    const pill = campaign.economy?.pills?.find(item => item.id === id);
    if (!pill || !Number.isFinite(pill.value) || pill.value < procurement.minimum ||
        !Number.isInteger(pill.turn) || pill.turn < 1 || pill.turn > 100) return null;
    const premium = pill.turn >= procurement.featuredTurn ? procurement.featuredPremium : procurement.premium;
    return {pill, premium, payout:E.saleValue(campaign,pill) + premium};
  }

  function buyPill(campaign, id) {
    const quote = purchaseQuote(campaign, id);
    if (!quote) return false;
    const e = campaign.economy;
    e.pills.splice(e.pills.indexOf(quote.pill), 1);
    campaign.lease.purchase = {id, day:campaign.day, value:quote.pill.value, payout:quote.payout};
    E.credit(campaign, quote.payout, '药铺收购',id);
    root.AlchemyGameFeel?.emit('sell',{kind:'pharmacy',id,value:quote.payout,tier:'large'});
    return true;
  }

  const api = {ensure, closingQuote, collectRent, procurement, canOffer, purchaseQuote, buyPill};
  if (typeof module !== 'undefined') module.exports = api;
  else root.AlchemyLease = api;
})(typeof window !== 'undefined' ? window : globalThis);
