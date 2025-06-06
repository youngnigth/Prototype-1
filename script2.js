// script.js

// ------------------------------
// Helper: Get / Set Local Storage
// ------------------------------
function getStoredEntries(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
function setStoredEntries(key, array) {
  localStorage.setItem(key, JSON.stringify(array));
}

// ------------------------------
// Data Keys
// ------------------------------
const KEYS = {
  LIABILITIES: "liabilitiesEntries",
  SAVINGS: "savingsEntries",
  INVESTMENTS: "investmentsEntries",
  DEBT: "debtEntries",
};

// ------------------------------
// DOM References: Forms & Tables
// ------------------------------
const forms = {
  liabilities: document.getElementById("liabilities-form"),
  savings: document.getElementById("savings-form"),
  investments: document.getElementById("investments-form"),
  debt: document.getElementById("debt-form"),
};
const tbodies = {
  liabilities: document.getElementById("liabilities-tbody"),
  savings: document.getElementById("savings-tbody"),
  investments: document.getElementById("investments-tbody"),
  debt: document.getElementById("debt-tbody"),
};
const totals = {
  liabilities: document.getElementById("liabilities-total"),
  savings: document.getElementById("savings-total"),
  investments: document.getElementById("investments-total"),
  debt: document.getElementById("debt-total"),
};

// ------------------------------
// Overview DOM References
// ------------------------------
const overviewLiabilities    = document.getElementById("overview-liabilities");
const overviewSavings        = document.getElementById("overview-savings");
const overviewInvestments    = document.getElementById("overview-investments");
const overviewDebt           = document.getElementById("overview-debt");
const overviewCashflow       = document.getElementById("overview-cashflow");
const overviewNet            = document.getElementById("overview-net");
const overviewLiabilitiesPct = document.getElementById("overview-liabilities-pct");
const overviewSavingsPct     = document.getElementById("overview-savings-pct");
const overviewInvestmentsPct = document.getElementById("overview-investments-pct");
const overviewDebtPct        = document.getElementById("overview-debt-pct");

// ------------------------------
// Chart reference
// ------------------------------
let overviewChart = null;

// ------------------------------
// Initialize Sections & Listeners
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  ["liabilities", "savings", "investments", "debt"].forEach(renderEntries);
  ["liabilities", "savings", "investments", "debt"].forEach(setupFormListener);
  setupTabSwitching();
  buildOverview();
  document.getElementById("download-report").addEventListener("click", generatePDF);
});

// ------------------------------
// Form Submission Handler
// ------------------------------
function setupFormListener(category) {
  const formEl = forms[category];
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const name   = formEl.querySelector("input[type='text']").value.trim();
    const amount = parseFloat(formEl.querySelector("input[type='number']").value);
    const date   = formEl.querySelector("input[type='date']").value;
    if (!name || isNaN(amount) || !date) {
      alert("Please fill out all fields correctly.");
      return;
    }
    const entry = { id: Date.now(), name, amount, date };
    const key   = KEYS[category.toUpperCase()];
    const arr   = getStoredEntries(key);
    arr.push(entry);
    setStoredEntries(key, arr);
    formEl.reset();
    renderEntries(category);
    buildOverview();
  });
}

// ------------------------------
// Render Table & Total
// ------------------------------
function renderEntries(category) {
  const key   = KEYS[category.toUpperCase()];
  const arr   = getStoredEntries(key);
  const tbody = tbodies[category];
  tbody.innerHTML = "";
  let sum = 0;
  arr.forEach((entry) => {
    sum += entry.amount;
    const formattedAmount = entry.amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Name">${entry.name}</td>
      <td data-label="Amount ($)">$${formattedAmount}</td>
      <td data-label="Date">${entry.date}</td>
      <td data-label="Action">
        <button class="delete-btn" data-id="${entry.id}" data-cat="${category}">
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  totals[category].textContent = sum.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteEntry(category, parseInt(btn.dataset.id));
    });
  });
}

// ------------------------------
// Delete a Single Entry
// ------------------------------
function deleteEntry(category, id) {
  const key = KEYS[category.toUpperCase()];
  let arr   = getStoredEntries(key);
  arr = arr.filter((e) => e.id !== id);
  setStoredEntries(key, arr);
  renderEntries(category);
  buildOverview();
}

// ------------------------------
// Tab Switching Logic
// ------------------------------
function setupTabSwitching() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const sections   = document.querySelectorAll(".section");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      sections.forEach((sec) => sec.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.target).classList.add("active");
    });
  });
}

