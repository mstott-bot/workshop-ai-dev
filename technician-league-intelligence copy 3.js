/* =========================================================
   Workshop AI WAI-089 — Technician League Intelligence
   Safe display-layer extension. Does not replace technician,
   job-board, workload or downtime data sources.
   ========================================================= */
(function(){
  "use strict";

  const STORAGE_KEY="workshopAILeaguePeriodWAI089";
  let period=localStorage.getItem(STORAGE_KEY)||"month";
  const validPeriods=new Set(["today","week","month","year"]);
  if(!validPeriods.has(period)) period="month";

  function el(id){return document.getElementById(id)}
  function startDay(d){const x=new Date(d);x.setHours(0,0,0,0);return x}
  function endDay(d){const x=new Date(d);x.setHours(23,59,59,999);return x}
  function startWeek(d){const x=startDay(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
  function safeDate(value){if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d}
  function jobDate(job){return safeDate(job.completedAt||job.finishedAt||job.bookingDate||job.createdAt)}
  function isComplete(job){return typeof completed==="function"?completed(job):!!job.completedAt}
  function workingDays(start,end){let n=0,d=startDay(start),last=startDay(end);while(d<=last){const day=d.getDay();if(day!==0&&day!==6)n++;d.setDate(d.getDate()+1)}return n}

  function ranges(selected){
    const now=new Date();let start,end=endDay(now),prevStart,prevEnd;
    if(selected==="today"){
      start=startDay(now);prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-1);prevEnd=endDay(prevStart);
    }else if(selected==="week"){
      start=startWeek(now);const elapsed=Math.floor((startDay(now)-start)/86400000);
      prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-7);
      const p=new Date(prevStart);p.setDate(p.getDate()+elapsed);prevEnd=endDay(p);
    }else if(selected==="year"){
      start=new Date(now.getFullYear(),0,1);prevStart=new Date(now.getFullYear()-1,0,1);
      prevEnd=endDay(new Date(now.getFullYear()-1,now.getMonth(),Math.min(now.getDate(),daysInMonth(now.getFullYear()-1,now.getMonth()))));
    }else{
      start=new Date(now.getFullYear(),now.getMonth(),1);prevStart=new Date(now.getFullYear(),now.getMonth()-1,1);
      prevEnd=endDay(new Date(prevStart.getFullYear(),prevStart.getMonth(),Math.min(now.getDate(),daysInMonth(prevStart.getFullYear(),prevStart.getMonth()))));
    }
    return {start,end,prevStart,prevEnd};
  }

  function jobsFor(tech,start,end){
    return (Array.isArray(window.jobs)?window.jobs:jobs).filter(job=>{
      if(job.technician!==tech)return false;
      const d=jobDate(job);return d&&d>=start&&d<=end;
    });
  }
  function availableHours(tech,start,end){
    const daily=typeof techAvailableHours==="function"?Number(techAvailableHours(tech)||0):8;
    if(period==="today")return daily;
    return daily*workingDays(start,end);
  }
  function metrics(tech,start,end){
    const list=jobsFor(tech,start,end);
    const finished=list.filter(isComplete);
    const sold=finished.reduce((s,j)=>s+Number(j.hours||0),0);
    const clocked=finished.reduce((s,j)=>s+Number(j.actualHours||0),0);
    const available=availableHours(tech,start,end);
    const productivity=available>0?(sold/available)*100:null;
    const efficiencyValue=clocked>0?(sold/clocked)*100:null;
    const efficiencySafe=efficiencyValue!==null&&efficiencyValue>500?null:efficiencyValue;
    const retail=finished.filter(j=>j.type==="Retail").reduce((s,j)=>s+Number(j.hours||0),0);
    const warranty=finished.filter(j=>j.type==="Warranty").reduce((s,j)=>s+Number(j.hours||0),0);
    const internal=finished.filter(j=>j.type==="Internal").reduce((s,j)=>s+Number(j.hours||0),0);
    const score=(productivity===null&&efficiencySafe===null)?null:((productivity||0)*0.5+(efficiencySafe||0)*0.5);
    return {tech,available,sold,clocked,productivity,efficiency:efficiencySafe,jobs:finished.length,retail,warranty,internal,score};
  }
  function trend(current,previous){
    if(current===null||previous===null||!Number.isFinite(current)||!Number.isFinite(previous))return {symbol:"—",cls:"flat",label:"No comparison"};
    const diff=current-previous;if(diff>2)return {symbol:"▲",cls:"up",label:`Up ${Math.abs(diff).toFixed(0)} pts`};
    if(diff< -2)return {symbol:"▼",cls:"down",label:`Down ${Math.abs(diff).toFixed(0)} pts`};
    return {symbol:"→",cls:"flat",label:"Stable"};
  }
  function metricCell(value,previous,suffix="%"){
    if(value===null||!Number.isFinite(value))return '<span class="league-na">N/A</span>';
    const t=trend(value,previous);
    return `<strong>${value.toFixed(0)}${suffix}</strong> <span class="league-trend ${t.cls}" title="${t.label}">${t.symbol}</span><small class="league-compare">${t.label}</small>`;
  }
  function status(tech){try{return typeof techStatusLabel==="function"?techStatusLabel(tech):"In Work"}catch(_){return "In Work"}}
  function label(){return period==="today"?"Today compared with yesterday":period==="week"?"This week compared with the same point last week":period==="year"?"Year to date compared with the same point last year":"Month to date compared with the same point last month"}
  function rows(){
    const r=ranges(period);return (typeof getTechs==="function"?getTechs():[]).map(tech=>{
      const current=metrics(tech,r.start,r.end),previous=metrics(tech,r.prevStart,r.prevEnd);
      return {...current,previous,overall:trend(current.score,previous.score)};
    }).sort((a,b)=>{
      const as=a.score===null?-1:a.score,bs=b.score===null?-1:b.score;
      if(bs!==as)return bs-as;return a.tech.localeCompare(b.tech);
    });
  }
  function render(id){
    const target=el(id);if(!target)return;
    const data=rows();
    target.innerHTML=`<p class="league-period-note"><strong>${label()}</strong>. Rankings use completed jobs only. ▲ improving, → stable, ▼ declining.</p>
    <table class="wai089-league"><thead><tr><th>Rank</th><th>Technician</th><th>Status</th><th>Available</th><th>Hours Sold</th><th>Hours Clocked</th><th>Productivity</th><th>Efficiency</th><th>Jobs Completed</th><th>Overall Trend</th></tr></thead><tbody>${data.map((r,i)=>{
      const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1);
      const excluded=r.available<=0;
      return `<tr><td>${medal}</td><td><strong>${r.tech}</strong></td><td>${status(r.tech)}</td><td>${r.available.toFixed(1)}</td><td>${r.sold.toFixed(1)}</td><td>${r.clocked.toFixed(1)}</td><td>${excluded?'<span class="league-na">N/A</span>':metricCell(r.productivity,r.previous.productivity)}</td><td>${metricCell(r.efficiency,r.previous.efficiency)}</td><td>${r.jobs}</td><td><span class="league-trend ${r.overall.cls}">${r.overall.symbol}</span> ${r.overall.label}</td></tr>`;
    }).join("")}</tbody></table>`;
  }
  function setPeriod(next){
    if(!validPeriods.has(next))return;period=next;localStorage.setItem(STORAGE_KEY,period);
    ["leaguePeriodOwner","leaguePeriod"].forEach(id=>{const node=el(id);if(node)node.value=period});
    render("leagueTableOwner");render("leagueTable");
  }
  window.setTechnicianLeaguePeriod=setPeriod;
  window.renderLeague=render;
  function init(){setPeriod(period)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else setTimeout(init,0);
})();
