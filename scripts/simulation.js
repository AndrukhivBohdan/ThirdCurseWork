// === simulation.js ===

// Змінна для зберігання всіх товарів
let allItems = [];
let buyersGlobal = [];
let simulationTimeouts = [];
let simulationRunning = false;
let simulationInterrupted = false;
let skipAnimation = false;

function loadAllItems(callback) {
  $ajaxUtils.sendGetRequest("data/categories.json", function (categories) {
    let remaining = categories.length;

    if (remaining === 0) {
      if (callback) callback();
      return;
    }

    categories.forEach((cat) => {
      const url = `data/catalog/${cat.short_name}.json`;
      $ajaxUtils.sendGetRequest(url, function (catalogData) {
        const items = catalogData.catalog_items.map((item) => {
          item.categoryShort = cat.short_name;
          item.categoryName = cat.CategoryName;
          return item;
        });

        allItems = allItems.concat(items);
        remaining--;

        if (remaining === 0 && callback) {
          callback();
        }
      });
    });
  });
}

// Симуляція для всіх покупців
function simulateBuyerPurchase(buyer) {
  if (!allItems || allItems.length === 0) {
    console.warn("❌ Товари не завантажено або масив порожній!");
    return;
  }
  for (let i = 0; i < buyer.viewLimit; i++) {
    const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
    const categoryType = randomItem.category_type || "no_discount";

    if (buyer.decideToBuy(categoryType)) {
      buyer.buy(randomItem);
    }
  }
}

function simulateBuyers(buyerCount) {
  const buyers = [];
  for (let i = 0; i < buyerCount; i++) {
    const buyer = BuyerFactory.createBuyer();
    simulateBuyerPurchase(buyer);
    buyers.push(buyer);
  }
  return buyers;
}

// === Візуальна симуляція (існуючий код) ===

function startSim(buyerCount) {
  if (simulationRunning) {
    alert("Симуляція вже виконується.");
    return;
  }
  simulationRunning = true;
  simulationInterrupted = false;
  skipAnimation = false;
  buyersGlobal = [];

  const container = document.getElementById("buyers-container");
  const queues = document.querySelectorAll('.queue');
  container.innerHTML = "";
  document.querySelectorAll(".simulation-stats, .simulation-analysis").forEach(el => el.remove());

  loadAllItems(() => {
    if (!allItems || allItems.length === 0) {
      alert("⚠️ Не вдалося завантажити товари для симуляції.");
      simulationRunning = false;
      return;
    }

    buyersGlobal = simulateBuyers(buyerCount);

    if (skipAnimation) {
      if (!simulationInterrupted) {
        renderPurchaseStats(buyersGlobal);
        renderBuyerAnalysis(buyersGlobal);
      }
      simulationRunning = false;
      return;
    }

    let completedBuyers = 0;

    for (let i = 0; i < buyerCount; i++) {
      if (simulationInterrupted) break;

      const el = document.createElement("div");
      el.classList.add("entering-buyer");
      makeBuyerRemovable(el);

      const offset = Math.floor(Math.random() * 40) - 20;
      el.style.left = `calc(50% + ${offset}px)`;

      const timeoutId = setTimeout(() => {
        if (simulationInterrupted || skipAnimation) return;

        container.appendChild(el);
        el.style.animation = "moveUp 3s linear forwards";

        el.addEventListener("animationend", () => {
          el.remove();
          setTimeout(() => {
            if (simulationInterrupted || skipAnimation) return;
            moveToQueue(queues, () => {
              completedBuyers++;
              if (completedBuyers === buyerCount && !simulationInterrupted && !skipAnimation) {
                renderPurchaseStats(buyersGlobal);
                renderBuyerAnalysis(buyersGlobal);
                simulationRunning = false;
              }
            });
          }, 300 + Math.random() * 1000);
        });
      }, i * 400);
      simulationTimeouts.push(timeoutId);
    }
  });
}

function simulateBuyers(buyerCount) {
  const buyers = [];
  for (let i = 0; i < buyerCount; i++) {
    const buyer = BuyerFactory.createBuyer();
    simulateBuyerPurchase(buyer);
    buyers.push(buyer);
  }
  return buyers;
}

