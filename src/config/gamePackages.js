const GAME_PACKAGES = [
  {
    id: 'single',
    games: 1,
    label: 'لعبة واحدة',
    priceKWD: 1.5,
    priceUSD: 4.89,
    originalPriceKWD: null,
    originalPriceUSD: null,
    discount: null,
    discountLabel: null,
    popular: false
  },
  {
    id: 'double',
    games: 2,
    label: 'لعبتين',
    priceKWD: 2.5,
    priceUSD: 8.15,
    originalPriceKWD: null,
    originalPriceUSD: null,
    discount: null,
    discountLabel: null,
    popular: false
  },
  {
    id: 'five',
    games: 5,
    label: '5 ألعاب',
    priceKWD: 4.5,
    priceUSD: 14.67,
    originalPriceKWD: 6,
    originalPriceUSD: 19.56,
    discount: 25,
    discountLabel: 'عرض العيد',
    popular: true
  },
  {
    id: 'ten',
    games: 10,
    label: '10 ألعاب',
    priceKWD: 8,
    priceUSD: 26.08,
    originalPriceKWD: 10,
    originalPriceUSD: 32.60,
    discount: 20,
    discountLabel: null,
    popular: false
  }
];

module.exports = { GAME_PACKAGES };
