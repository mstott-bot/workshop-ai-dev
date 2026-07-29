/* Workshop AI OS v5.7.3 — Vehicle Intelligence Search Button Fix
   Independent binding so the search button and Enter key work even if the original handler is missed.
   Does not change Coach, Garage Health, Action Centre, job boards, timers, or parts logic.
*/
(function(){
  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v || '').toLowerCase().trim(); }

  function safeCompleted(job){
    try {
      if (typeof completed === 'function') return completed(job);
    } catch(e) {}
    const st = String(job && job.status || '');
    return !!(job && job.completedAt) || st.includes('Ready') || st.includes('Complete') || st.includes('Collected');
  }

  function safeFmt(dt){
    try {
      if (typeof fmt === 'function') return fmt(dt);
    } catch(e) {}
    return dt ? new Date(dt).toLocaleString('en-GB') : 'Not set';
  }

  function searchText(job){
    try {
      if (typeof vehicleHistorySearchText === 'function') return vehicleHistorySearchText(job);
    } catch(e) {}
    const partsRequests = (job.partsRequests || []).map(function(p){
      return [p.description, p.qty, p.priority, p.supplier, p.status, p.note].join(' ');
    }).join(' ');
    const timeline = (job.timeline || []).map(function(t){
      return [t.title, t.detail, t.type].join(' ');
    }).join(' ');
    return [
      job.jobNo, job.reg, job.customer, job.phone, job.make, job.model, job.mileage,
      job.type, job.technician, job.status, job.workRequired, job.specialInstructions,
      job.complaint, job.findings, job.repair, job.parts, job.advisories, job.report,
      partsRequests, timeline
    ].join(' ');
  }

  function partsSummary(job){
    try {
      if (typeof vehicleHistoryPartsSummary === 'function') return vehicleHistoryPartsSummary(job);
    } catch(e) {}
    const req = job.partsRequests || [];
    if (req.length) {
      return req.map(function(p){ return (p.description || 'Part') + ' x' + (p.qty || 1) + ' (' + (p.status || 'Requested') + ')'; }).join(', ');
    }
    return job.parts || 'No parts recorded';
  }

  function badge(job){
    const st = String(job.status || '');
    if (st.includes('Awaiting Parts')) return '<span class="history-badge parts">Awaiting Parts</span>';
    if (!safeCompleted(job)) return '<span class="history-badge open">Open</span>';
    return '<span class="history-badge complete">History</span>';
  }

  function visitsByReg(list){
    const map = {};
    list.forEach(function(j){
      const reg = String(j.reg || 'Unknown').toUpperCase();
      map[reg] = (map[reg] || 0) + 1;
    });
    return map;
  }

  function escapeHtml(v){
    return String(v || '').replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }

  window.runVehicleIntelligenceSearch = function(){
    const results = byId('vehicleIntelligenceResults');
    if (!results) return;

    const search = byId('vehicleHistorySearch');
    const filterEl = byId('vehicleHistoryQuickFilter');
    const q = norm(search ? search.value : '');
    const filter = filterEl ? filterEl.value : 'all';

    let list = Array.isArray(jobs) ? jobs.slice() : [];
    list.sort(function(a,b){
      return new Date(b.completedAt || b.finishedAt || b.createdAt || 0) - new Date(a.completedAt || a.finishedAt || a.createdAt || 0);
    });

    if (q) list = list.filter(function(j){ return norm(searchText(j)).includes(q); });
    if (filter === 'completed') list = list.filter(function(j){ return safeCompleted(j); });
    if (filter === 'open') list = list.filter(function(j){ return !safeCompleted(j); });
    if (filter === 'parts') list = list.filter(function(j){
      return String(j.status || '').includes('Awaiting Parts') || (j.partsRequests || []).some(function(p){ return !['Received','Fitted'].includes(p.status); });
    });
    if (filter === 'approval') list = list.filter(function(j){ return String(j.status || '').includes('Approval'); });

    const visits = visitsByReg(list);
    const uniqueVehicles = Object.keys(visits).length;
    const completedCount = list.filter(safeCompleted).length;
    const openCount = list.filter(function(j){ return !safeCompleted(j); }).length;
    const partsCount = list.filter(function(j){
      return String(j.status || '').includes('Awaiting Parts') || (j.partsRequests || []).some(function(p){ return !['Received','Fitted'].includes(p.status); });
    }).length;

    const stats = byId('vehicleIntelligenceStats');
    if (stats) {
      stats.innerHTML = '<div class="stat"><strong>' + list.length + '</strong>Jobs Found</div>' +
        '<div class="stat"><strong>' + uniqueVehicles + '</strong>Vehicles</div>' +
        '<div class="stat good"><strong>' + completedCount + '</strong>History Jobs</div>' +
        '<div class="stat warn"><strong>' + openCount + '</strong>Open Jobs</div>' +
        '<div class="stat ' + (partsCount ? 'bad' : 'good') + '"><strong>' + partsCount + '</strong>Parts Issues</div>';
    }

    if (!list.length) {
      results.innerHTML = q ? 'No matching vehicle history found.' : 'No jobs recorded yet.';
      return;
    }

    results.innerHTML = list.map(function(j){
      try { if (typeof ensureTimeline === 'function') ensureTimeline(j); } catch(e) {}
      const visitCount = visits[String(j.reg || 'Unknown').toUpperCase()] || 1;
      const reportPreview = j.report ? '<div class="history-report-preview">' + escapeHtml(j.report) + '</div>' : '';
      return '<div class="job-card vehicle-intelligence-card">' +
        '<h3>' + escapeHtml(j.reg || 'No reg') + ' — ' + escapeHtml((j.make || '') + ' ' + (j.model || '')) + ' ' + badge(j) + '</h3>' +
        '<div class="vehicle-intelligence-meta">' +
          '<div><strong>Job Number</strong>' + escapeHtml(j.jobNo || 'Not set') + '</div>' +
          '<div><strong>Customer</strong>' + escapeHtml(j.customer || 'Not entered') + '</div>' +
          '<div><strong>Telephone</strong>' + escapeHtml(j.phone || 'Not entered') + '</div>' +
          '<div><strong>Technician</strong>' + escapeHtml(j.technician || 'Not set') + '</div>' +
          '<div><strong>Booking Date</strong>' + escapeHtml(j.bookingDate || 'Not set') + '</div>' +
          '<div><strong>Completed</strong>' + escapeHtml(j.completedAt ? safeFmt(j.completedAt) : 'Not completed') + '</div>' +
          '<div><strong>Status</strong>' + escapeHtml(j.status || 'Not set') + '</div>' +
          '<div><strong>Total Visits Found</strong>' + visitCount + '</div>' +
        '</div>' +
        '<p><strong>Work Required:</strong> ' + escapeHtml(j.workRequired || 'Not entered') + '</p>' +
        '<p><strong>Repair / Findings:</strong> ' + escapeHtml(j.repair || j.findings || 'No technician repair summary yet.') + '</p>' +
        '<p><strong>Parts History:</strong> ' + escapeHtml(partsSummary(j)) + '</p>' +
        '<p><strong>Timeline Events:</strong> ' + ((j.timeline || []).length) + '</p>' +
        reportPreview +
        '<div class="vehicle-intelligence-actions">' +
          '<button onclick="showTimelineModal(\'' + j.id + '\')">Timeline</button>' +
          '<button onclick="openJob(\'' + j.id + '\')">Open Job</button>' +
          (j.report ? '<button onclick="copyVehicleHistoryReport(\'' + j.id + '\')">Copy Report</button>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  };

  function bind(){
    const btn = byId('vehicleHistorySearchBtn');
    const input = byId('vehicleHistorySearch');
    const filter = byId('vehicleHistoryQuickFilter');

    if (btn && !btn.dataset.waiVehicleFixed) {
      btn.dataset.waiVehicleFixed = '1';
      btn.addEventListener('click', function(e){ e.preventDefault(); window.runVehicleIntelligenceSearch(); });
    }
    if (input && !input.dataset.waiVehicleFixed) {
      input.dataset.waiVehicleFixed = '1';
      input.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); window.runVehicleIntelligenceSearch(); } });
    }
    if (filter && !filter.dataset.waiVehicleFixed) {
      filter.dataset.waiVehicleFixed = '1';
      filter.addEventListener('change', window.runVehicleIntelligenceSearch);
    }
  }

  document.addEventListener('click', function(e){
    if (e.target && e.target.id === 'vehicleHistorySearchBtn') {
      e.preventDefault();
      window.runVehicleIntelligenceSearch();
    }
  });

  const oldRender = typeof render === 'function' ? render : null;
  if (oldRender && !window.__waiVehicleRenderWrapped) {
    window.__waiVehicleRenderWrapped = true;
    render = function(){ oldRender(); bind(); if (byId('vehicleIntelligenceResults')) window.runVehicleIntelligenceSearch(); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ bind(); window.runVehicleIntelligenceSearch(); });
  } else {
    bind();
    window.runVehicleIntelligenceSearch();
  }
})();