// ------------------------------
// Build Overview & Chart
// ------------------------------
function buildOverview() {
  const sumLiab = parseFloat(totals.liabilities.textContent.replace(/,/g, "")) || 0;
  const sumSave = parseFloat(totals.savings.textContent.replace(/,/g, ""))     || 0;
  const sumInv  = parseFloat(totals.investments.textContent.replace(/,/g, ""))  || 0;
  const sumDebt = parseFloat(totals.debt.textContent.replace(/,/g, ""))         || 0;
  const cashflow = sumSave + sumInv;
  const networth = cashflow - (sumLiab + sumDebt);

  overviewLiabilities.textContent = sumLiab.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  overviewSavings.textContent      = sumSave.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  overviewInvestments.textContent  = sumInv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  overviewDebt.textContent         = sumDebt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  overviewCashflow.textContent     = cashflow.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  overviewNet.textContent          = networth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const grandTotal = sumLiab + sumSave + sumInv + sumDebt;
  overviewLiabilitiesPct.textContent = grandTotal > 0 ? ((sumLiab / grandTotal) * 100).toFixed(0) + "%" : "0%";
  overviewSavingsPct.textContent      = grandTotal > 0 ? ((sumSave / grandTotal) * 100).toFixed(0) + "%" : "0%";
  overviewInvestmentsPct.textContent  = grandTotal > 0 ? ((sumInv / grandTotal) * 100).toFixed(0) + "%" : "0%";
  overviewDebtPct.textContent         = grandTotal > 0 ? ((sumDebt / grandTotal) * 100).toFixed(0) + "%" : "0%";

  const data   = [sumLiab, sumSave, sumInv, sumDebt];
  const labels = ["Liabilities", "Savings", "Investments", "Debt"];
  const colors = [
    "rgba(239, 68, 68, 0.7)",    // red-ish
    "rgba(16, 185, 129, 0.7)",   // green-ish
    "rgba(59, 130, 246, 0.7)",   // blue-ish
    "rgba(107, 114, 128, 0.7)",  // gray-ish
  ];

  const ctx = document.getElementById("overview-chart").getContext("2d");
  if (overviewChart) overviewChart.destroy();
  overviewChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: "#fff", borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
  });
}

