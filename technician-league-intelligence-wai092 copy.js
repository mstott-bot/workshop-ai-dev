/* =========================================================
   Workshop AI WAI-092 — Technician League Intelligence
   Command Centre + Reports league, movers, trends,
   personal bests, consistency and Hall of Fame.
   ========================================================= */
(function(){
  "use strict";

  const PERIOD_KEY="workshopAILeaguePeriodWAI092";
  const TARGET=100;
  const PERIODS=new Set(["today","week","month","year"]);
  let selectedPeriod=localStorage.getItem(PERIOD_KEY)||"month";
  if(!PERIODS.has(selectedPeriod)) selectedPeriod="month";

  const $id=id=>document.getElementById(id);
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const dayStart=value=>{const d=new Date(value);d.setHours(0,0,0,0);return d};
  const dayEnd=value=>{const d=new Date(value);d.setHours(23,59,59,999);return d};
  const validDate=value=>{if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d};
  const allJobs=()=>typeof jobs!=="undefined"&&Array.isArray(jobs)?jobs:(Array.isArray(window.jobs)?window.jobs:[]);
  const techs=()=>typeof getTechs==="function"?getTechs():[...new Set(allJobs().map(j=>j.technician).filter(Boolean))];
  const isComplete=j=>typeof completed==="function"?completed(j):Boolean(j.completedAt||j.status==="✅ Ready for Collection"||j.status==="🟢 Repair Complete");
  const completedDate=j=>validDate(j.completedAt||j.finishedAt||j.updatedAt||j.bookingDate||j.createdAt);
  const monday=value=>{const d=dayStart(value);d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
  const workingDays=(start,end)=>{let total=0,d=dayStart(start),last=dayStart(end);while(d<=last){if(d.getDay()!==0&&d.getDay()!==6)total++;d.setDate(d.getDate()+1)}return total};
  const fmt=v=>Number.isFinite(v)?`${v.toFixed(0)}%`:"N/A";
  const escapeHtml=s=>String(s??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function ranges(period){
    const now=new Date(); let start,end=dayEnd(now),prevStart,prevEnd;
    if(period==="today"){
      start=dayStart(now);prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-1);
      while(prevStart.getDay()===0||prevStart.getDay()===6)prevStart.setDate(prevStart.getDate()-1);
      prevEnd=dayEnd(prevStart);
    }else if(period==="week"){
      start=monday(now);const elapsed=Math.floor((dayStart(now)-start)/86400000);
      prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-7);
      prevEnd=dayEnd(new Date(prevStart.getFullYear(),prevStart.getMonth(),prevStart.getDate()+elapsed));
    }else if(period==="year"){
      start=new Date(now.getFullYear(),0,1);prevStart=new Date(now.getFullYear()-1,0,1);
      prevEnd=dayEnd(new Date(now.getFullYear()-1,now.getMonth(),Math.min(now.getDate(),new Date(now.getFullYear()-1,now.getMonth()+1,0).getDate())));
    }else{
      start=new Date(now.getFullYear(),now.getMonth(),1);prevStart=new Date(now.getFullYear(),now.getMonth()-1,1);
      prevEnd=dayEnd(new Date(prevStart.getFullYear(),prevStart.getMonth(),Math.min(now.getDate(),new Date(prevStart.getFullYear(),prevStart.getMonth()+1,0).getDate())));
    }
    return {start,end,prevStart,prevEnd};
  }

  function availableHours(tech,start,end,period){
    if(period==="today"&&typeof techAvailableHours==="function") return Math.max(0,num(techAvailableHours(tech)));
    return workingDays(start,end)*8;
  }

  function metrics(tech,start,end,period){
    const list=allJobs().filter(j=>isComplete(j)&&((j.technician===tech)||((j.techTimeSessions||[]).some(x=>x.technician===tech)))).filter(j=>{const d=completedDate(j);return d&&d>=start&&d<=end});
    const techHours=j=>{const ss=j.techTimeSessions||[];if(!ss.length)return j.technician===tech?num(j.actualHours||j.clockedHours):0;return ss.filter(x=>x.technician===tech).reduce((a,x)=>a+num(x.hours),0)};
    const soldCredit=j=>{const ss=j.techTimeSessions||[];if(!ss.length)return j.technician===tech?num(j.hours||j.allowedHours):0;const total=ss.reduce((a,x)=>a+num(x.hours),0),mine=techHours(j);return total>0?num(j.hours||j.allowedHours)*(mine/total):0};
    const sold=list.reduce((s,j)=>s+soldCredit(j),0);
    const clocked=list.reduce((s,j)=>s+techHours(j),0);
    const available=availableHours(tech,start,end,period);
    const productivity=available>0?sold/available*100:null;
    const efficiency=clocked>0?sold/clocked*100:null;
    const utilisation=available>0?clocked/available*100:null;
    const jobsDone=list.length;
    const jobComponent=Math.min(100,jobsDone*20);
    const score=[productivity,efficiency,utilisation].every(v=>v===null)?null:
      Math.min(150,(productivity||0)*.40+(efficiency||0)*.30+(utilisation||0)*.20+jobComponent*.10);
    return {tech,list,sold,clocked,available,productivity,efficiency,utilisation,jobs:jobsDone,score};
  }

  function rankedFor(start,end,period){
    return techs().map(t=>metrics(t,start,end,period)).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.tech.localeCompare(b.tech));
  }

  function leagueData(){
    const r=ranges(selectedPeriod),current=rankedFor(r.start,r.end,selectedPeriod),previous=rankedFor(r.prevStart,r.prevEnd,selectedPeriod);
    const previousRanks=new Map(previous.map((row,i)=>[row.tech,i+1]));
    const previousMetrics=new Map(previous.map(row=>[row.tech,row]));
    return current.map((row,i)=>{
      const prior=previousMetrics.get(row.tech)||metrics(row.tech,r.prevStart,r.prevEnd,selectedPeriod);
      const previousRank=previousRanks.get(row.tech)||current.length;
      const rank=i+1,rankMove=previousRank-rank;
      const scoreChange=row.score===null||prior.score===null?null:row.score-prior.score;
      return {...row,rank,previousRank,rankMove,prior,scoreChange};
    });
  }

  function trend(value,previous){
    if(value===null||previous===null||!Number.isFinite(value)||!Number.isFinite(previous))return {icon:"—",cls:"flat",label:"No comparison",diff:null};
    const diff=value-previous;
    if(diff>2)return {icon:"▲",cls:"up",label:`+${diff.toFixed(0)} pts`,diff};
    if(diff< -2)return {icon:"▼",cls:"down",label:`${diff.toFixed(0)} pts`,diff};
    return {icon:"→",cls:"flat",label:"Stable",diff};
  }

  function metric(value,previous){
    if(value===null||!Number.isFinite(value))return '<span class="league-na">N/A</span>';
    const t=trend(value,previous);
    return `<strong>${fmt(value)}</strong><span class="wai092-trend ${t.cls}" title="${t.label}">${t.icon}</span><small>${t.label}</small>`;
  }

  function rankMove(row){
    if(row.rankMove>0)return `<span class="wai092-rank up">↑${row.rankMove}</span>`;
    if(row.rankMove<0)return `<span class="wai092-rank down">↓${Math.abs(row.rankMove)}</span>`;
    return '<span class="wai092-rank flat">→</span>';
  }

  function dailyHistory(tech){
    const grouped=new Map();
    allJobs().filter(j=>j.technician===tech&&isComplete(j)).forEach(j=>{
      const d=completedDate(j);if(!d)return;const key=dayStart(d).toISOString().slice(0,10);
      if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(j);
    });
    return [...grouped.entries()].map(([date,list])=>{
      const sold=list.reduce((s,j)=>s+num(j.hours||j.allowedHours),0),clocked=list.reduce((s,j)=>s+num(j.actualHours||j.clockedHours),0);
      return {date,sold,clocked,jobs:list.length,productivity:sold/8*100,efficiency:clocked>0?sold/clocked*100:null,utilisation:clocked/8*100};
    }).sort((a,b)=>a.date.localeCompare(b.date));
  }

  function technicianRecords(tech){
    const days=dailyHistory(tech);
    const max=(key)=>days.length?days.reduce((best,d)=>(d[key]??-Infinity)>(best[key]??-Infinity)?d:best,days[0]):null;
    let current=0,longest=0;
    for(let i=days.length-1;i>=0;i--){if(days[i].productivity>=TARGET)current++;else break}
    let run=0;days.forEach(d=>{run=d.productivity>=TARGET?run+1:0;longest=Math.max(longest,run)});
    return {days,bestProductivity:max("productivity"),bestEfficiency:max("efficiency"),bestUtilisation:max("utilisation"),mostJobs:max("jobs"),mostSold:max("sold"),currentStreak:current,longestStreak:longest,daysAbove:days.filter(d=>d.productivity>=TARGET).length};
  }

  function hallOfFame(){
    const records=techs().map(t=>({tech:t,...technicianRecords(t)}));
    const choose=(recordKey,valueKey)=>records.filter(r=>r[recordKey]).sort((a,b)=>(b[recordKey][valueKey]??-1)-(a[recordKey][valueKey]??-1))[0];
    const streak=records.sort((a,b)=>b.longestStreak-a.longestStreak)[0];
    return [
      {icon:"⚡",title:"Highest Productivity",winner:choose("bestProductivity","productivity"),record:"bestProductivity",key:"productivity",suffix:"%"},
      {icon:"⚙️",title:"Highest Efficiency",winner:choose("bestEfficiency","efficiency"),record:"bestEfficiency",key:"efficiency",suffix:"%"},
      {icon:"🔧",title:"Most Jobs in a Day",winner:choose("mostJobs","jobs"),record:"mostJobs",key:"jobs",suffix:""},
      {icon:"🔥",title:"Longest Consistency Streak",winner:streak,value:streak?.longestStreak||0,suffix:" days"}
    ];
  }

  function movers(data){
    const comparable=data.filter(r=>r.scoreChange!==null&&Number.isFinite(r.scoreChange));
    return {
      improved:[...comparable].sort((a,b)=>b.scoreChange-a.scoreChange)[0]||null,
      dropped:[...comparable].sort((a,b)=>a.scoreChange-b.scoreChange)[0]||null
    };
  }

  function periodLabel(){return selectedPeriod==="today"?"Today vs previous working day":selectedPeriod==="week"?"This week vs same point last week":selectedPeriod==="year"?"Year to date vs same point last year":"Month to date vs same point last month"}

  function controls(id){
    return `<div class="wai092-heading"><div><h3>${id==="leagueTableOwner"?"Live Technician League":"Technician Performance League"}</h3><p>${periodLabel()}</p></div><label>View<select class="wai092-period" data-target="${id}"><option value="today" ${selectedPeriod==="today"?"selected":""}>Today</option><option value="week" ${selectedPeriod==="week"?"selected":""}>Week</option><option value="month" ${selectedPeriod==="month"?"selected":""}>Month</option><option value="year" ${selectedPeriod==="year"?"selected":""}>Year</option></select></label></div>`;
  }

  function moversHtml(data){
    const m=movers(data);
    const card=(row,type)=>row?`<div class="wai092-mover ${type}"><span>${type==="good"?"📈 Most Improved":"📉 Biggest Drop"}</span><strong>${escapeHtml(row.tech)}</strong><p>${rankMove(row)} ${row.scoreChange>=0?"+":""}${row.scoreChange.toFixed(1)} score points</p><small>Productivity ${trend(row.productivity,row.prior.productivity).label} · Efficiency ${trend(row.efficiency,row.prior.efficiency).label}</small></div>`:`<div class="wai092-mover"><span>${type==="good"?"📈 Most Improved":"📉 Biggest Drop"}</span><strong>No comparison yet</strong><p>More completed-job history is needed.</p></div>`;
    return `<div class="wai092-movers">${card(m.improved,"good")}${card(m.dropped,"bad")}</div>`;
  }

  function compactTable(data){
    return `<div class="wai092-table-wrap"><table class="wai092-table"><thead><tr><th>Rank</th><th>Technician</th><th>Trend</th><th>Productivity</th><th>Jobs</th><th>Consistency</th></tr></thead><tbody>${data.map(r=>{
      const rec=technicianRecords(r.tech);const medal=r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":r.rank;
      const pb=rec.bestProductivity&&r.productivity!==null&&r.productivity>=rec.bestProductivity.productivity?'<span class="wai092-badge">🏅 PB</span>':'';
      return `<tr><td>${medal}</td><td><strong>${escapeHtml(r.tech)}</strong>${pb}</td><td>${rankMove(r)}</td><td>${metric(r.productivity,r.prior.productivity)}</td><td><strong>${r.jobs}</strong></td><td><span class="wai092-streak">🔥 ${rec.currentStreak} day${rec.currentStreak===1?'':'s'}</span></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function reportTable(data){
    return `<div class="wai092-table-wrap"><table class="wai092-table detailed"><thead><tr><th>Rank</th><th>Technician</th><th>Position</th><th>Available</th><th>Sold</th><th>Clocked</th><th>Productivity</th><th>Efficiency</th><th>Utilisation</th><th>Jobs</th><th>Trend</th></tr></thead><tbody>${data.map(r=>{
      const medal=r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":r.rank;const overall=trend(r.score,r.prior.score);
      return `<tr><td>${medal}</td><td><strong>${escapeHtml(r.tech)}</strong></td><td>${rankMove(r)}</td><td>${r.available.toFixed(1)}</td><td>${r.sold.toFixed(1)}</td><td>${r.clocked.toFixed(1)}</td><td>${metric(r.productivity,r.prior.productivity)}</td><td>${metric(r.efficiency,r.prior.efficiency)}</td><td>${metric(r.utilisation,r.prior.utilisation)}</td><td>${r.jobs}</td><td><span class="wai092-trend ${overall.cls}">${overall.icon}</span> ${overall.label}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function recordsHtml(){
    return `<div class="wai092-section-title"><h3>Personal Bests & Consistency</h3><p>Lifetime records calculated from completed job history.</p></div><div class="wai092-record-grid">${techs().map(t=>{const r=technicianRecords(t);return `<article class="wai092-record"><h4>${escapeHtml(t)}</h4><div><span>🏅 Best productivity</span><strong>${r.bestProductivity?fmt(r.bestProductivity.productivity):"N/A"}</strong></div><div><span>⚙️ Best efficiency</span><strong>${r.bestEfficiency?fmt(r.bestEfficiency.efficiency):"N/A"}</strong></div><div><span>🔧 Most jobs/day</span><strong>${r.mostJobs?r.mostJobs.jobs:"0"}</strong></div><div><span>🔥 Current streak</span><strong>${r.currentStreak} days</strong></div><div><span>⭐ Longest streak</span><strong>${r.longestStreak} days</strong></div><div><span>✅ Days over target</span><strong>${r.daysAbove}</strong></div></article>`}).join("")}</div>`;
  }

  function hallHtml(){
    return `<div class="wai092-section-title"><h3>Workshop Hall of Fame</h3><p>All-time achievements that remain until a new record is set.</p></div><div class="wai092-hall">${hallOfFame().map(h=>{let name="No record yet",value="—",date="";if(h.winner){name=h.winner.tech;if(h.record){const rec=h.winner[h.record];value=rec?`${num(rec[h.key]).toFixed(h.key==="jobs"?0:0)}${h.suffix}`:"—";date=rec?.date||""}else value=`${h.value}${h.suffix}`;}return `<article><span>${h.icon}</span><h4>${h.title}</h4><strong>${escapeHtml(name)}</strong><p>${value}</p><small>${date}</small></article>`}).join("")}</div>`;
  }

  function bindControls(){
    document.querySelectorAll(".wai092-period").forEach(select=>select.onchange=e=>{
      selectedPeriod=e.target.value;localStorage.setItem(PERIOD_KEY,selectedPeriod);
      renderLeague("leagueTableOwner");renderLeague("leagueTable");
    });
  }

  function renderLeague(id){
    const target=$id(id);if(!target)return;
    const data=leagueData(),reports=id==="leagueTable";
    target.innerHTML=`<div class="wai092-shell ${reports?"reports":"compact"}">${controls(id)}${moversHtml(data)}${reports?reportTable(data)+recordsHtml()+hallHtml():compactTable(data)}</div>`;
    bindControls();
  }

  window.renderLeague=renderLeague;
  window.setTechnicianLeaguePeriod=function(period){if(PERIODS.has(period)){selectedPeriod=period;localStorage.setItem(PERIOD_KEY,period);renderLeague("leagueTableOwner");renderLeague("leagueTable")}};
  const init=()=>{renderLeague("leagueTableOwner");renderLeague("leagueTable")};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else setTimeout(init,0);
})();
