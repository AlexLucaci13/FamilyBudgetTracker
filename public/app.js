//using $ as document.....
const $ = (id) =>document.getElementById(id);
//putting the default date to be today
document.querySelector('[name=date]').valueAsDate = new Date();

async function refreshApp(){
  const[transactions, summary] = await Promise.all(
    [
      fetch('/api/transactions').then((r)=>r.json()),
      fetch('/api/summary').then((r2)=>r2.json)
    ]
  )
  $('sum-income').textContent = summary.income;
  $('sum-expenses').textContent = summary.expenses;
  $('sum-balance').textContent = summary.balance;


  const cats = $('categories');
  cats.replaceChildren();

  for(const [name, total] of Object.entries(summary.byCategory)){
    const row = document.createElement('div');
    row.className = 'bar-row';
    const lable = document.createElement('span');
    lable.textContent = name;
  }
}

$('form').addEventListener('submit', async(e)=>{
  //stop reloading the page
  e.preventDefault();

})