// ------------------------------
// Generate and Download Professional PDF Report
// ------------------------------
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); // Portrait, mm, A4

  // ------------------------------
  // 1. Cover Page
  // ------------------------------
  const title = "Financial Tracker Report";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 60, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(`Generated on ${dateStr}`, doc.internal.pageSize.getWidth() / 2, 75, { align: "center" });
  doc.addPage();

  // ------------------------------
  // 2. Helper Functions
  // ------------------------------
  function fmt(num) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Precompute entries and totals
  const categoryData = {
    liabilities:    getStoredEntries(KEYS.LIABILITIES),
    savings:        getStoredEntries(KEYS.SAVINGS),
    investments:    getStoredEntries(KEYS.INVESTMENTS),
    debt:           getStoredEntries(KEYS.DEBT),
  };
  const categoryTotals = {
    liabilities: categoryData.liabilities.reduce((sum, e) => sum + e.amount, 0),
    savings:     categoryData.savings.reduce((sum, e) => sum + e.amount, 0),
    investments: categoryData.investments.reduce((sum, e) => sum + e.amount, 0),
    debt:        categoryData.debt.reduce((sum, e) => sum + e.amount, 0),
  };
  const grandTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  const categories = [
    { key: "liabilities", title: "Liabilities" },
    { key: "savings",     title: "Smart Savings" },
    { key: "investments", title: "Investments" },
    { key: "debt",        title: "Debt" },
  ];

  // ------------------------------
  // 3. Section Rendering
  // ------------------------------
  let yPos = 20;
  categories.forEach((cat, idx) => {
    const entries = categoryData[cat.key];
    const total   = categoryTotals[cat.key];
    const pct     = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(0) : "0";

    // Section Heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(cat.title, 14, yPos);
    // Underline
    const headingWidth = doc.getTextWidth(cat.title);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 1, 14 + headingWidth, yPos + 1);
    yPos += 8;

    // If no entries
    if (entries.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(12);
      doc.text("(No entries)", 14, yPos);
      yPos += 12;
    } else {
      // Table Header (monospace font for alignment)
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      const header = "Name                       Amount ($)     Date";
      doc.text(header, 14, yPos);
      yPos += 6;

      // Draw a subtle line under header
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(14, yPos + 1, 196, yPos + 1);
      yPos += 4;

      // Reset font for rows
      doc.setFont("courier", "normal");
      entries.forEach((e) => {
        const nameCol   = e.name.padEnd(25).slice(0, 25);
        const amountCol = ("$" + fmt(e.amount)).padStart(12);
        const dateCol   = e.date.padStart(12);
        const line      = `${nameCol}${amountCol}     ${dateCol}`;
        doc.text(line, 14, yPos);
        yPos += 6;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Section Total (bold, right-aligned)
      yPos += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const totalText = `Total ${cat.title}: $${fmt(total)} (${pct}%)`;
      const txtWidth  = doc.getTextWidth(totalText);
      doc.text(totalText, 196 - txtWidth, yPos);
      yPos += 12;
    }

    // Page break if near bottom
    if (idx < categories.length - 1 && yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  });

  // ------------------------------
  // 4. Overall Summary
  // ------------------------------
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Overall Summary", 14, yPos);
  const overallWidth = doc.getTextWidth("Overall Summary");
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 1, 14 + overallWidth, yPos + 1);
  yPos += 8;

  const sumLiab = categoryTotals.liabilities;
  const sumSave = categoryTotals.savings;
  const sumInv  = categoryTotals.investments;
  const sumDebt = categoryTotals.debt;
  const cashflow = sumSave + sumInv;
  const networth = cashflow - (sumLiab + sumDebt);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Cash Flow (Savings + Investments): $${fmt(cashflow)}`, 14, yPos);
  yPos += 6;
  doc.text(`Net Worth ((S + I) - (L + D)): $${fmt(networth)}`, 14, yPos);
  yPos += 12;

  // ------------------------------
  // 5. Embed the Overview Chart
  // ------------------------------
  const canvas = document.getElementById("overview-chart");
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const chartWidth = (pageWidth - margin * 2) * 0.5; // 50% width
  const aspect = canvas.height / canvas.width;
  const chartHeight = chartWidth * aspect;
  if (yPos + chartHeight > doc.internal.pageSize.getHeight() - 15) {
    doc.addPage();
    yPos = 20;
  }
  const xPos = (pageWidth - chartWidth) / 2;
  doc.addImage(imgData, "PNG", xPos, yPos, chartWidth, chartHeight);

  // ------------------------------
  // 6. Add Page Numbers Footer
  // ------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const footer = `Page ${i} of ${pageCount}`;
    doc.text(footer, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  // ------------------------------
  // 7. Save the PDF
  // ------------------------------
  doc.save("financial_report.pdf");
}



// At the end of script.js (after existing code):

// Toggle mobile nav

document.addEventListener('DOMContentLoaded', () => {
  // 1) Seleccionamos elementos clave
  const hamburger   = document.querySelector('.hamburger');
  const mobileNav   = document.querySelector('.mobile-nav');
  const desktopTabs = Array.from(document.querySelectorAll('.tab-btn'));
  const mobileTabs  = Array.from(document.querySelectorAll('.mobile-tab-btn'));

  // 2) Toggle del menú móvil (añadir/quitar .open y .hidden)
  hamburger.addEventListener('click', () => {
    // Si mobileNav tiene .hidden, lo quitamos y añadimos .open.
    // De lo contrario, lo ocultamos otra vez.
    if (mobileNav.classList.contains('hidden')) {
      mobileNav.classList.remove('hidden');
      mobileNav.classList.add('open');
      hamburger.classList.add('is-active'); // para animar la hamburguesa si lo deseas
    } else {
      mobileNav.classList.remove('open');
      mobileNav.classList.add('hidden');
      hamburger.classList.remove('is-active');
    }
  });

  // 3) Función para activar una pestaña (desktop o mobile)
  function activarPestana(listaBtns, botonActivo) {
    listaBtns.forEach(b => b.classList.remove('active'));
    botonActivo.classList.add('active');
  }

  // 4) Función para mostrar/ocultar secciones y hacer scroll
  function mostrarSeccion(targetId) {
    const todasSecciones = document.querySelectorAll('section[id$="-section"]');
    todasSecciones.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.remove('hidden');
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        sec.classList.add('hidden');
      }
    });
  }

  // 5) Listener para pestañas Desktop (.tab-btn)
  desktopTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const objetivo = btn.dataset.target; // ej. "savings-section"

      // a) Activamos visualmente la pestaña en Desktop
      activarPestana(desktopTabs, btn);

      // b) Sincronizamos la pestaña equivalente en Mobile
      const btnMobile = mobileTabs.find(mb => mb.dataset.target === objetivo);
      if (btnMobile) {
        activarPestana(mobileTabs, btnMobile);
      }

      // c) Mostramos la sección y hacemos scroll
      mostrarSeccion(objetivo);

      // d) Si el menú móvil estuviera abierto, lo cerramos
      if (mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        mobileNav.classList.add('hidden');
        hamburger.classList.remove('is-active');
      }
    });
  });

  // 6) Listener para pestañas Mobile (.mobile-tab-btn)
  mobileTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const objetivo = btn.dataset.target;

      // a) Activamos visualmente la pestaña en Mobile
      activarPestana(mobileTabs, btn);

      // b) Sincronizamos la pestaña equivalente en Desktop
      const btnDesk = desktopTabs.find(dt => dt.dataset.target === objetivo);
      if (btnDesk) {
        activarPestana(desktopTabs, btnDesk);
      }

      // c) Mostramos la sección y hacemos scroll
      mostrarSeccion(objetivo);

      // d) Cerramos el menú móvil inmediatamente
      mobileNav.classList.remove('open');
      mobileNav.classList.add('hidden');
      hamburger.classList.remove('is-active');
    });
  });

  // 7) Al cargar la página, podemos “forzar” que se active la primera pestaña automáticamente:
  if (desktopTabs.length > 0) {
    desktopTabs[0].click();
  }
});
