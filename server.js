// === server.js ===
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = 3000; // ЗМІНЕНО НА 3000


app.use(express.json());
app.use(express.static("CurseWork")); // Статичні файли, якщо потрібно
app.use(cors());

app.post("/api/add-item", (req, res) => {
  const { categoryShort, item } = req.body;
  const catalogPath = path.join(__dirname, "data", "catalog", `${categoryShort}.json`);

  // Перевірка існування файлу
  if (!fs.existsSync(catalogPath)) {
    return res.status(404).json({ error: "Категорія не знайдена" });
  }

  try {
    // Читання та оновлення даних 
    const catalog = JSON.parse(fs.readFileSync(catalogPath));
    catalog.catalog_items.push(item);

    // Запис з обробкою помилок
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    res.json({ success: true, message: "Товар додано" }); // ✅ Відповідь після успішного запису

  } catch (err) {
    console.error("Помилка запису:", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});
// Оновлення товару
app.post("/api/update-item", async (req, res) => {
  const { id, catShortName, quantity, price, discount, count, productName} = req.body;
  const filePath = path.join(__dirname, "data", "catalog", `${catShortName}.json`);
  try {
    // Читання файлу
    const data = await fs.promises.readFile(filePath, "utf8");
    const catalog = JSON.parse(data);

    // Пошук товару
    const item = catalog.catalog_items.find((i) => i.id == id);
    if (!item) {
      return res.status(404).json({ error: "Товар не знайдено" });
    }

    // Оновлення полів (без подвійної зміни quantity!)
    if (productName !== undefined) item.product_name = productName;
    if (quantity !== undefined) item.quantity = quantity;
    if (price !== undefined) item.price = price;
    if (discount !== undefined) item.discount = discount;
    if (count !== undefined) item.quantity += count;

    // Запис з обробкою помилок
    await fs.promises.writeFile(filePath, JSON.stringify(catalog, null, 2));
    res.json({ success: true, message: "Товар оновлено", updatedItem: item });

  } catch (err) {
    console.error("Помилка оновлення товару:", err);
    res.status(500).json({ 
      error: err.code === 'ENOENT' ? "Файл категорії не знайдено" : "Помилка сервера"
    });
  }
});
app.post("/api/add-category", (req, res) => {
  const { name } = req.body;
  const categoriesPath = path.join(__dirname, "data", "categories.json");
  const categories = JSON.parse(fs.readFileSync(categoriesPath));

  // Генеруємо коротку назву (наприклад, "F" для 6-ї категорії)
  const shortName = String.fromCharCode(65 + categories.length); // A, B, C, ...
  const newCategory = {
    id: categories.length + 1,
    short_name: shortName,
    CategoryName: name,
    special_instructions: "",
    url: `data/catalog/${shortName}.json`,
  };

  categories.push(newCategory);
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));

  // Створити файл для нової категорії
  const catalogPath = path.join(
    __dirname,
    "data",
    "catalog",
    `${shortName}.json`
  );
  fs.writeFileSync(
    catalogPath,
    JSON.stringify(
      {
        catalog_items: [],
        category: newCategory,
      },
      null,
      2
    )
  );

  res.json(newCategory); // Повернути створену категорію
});
app.post("/api/decrease-quantity", (req, res) => {
  const { id, catShortName } = req.body;
  const filePath = path.join(__dirname, "data", "catalog", `${catShortName}.json`);

  try {
    const catalog = JSON.parse(fs.readFileSync(filePath));
    const item = catalog.catalog_items.find(i => i.id === id);

    if (!item) {
      return res.status(404).json({ error: "Товар не знайдено" });
    }

    if (item.quantity > 0) {
      item.quantity -= 1;
      fs.writeFileSync(filePath, JSON.stringify(catalog, null, 2));
      res.json({ success: true, message: "Кількість зменшено", item });
    } else {
      res.status(400).json({ error: "Немає в наявності" });
    }
  } catch (err) {
    console.error("Помилка оновлення кількості:", err);
    res.status(500).json({ error: "Помилка сервера" });
  }
});



app.listen(PORT, () =>
  console.log(`Сервер запущено на http://localhost:${PORT}`)
);
