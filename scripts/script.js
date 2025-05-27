// Ловить всі сабміти
document.addEventListener("submit", function (e) {
  console.warn("🛑 Сабміт форми — можливе перезавантаження!");
  e.preventDefault();
    this.alert("dfa");
});

// Ловить всі reload'и
window.addEventListener("beforeunload", function () {
  console.warn("🔁 Сторінка намагається перезавантажитись");
  this.alert("dfa");
});

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("collapsable-nav");
  const bsCollapse = new bootstrap.Collapse(menuToggle, { toggle: false });

  document
    .querySelector(".navbar-toggler")
    .addEventListener("blur", function (event) {
      let screenWidth = window.innerWidth;
      if (screenWidth < 768) {
        bsCollapse.toggle();
      }
    });
});

(function (global) {
  const ns = {};

  const homeHtml = "snippets/home-snippet.html";
  const allCategoriesUrl = "data/categories.json";
  const categoriesTitleHtml = "snippets/categories-title-snippet.html";
  const categoryHtml = "snippets/category-snippet.html";
  const catalogItemUrl = "data/catalog/";
  const catalogItemTitleHtml = "snippets/catalog-items-title.html";
  const catalogItemHtml = "snippets/catalog-item.html";
  const catalogChangeTitle = "snippets/catalog-change-title.html";
  const catalogChangeItemHtml = "snippets/catalog-change-item.html";
  const simulationTitle = "snippets/simulation-title.html";

  const insertHtml = function (selector, html) {
    const targetElem = document.querySelector(selector);
    targetElem.innerHTML = html;
  };
  const showLoading = function (selector) {
    let html = "<div class='text-center'>";
    html += "<img src='images/ajax-loader.gif' alt='loading'></div>";
    insertHtml(selector, html);
  };

  const insertProperty = function (string, propName, propValue) {
    const propToReplace = "{{" + propName + "}}";
    string = string.replace(new RegExp(propToReplace, "g"), propValue);
    return string;
  };

  function insertPrice(html, amountPropName, item, finalPrice) {
    if (!item.discount) {
      html = insertProperty(html, amountPropName, item.price + "$");
      return html;
    }
    item =
      "<div><s>" +
      item.price +
      "$</s><span class='text-success ms-2'>-" +
      item.discount +
      "%<span></div>";
    item += finalPrice + "$";
    html = insertProperty(html, amountPropName, item);
    return html;
  }

  const switchCatalogToActive = function () {
    let classes = document.querySelector("#navHomeButton").className;
    classes = classes.replace(new RegExp("active", "g"), "");
    document.querySelector("#navHomeButton").className = classes;

    classes = document.querySelector("#navCatalogButton").className;
    if (classes.indexOf("active") === -1) {
      classes += " active";
      document.querySelector("#navCatalogButton").className = classes;
    }
  };

  document.addEventListener("DOMContentLoaded", function (event) {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(
      homeHtml,
      function (responseText) {
        document.querySelector("#main-content").innerHTML = responseText;
      },
      false
    );
  });
  ns.about = function (){
    alert("Цей сайт зробив Андрухів Богдан");
  }
  ns.loadCatalogCategories = function () {
    showLoading("#main-content");
    switchCatalogToActive();
    $ajaxUtils.sendGetRequest(allCategoriesUrl, buildAndShowCategoriesHTML);
  };

  ns.loadCatalogItems = function (categoryShort) {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(
      catalogItemUrl + categoryShort + ".json",
      buildAndShowCatalogItemsHTML
    );
  };

  ns.loadCatalogForChanges = function () {
    showLoading("#main-content");
    switchCatalogToActive();
    $ajaxUtils.sendGetRequest(
      allCategoriesUrl,
      buildAndShowCatalogChangeItemsHTML
    );
  };

  ns.updateItem = function (id, catShortName) {
      const productName = document.getElementById("productName-" + id).value;
    const quantity = parseInt(document.getElementById("quantity-" + id).value);
    const price = parseFloat(document.getElementById("price-" + id).value);
    const discount = parseFloat(
      document.getElementById("discount-" + id).value
    );
    const count = parseFloat(
      document.getElementById("changeAmount-" + id).value
    );

    const data = { id, catShortName, quantity, price, discount, count, productName};

    $ajaxUtils.sendPostRequest(
      "/api/update-item",
      data,
      function (response) {
        alert("Оновлено успішно");
      },
      false
    );
  };
  
  ns.addNewItem = function () {
    const categoryShort = document.getElementById("new-product-category").value;
    const newCategoryName = document.getElementById("new-category-name").value;
    const productName = document.getElementById("new-product-name").value;
    const description = document.getElementById(
      "new-product-description"
    ).value;
    const price = parseFloat(
      document.getElementById("new-product-price").value
    );
    const discount =
      parseFloat(document.getElementById("new-product-discount").value) || 0;
    const quantity = parseInt(
      document.getElementById("new-product-quantity").value
    );

    if (!productName || !price || !quantity) {
      alert("Заповніть обовʼязкові поля: назва, ціна, кількість!");
      return;
    }

    // Якщо обрано "Інше" — створити нову категорію
    if (categoryShort === "other" && newCategoryName) {
      $ajaxUtils.sendPostRequest(
        "/api/add-category",
        { name: newCategoryName },
        function (response) {
          // Після створення категорії додати товар
          addItemToCategory(
            response.short_name,
            productName,
            description,
            price,
            discount,
            quantity
          );
        }
      );
    } else if (categoryShort && categoryShort !== "other") {
      // Додати товар до існуючої категорії
      addItemToCategory(
        categoryShort,
        productName,
        description,
        price,
        discount,
        quantity
      );
    } else {
      alert("Оберіть категорію!");
    }
  };

  function addItemToCategory(
    categoryShort,
    productName,
    description,
    price,
    discount,
    quantity
  ) {
    const newItem = {
      id: Date.now(), // Унікальний ID на основі часу
      short_name: categoryShort,
      product_name: productName,
      description: description,
      price: price,
      discount: discount,
      quantity: quantity,
    };

    $ajaxUtils.sendPostRequest(
      "/api/add-item",
      { categoryShort, item: newItem },
      function (response) {
        alert("Товар успішно додано!");
        // Оновити інтерфейс (наприклад, перезавантажити список товарів)
        ns.loadCatalogForChanges();
      },false
    );
  }



  ns.loadSimulation = function () {
  showLoading("#main-content");

  $ajaxUtils.sendGetRequest(
    "snippets/simulation-title.html",
    function (html) {
      insertHtml("#main-content", html);

      // Почекаємо поки DOM завантажиться і кнопка з’явиться
      const startBtn = document.getElementById("start-simulation-btn");
      if (startBtn) {
        startBtn.addEventListener("click", function (e) {
          e.preventDefault();
          const countInput = document.getElementById("buyer-count");
          if (!countInput) {
            alert("Поле для введення кількості покупців не знайдено.");
            return;
          }

          const count = parseInt(countInput.value);
          if (isNaN(count) || count <= 0) {
            alert("Введіть коректну кількість покупців.");
            return;
          }

          // Запустити симуляцію
          startSim(count); 
        });
      }
      const stopBtn = document.getElementById("stop-simulation-btn");
if (stopBtn) {
  stopBtn.addEventListener("click", function () {
    simulationInterrupted = true;
    simulationRunning = false;

    simulationTimeouts.forEach(id => clearTimeout(id));
    simulationTimeouts = [];
    // Очистити DOM
    document.getElementById("buyers-container").innerHTML = "";
    document.querySelectorAll(".buyer").forEach(b => b.remove());
    document.querySelectorAll(".entering-buyer").forEach(b => b.remove());
    document.querySelectorAll(".simulation-stats, .simulation-analysis").forEach(el => el.remove());

    console.warn("⛔ Симуляцію зупинено");
  });
}

const skipBtn = document.getElementById("skip-animation-btn");

skipBtn.addEventListener("click", () => {
  if (!simulationRunning) return;

  skipAnimation = true;
  simulationTimeouts.forEach(id => clearTimeout(id));
  simulationTimeouts = [];
  // Миттєво прибрати візуальні елементи
  document.getElementById("buyers-container").innerHTML = "";
  document.querySelectorAll(".buyer, .entering-buyer").forEach(el => el.remove());

  // Миттєво вивести статистику
  renderPurchaseStats(buyersGlobal);
  renderBuyerAnalysis(buyersGlobal);

  simulationRunning = false;
});
    },
    false
  );
  };

  function buildAndShowCatalogChangeItemsHTML(categories) {
    // Завантажуємо заголовок таблиці
    $ajaxUtils.sendGetRequest(
      "snippets/catalog-change-title.html",
      function (tableTitleHtml) {
        // Завантажуємо шаблон товару
        $ajaxUtils.sendGetRequest(
          "snippets/catalog-change-item.html",
          function (itemHtml) {
            let finalHtml = "<table class='table table-striped'>";
            finalHtml += tableTitleHtml;

            let pending = categories.length;

            categories.forEach(function (category) {
              const fileUrl = "data/catalog/" + category.short_name + ".json";

              $ajaxUtils.sendGetRequest(fileUrl, function (catalogData) {
                catalogData.catalog_items.forEach(function (item) {
                  let html = itemHtml;

                  const finalPrice = (
                    item.price -
                    (item.price * (item.discount || 0)) / 100
                  ).toFixed(2);

                  html = insertProperty(html, "id", item.id);
                  html = insertProperty(html, "CategoryName", catalogData.category.CategoryName);
                  html = insertProperty(
                    html,
                    "product_name",
                    item.product_name
                  );
                  html = insertProperty(html, "quantity", item.quantity);
                  html = insertProperty(html, "price", item.price);
                  html = insertProperty(html, "discount", item.discount || 0);
                  html = insertProperty(html, "finalPrice", finalPrice);
                  html = insertProperty(
                    html,
                    "catShortName",
                    category.short_name
                  );
                  html = insertProperty(
                    html,
                    "short_name",
                    item.short_name || "default"
                  ); // якщо є зображення

                  finalHtml += html;
                });

                pending--;
                if (pending === 0) {
                  finalHtml += "</tbody></table>";
                  insertHtml("#main-content", finalHtml);

                  initCategorySelect(categories);
                }
              });
            });
          },
          false
        );
      },
      false
    );
  }

  function initCategorySelect(categories) {

    const select = document.getElementById("new-product-category");

    // Перевірка, чи існує елемент
    if (!select) {
      console.error("Елемент new-product-category не знайдено!");
      return;
    }

    // Очистити існуючі опції
    select.innerHTML = '<option value="">-- Оберіть категорію --</option>';

    // Додати категорії
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.short_name;
      option.textContent = category.CategoryName;
      select.appendChild(option);
    });
  }

  function buildAndShowCategoriesHTML(categories) {
    $ajaxUtils.sendGetRequest(
      categoriesTitleHtml,
      function (categoriesTitleHtml) {
        $ajaxUtils.sendGetRequest(
          categoryHtml,
          function (categoryHtml) {
            const categoriesViewHtml = buildCategoriesViewHtml(
              categories,
              categoriesTitleHtml,
              categoryHtml
            );
            insertHtml("#main-content", categoriesViewHtml);
          },
          false
        );
      },
      false
    );
  }

  function buildCategoriesViewHtml(
    categories,
    categoriesTitleHtml,
    categoryHtml
  ) {
    let finalHtml = categoriesTitleHtml;
    finalHtml += "<section class='row g-4' id='category-grid'>";

    for (let i = 0; i < categories.length; i++) {
      html = categoryHtml;

      const product_name = "" + categories[i].CategoryName;
      const short_name = categories[i].short_name;

      html = insertProperty(html, "product_name", product_name);
      html = insertProperty(html, "short_name", short_name);

      finalHtml += html;
    }

    finalHtml += "</section>";
    return finalHtml;
  }

  function buildAndShowCatalogItemsHTML(categoryCatalogItems) {
    $ajaxUtils.sendGetRequest(
      catalogItemTitleHtml,
      function (catalogItemTitleHtml) {
        $ajaxUtils.sendGetRequest(
          catalogItemHtml,
          function (catalogItemHtml) {
            const catalogItemViewHtml = buildCatalogItemViewHtml(
              categoryCatalogItems,
              catalogItemTitleHtml,
              catalogItemHtml
            );
            insertHtml("#main-content", catalogItemViewHtml);
          },
          false
        );
      },
      false
    );
  }

  function buildCatalogItemViewHtml(
    categoryCatalogItems,
    catalogItemTitleHtml,
    catalogItemHtml
  ) {
    catalogItemTitleHtml = insertProperty(
      catalogItemTitleHtml,
      "CategoryName",
      categoryCatalogItems.category.CategoryName
    );
    catalogItemTitleHtml = insertProperty(
      catalogItemTitleHtml,
      "special_instructions",
      categoryCatalogItems.category.special_instructions
    );

    let finalHtml = catalogItemTitleHtml;
    finalHtml += "<section class = 'row'>";

    const catalogItems = categoryCatalogItems.catalog_items;

    for (let i = 0; i < catalogItems.length; i++) {
      let html = catalogItemHtml;

      let finalPrice =
        catalogItems[i].price -
        (catalogItems[i].price * catalogItems[i].discount) / 100;

      html = insertProperty(html, "categoryShort_name", categoryCatalogItems.category.short_name);
      html = insertProperty(html, "short_name", catalogItems[i].short_name);
      html = insertPrice(html, "price", catalogItems[i], finalPrice);
      html = insertProperty(html, "quantity", catalogItems[i].quantity);
      html = insertProperty(html, "product_name", catalogItems[i].product_name);
      html = insertProperty(html, "description", catalogItems[i].description);

      finalHtml += html;
    }
    finalHtml += "</section>";
    return finalHtml;
  }
  global.$ns = ns;
})(window);