function moveToQueue(queues, onComplete) {
  if (simulationInterrupted) return;
  const buyer = document.createElement("div");
  buyer.classList.add("buyer");
  makeBuyerRemovable(buyer);

  const targetQueue = Array.from(queues).reduce((shortest, current) =>
    current.children.length < shortest.children.length ? current : shortest
  );

  targetQueue.appendChild(buyer);
  positionBuyersInQueue(targetQueue);
  handleQueue(targetQueue, onComplete);
}

function positionBuyersInQueue(queue) {
  const buyers = queue.querySelectorAll(".buyer");
  buyers.forEach((buyer, index) => {
    buyer.style.position = "absolute";
    buyer.style.left = "50%";
    buyer.style.transform = "translateX(-50%)";
    buyer.style.bottom = `${index * 35}px`;
  });
}

function handleQueue(queue, onComplete) {
  if (simulationInterrupted) return;
  if (queue.dataset.serving === "true") return;

  const buyer = queue.querySelector('.buyer');
  if (!buyer) return;

  queue.dataset.serving = "true";

  const store = document.getElementById("store-layout");
  const buyerRect = buyer.getBoundingClientRect();
  const storeRect = store.getBoundingClientRect();

  const initialLeft = buyerRect.left - storeRect.left;
  const initialTop = buyerRect.top - storeRect.top;

  const movingBuyer = document.createElement("div");
  movingBuyer.className = "buyer";
  movingBuyer.style.position = "absolute";
  makeBuyerRemovable(buyer);
  movingBuyer.style.left = `${initialLeft}px`;
  movingBuyer.style.top = `${initialTop}px`;

  store.appendChild(movingBuyer);
  buyer.remove();

  const cashier = queue.parentElement.querySelector('.cashier');
  const cashierRect = cashier.getBoundingClientRect();

  const targetLeft = cashierRect.left + cashierRect.width / 2 - storeRect.left - 10;
  const targetTop = cashierRect.top + cashierRect.height / 2 - storeRect.top - 10;

  movingBuyer.style.transition = "transform 1s linear";
  const dx = targetLeft - initialLeft;
  const dy = targetTop - initialTop;
  movingBuyer.style.transform = `translate(${dx}px, ${dy}px)`;

  const serviceTime = 2000 + Math.random() * 5000;
  setTimeout(() => {
    const finalLeft = initialLeft + dx;
    const finalTop = initialTop + dy;

    movingBuyer.style.transition = "none";
    movingBuyer.style.transform = "none";
    movingBuyer.style.left = `${finalLeft}px`;
    movingBuyer.style.top = `${finalTop}px`;

    requestAnimationFrame(() => {
      movingBuyer.style.transition = "top 1.5s linear";
      movingBuyer.style.top = `${finalTop + 200}px`;
    });

    setTimeout(() => {
      movingBuyer.remove();
      queue.dataset.serving = "false";
      positionBuyersInQueue(queue);
      handleQueue(queue, onComplete);

      if (onComplete) onComplete();
    }, 1700);
  }, serviceTime);
}

