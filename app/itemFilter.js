// Single source of truth for which catering items the kitchen does NOT prepare
// (drinks, wine, snacks, external orders). Used by the Excel sheets and by
// change detection so they always agree.
//
// Terms are matched as WHOLE WORDS (a trailing "s"/"es" is allowed for plurals),
// so "tea" hides "Tea & coffee" but not "steak", and "rum" hides "Rum" but not
// "crumble". The keep-list wins over the skip-list, so a food item that happens
// to contain a drink word is still shown.

const KEEP = ['pot', 'bowl', 'brioche', 'bacon', 'sandwich', 'biscuit']

const SKIP = [
  // Hot drinks
  'tea', 'coffee', 'hot chocolate',
  // Soft drinks & mixers
  'water', 'juice', 'soft drink', 'coca', 'lemonade', '7up', 'fanta',
  'lemonaid', 'kombucha', 'smoothie', 'squash', 'cordial', 'elderflower',
  'presse', 'tonic', 'soda water', 'remedy', 'fentiman',
  // Beer, cider & low/no alcohol
  'beer', 'lager', 'ale', 'cider', 'corona', 'peroni', 'lucky saint',
  // Wine, sparkling & grape varieties
  'wine', 'prosecco', 'champagne', 'sparkling', 'filtered',
  'pinot', 'grigio', 'sauvignon', 'chardonnay', 'merlot', 'cabernet',
  'malbec', 'shiraz', 'syrah', 'tempranillo', 'rioja', 'riesling',
  'rosé', 'rose', 'chablis', 'bordeaux', 'burgundy', 'chianti',
  'zinfandel', 'grenache', 'viognier', 'verdejo', 'albariño',
  'inzolia', 'montepulciano', 'primitivo', "nero d'avola", 'vermentino',
  'reserve rouge', 'reserve blanc', 'maison sabadie',
  'bodegas', 'fleurey', 'frunza', 'petalo',
  // Spirits & cocktails
  'gin', 'vodka', 'rum', 'whisky', 'whiskey', 'liqueur', 'spirits',
  'cocktail', 'mocktail',
  // Non-food items
  'ice bucket',
  // Snacks
  'crisps', 'nibble', 'rice cake', 'pretzel',
  // External orders
  'just eat',
]

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build one regex: not preceded by a letter/digit, optional plural, not
// followed by a letter/digit.
function wholeWordRegex(terms) {
  const body = terms.map(escapeRegex).join('|')
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?:e?s)?(?![\\p{L}\\p{N}])`, 'iu')
}

const KEEP_RE = wholeWordRegex(KEEP)
const SKIP_RE = wholeWordRegex(SKIP)

// True if the item is a drink / snack / external item the kitchen doesn't make.
export function isSnackOrBev(name) {
  const n = String(name || '')
  if (KEEP_RE.test(n)) return false
  return SKIP_RE.test(n)
}
