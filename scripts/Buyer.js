const BuyerFactory = (() => {
  let buyerId = 0;

  const CHARACTER_TYPES = {
    impulsive: "імпульсивний",
    balanced: "збалансований",
    cautious: "обережний"
  };

  const PROBABILITY_MAP = {
    "імпульсивний": {
      "new": 0.9,
      "no_discount": 0.8,
      "discount": 0.95,
      "big_discount": 0.99
    },
    "збалансований": {
      "new": 0.4,
      "no_discount": 0.5,
      "discount": 0.6,
      "big_discount": 0.7
    },
    "обережний": {
      "new": 0.05,
      "no_discount": 0.2,
      "discount": 0.1,
      "big_discount": 0.15
    }
  };

  function getRandomCharacter() {
  const values = [
    CHARACTER_TYPES.impulsive,
    CHARACTER_TYPES.impulsive,
    CHARACTER_TYPES.balanced,
    CHARACTER_TYPES.cautious,

  ];
      return values[Math.floor(Math.random() * values.length)];
  }

  function getRandomViewLimit(min = 3, max = 10) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createBuyer() {
    const character = getRandomCharacter();
    const viewLimit = getRandomViewLimit();

    const buyer = {
      id: buyerId++,
      character,
      viewLimit,
      purchaseProbabilityMap: PROBABILITY_MAP[character],
      purchasedItems: [],
      purchaseStats: {
        totalViewed: viewLimit,
        totalBought: 0,
        categoryTypes: {
          new: 0,
          no_discount: 0,
          discount: 0,
          big_discount: 0
        }
      },
      decideToBuy(category_type) {
        const probability = this.purchaseProbabilityMap[category_type] || 0;
        return Math.random() < probability;
      },
      buy(item) {
        this.purchasedItems.push(item);
        this.purchaseStats.totalBought++;

        const type = item.category_type || "no_discount";
        if (this.purchaseStats.categoryTypes.hasOwnProperty(type)) {
          this.purchaseStats.categoryTypes[type]++;
        }
      }
    };

    return buyer;
  }

  return {
    createBuyer
  };
})();