function makeBuyerRemovable(buyer) {
  buyer.addEventListener("click", () => {
    buyer.remove();
  });
}
function renderPurchaseStats(buyers) {
  if (simulationInterrupted) return;
  const stats = {
    big_discount: 0,
    discount: 0,
    new: 0,
    no_discount: 0,
  };

  // Підрахунок товарів за типом
  buyers.forEach((buyer) => {
    buyer.purchasedItems.forEach((item) => {
      const type = item.category_type || "no_discount";
      if (stats.hasOwnProperty(type)) {
        stats[type]++;
      }
    });
  });

  // Назви для відображення
  const typeLabels = {
    big_discount: "Товар з великою знижкою",
    discount: "Товар зі знижкою",
    new: "Новий товар",
    no_discount: "Товар без знижки",
  };
    const oldStats = document.querySelector(".simulation-stats");
        const oldAnalys = document.querySelector(".simulation-analysis");
  if (oldStats) {
    oldStats.remove();
    oldAnalys.remove();
  }
  

  // Побудова HTML-таблиці з класом для анімації
  let tableHtml = `
    <div class="simulation-stats mt-5">
      <h3 class="mb-3">📊 Результати симуляції</h3>
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Тип продукту</th>
            <th>Кількість</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const type in stats) {
    tableHtml += `
      <tr>
        <td>${typeLabels[type]}</td>
        <td>${stats[type]}</td>
      </tr>
    `;
  }

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  // Вставити в DOM
  const container = document.getElementById("main-content");
  container.insertAdjacentHTML("beforeend", tableHtml);

  // Анімаційне з'явлення (додається клас .show)
  const statBlock = container.querySelector(".simulation-stats");
  setTimeout(() => {
    statBlock.classList.add("show");
  }, 50);
}
function renderBuyerAnalysis(buyers) {
  if (simulationInterrupted) return;
  const counts = {
    Імпульсивний: 0,
    Збалансований: 0,
    Обережний: 0
  };

  buyers.forEach(b => {
    const type = guessBuyerType(b);
    counts[type]++;
  });

  const total = buyers.length;
  const impulsiveRatio = counts.Імпульсивний / total;
  const cautiousRatio = counts.Обережний / total;
  const balancedRatio = counts.Збалансований / total;

  let conclusion = "";

  if (impulsiveRatio >= 0.5 && impulsiveRatio > cautiousRatio && impulsiveRatio > balancedRatio) {
    conclusion = `
      🔍 Аналіз показує, що більшість покупців є <b>імпульсивними</b>.
      Це вказує на те, що знижки, нові товари або яскрава презентація товару сильно впливають на поведінку клієнтів.
      Рекомендується робити акцент на маркетингових акціях, вітринах, спеціальних пропозиціях та яскравих візуальних елементах у магазині.
    `;
  } else if (cautiousRatio >= 0.5 && cautiousRatio > impulsiveRatio && cautiousRatio > balancedRatio) {
    conclusion = `
      🔍 Спостерігається переважання <b>обережних</b> покупців.
      Такі клієнти купують рідше, обирають переважно перевірені або дуже знижені товари.
      Рекомендується надавати детальну інформацію про товари, чітке ціноутворення, а також підкреслювати надійність і гарантії.
    `;
  } else if (balancedRatio >= 0.5 && balancedRatio > impulsiveRatio && balancedRatio > cautiousRatio) {
    conclusion = `
      🔍 Поведінка покупців виглядає <b>збалансованою</b>.
      Покупці роблять вибір обдумано, частково орієнтуючись на знижки, але не уникаючи нових чи звичайних товарів.
      Оптимально поєднувати знижки, новинки та стабільний асортимент — вони оцінять гнучкість і логічну презентацію.
    `;
  } else {
    conclusion = `
      🔍 Клієнтська база виглядає <b>змішаною</b> — немає чітко домінуючої групи.
      Це означає, що до магазину приходять покупці з різними стратегіями поведінки.
      Варто підтримувати баланс між маркетингом, стабільністю цін та гнучкістю асортименту.
    `;
  }

  const analysisHtml = `
    <div class="mt-4 p-3 border rounded bg-light shadow-sm text-dark simulation-analysis">
      <h4>🧠 Аналітичне припущення:</h4>
      <p>${conclusion}</p>
    </div>
  `;

  const container = document.getElementById("main-content");
  container.insertAdjacentHTML("beforeend", analysisHtml);
}

function guessBuyerType(buyer) {
  const stats = buyer.purchaseStats;
  if (!stats || !stats.totalViewed || !stats.categoryTypes) {
    return "Невизначений";
  }

  const ratio = stats.totalBought / stats.totalViewed;
  const types = stats.categoryTypes;

  const dominantType = Object.entries(types).sort((a, b) => b[1] - a[1])[0][0];

  if (ratio >= 0.6 && (dominantType === "new" || dominantType === "no_discount")) {
    return "Імпульсивний";
  } else if (ratio >= 0.3 && (dominantType === "discount" || dominantType === "big_discount")) {
    return "Збалансований";
  } else {
    return "Обережний";
  }
}
