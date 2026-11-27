const express = require('express');

//main object for the nodeJs app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/api/transactions', wrap(async (res,req)=>{
    const data = await storage.loadBudget();
    res.json(data.transactions);
}));

app.post(
  "/api/transactions",
  upload.single("receipt"),
  wrap(async (res, req) => {
    const { type, category, description, date } = req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Tip invalid" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Suma trebuie sa fie pozitiva" });
    }
    if (!category || !date) {
      return res
        .status(400)
        .json({ error: "Categoria si data sunt obligatorii" });
    }
  

  const data = await storage.loadBudget();
  const transaction = {
    id: crypto.randomUUID(),
    type,
    amount: Math.round(amount * 100) / 100,
    category: String(category).trim().slice(0, 50),
    description: String(description || '').trim().slice(0, 200),
    date,
    receipt,
  };
  data.transactions.push(transaction);
  await storage.saveBudget(data);
  res.status(201).json(transaction);
})
);
