export const categories = [
  ['pastry', 'Pastry quality', 'How good does the pastry taste and feel? Think about flavour, texture, and whether it is too dry or soggy.'],
  ['filling', 'Filling quality', 'How good does the filling taste? Think about the fruit, spice, sweetness, and texture.'],
  ['ratio', 'Pastry to filling ratio', 'Is there a good balance of pastry and filling in each bite, without too much of either?'],
  ['portion', 'Portion size', 'Is one pie a satisfying size to eat, without feeling too small or too large?'],
  ['dusting', 'Quality of dusting', 'How good is the sugar dusting on top? Think about even coverage, texture, and whether there is too much or too little.']
];
const ratingDescriptions = [
  'Terrible — vomit-inducing',
  'Awful — one bite was too many',
  'Very bad — wouldn’t try again',
  'Poor — needs a lot of work',
  'Below average — disappointing',
  'Average — nothing special',
  'Good — would happily eat it',
  'Very good — would choose it again',
  'Excellent — a festive favourite',
  'Outstanding — almost pie perfection',
  'Best mince pie I’ve ever tasted'
];
export const ratingDescription = value => ratingDescriptions[Math.round(Number(value)*2)];
export const overall = review => categories.reduce((n, [key]) => n + Number(review[key]), 0) / categories.length;
export const perPie = pie => Number(pie.price_pence) / 100 / Number(pie.box_count);
export const money = number => new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'}).format(number);
export function stats(pie, reviews) {
  const rows = reviews.filter(r => r.pie_id === pie.id);
  const result = {count:rows.length, overall:null, value:null};
  for (const [key] of categories) result[key] = rows.length ? rows.reduce((n,r)=>n+Number(r[key]),0)/rows.length : null;
  if (rows.length) {
    result.overall = rows.reduce((n,r)=>n+overall(r),0)/rows.length;
    result.value = result.overall / perPie(pie);
  }
  return result;
}
export function ranked(pies, reviews, metric='overall', minimum=1) {
  return pies.filter(p=>!p.archived).map(p=>({...p,stats:stats(p,reviews)}))
    .filter(p=>p.stats.count>=minimum)
    .sort((a,b)=>(b.stats[metric] ?? -1)-(a.stats[metric] ?? -1) || b.stats.count-a.stats.count || a.name.localeCompare(b.name));
}
export function validateReview(review) {
  if (!review.pie_id || !review.profile_id) throw new Error('Choose a pie and a taster first.');
  for (const [key,label] of categories) {
    const n = review[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n<0 || n>5 || !Number.isInteger(n*2)) throw new Error(`Choose a score for ${label.toLowerCase()}.`);
  }
  if ((review.comments || '').length>2000) throw new Error('Keep your comment under 2,000 characters.');
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
