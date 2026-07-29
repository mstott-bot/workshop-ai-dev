/* Workshop AI WAI-106.0 — Staff Calendar & Attendance
   Shares the Daily Planner availability store directly. */
(function(){
  'use strict';
  const STORE='workshopAIForwardTechnicianAvailabilityV1';
  const STATUS_META={
    'Working':{cls:'working',icon:'🟢'},'Holiday':{cls:'holiday',icon:'🏖'},'Sick':{cls:'sick',icon:'🤒'},
    'Training':{cls:'training',icon:'🎓'},'Half Day':{cls:'half-day',icon:'🟠'},'Overtime':{cls:'overtime',icon:'⏰'},
    'Not Scheduled':{cls:'not-scheduled',icon:'⚫'},'Medical Appointment':{cls:'other',icon:'🩺'},
    'Compassionate Leave':{cls:'other',icon:'💜'},'Unpaid Leave':{cls:'other',icon:'◼'},'Other Time Off':{cls:'other',icon:'⚪'}
  };
  let viewDate=new Date(); viewDate.setDate(1);
  let reportType='all';
  const $=id=>document.getElementById(id);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function techs(){ return typeof getTechs==='function'?getTechs():[]; }
  function store(){ try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}} }
  function save(data){ localStorage.setItem(STORE,JSON.stringify(data)); if(typeof forwardTechnicianAvailability!=='undefined') forwardTechnicianAvailability=data; }
  function record(date,tech){ const data=store(); return data[`${date}::${tech}`]||{technician:tech,date,status:'Working',hours:Number(window.plannerSettings?.capacity||8),note:'',custom:false}; }
  function monthBounds(){ return {start:new Date(viewDate.getFullYear(),viewDate.getMonth(),1),end:new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0)}; }
  function weekdays(){ const {start,end}=monthBounds(),out=[]; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){if(d.getDay()!==0&&d.getDay()!==6)out.push(new Date(d));} return out; }
  function renderCalendar(){
    if(!$('staffCalendarGrid'))return;
    const days=weekdays(), names=techs();
    $('staffCalendarMonthTitle').textContent=viewDate.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
    $('staffCalendarGrid').innerHTML=`<table class="staff-calendar-table"><thead><tr><th>Technician</th>${days.map(d=>`<th>${d.toLocaleDateString('en-GB',{weekday:'short'})}<br>${d.getDate()}</th>`).join('')}</tr></thead><tbody>${names.map(t=>`<tr><td>${esc(t)}</td>${days.map(d=>{const date=iso(d),r=record(date,t),m=STATUS_META[r.status]||STATUS_META['Other Time Off'];return `<td><button class="staff-calendar-status ${m.cls}" data-date="${date}" data-tech="${esc(t)}"><span>${m.icon} ${esc(r.status)}</span>${r.note?`<div class="calendar-note">${esc(r.note)}</div>`:''}<div class="calendar-note">${Number(r.hours||0).toFixed(1)} hrs available</div></button></td>`}).join('')}</tr>`).join('')}</tbody></table>`;
    $('staffCalendarGrid').querySelectorAll('[data-date]').forEach(btn=>btn.addEventListener('click',()=>openEditor(btn.dataset.tech,btn.dataset.date)));
    renderCalendarSummary();
  }
  function renderCalendarSummary(){
    const days=weekdays(), names=techs(); let holiday=0,sick=0,other=0,available=0;
    days.forEach(d=>names.forEach(t=>{const r=record(iso(d),t); if(r.status==='Holiday')holiday++; else if(r.status==='Sick')sick++; else if(r.status!=='Working'&&r.status!=='Overtime')other++; if(Number(r.hours)>0)available++;}));
    $('staffCalendarSummary').innerHTML=`<div class="stat"><strong>${holiday}</strong>Holiday Days</div><div class="stat"><strong>${sick}</strong>Sick Days</div><div class="stat"><strong>${other}</strong>Other Time Off</div><div class="stat good"><strong>${available}</strong>Available Staff Days</div>`;
  }
  function openEditor(tech,date){
    const r=record(date,tech); $('attendanceTechnician').value=tech; $('attendanceStartDate').value=date; $('attendanceEndDate').value=date; $('attendanceStatus').value=STATUS_META[r.status]?r.status:'Other Time Off'; $('attendanceHours').value=Number(r.hours||0); $('attendanceNote').value=r.note||''; $('attendanceModal').classList.remove('hidden');
  }
  function closeEditor(){ $('attendanceModal').classList.add('hidden'); }
  function datesInclusive(a,b){const out=[],s=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00');for(let d=s;d<=e;d.setDate(d.getDate()+1))out.push(iso(d));return out;}
  function defaultHours(status){const normal=Number(window.plannerSettings?.capacity||8);if(['Holiday','Sick','Training','Not Scheduled','Compassionate Leave','Unpaid Leave','Other Time Off'].includes(status))return 0;if(status==='Half Day'||status==='Medical Appointment')return normal/2;if(status==='Overtime')return normal+2;return normal;}
  function saveEditor(){
    const tech=$('attendanceTechnician').value,start=$('attendanceStartDate').value,end=$('attendanceEndDate').value||start,status=$('attendanceStatus').value,hours=Number($('attendanceHours').value),note=$('attendanceNote').value.trim();
    if(!tech||!start||!end||new Date(end)<new Date(start)){alert('Select a technician and a valid date range.');return;}
    const data=store(); datesInclusive(start,end).forEach(date=>data[`${date}::${tech}`]={technician:tech,date,status,hours:Number.isFinite(hours)?hours:defaultHours(status),note,updatedAt:new Date().toISOString()}); save(data); closeEditor();
    if(typeof render==='function')render(); renderCalendar(); renderAttendanceReport();
  }
  function clearEditor(){const tech=$('attendanceTechnician').value,start=$('attendanceStartDate').value,end=$('attendanceEndDate').value||start,data=store();datesInclusive(start,end).forEach(date=>delete data[`${date}::${tech}`]);save(data);closeEditor();if(typeof render==='function')render();renderCalendar();renderAttendanceReport();}
  function reportRange(){const p=$('attendanceReportPeriod')?.value||'month',now=new Date();let start,end;if(p==='year'){start=new Date(now.getFullYear(),0,1);end=new Date(now.getFullYear(),11,31)}else if(p==='previousYear'){start=new Date(now.getFullYear()-1,0,1);end=new Date(now.getFullYear()-1,11,31)}else if(p==='custom'){start=new Date(($('attendanceReportStart').value||iso(new Date(now.getFullYear(),now.getMonth(),1)))+'T00:00:00');end=new Date(($('attendanceReportEnd').value||iso(now))+'T23:59:59')}else{start=new Date(now.getFullYear(),now.getMonth(),1);end=new Date(now.getFullYear(),now.getMonth()+1,0)}return {start,end};}
  function reportRecords(){const {start,end}=reportRange(),selected=$('attendanceReportTechnician')?.value||'All';return Object.values(store()).filter(r=>{const d=new Date(r.date+'T12:00:00');if(d<start||d>end)return false;if(selected!=='All'&&r.technician!==selected)return false;if(reportType==='holiday')return r.status==='Holiday';if(reportType==='sick')return r.status==='Sick';if(reportType==='timeoff')return !['Working','Overtime'].includes(r.status);return true;});}
  function renderAttendanceReport(){
    if(!$('attendanceReportOutput'))return; const recs=reportRecords(); const holiday=recs.filter(r=>r.status==='Holiday').length,sick=recs.filter(r=>r.status==='Sick').length,timeoff=recs.filter(r=>!['Working','Overtime'].includes(r.status)).length,occasions=countOccasions(recs.filter(r=>r.status==='Sick'));
    $('attendanceReportSummary').innerHTML=`<div class="stat"><strong>${holiday}</strong>Holiday Days</div><div class="stat bad"><strong>${sick}</strong>Sick Days</div><div class="stat warn"><strong>${occasions}</strong>Sickness Occasions</div><div class="stat"><strong>${timeoff}</strong>Total Time-Off Days</div>`;
    const grouped={}; recs.forEach(r=>{const k=r.technician;grouped[k]??={Holiday:0,Sick:0,Training:0,Other:0,total:0};grouped[k].total++;if(r.status==='Holiday')grouped[k].Holiday++;else if(r.status==='Sick')grouped[k].Sick++;else if(r.status==='Training')grouped[k].Training++;else if(!['Working','Overtime'].includes(r.status))grouped[k].Other++;});
    $('attendanceReportOutput').innerHTML=Object.keys(grouped).length?`<div class="attendance-table-wrap"><table class="attendance-table"><thead><tr><th>Technician</th><th>Holiday</th><th>Sick</th><th>Training</th><th>Other Time Off</th><th>Total Recorded</th></tr></thead><tbody>${Object.entries(grouped).map(([t,g])=>`<tr><td>${esc(t)}</td><td>${g.Holiday}</td><td>${g.Sick}</td><td>${g.Training}</td><td>${g.Other}</td><td>${g.total}</td></tr>`).join('')}</tbody></table></div><h3>Detailed Records</h3>${recs.sort((a,b)=>a.date.localeCompare(b.date)).map(r=>`<div class="job-card"><h3>${esc(r.technician)} — ${esc(r.status)}</h3><p><strong>Date:</strong> ${new Date(r.date+'T12:00:00').toLocaleDateString('en-GB')}</p>${r.note?`<p><strong>Note:</strong> ${esc(r.note)}</p>`:''}</div>`).join('')}`:'<div class="job-card"><p>No attendance records match this report.</p></div>';
  }
  function countOccasions(records){const by={};records.forEach(r=>(by[r.technician]??=[]).push(r.date));let n=0;Object.values(by).forEach(ds=>{ds.sort();let prev=null;ds.forEach(x=>{const d=new Date(x);if(!prev||Math.round((d-prev)/86400000)>1)n++;prev=d;});});return n;}
  function populate(){ const opts=techs().map(t=>`<option>${esc(t)}</option>`).join(''); $('attendanceTechnician').innerHTML=opts; $('attendanceReportTechnician').innerHTML='<option value="All">All Technicians</option>'+opts; }
  function init(){
    if(!$('staffCalendarGrid'))return; populate(); const now=new Date(); $('attendanceReportStart').value=iso(new Date(now.getFullYear(),now.getMonth(),1)); $('attendanceReportEnd').value=iso(now);
    $('calendarPrevMonth').onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar()}; $('calendarNextMonth').onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar()}; $('calendarToday').onclick=()=>{viewDate=new Date();viewDate.setDate(1);renderCalendar()}; $('addTimeOffBtn').onclick=()=>openEditor(techs()[0]||'',iso(new Date()));
    $('attendanceClose').onclick=closeEditor; $('attendanceCancel').onclick=closeEditor; $('attendanceSave').onclick=saveEditor; $('attendanceClear').onclick=clearEditor; $('attendanceStatus').onchange=()=>{$('attendanceHours').value=defaultHours($('attendanceStatus').value)};
    ['attendanceReportPeriod','attendanceReportTechnician','attendanceReportStart','attendanceReportEnd'].forEach(id=>$(id).addEventListener('change',renderAttendanceReport)); $('refreshAttendanceReport').onclick=renderAttendanceReport;
    document.querySelectorAll('[data-attendance-report]').forEach(b=>b.onclick=()=>{reportType=b.dataset.attendanceReport;document.querySelectorAll('[data-attendance-report]').forEach(x=>x.classList.toggle('active',x===b));renderAttendanceReport()});
    renderCalendar(); renderAttendanceReport(); window.addEventListener('storage',()=>{renderCalendar();renderAttendanceReport()});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
  window.renderStaffCalendar=renderCalendar;
})();
