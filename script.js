// ─── STATE ────────────────────────────────────────────
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const CAT_COLORS = {
  Makanan: '#2D5016',
  Transportasi: '#1D9E75',
  Tagihan: '#D85A30',
  Belanja: '#7F77DD',
  Hiburan: '#D4537E',
  Kesehatan: '#E0A500',
  Lainnya: '#6B6660'
};

const CAT_LIGHT = {
  Makanan: '#EBF3E3',
  Transportasi: '#E1F5EE',
  Tagihan: '#FAECE7',
  Belanja: '#EEEDFE',
  Hiburan: '#FBEAF0',
  Kesehatan: '#FEF9E7',
  Lainnya: '#F1EFE8'
};

let now = new Date();
let curYear = now.getFullYear();
let curMonth = now.getMonth();
let data = JSON.parse(localStorage.getItem('exp_v2') || '{}');
let budgets = JSON.parse(localStorage.getItem('exp_budgets') || '{}');
let catChartInst = null;
let trendChartInst = null;
let reportPieInst = null;
let reportLineInst = null;

// ─── HELPERS ──────────────────────────────────────────
const key = () => `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
const monthExp = () => data[key()] || [];
const fmt = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const save = () => localStorage.setItem('exp_v2', JSON.stringify(data));
const saveBudgets = () => localStorage.setItem('exp_budgets', JSON.stringify(budgets));
const genId = () => Date.now() + Math.random().toString(36).slice(2, 6);

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ─── NAVIGATION ───────────────────────────────────────
const pages = {
  dashboard: 'Dashboard',
  transaksi: 'Transaksi',
  laporan: 'Laporan'
};

let activePage = 'dashboard';

function showPage(p) {
  activePage = p;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  document.querySelectorAll('.nav-item')[Object.keys(pages).indexOf(p)].classList.add('active');
  document.getElementById('pageTitle').textContent = pages[p];
  render();
}

function changeMonth(d) {
  curMonth += d;
  if (curMonth > 11) {
    curMonth = 0;
    curYear++;
  }
  if (curMonth < 0) {
    curMonth = 11;
    curYear--;
  }
  document.getElementById('budgetInput').value = budgets[key()] || '';
  render();
}

// ─── CRUD ─────────────────────────────────────────────
function addExpense() {
  const name = document.getElementById('fName').value.trim();
  const amount = parseFloat(document.getElementById('fAmount').value);
  if (!name || !amount || amount <= 0) {
    toast('⚠ Isi keterangan dan jumlah yang valid');
    return;
  }
  const cat = document.getElementById('fCat').value;
  const note = document.getElementById('fNote').value.trim();
  let date = document.getElementById('fDate').value;
  if (!date) {
    const t = new Date();
    date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }
  const k = key();
  if (!data[k]) data[k] = [];
  data[k].push({
    id: genId(),
    name,
    amount,
    cat,
    note,
    date
  });
  save();
  render();
  document.getElementById('fName').value = '';
  document.getElementById('fAmount').value = '';
  document.getElementById('fNote').value = '';
  toast('✓ Pengeluaran ditambahkan');
}

function deleteExpense(id) {
  const k = key();
  data[k] = (data[k] || []).filter(e => e.id !== id);
  save();
  render();
  toast('Transaksi dihapus');
}

function confirmDeleteAll() {
  if (monthExp().length === 0) {
    toast('Tidak ada data');
    return;
  }
  if (confirm(`Hapus semua ${monthExp().length} transaksi bulan ${MONTHS[curMonth]}?`)) {
    data[key()] = [];
    save();
    render();
    toast('Semua transaksi dihapus');
  }
}

function openEdit(id) {
  const exp = monthExp().find(e => e.id === id);
  if (!exp) return;
  document.getElementById('editId').value = id;
  document.getElementById('editName').value = exp.name;
  document.getElementById('editAmount').value = exp.amount;
  document.getElementById('editCat').value = exp.cat;
  document.getElementById('editDate').value = exp.date;
  document.getElementById('editNote').value = exp.note || '';
  document.getElementById('editModal').classList.add('open');
}

function closeModal() {
  document.getElementById('editModal').classList.remove('open');
}

function saveEdit() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('editName').value.trim();
  const amount = parseFloat(document.getElementById('editAmount').value);
  if (!name || !amount || amount <= 0) {
    toast('⚠ Data tidak valid');
    return;
  }
  const k = key();
  data[k] = (data[k] || []).map(e =>
    e.id === id ? {
      ...e,
      name,
      amount,
      cat: document.getElementById('editCat').value,
      date: document.getElementById('editDate').value,
      note: document.getElementById('editNote').value.trim()
    } : e
  );
  save();
  closeModal();
  render();
  toast('✓ Perubahan disimpan');
}

function saveBudget() {
  budgets[key()] = parseFloat(document.getElementById('budgetInput').value) || 0;
  saveBudgets();
  render();
}

// ─── RENDER ───────────────────────────────────────────
function render() {
  document.getElementById('monthLabel').textContent = `${MONTHS[curMonth]} ${curYear}`;
  const list = monthExp();
  const budget = parseFloat(document.getElementById('budgetInput').value) || 0;
  const total = list.reduce((s, e) => s + e.amount, 0);
  const sisa = budget - total;

  // metrics
  document.getElementById('m-total').textContent = fmt(total);
  document.getElementById('m-count').textContent = list.length + ' transaksi';
  document.getElementById('m-sisa').textContent = fmt(Math.abs(sisa));
  document.getElementById('m-sisa').style.color = sisa < 0 ? 'var(--danger)' : 'var(--accent)';
  document.getElementById('m-pct-label').textContent = budget > 0 ? (sisa < 0 ? 'melebihi anggaran' : 'sisa dari anggaran') : 'belum ada anggaran';

  // daily avg
  const today = new Date();
  const daysElapsed = curMonth === today.getMonth() && curYear === today.getFullYear() ? today.getDate() : new Date(curYear, curMonth + 1, 0).getDate();
  document.getElementById('m-daily').textContent = list.length ? fmt(total / daysElapsed) : 'Rp 0';

  // max
  const maxExp = list.reduce((m, e) => e.amount > m.amount ? e : m, {
    amount: 0,
    name: '—',
    cat: '—'
  });
  document.getElementById('m-max').textContent = fmt(maxExp.amount);
  document.getElementById('m-max-cat').textContent = maxExp.amount > 0 ? maxExp.name : '—';

  // progress
  const pct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const pf = document.getElementById('progressFill');
  pf.style.width = pct.toFixed(1) + '%';
  pf.className = 'progress-fill' + (pct >= 100 ? ' danger' : pct >= 75 ? ' warn' : '');
  document.getElementById('progressPct').textContent = pct.toFixed(0) + '%';
  document.getElementById('progressPct').style.color = pct >= 100 ? 'var(--danger)' : pct >= 75 ? 'var(--warn)' : 'var(--text2)';

  if (activePage === 'dashboard') {
    renderDashboard(list);
  }
  if (activePage === 'transaksi') {
    renderTransactions();
  }
  if (activePage === 'laporan') {
    renderLaporan(list);
  }
}

function renderDashboard(list) {
  renderCatChart(list);
  renderTrendChart(list);
  renderRecentTable(list.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8));
}

function renderRecentTable(list) {
  const body = document.getElementById('recentBody');
  if (!list.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="4">Belum ada transaksi bulan ini</td></tr>';
    return;
  }
  body.innerHTML = list.map(e => `
    <tr>
      <td style="color:var(--text3);white-space:nowrap">${fmtDate(e.date)}</td>
      <td><b style="font-weight:500">${e.name}</b></td>
      <td><span class="cat-pill" style="background:${CAT_LIGHT[e.cat] || '#f0f0f0'};color:${CAT_COLORS[e.cat] || '#888'}">
        <span class="cat-dot" style="background:${CAT_COLORS[e.cat] || '#888'}"></span>${e.cat}
      </span></td>
      <td class="amount-cell">${fmt(e.amount)}</td>
    </tr>`).join('');
}

function renderTransactions() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  const cat = document.getElementById('filterCat').value;
  const sort = document.getElementById('sortBy').value;
  let list = monthExp().filter(e => {
    const matchQ = !q || e.name.toLowerCase().includes(q) || (e.note || '').toLowerCase().includes(q);
    const matchCat = !cat || e.cat === cat;
    return matchQ && matchCat;
  });
  if (sort === 'date-desc') list.sort((a, b) => b.date.localeCompare(a.date));
  else if (sort === 'date-asc') list.sort((a, b) => a.date.localeCompare(b.date));
  else if (sort === 'amount-desc') list.sort((a, b) => b.amount - a.amount);
  else list.sort((a, b) => a.amount - b.amount);
  document.getElementById('resultCount').textContent = list.length + ' transaksi ditemukan';
  const body = document.getElementById('transBody');
  if (!list.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="6">Tidak ada transaksi yang cocok</td></tr>';
    return;
  }
  body.innerHTML = list.map(e => `
    <tr>
      <td style="color:var(--text3);white-space:nowrap">${fmtDate(e.date)}</td>
      <td><b style="font-weight:500">${e.name}</b></td>
      <td style="color:var(--text3);font-size:13px">${e.note || '—'}</td>
      <td><span class="cat-pill" style="background:${CAT_LIGHT[e.cat] || '#f0f0f0'};color:${CAT_COLORS[e.cat] || '#888'}">
        <span class="cat-dot" style="background:${CAT_COLORS[e.cat] || '#888'}"></span>${e.cat}
      </span></td>
      <td class="amount-cell">${fmt(e.amount)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="openEdit('${e.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="if(confirm('Hapus transaksi ini?'))deleteExpense('${e.id}')">Hapus</button>
        </div>
      </td>
    </tr>`).join('');
}

function renderLaporan(list) {
  // Pie chart
  const cats = {};
  list.forEach(e => {
    cats[e.cat] = (cats[e.cat] || 0) + e.amount;
  });
  const catLabels = Object.keys(cats);
  const catData = Object.values(cats);
  const catColors = catLabels.map(l => CAT_COLORS[l] || '#888');
  if (reportPieInst) reportPieInst.destroy();
  reportPieInst = new Chart(document.getElementById('reportPie'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData.length ? catData : [1],
        backgroundColor: catData.length ? catColors : ['#ddd'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${fmt(ctx.raw)} (${catLabels.length ? ((ctx.raw / catData.reduce((a, b) => a + b, 0)) * 100).toFixed(1) + '%' : ''})`
          }
        }
      },
      cutout: '60%'
    }
  });

  // Line chart – 6 months
  const months6 = [];
  const totals6 = [];
  for (let i = 5; i >= 0; i--) {
    let m = curMonth - i;
    let y = curYear;
    if (m < 0) {
      m += 12;
      y--;
    }
    const k = `${y}-${String(m + 1).padStart(2, '0')}`;
    months6.push(MONTHS[m].slice(0, 3));
    totals6.push((data[k] || []).reduce((s, e) => s + e.amount, 0));
  }
  if (reportLineInst) reportLineInst.destroy();
  reportLineInst = new Chart(document.getElementById('reportLine'), {
    type: 'line',
    data: {
      labels: months6,
      datasets: [{
        label: 'Total Pengeluaran',
        data: totals6,
        borderColor: '#2D5016',
        backgroundColor: 'rgba(45, 80, 22, .08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#2D5016',
        pointRadius: 5,
        fill: true,
        tension: .35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          grid: {
            color: 'rgba(0, 0, 0, .06)'
          },
          ticks: {
            callback: v => v >= 1000000 ? 'Rp ' + (v / 1000000).toFixed(1) + 'jt' : 'Rp ' + (v / 1000).toFixed(0) + 'rb'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });

  // Category breakdown
  const total = list.reduce((s, e) => s + e.amount, 0);
  document.getElementById('catBreakdown').innerHTML = Object.keys(CAT_COLORS).map(cat => {
    const amt = (cats[cat] || 0);
    const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span class="cat-dot" style="background:${CAT_COLORS[cat]};width:10px;height:10px;border-radius:50%;flex-shrink:0"></span>
      <span style="flex:1;font-size:14px">${cat}</span>
      <span style="font-size:13px;color:var(--text3)">${pct}%</span>
      <span style="font-size:14px;font-weight:600;min-width:100px;text-align:right">${fmt(amt)}</span>
    </div>`;
  }).join('');

  // Top 5
  const top5 = list.slice().sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxAmt = top5[0]?.amount || 1;
  document.getElementById('topExpenses').innerHTML = top5.length ? top5.map((e, i) => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
        <span style="font-weight:500">${i + 1}. ${e.name}</span>
        <span style="font-weight:600">${fmt(e.amount)}</span>
      </div>
      <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden">
        <div style="height:100%;background:${CAT_COLORS[e.cat] || '#888'};border-radius:3px;width:${((e.amount / maxAmt) * 100).toFixed(1)}%;transition:.4s"></div>
      </div>
    </div>`).join('') : '<div style="color:var(--text3);font-size:14px;padding:20px 0;text-align:center">Belum ada data</div>';
}

function renderCatChart(list) {
  const cats = {};
  list.forEach(e => {
    cats[e.cat] = (cats[e.cat] || 0) + e.amount;
  });
  const labels = Object.keys(cats);
  const vals = Object.values(cats);
  const colors = labels.map(l => CAT_COLORS[l] || '#888');
  const total = vals.reduce((a, b) => a + b, 0);

  document.getElementById('catLegend').innerHTML = labels.map((l, i) => `
    <span class="legend-item">
      <span class="legend-sq" style="background:${colors[i]}"></span>${l} ${total > 0 ? ((vals[i] / total * 100).toFixed(0)) + '%' : ''}
    </span>`).join('');

  if (catChartInst) catChartInst.destroy();
  catChartInst = new Chart(document.getElementById('catChart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: vals.length ? vals : [1],
        backgroundColor: vals.length ? colors : ['#e8e4dc'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${fmt(ctx.raw)}`
          }
        }
      },
      cutout: '62%'
    }
  });
}

function renderTrendChart(list) {
  const days = {};
  list.forEach(e => {
    const d = e.date || '';
    days[d] = (days[d] || 0) + e.amount;
  });
  const sorted = Object.keys(days).sort();
  const dayLabels = sorted.map(d => {
    const p = d.split('-');
    return p[2] + '/' + p[1];
  });

  if (trendChartInst) trendChartInst.destroy();
  trendChartInst = new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
      labels: dayLabels.length ? dayLabels : ['—'],
      datasets: [{
        data: sorted.length ? sorted.map(d => days[d]) : [0],
        backgroundColor: '#2D5016',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: ctx => fmt(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            },
            maxTicksLimit: 14
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, .05)'
          },
          ticks: {
            callback: v => v >= 1000000 ? 'Rp ' + (v / 1000000).toFixed(1) + 'jt' : v >= 1000 ? 'Rp ' + (v / 1000).toFixed(0) + 'rb' : 'Rp ' + v
          }
        }
      }
    }
  });
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day} ${MONTHS[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

// ─── EXPORT EXCEL ──────────────────────────────────────
function exportExcel() {
  const list = monthExp();
  if (!list.length) {
    toast('⚠ Tidak ada data untuk diekspor');
    return;
  }
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const headers = ['No', 'Tanggal', 'Keterangan', 'Catatan', 'Kategori', 'Jumlah (Rp)'];
  const rows = list.slice().sort((a, b) => a.date.localeCompare(b.date))
    .map((e, i) => [i + 1, fmtDate(e.date), e.name, e.note || '', e.cat, e.amount]);
  const budget = budgets[key()] || 0;
  const total = list.reduce((s, e) => s + e.amount, 0);
  const wsData = [
    [`LAPORAN PENGELUARAN — ${MONTHS[curMonth].toUpperCase()} ${curYear}`],
    [],
    headers,
    ...rows,
    [],
    ['', '', '', '', 'TOTAL', total],
    ['', '', '', '', 'ANGGARAN', budget],
    ['', '', '', '', 'SISA', budget - total],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 32 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 }
  ];

  // Merge title row
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');

  // Sheet 2: Ringkasan per kategori
  const cats = {};
  list.forEach(e => {
    cats[e.cat] = (cats[e.cat] || 0) + e.amount;
  });
  const sumData = [
    ['RINGKASAN PER KATEGORI'],
    [],
    ['Kategori', 'Total (Rp)', '%'],
    ...Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => [cat, amt, (amt / total * 100).toFixed(1) + '%']),
    [],
    ['Total', total, '100%']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sumData);
  ws2['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 10 }
  ];
  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

  // Sheet 3: Tren harian
  const days = {};
  list.forEach(e => {
    const d = e.date || '';
    days[d] = (days[d] || 0) + e.amount;
  });
  const trendData = [
    ['TREN PENGELUARAN HARIAN'],
    [],
    ['Tanggal', 'Total (Rp)'],
    ...Object.keys(days).sort().map(d => [fmtDate(d), days[d]])
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(trendData);
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 16 }
  ];
  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Tren Harian');

  const fname = `Pengeluaran_${MONTHS[curMonth]}_${curYear}.xlsx`;
  XLSX.writeFile(wb, fname);
  toast('✓ File Excel berhasil diunduh');
}

// ─── INIT ─────────────────────────────────────────────
document.getElementById('fDate').value = (() => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
})();
document.getElementById('budgetInput').value = budgets[key()] || '';
document.getElementById('editModal').addEventListener('click', e => {
  if (e.target === document.getElementById('editModal')) closeModal();
});
render();