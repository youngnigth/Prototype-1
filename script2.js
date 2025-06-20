// pull in jsPDF
const { jsPDF } = window.jspdf;

const form = document.getElementById('entry-form');
const descInput = document.getElementById('description');
const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const entriesContainer = document.getElementById('entries');

const totalIncomeEl     = document.getElementById('total-income');
const totalExpenseEl    = document.getElementById('total-expense');
const totalInvestmentEl = document.getElementById('total-investment');
const totalDebtEl       = document.getElementById('total-debt');
const totalAssetEl      = document.getElementById('total-asset');
const totalNetWorthEl   = document.getElementById('total-net-worth');
const balanceEl         = document.getElementById('balance');

const downloadBtn       = document.getElementById('download-pdf');
const ctx               = document.getElementById('distributionChart').getContext('2d');

let entries = JSON.parse(localStorage.getItem('budgetEntries')) || [];

const chart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: ['Income','Expense','Investment','Debt','Asset'],
    datasets: [{
      data: [0,0,0,0,0],
      backgroundColor: ['#03dac6','#cf6679','#bb86fc','#ffca28','#4caf50']
    }]
  },
  options: { responsive: true, maintainAspectRatio: false }
});

function render() {
  entriesContainer.innerHTML = '';
  let inc=0, exp=0, inv=0, dbt=0, ast=0;

  entries.forEach((e, idx) => {
    const sign = (e.type==='expense' || e.type==='debt') ? '-' : '+';
    const amtStr = new Intl.NumberFormat('en-US',{
      style:'currency', currency:'USD'
    }).format(e.amount);

    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="entry-info">
        <span><strong>${e.description}</strong></span>
        <span>${e.type.charAt(0).toUpperCase()+e.type.slice(1)}</span>
      </div>
      <div class="entry-action">
        <span>${sign}${amtStr}</span>
        <button data-index="${idx}">Delete</button>
      </div>`;

    entriesContainer.appendChild(card);

    if (e.type==='income')      inc += e.amount;
    else if (e.type==='expense') exp += e.amount;
    else if (e.type==='investment') inv += e.amount;
    else if (e.type==='debt')     dbt += e.amount;
    else if (e.type==='asset')    ast += e.amount;
  });

  const fmt = v => new Intl.NumberFormat('en-US',{
    style:'currency', currency:'USD'
  }).format(v);

  totalIncomeEl.textContent     = fmt(inc);
  totalExpenseEl.textContent    = fmt(exp);
  totalInvestmentEl.textContent = fmt(inv);
  totalDebtEl.textContent       = fmt(dbt);
  totalAssetEl.textContent      = fmt(ast);

  // net worth = inc + inv + ast - exp - dbt
  const netWorth = inc + inv + ast - exp - dbt;
  totalNetWorthEl.textContent   = fmt(netWorth);

  // balance same as net worth
  balanceEl.textContent         = fmt(netWorth);

  chart.data.datasets[0].data = [inc,exp,inv,dbt,ast];
  chart.update();

  localStorage.setItem('budgetEntries', JSON.stringify(entries));
}

form.addEventListener('submit', e => {
  e.preventDefault();
  entries.push({
    description: descInput.value.trim(),
    type: typeInput.value,
    amount: parseFloat(amountInput.value)
  });
  descInput.value = '';
  amountInput.value = '';
  render();
});

entriesContainer.addEventListener('click', e => {
  if (e.target.tagName==='BUTTON') {
    entries.splice(e.target.dataset.index, 1);
    render();
  }
});

function loadImage(src) {
  return new Promise(res => {
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
    img.onerror = () => res(null);
  });
}

downloadBtn.addEventListener('click', () => {
  (async () => {
    const pdf = new jsPDF({unit:'pt',format:'a4'});
    const fmt = v => new Intl.NumberFormat('en-US',{
      style:'currency', currency:'USD'
    }).format(v);

    // recalc
    let inc=0, exp=0, inv=0, dbt=0, ast=0;
    entries.forEach(e => {
      if (e.type==='income')      inc += e.amount;
      if (e.type==='expense')     exp += e.amount;
      if (e.type==='investment')  inv += e.amount;
      if (e.type==='debt')        dbt += e.amount;
      if (e.type==='asset')       ast += e.amount;
    });

    const headerY = 40;
    const logo = await loadImage('logo.png');
    pdf.setFillColor(30,30,30);
    pdf.rect(0,headerY-10,pdf.internal.pageSize.getWidth(),50,'F');
    if (logo) pdf.addImage(logo,'PNG',40,headerY,80,30);
    pdf.setFontSize(18).setTextColor(255,255,255);
    pdf.text('Young Desert', logo?140:40, headerY+15);
    pdf.setFontSize(12)
       .text(`Budget Report — ${new Date().toLocaleDateString()}`, logo?140:40, headerY+32);

    const summaryData = [
      ['Total Income',     inc],
      ['Total Expense',    exp],
      ['Total Investments',inv],
      ['Total Debt',       dbt],
      ['Total Assets',     ast],
      ['Total Net Worth',  inc + inv + ast - exp - dbt]
    ];

    let y = headerY + 80;
    pdf.setTextColor(0).setFontSize(14).text('Summary',40,y);
    y+=20;
    pdf.setFontSize(12);
    summaryData.forEach(([lbl,val])=>{
      pdf.text(`${lbl}:`,50,y);
      pdf.text(fmt(val),200,y);
      y+=18;
    });

    y+=10;
    pdf.setLineWidth(0.5)
       .line(40,y,pdf.internal.pageSize.getWidth()-40,y);
    y+=10;
    pdf.text('Description',50,y);
    pdf.text('Type',300,y);
    pdf.text('Amount',400,y);
    y+=6;
    pdf.line(40,y,pdf.internal.pageSize.getWidth()-40,y);
    y+=20;

    entries.forEach(e=>{
      if (y > pdf.internal.pageSize.getHeight()-60) {
        pdf.addPage();
        y = 60;
      }
      pdf.text(e.description,50,y);
      pdf.text(e.type.charAt(0).toUpperCase()+e.type.slice(1),300,y);
      pdf.text(fmt(e.amount),400,y);
      y+=18;
    });

    pdf.save('Executive_Budget_Report.pdf');
  })();
});

// initial draw
render();
