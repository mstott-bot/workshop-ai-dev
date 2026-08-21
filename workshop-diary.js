/* WAI-115.25 Workshop Diary + Daily Labour Mix */
(function(){
  const el=id=>document.getElementById(id);
  const iso=d=>d.toISOString().slice(0,10);
  const parse=s=>new Date(`${s}T12:00:00`);
  const fmt=s=>parse(s).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const priorityTone=p=>String(p||'').includes('Urgent')?'urgent':String(p||'').includes('Customer Waiting')?'waiting':'today';
  function dayJobs(date){return (window.jobs||jobs||[]).filter(j=>String(j.bookingDate||'').slice(0,10)===date && !completed(j));}
  function capacity(date){
    const av=typeof workshopAvailabilityForDate==='function'?workshopAvailabilityForDate(date):{totalHours:0,techniciansAvailable:0,rows:[]};
    const list=dayJobs(date); const booked=list.reduce((n,j)=>n+Number(j.hours||0),0); const remaining=Number(av.totalHours||0)-booked;
    const pct=av.totalHours>0?Math.round(booked/av.totalHours*100):0;
    return {av,list,booked,remaining,pct};
  }
  function workType(job){const type=String(job.type||job.jobType||'Retail').toLowerCase();return type.includes('warranty')?'Warranty':type.includes('internal')?'Internal':'Retail';}
  function targetPct(type){
    const saved=typeof targets!=='undefined'?targets:{};
    if(type==='Retail')return Number(saved.dailyRetailPct??60);
    if(type==='Warranty')return Number(saved.dailyWarrantyPct??30);
    return Number(saved.dailyInternalPct??10);
  }
  function renderLabourMix(date){
    const host=el('diaryLabourMix');if(!host)return;
    const c=capacity(date),available=Number(c.av.totalHours||0),booked=Number(c.booked||0);
    if(el('diaryMixTitle'))el('diaryMixTitle').textContent=`Work Type Split · ${fmt(date)}`;
    if(el('diaryMixTotal'))el('diaryMixTotal').textContent=`${booked.toFixed(1)}h booked from ${available.toFixed(1)}h available`;
    host.innerHTML=['Retail','Warranty','Internal'].map(type=>{
      const hours=c.list.filter(j=>workType(j)===type).reduce((sum,j)=>sum+Number(j.hours||0),0);
      const actualPct=booked>0?hours/booked*100:0;
      const allocationPct=targetPct(type),allocatedHours=available*allocationPct/100;
      const used=allocatedHours>0?hours/allocatedHours*100:0,over=hours>allocatedHours+0.001,near=!over&&used>=90;
      return `<div class="diary-mix-card ${type.toLowerCase()} ${over?'over':near?'near':''}"><div class="diary-mix-label"><span>${type}</span><span>${over?'🔴 Over target':near?'🟠 Near target':'🟢 Within target'}</span></div><strong class="diary-mix-percent">${actualPct.toFixed(0)}%</strong><span class="diary-mix-hours">${hours.toFixed(1)} hours booked</span><small class="diary-mix-target">Target allocation: ${allocationPct.toFixed(0)}% · ${allocatedHours.toFixed(1)} hours</small>${over?`<small class="diary-mix-warning">${(hours-allocatedHours).toFixed(1)} hours over the ${type.toLowerCase()} allocation</small>`:''}<div class="diary-mix-meter"><i style="width:${Math.min(100,Math.max(0,used))}%"></i></div></div>`;
    }).join('');
  }
  function renderStrip(){
    const host=el('diaryCapacityStrip'); if(!host)return;
    const anchor=el('diaryAnchorDate')?.value||todayISO();
    let html='';
    for(let i=0;i<7;i++){
      const d=parse(anchor); d.setDate(d.getDate()+i); const key=iso(d), c=capacity(key);
      const tone=c.remaining<0?'over':c.pct>=85?'busy':c.pct>=60?'steady':'free';
      html+=`<button type="button" class="diary-day ${tone}" data-diary-date="${key}">
        <span class="diary-day-date">${fmt(key)}</span>
        <strong>${c.remaining.toFixed(1)}h</strong><small>remaining</small>
        <div class="diary-day-metrics"><span>${c.av.totalHours.toFixed(1)}h available</span><span>${c.booked.toFixed(1)}h booked</span><span>${c.av.techniciansAvailable} tech${c.av.techniciansAvailable===1?'':'s'}</span></div>
        <div class="diary-meter"><i style="width:${Math.min(100,Math.max(0,c.pct))}%"></i></div><b>${c.pct}%</b>
      </button>`;
    }
    host.innerHTML=html;
    host.querySelectorAll('[data-diary-date]').forEach(b=>b.onclick=()=>selectDate(b.dataset.diaryDate));
    renderLabourMix(el('futureBookingDate')?.value||anchor);
  }
  function selectDate(date){
    if(el('futureBookingDate'))el('futureBookingDate').value=date;
    if(el('bookingDate'))el('bookingDate').value=date;
    if(el('futureQuickView'))el('futureQuickView').value='selected';
    renderDiaryBookings();
    renderLabourMix(date);
    document.querySelectorAll('.diary-day').forEach(x=>x.classList.toggle('selected',x.dataset.diaryDate===date));
  }
  function bookingRow(j){
    const tone=priorityTone(j.priority);
    return `<div class="diary-booking-row ${tone}">
      <div class="diary-booking-time"><strong>${Number(j.hours||0).toFixed(1)}h</strong><span>${esc(j.mot&&j.mot!=='None'?j.mot:j.type||'Job')}</span></div>
      <div class="diary-booking-main"><div><strong class="diary-reg">${esc(j.reg)}</strong><span class="diary-priority ${tone}">${esc(j.priority||'Today')}</span></div><h3>${esc(j.customer||'Customer not entered')}</h3><p>${esc(j.make||'')} ${esc(j.model||'')} · ${esc(j.workRequired||'No work description entered')}</p><small>${esc(j.phone||'No telephone')} · Technician: ${esc(j.technician||'Unassigned')}</small></div>
      <div class="diary-booking-actions"><button type="button" onclick="openMoveBooking('${j.id}')">Move / Edit</button><button type="button" onclick="showTimelineModal('${j.id}')">Timeline</button>${String(j.bookingDate).slice(0,10)===todayISO()?`<button type="button" class="primary" onclick="openJob('${j.id}')">Open Live Job</button>`:''}<button type="button" class="danger-lite" onclick="deleteWorkshopJob('${j.id}')">Remove</button></div>
    </div>`;
  }
  function renderDiaryBookings(){
    const host=el('futureBookingsList'); if(!host)return;
    const mode=el('futureQuickView')?.value||'selected';
    if(mode==='7days'){
      const start=el('futureBookingDate')?.value||todayISO(); let out='';
      for(let i=0;i<7;i++){const d=parse(start);d.setDate(d.getDate()+i);const key=iso(d),c=capacity(key);out+=`<div class="diary-date-section"><div class="diary-date-head"><h3>${fmt(key)}</h3><span>${c.list.length} booking${c.list.length===1?'':'s'} · ${c.booked.toFixed(1)}h booked · ${c.remaining.toFixed(1)}h remaining</span></div>${c.list.length?c.list.map(bookingRow).join(''):'<div class="diary-empty">No workshop bookings.</div>'}</div>`;} host.innerHTML=out;
    } else {
      let date=mode==='tomorrow'?addDaysISO(1):(el('futureBookingDate')?.value||todayISO()); const c=capacity(date);
      host.innerHTML=`<div class="diary-date-section"><div class="diary-date-head"><h3>${fmt(date)}</h3><span>${c.av.techniciansAvailable} technicians · ${c.av.totalHours.toFixed(1)}h available · ${c.booked.toFixed(1)}h booked · <strong>${c.remaining.toFixed(1)}h remaining</strong></span></div>${c.list.length?c.list.map(bookingRow).join(''):'<div class="diary-empty">No workshop bookings for this day.</div>'}</div>`;
    }
    renderStrip();
  }
  window.renderWorkshopDiary=function(){renderStrip();renderDiaryBookings();};
  window.renderFutureBookings=renderDiaryBookings;
  function init(){
    if(!el('diaryScreen'))return;
    if(el('diaryAnchorDate'))el('diaryAnchorDate').value=todayISO();
    if(el('futureBookingDate'))el('futureBookingDate').value=todayISO();
    el('diaryAnchorDate')?.addEventListener('change',renderStrip);
    el('futureBookingDate')?.addEventListener('change',renderDiaryBookings);
    el('futureQuickView')?.addEventListener('change',renderDiaryBookings);
    el('diaryTodayBtn')?.addEventListener('click',()=>{el('diaryAnchorDate').value=todayISO();selectDate(todayISO());});
    el('diaryAddBookingBtn')?.addEventListener('click',()=>{selectDate(el('futureBookingDate')?.value||todayISO());el('diaryBookingForm')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>el('reg')?.focus(),250);});
    el('diaryClearForm')?.addEventListener('click',()=>{if(typeof clearForm==='function')clearForm();});
    renderWorkshopDiary();
  }
  const priorRender=window.render;
  if(typeof priorRender==='function')window.render=function(){priorRender();setTimeout(()=>window.renderWorkshopDiary?.(),0);};
  window.addEventListener('wai-diary-refresh',renderDiaryBookings);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
