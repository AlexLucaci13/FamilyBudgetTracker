const fmt = (n) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const $ = (id) => document.getElementById(id);

document.querySelector('[name=date]').valueAsDate = new Date();

async function refresh() {
  const [transactions, summary] = await Promise.all([
    fetch('/api/transactions').then((r) => r.json()),
    fetch('/api/summary').then((r) => r.json()),
  ]);

  $('sum-income').textContent = fmt(summary.income);
  $('sum-expenses').textContent = fmt(summary.expenses);
  $('sum-balance').textContent = fmt(summary.balance);
  $('sum-balance').className = summary.balance >= 0 ? 'income' : 'expense';

  const cats = $('categories');
  cats.replaceChildren();
  const max = Math.max(1, ...Object.values(summary.byCategory));
  for (const [name, total] of Object.entries(summary.byCategory)) {
    const row = document.createElement('div');
    row.className = 'bar-row';
    const label = document.createElement('span');
    label.textContent = name;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('span');
    fill.style.width = (total / max) * 100 + '%';
    bar.appendChild(fill);
    const value = document.createElement('span');
    value.textContent = fmt(total);
    row.append(label, bar, value);
    cats.appendChild(row);
  }
  if (!Object.keys(summary.byCategory).length) cats.textContent = 'Nicio cheltuială încă.';

  const tbody = $('rows');
  tbody.replaceChildren();
  transactions.sort((a, b) => b.date.localeCompare(a.date)).forEach((t) => {
    const tr = document.createElement('tr');
    const cells = [t.date, t.category, t.description];
    cells.forEach((c) => { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });

    const amount = document.createElement('td');
    amount.className = t.type;
    amount.textContent = (t.type === 'income' ? '+' : '-') + fmt(t.amount);
    tr.appendChild(amount);

    const receipt = document.createElement('td');
    if (t.receipt) {
      const a = document.createElement('a');
      a.href = '/receipts/' + encodeURIComponent(t.receipt);
      a.target = '_blank';
      a.textContent = 'Vezi';
      receipt.appendChild(a);
    }
    tr.appendChild(receipt);

    const actions = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'Șterge';
    del.onclick = async () => {
      if (!confirm('Ștergi tranzacția?')) return;
      await fetch('/api/transactions/' + t.id, { method: 'DELETE' });
      refresh();
    };
    actions.appendChild(del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('msg').textContent = '';
  const form = e.target;
  const res = await fetch('/api/transactions', { method: 'POST', body: new FormData(form) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    $('msg').textContent = err.error || 'Eroare la salvare';
    return;
  }
  form.reset();
  form.querySelector('[name=date]').valueAsDate = new Date();
  refresh();
});

refresh();
