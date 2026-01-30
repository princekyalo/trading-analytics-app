/* FinRatio app.js
 - Dynamically builds category cards
 - Injects category-specific forms into modal
 - Computes ratios (core ones from the specification)
 - Renders Chart.js bar chart of computed ratios
 - Uses Bootstrap Modal (already included in index.html)
*/

/* --------- Category definitions and required fields ---------
   Keys correspond to input field keys; label is shown in form.
   The formulas implemented match the spec provided to compute
   the most commonly used ratios per category.
*/
const CATEGORIES = {
  valuation: {
    title: "Valuation Ratios",
    description: "P/E, Forward P/E, P/B, EV/EBITDA, PEG, Dividend Yield, Earnings Yield",
    fields: [
      {k:"marketPrice", label:"Market Price per Share", type:"number"},
      {k:"eps", label:"Earnings per Share (EPS)", type:"number"},
      {k:"forecastEps", label:"Forecast EPS", type:"number"},
      {k:"bookValuePerShare", label:"Book Value per Share", type:"number"},
      {k:"marketCap", label:"Market Capitalization", type:"number"},
      {k:"revenue", label:"Revenue", type:"number"},
      {k:"operatingCashFlow", label:"Operating Cash Flow", type:"number"},
      {k:"enterpriseValue", label:"Enterprise Value (EV)", type:"number"},
      {k:"ebitda", label:"EBITDA", type:"number"},
      {k:"earningsGrowthRate", label:"Earnings Growth Rate (as decimal, e.g. 0.2)", type:"number", step:"0.01"},
      {k:"annualDividendPerShare", label:"Annual Dividend per Share", type:"number"},
      {k:"sharePrice", label:"Share Price (for Dividend Yield)", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const mp = vals.marketPrice, eps = vals.eps, fEPS = vals.forecastEps;
      const bV = vals.bookValuePerShare, mCap = vals.marketCap, rev = vals.revenue;
      const ocf = vals.operatingCashFlow, EV = vals.enterpriseValue, ebitda = vals.ebitda;
      const g = vals.earningsGrowthRate, adiv = vals.annualDividendPerShare, sp = vals.sharePrice;

      if(valid(mp) && valid(eps)) res["P/E"] = mp / eps;
      if(valid(mp) && valid(fEPS)) res["Forward P/E"] = mp / fEPS;
      if(valid(mp) && valid(bV)) res["P/B"] = mp / bV;
      if(valid(mCap) && valid(rev)) res["P/S (MarketCap/Revenue)"] = mCap / rev;
      if(valid(mCap) && valid(ocf)) res["P/CF (MarketCap/OperatingCF)"] = mCap / ocf;
      if(valid(EV) && valid(ebitda)) res["EV/EBITDA"] = EV / ebitda;
      if(valid(mp) && valid(eps) && valid(g) && g !== 0) {
        const pe = (mp/eps);
        res["PEG (P/E ÷ Growth)"] = pe / g;
      }
      if(valid(adiv) && valid(sp)) res["Dividend Yield"] = adiv / sp;
      if(valid(eps) && valid(mp)) res["Earnings Yield"] = eps / mp;
      return res;
    }
  },

  profitability: {
    title: "Profitability Ratios",
    description: "Gross Margin, Operating Margin, Net Profit Margin, ROE, ROA, ROIC, ROCE",
    fields: [
      {k:"revenue", label:"Revenue", type:"number"},
      {k:"cogs", label:"Cost of Goods Sold (COGS)", type:"number"},
      {k:"operatingIncome", label:"Operating Income", type:"number"},
      {k:"netIncome", label:"Net Income", type:"number"},
      {k:"shareholdersEquity", label:"Shareholders' Equity", type:"number"},
      {k:"totalAssets", label:"Total Assets", type:"number"},
      {k:"nopat", label:"NOPAT (Net Operating Profit After Taxes)", type:"number"},
      {k:"investedCapital", label:"Invested Capital", type:"number"},
      {k:"ebit", label:"EBIT", type:"number"},
      {k:"capitalEmployed", label:"Capital Employed", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const rev = vals.revenue, cogs = vals.cogs, opInc = vals.operatingIncome, net = vals.netIncome;
      const eq = vals.shareholdersEquity, assets = vals.totalAssets, nopat = vals.nopat;
      const invested = vals.investedCapital, ebit = vals.ebit, capEmp = vals.capitalEmployed;

      if(valid(rev) && valid(cogs) && rev !== 0) res["Gross Margin"] = (rev - cogs) / rev;
      if(valid(opInc) && valid(rev) && rev !== 0) res["Operating Margin"] = opInc / rev;
      if(valid(net) && valid(rev) && rev !== 0) res["Net Profit Margin"] = net / rev;
      if(valid(net) && valid(eq)) res["ROE (Return on Equity)"] = net / eq;
      if(valid(net) && valid(assets)) res["ROA (Return on Assets)"] = net / assets;
      if(valid(nopat) && valid(invested)) res["ROIC"] = nopat / invested;
      if(valid(ebit) && valid(capEmp)) res["ROCE"] = ebit / capEmp;
      return res;
    }
  },

  liquidity: {
    title: "Liquidity Ratios",
    description: "Current Ratio, Quick Ratio, Cash Ratio, Operating Cash Flow Ratio",
    fields: [
      {k:"currentAssets", label:"Current Assets", type:"number"},
      {k:"currentLiabilities", label:"Current Liabilities", type:"number"},
      {k:"inventory", label:"Inventory", type:"number"},
      {k:"cashAndEquivalents", label:"Cash & Cash Equivalents", type:"number"},
      {k:"operatingCashFlow", label:"Operating Cash Flow", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const CA = vals.currentAssets, CL = vals.currentLiabilities, inv = vals.inventory;
      const cash = vals.cashAndEquivalents, ocf = vals.operatingCashFlow;
      if(valid(CA) && valid(CL) && CL !== 0) res["Current Ratio"] = CA / CL;
      if(valid(CA) && valid(inv) && valid(CL) && CL !== 0) res["Quick Ratio"] = (CA - inv) / CL;
      if(valid(cash) && valid(CL) && CL !== 0) res["Cash Ratio"] = cash / CL;
      if(valid(ocf) && valid(CL) && CL !== 0) res["Operating Cash Flow Ratio"] = ocf / CL;
      return res;
    }
  },

  leverage: {
    title: "Leverage & Solvency",
    description: "Debt-to-Equity, Debt-to-Assets, Equity Ratio, Interest Coverage, DSCR, Net Debt to EBITDA",
    fields: [
      {k:"totalDebt", label:"Total Debt", type:"number"},
      {k:"shareholdersEquity", label:"Shareholders' Equity", type:"number"},
      {k:"totalAssets", label:"Total Assets", type:"number"},
      {k:"ebit", label:"EBIT", type:"number"},
      {k:"interestExpense", label:"Interest Expense", type:"number"},
      {k:"operatingIncome", label:"Operating Income", type:"number"},
      {k:"totalDebtService", label:"Total Debt Service", type:"number"},
      {k:"cash", label:"Cash", type:"number"},
      {k:"ebitda", label:"EBITDA (optional for Net Debt/EBITDA)", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const D = vals.totalDebt, E = vals.shareholdersEquity, A = vals.totalAssets;
      const ebit = vals.ebit, interest = vals.interestExpense, opInc = vals.operatingIncome;
      const debtService = vals.totalDebtService, cash = vals.cash, ebitda = vals.ebitda;

      if(valid(D) && valid(E) && E !== 0) res["Debt-to-Equity"] = D / E;
      if(valid(D) && valid(A) && A !== 0) res["Debt-to-Assets"] = D / A;
      if(valid(E) && valid(A) && A !== 0) res["Equity Ratio"] = E / A;
      if(valid(ebit) && valid(interest) && interest !== 0) res["Interest Coverage (EBIT/Interest)"] = ebit / interest;
      if(valid(opInc) && valid(debtService) && debtService !== 0) res["Debt Service Coverage Ratio"] = opInc / debtService;
      if(valid(D) && valid(cash) && valid(ebitda)) res["Net Debt / EBITDA"] = (D - cash) / ebitda;
      return res;
    }
  },

  efficiency: {
    title: "Efficiency / Activity Ratios",
    description: "Asset Turnover, Inventory Turnover, Receivables Turnover, DSO, DIO, CCC",
    fields: [
      {k:"revenue", label:"Revenue", type:"number"},
      {k:"totalAssets", label:"Total Assets", type:"number"},
      {k:"avgInventory", label:"Average Inventory", type:"number"},
      {k:"cogs", label:"Cost of Goods Sold (COGS)", type:"number"},
      {k:"avgAccountsReceivable", label:"Average Accounts Receivable", type:"number"},
      {k:"accountsReceivable", label:"Accounts Receivable (current)", type:"number"},
      {k:"inventory", label:"Inventory (current)", type:"number"},
      {k:"daysPayablesOutstanding", label:"Days Payables Outstanding (DPO)", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const rev = vals.revenue, totA = vals.totalAssets;
      const avgInv = vals.avgInventory, cogs = vals.cogs, avgAR = vals.avgAccountsReceivable;
      const AR = vals.accountsReceivable, inv = vals.inventory, dpo = vals.daysPayablesOutstanding;

      if(valid(rev) && valid(totA) && totA !== 0) res["Asset Turnover"] = rev / totA;
      if(valid(cogs) && valid(avgInv) && avgInv !== 0) res["Inventory Turnover"] = cogs / avgInv;
      if(valid(rev) && valid(avgAR) && avgAR !== 0) res["Receivables Turnover"] = rev / avgAR;
      if(valid(AR) && valid(rev) && rev !== 0) res["DSO (Days Sales Outstanding)"] = (AR / rev) * 365;
      if(valid(inv) && valid(cogs) && cogs !== 0) res["DIO (Days Inventory Outstanding)"] = (inv / cogs) * 365;
      if(res["DSO (Days Sales Outstanding)"] !== undefined && res["DIO (Days Inventory Outstanding)"] !== undefined && valid(dpo)) {
        res["Cash Conversion Cycle (CCC)"] = res["DSO (Days Sales Outstanding)"] + res["DIO (Days Inventory Outstanding)"] - dpo;
      }
      return res;
    }
  },

  market: {
    title: "Market Performance & Risk",
    description: "Beta, Alpha, Sharpe, Sortino, Treynor, Max Drawdown",
    fields: [
      {k:"covariance", label:"Covariance (Stock, Market)", type:"number"},
      {k:"varianceMarket", label:"Variance (Market)", type:"number"},
      {k:"actualReturn", label:"Actual Return (decimal e.g. 0.12)", type:"number"},
      {k:"expectedReturn", label:"Expected Return (CAPM)", type:"number"},
      {k:"returnVal", label:"Return (decimal)", type:"number"},
      {k:"riskFreeRate", label:"Risk-Free Rate (decimal)", type:"number"},
      {k:"stdDev", label:"Standard Deviation", type:"number"},
      {k:"downsideDeviation", label:"Downside Deviation", type:"number"},
      {k:"beta", label:"Beta (optional)", type:"number"},
      {k:"peakValue", label:"Peak Value", type:"number"},
      {k:"troughValue", label:"Trough Value", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const cov = vals.covariance, varM = vals.varianceMarket, actual = vals.actualReturn, expected = vals.expectedReturn;
      const r = vals.returnVal, rf = vals.riskFreeRate, sd = vals.stdDev, dd = vals.downsideDeviation;
      const betaProvided = vals.beta, peak = vals.peakValue, trough = vals.troughValue;

      if(valid(cov) && valid(varM) && varM !== 0) res["Beta (β)"] = cov / varM;
      if(valid(actual) && valid(expected)) res["Alpha (α)"] = actual - expected;
      if(valid(r) && valid(rf) && valid(sd) && sd !== 0) res["Sharpe Ratio"] = (r - rf) / sd;
      if(valid(r) && valid(rf) && valid(dd) && dd !== 0) res["Sortino Ratio"] = (r - rf) / dd;
      const betaVal = res["Beta (β)"] !== undefined ? res["Beta (β)"] : (valid(betaProvided) ? betaProvided : undefined);
      if(valid(r) && valid(rf) && valid(betaVal) && betaVal !== 0) res["Treynor Ratio"] = (r - rf) / betaVal;
      if(valid(peak) && valid(trough) && peak !== 0) res["Maximum Drawdown"] = (peak - trough) / peak;
      return res;
    }
  },

  cashflow: {
    title: "Cash Flow & Dividend Sustainability",
    description: "Free Cash Flow, FCF Yield, Dividend Payout, Dividend Coverage, Cash Flow to Debt",
    fields: [
      {k:"operatingCashFlow", label:"Operating Cash Flow", type:"number"},
      {k:"capitalExpenditures", label:"Capital Expenditures", type:"number"},
      {k:"marketCap", label:"Market Capitalization", type:"number"},
      {k:"dividends", label:"Dividends", type:"number"},
      {k:"netIncome", label:"Net Income", type:"number"},
      {k:"totalDebt", label:"Total Debt", type:"number"}
    ],
    compute: function(vals){
      const res = {};
      const ocf = vals.operatingCashFlow, capex = vals.capitalExpenditures, mcap = vals.marketCap;
      const divs = vals.dividends, net = vals.netIncome, debt = vals.totalDebt;

      if(valid(ocf) && valid(capex)) res["Free Cash Flow (FCF)"] = ocf - capex;
      if(valid(res["Free Cash Flow (FCF)"]) && valid(mcap) && mcap !== 0) res["FCF Yield"] = res["Free Cash Flow (FCF)"] / mcap;
      if(valid(divs) && valid(net) && net !== 0) res["Dividend Payout Ratio"] = divs / net;
      if(valid(net) && valid(divs) && divs !== 0) res["Dividend Coverage Ratio"] = net / divs;
      if(valid(ocf) && valid(debt) && debt !== 0) res["Cash Flow to Debt Ratio"] = ocf / debt;
      return res;
    }
  },

  intrinsic: {
    title: "Intrinsic Value Metrics",
    description: "DCF, EVA, WACC",
    fields: [
      {k:"cfSeries", label:"Cash Flows (comma-separated, CF₁,CF₂,...)", type:"textarea"},
      {k:"discountRate", label:"Discount Rate r (decimal)", type:"number", step:"0.001"},
      {k:"nopat", label:"NOPAT", type:"number"},
      {k:"wacc", label:"WACC (decimal)", type:"number"},
      {k:"investedCapital", label:"Invested Capital", type:"number"},
      {k:"E", label:"E (Equity)", type:"number"},
      {k:"V", label:"V (Total Value)", type:"number"},
      {k:"Re", label:"Cost of Equity (Re)", type:"number"},
      {k:"D", label:"Debt (D)", type:"number"},
      {k:"Rd", label:"Cost of Debt (Rd)", type:"number"},
      {k:"taxRate", label:"Tax Rate (decimal)", type:"number", step:"0.01"}
    ],
    compute: function(vals){
      const res = {};
      // DCF = Σ [CFt / (1+r)^t]
      const cfStr = vals.cfSeries;
      const r = vals.discountRate;
      if(cfStr && typeof cfStr === "string" && cfStr.trim() !== "" && valid(r)) {
        const arr = cfStr.split(",").map(s => parseFloat(s.trim())).filter(x => !isNaN(x));
        let sum = 0;
        for(let i=0;i<arr.length;i++){
          const t = i+1;
          sum += arr[i] / Math.pow(1 + r, t);
        }
        res["DCF (present value)"] = sum;
      }

      // EVA = NOPAT - (WACC × Invested Capital)
      if(valid(vals.nopat) && valid(vals.wacc) && valid(vals.investedCapital)) {
        res["EVA"] = vals.nopat - (vals.wacc * vals.investedCapital);
      }

      // WACC = (E/V × Re) + (D/V × Rd × (1 – Tax Rate))
      if(valid(vals.E) && valid(vals.V) && vals.V !== 0 && valid(vals.Re) && valid(vals.D) && valid(vals.Rd) && valid(vals.taxRate)) {
        const wacc = (vals.E/vals.V * vals.Re) + (vals.D/vals.V * vals.Rd * (1 - vals.taxRate));
        res["WACC (calculated)"] = wacc;
      } else if(valid(vals.wacc)) {
        // If user supplied wacc, we show it
        res["WACC (input)"] = vals.wacc;
      }
      return res;
    }
  }
};

/* ---------- Utility helpers ---------- */
function valid(v){ return v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v)); }
function fmt(value){
  if(value === undefined) return "-";
  if(Math.abs(value) < 0.0001 && value !== 0) return value.toPrecision(4);
  if(Math.abs(value) < 1 && Math.abs(value) !== 0) return Number(value).toFixed(4);
  return Number(value).toLocaleString(undefined, {maximumFractionDigits:4});
}

/* ---------- DOM References ---------- */
const categoryGrid = document.getElementById("categoryGrid");
const ratioModalEl = document.getElementById("ratioModal");
const ratioModal = new bootstrap.Modal(ratioModalEl, {keyboard:true});
const ratioModalLabel = document.getElementById("ratioModalLabel");
const ratioForm = document.getElementById("ratioForm");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultsContainer = document.getElementById("resultsContainer");
const ratioChartCtx = document.getElementById("ratioChart").getContext('2d');

let activeCategoryKey = null;
let currentChart = null;

/* ---------- Build category buttons (cards) ---------- */
function buildCategoryGrid(){
  const keys = Object.keys(CATEGORIES);
  keys.forEach((key, idx) => {
    const cat = CATEGORIES[key];
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4";
    col.innerHTML = `
      <div class="category-card p-3" role="button" data-category="${key}" tabindex="${100+idx}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="category-title">${cat.title}</div>
            <div class="category-desc">${cat.description}</div>
          </div>
          <div class="text-end">
            <button class="btn btn-sm btn-outline-primary">Open</button>
          </div>
        </div>
      </div>
    `;
    categoryGrid.appendChild(col);
  });

  // add click events
  categoryGrid.querySelectorAll("[data-category]").forEach(el => {
    el.addEventListener("click", () => openCategoryModal(el.dataset.category));
  });
}

/* ---------- Build form for a category ---------- */
function openCategoryModal(categoryKey){
  activeCategoryKey = categoryKey;
  const cat = CATEGORIES[categoryKey];
  ratioModalLabel.textContent = cat.title;
  resultsContainer.innerHTML = "";

  // Build form inputs
  ratioForm.innerHTML = "";
  cat.fields.forEach(f => {
    const wrapper = document.createElement("div");
    wrapper.className = "mb-3";

    if(f.type === "textarea") {
      wrapper.innerHTML = `
        <label class="form-label">${f.label}</label>
        <textarea class="form-control" name="${f.k}" rows="3" placeholder="${f.placeholder || ''}"></textarea>
      `;
    } else {
      wrapper.innerHTML = `
        <label class="form-label">${f.label}</label>
        <input class="form-control" name="${f.k}" type="${f.type}" step="${f.step || 'any'}" placeholder="${f.placeholder || ''}" />
      `;
    }
    ratioForm.appendChild(wrapper);
  });

  // open modal
  ratioModal.show();
  // Clear chart and results
  clearChart();
}

/* ---------- Read form values ---------- */
function readFormValues(){
  const data = {};
  const inputs = ratioForm.querySelectorAll("input, textarea");
  inputs.forEach(inp => {
    const name = inp.name;
    const raw = inp.value;
    // If textarea for cfSeries, keep as string
    const fieldDef = findFieldDef(activeCategoryKey, name);
    if(fieldDef && fieldDef.type === "textarea") {
      data[name] = raw;
    } else {
      const n = parseFloat(raw);
      data[name] = Number.isNaN(n) ? undefined : n;
    }
  });
  return data;
}
function findFieldDef(catKey, name){
  const cat = CATEGORIES[catKey];
  if(!cat) return null;
  return cat.fields.find(f => f.k === name);
}

/* ---------- Analyze and render results ---------- */
analyzeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  if(!activeCategoryKey) return;
  const values = readFormValues();
  const cat = CATEGORIES[activeCategoryKey];
  const computed = cat.compute(values) || {};

  // Render results list/table
  renderResults(computed);

  // Render chart (bar)
  const labels = Object.keys(computed);
  const data = labels.map(k => computed[k]);

  if(labels.length === 0){
    showAlert("No ratios could be computed. Please fill the required fields with valid numbers.", "warning");
    clearChart();
    return;
  }
  renderChart(labels, data, cat.title);
});

/* ---------- Results rendering ---------- */
function renderResults(obj){
  if(!obj || Object.keys(obj).length === 0){
    resultsContainer.innerHTML = `<div class="text-muted">No ratios available. Provide inputs and press Analyze.</div>`;
    return;
  }
  const table = document.createElement("div");
  table.innerHTML = `
    <table class="table table-sm mb-0">
      <thead><tr><th>Ratio</th><th class="text-end">Value</th></tr></thead>
      <tbody>
        ${Object.entries(obj).map(([k,v]) => `<tr><td>${k}</td><td class="text-end">${fmt(v)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
  resultsContainer.innerHTML = "";
  resultsContainer.appendChild(table);
}

/* ---------- Chart rendering ---------- */
function renderChart(labels, data, title){
  // convert values to numbers for Chart.js, setting NaN -> 0
  const numericData = data.map(d => (Number.isFinite(d) ? d : 0));
  // destroy previous chart
  if(currentChart) currentChart.destroy();

  // create gradient for bars
  const gradient = ratioChartCtx.createLinearGradient(0,0,0,400);
  gradient.addColorStop(0, 'rgba(79,145,255,0.9)');
  gradient.addColorStop(1, 'rgba(76,175,80,0.9)');

  currentChart = new Chart(ratioChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: title,
        data: numericData,
        backgroundColor: gradient,
        borderColor: numericData.map(()=>'rgba(47,79,127,0.12)'),
        borderWidth: 1
      }]
    },
    options: {
      responsive:true,
      plugins: {
        legend:{ display: false },
        tooltip: {
          callbacks: {
            label: function(context){
              const val = context.raw;
              return `${fmt(val)}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { maxRotation: 35, minRotation: 0 } },
        y: { beginAtZero: true }
      }
    }
  });
}

function clearChart(){
  if(currentChart){ currentChart.destroy(); currentChart = null; }
  // clear canvas by resizing (small hack to clear)
  try { ratioChartCtx.clearRect(0,0,ratioChartCtx.canvas.width, ratioChartCtx.canvas.height); } catch(e){}
}

/* ---------- Additional UI handlers ---------- */
document.getElementById("clearFormBtn").addEventListener("click", (e) => {
  e.preventDefault();
  ratioForm.querySelectorAll("input,textarea").forEach(i => i.value = "");
  resultsContainer.innerHTML = "";
  clearChart();
});

function showAlert(message, type="info"){
  // Simple temporary alert (bootstrap)
  const alertId = "tempAlert";
  let existing = document.getElementById(alertId);
  if(existing) existing.remove();
  const el = document.createElement("div");
  el.id = alertId;
  el.className = `alert alert-${type} position-fixed top-0 end-0 m-3 shadow`;
  el.style.zIndex = 2000;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(()=> el.classList.add("fade"), 10);
  setTimeout(()=> { el.classList.remove("fade"); el.remove(); }, 3500);
}

/* ---------- Init ---------- */
(function init(){
  buildCategoryGrid();
})();