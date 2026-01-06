const GAME_PACKAGES = [
  {
    id: 'single',
    games: 1,
    label: 'لعبة واحدة',
    priceKWD: 1.5,
    priceUSD: 4.89  // For PayPal (KWD to USD conversion)
  },
  {
    id: 'double',
    games: 2,
    label: 'لعبتين',
    priceKWD: 2.5,
    priceUSD: 8.15
  },
  {
    id: 'five',
    games: 5,
    label: '5 ألعاب',
    priceKWD: 6,
    priceUSD: 19.56,
    popular: true
  },
  {
    id: 'ten',
    games: 10,
    label: '10 ألعاب',
    priceKWD: 10,
    priceUSD: 32.60
  }
];

module.exports = { GAME_PACKAGES };
