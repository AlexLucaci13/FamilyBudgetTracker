const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const storage = require('./storage');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Eroare de server' });
  });

// Lista tranzactiilor
app.get('/api/transactions', wrap(async (req, res) => {
  const data = await storage.loadBudget();
  res.json(data.transactions);
}));

// Adaugare tranzactie (cu bon optional)
app.post('/api/transactions', upload.single('receipt'), wrap(async (req, res) => {
  const { type, category, description, date } = req.body;
  const amount = parseFloat(req.body.amount);

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tip invalid' });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Suma trebuie sa fie pozitiva' });
  }
  if (!category || !date) {
    return res.status(400).json({ error: 'Categoria si data sunt obligatorii' });
  }

  let receipt = null;
  if (req.file) {
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Bonul trebuie sa fie PNG, JPG sau PDF' });
    }
    const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'application/pdf': '.pdf' }[req.file.mimetype];
    receipt = crypto.randomUUID() + ext;
    await storage.uploadReceipt(receipt, req.file.buffer, req.file.mimetype);
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
}));

// Stergere tranzactie
app.delete('/api/transactions/:id', wrap(async (req, res) => {
  const data = await storage.loadBudget();
  const idx = data.transactions.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nu exista' });
  const [removed] = data.transactions.splice(idx, 1);
  await storage.saveBudget(data);
  await storage.deleteReceipt(removed.receipt);
  res.status(204).end();
}));

// Sumar: total venituri, cheltuieli, sold, cheltuieli pe categorii
app.get('/api/summary', wrap(async (req, res) => {
  const { transactions } = await storage.loadBudget();
  let income = 0;
  let expenses = 0;
  const byCategory = {};
  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount;
    } else {
      expenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }
  res.json({
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    balance: Math.round((income - expenses) * 100) / 100,
    byCategory,
  });
}));

// Descarcare bon
app.get('/receipts/:name', wrap(async (req, res) => {
  const name = path.basename(req.params.name);
  const receipt = await storage.getReceipt(name);
  if (!receipt) return res.status(404).send('Bon negasit');
  res.set('Content-Type', receipt.contentType);
  res.send(receipt.buffer);
}));

// Eroare upload (fisier prea mare etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Fisier invalid sau prea mare (max 5 MB)' });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aplicatia ruleaza pe portul ${PORT}`);
  console.log(storage.useAzure ? 'Stocare: Azure Blob Storage' : 'Stocare: folder local (local-data/)');
});
