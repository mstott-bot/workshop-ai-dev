/* =====================================================================
   Workshop AI — WAI-066A
   Workshop Intelligence Reports Engine

   Purpose:
   - A separate read-only reporting module
   - Uses the existing jobs, parts, targets, availability and timeline data
   - Does not change job workflow or Parts workflow
   ===================================================================== */

(function(){
  "use strict";

  const REPORTS = [
    {id:"workshop", category:"Performance", icon:"📈", title:"Workshop Performance", description:"Jobs, labour hours, efficiency, productivity and labour value."},
    {id:"technicians", category:"Performance", icon:"👨‍🔧", title:"Technician Performance", description:"Technician scorecards with jobs, completed labour hours, efficiency and job mix."},
    {id:"technicianCostPerJob", category:"Financial", icon:"💼", title:"Technician Cost per Job", description:"Each technician’s labour cost to the business divided by completed jobs, excluding MOT jobs."},
    {id:"vhc", category:"Performance", icon:"📋", title:"Vehicle Health Check Performance", description:"VHC completion by technician, retail-job coverage and amber/red work identified."},
    {id:"jobs", category:"Performance", icon:"✅", title:"Jobs Completed", description:"Daily, weekly and monthly jobs including and excluding MOTs."},
    {id:"labour", category:"Performance", icon:"⏱", title:"Completed Labour Hours", description:"Completed sold labour hours by technician and workshop."},
    {id:"productivity", category:"Performance", icon:"⚡", title:"Productivity & Efficiency", description:"Actual clocked productive time, available capacity and sold-hours efficiency."},
    {id:"revenue", category:"Financial", icon:"💷", title:"Revenue Watch", description:"Completed labour value by job type and technician."},
    {id:"parts", category:"Operations", icon:"📦", title:"Parts & Supplier Performance", description:"Outstanding parts, delivery times, partial deliveries and incorrect parts."},
    {id:"returns", category:"Operations", icon:"↩️", title:"Parts & Tyres Returns", description:"Returned parts and tyres, suppliers, reasons, values and credit status."},
    {id:"downtime", category:"Operations", icon:"⏸", title:"Downtime Intelligence", description:"Lost hours, reasons and technician downtime patterns."},
    {id:"carryover", category:"Operations", icon:"⚠️", title:"Carry-over Jobs", description:"Open jobs from earlier dates and the hours tied up in them."},
    {id:"mot", category:"MOT", icon:"🚗", title:"MOT Performance", description:"MOT volume, results and MOT-inclusive versus non-MOT workload."},
    {id:"approvals", category:"Customers", icon:"📞", title:"Customer Approval Performance", description:"Outstanding approvals, completed approvals and average response times."},
    {id:"garageHealth", category:"Management", icon:"🏆", title:"Garage Health", description:"Operational health summary and the largest current risks."},
    {id:"repeatRepairs", category:"Management", icon:"🔁", title:"Repeat Repair Intelligence", description:"Repeat repairs by technician, job, root cause, lost hours and month-on-month trend."},
    {id:"monthlyTechnicianReview", category:"Management", icon:"📝", title:"Monthly Technician Performance Review", description:"Printable individual monthly review with productivity, efficiency, first-time fix, jobs excluding MOTs, cost per job and league position."}
  ];

  const CATEGORIES=["All","Performance","Financial","Operations","MOT","Customers","Management"];
  const FAVOURITES_KEY="workshopAIReportFavouritesV1";
  let activeReport="workshop";
  let reportOpen=false;
  let activeCategory="All";
  let favourites=JSON.parse(localStorage.getItem(FAVOURITES_KEY)||"[]");

  function el(id){ return document.getElementById(id); }
  function safeNumber(value){ return Number.isFinite(Number(value)) ? Number(value) : 0; }
  function money(value){ return "£"+Math.round(safeNumber(value)).toLocaleString("en-GB"); }
  function moneyExact(value){ return "£"+safeNumber(value).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function escapeHtml(value){ return String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch])); }
  function hours(value){ return safeNumber(value).toFixed(1)+" hrs"; }
  function percent(value){
    return value===null||value===undefined||Number.isNaN(Number(value))
      ? "N/A"
      : Number(value).toFixed(0)+"%";
  }
  function normalDate(value){
    const text=String(value||"");
    return text ? text.slice(0,10) : "";
  }
  function startOfWeek(date){
    const d=new Date(date);
    const day=(d.getDay()+6)%7;
    d.setDate(d.getDate()-day);
    d.setHours(0,0,0,0);
    return d;
  }
  function endOfWeek(date){
    const d=startOfWeek(date);
    d.setDate(d.getDate()+6);
    d.setHours(23,59,59,999);
    return d;
  }
  function firstOfMonth(date){
    return new Date(date.getFullYear(),date.getMonth(),1);
  }
  function lastOfMonth(date){
    return new Date(date.getFullYear(),date.getMonth()+1,0,23,59,59,999);
  }
  function isoLocal(date){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,"0");
    const d=String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  }
  function range(){
    const nowDate=new Date();
    const period=el("intelligencePeriod")?.value||"month";
    let start;
    let end;

    if(period==="today"){
      start=new Date(nowDate); start.setHours(0,0,0,0);
      end=new Date(nowDate); end.setHours(23,59,59,999);
    }else if(period==="week"){
      start=startOfWeek(nowDate);
      end=endOfWeek(nowDate);
    }else if(period==="previousMonth"){
      start=new Date(nowDate.getFullYear(),nowDate.getMonth()-1,1);
      end=new Date(nowDate.getFullYear(),nowDate.getMonth(),0,23,59,59,999);
    }else if(period==="ytd"){
      start=new Date(nowDate.getFullYear(),0,1);
      end=new Date(nowDate); end.setHours(23,59,59,999);
    }else if(period==="custom"){
      const startValue=el("intelligenceStartDate")?.value;
      const endValue=el("intelligenceEndDate")?.value;
      start=startValue?new Date(startValue+"T00:00:00"):firstOfMonth(nowDate);
      end=endValue?new Date(endValue+"T23:59:59"):new Date(nowDate);
    }else{
      start=firstOfMonth(nowDate);
      end=lastOfMonth(nowDate);
    }

    return {start,end,label:`${start.toLocaleDateString("en-GB")} – ${end.toLocaleDateString("en-GB")}`};
  }
  function daysBetweenInclusive(start,end){
    return Math.max(1,Math.round((end-start)/(1000*60*60*24))+1);
  }
  function comparisonRange(current=range()){
    const mode=el("intelligenceComparison")?.value||"none";
    if(mode==="none") return null;

    let start;
    let end;

    if(mode==="previousMonth"){
      start=new Date(current.start.getFullYear(),current.start.getMonth()-1,1);
      end=new Date(current.start.getFullYear(),current.start.getMonth(),0,23,59,59,999);
    }else if(mode==="lastYear"){
      start=new Date(current.start);
      end=new Date(current.end);
      start.setFullYear(start.getFullYear()-1);
      end.setFullYear(end.getFullYear()-1);
    }else{
      const days=daysBetweenInclusive(current.start,current.end);
      end=new Date(current.start);
      end.setDate(end.getDate()-1);
      end.setHours(23,59,59,999);
      start=new Date(end);
      start.setDate(start.getDate()-days+1);
      start.setHours(0,0,0,0);
    }

    return {start,end,label:`${start.toLocaleDateString("en-GB")} – ${end.toLocaleDateString("en-GB")}`};
  }
  function jobsForSelectedRange(selectedRange,{completedOnly=false}={}){
    const tech=selectedTechnician();
    return jobs.filter(job=>{
      if(tech!=="All"&&job.technician!==tech) return false;
      if(completedOnly&&!completed(job)) return false;
      return inRange(jobDate(job),selectedRange);
    });
  }
  function coreMetricsForRange(selectedRange){
    const list=jobsForSelectedRange(selectedRange,{completedOnly:true});
    const sold=list.reduce((sum,job)=>sum+soldHours(job),0);
    const actual=list.reduce((sum,job)=>sum+actualClocked(job),0);
    const value=list.reduce((sum,job)=>sum+labourValue(job),0);
    const efficiency=actual>0?(sold/actual)*100:null;
    return {jobs:list.length,sold,actual,value,efficiency};
  }
  function changeText(current,previous,suffix=""){
    if(previous===null||previous===undefined||Number(previous)===0){
      return "No earlier comparison data";
    }
    const change=((Number(current)-Number(previous))/Math.abs(Number(previous)))*100;
    const arrow=change>0?"▲":change<0?"▼":"■";
    return `${arrow} ${Math.abs(change).toFixed(0)}% ${change>0?"up":change<0?"down":"unchanged"}${suffix}`;
  }
  function renderComparison(){
    const container=el("workshopIntelligenceComparison");
    if(!container) return;

    const previousRange=comparisonRange();
    if(!previousRange){
      container.innerHTML="";
      return;
    }

    const currentMetrics=coreMetricsForRange(range());
    const previousMetrics=coreMetricsForRange(previousRange);

    container.innerHTML=`
      <div class="coach-card">
        <h3>Comparison: ${previousRange.label}</h3>
        <div class="intelligence-comparison-grid">
          <div><strong>Jobs</strong><span>${changeText(currentMetrics.jobs,previousMetrics.jobs)}</span></div>
          <div><strong>Sold Labour</strong><span>${changeText(currentMetrics.sold,previousMetrics.sold)}</span></div>
          <div><strong>Labour Value</strong><span>${changeText(currentMetrics.value,previousMetrics.value)}</span></div>
          <div><strong>Efficiency</strong><span>${changeText(currentMetrics.efficiency||0,previousMetrics.efficiency||0)}</span></div>
        </div>
      </div>`;
  }
  function jobDate(job){
    return new Date(job.completedAt||job.finishedAt||job.bookingDate||job.createdAt||0);
  }
  function inRange(dateValue,selectedRange=range()){
    const d=dateValue instanceof Date?dateValue:new Date(dateValue||0);
    return !Number.isNaN(d.getTime()) && d>=selectedRange.start && d<=selectedRange.end;
  }
  function selectedTechnician(){
    return el("intelligenceTechnician")?.value||"All";
  }
  function filteredJobs({completedOnly=false}={}){
    const selectedRange=range();
    const tech=selectedTechnician();

    return jobs.filter(job=>{
      if(tech!=="All"&&job.technician!==tech) return false;
      if(completedOnly&&!completed(job)) return false;
      return inRange(jobDate(job),selectedRange);
    });
  }
  function completedJobs(){
    return filteredJobs({completedOnly:true});
  }
  function isMotJob(job){
    const mot=String(job.mot||"").toLowerCase();
    return mot&&mot!=="none"&&!mot.includes("no mot");
  }
  function actualClocked(job){
    return safeNumber(job.actualHours);
  }
  function soldHours(job){
    return safeNumber(job.hours);
  }
  function efficiencyFor(list){
    const sold=list.reduce((sum,job)=>sum+soldHours(job),0);
    const actual=list.reduce((sum,job)=>sum+actualClocked(job),0);
    return actual>0?(sold/actual)*100:null;
  }
  function availabilityHoursForRange(selectedRange=range(),tech="All"){
    if(typeof workshopAvailabilityForDate!=="function"){
      return safeNumber(targets.availableHours);
    }

    let total=0;
    const cursor=new Date(selectedRange.start);
    cursor.setHours(12,0,0,0);
    const end=new Date(selectedRange.end);
    end.setHours(12,0,0,0);

    while(cursor<=end){
      const day=cursor.getDay();
      if(day!==0&&day!==6){
        const date=isoLocal(cursor);
        const availability=workshopAvailabilityForDate(date);
        if(tech==="All"){
          total+=safeNumber(availability.totalHours);
        }else{
          const row=availability.rows.find(item=>item.technician===tech);
          total+=safeNumber(row?.hours);
        }
      }
      cursor.setDate(cursor.getDate()+1);
    }
    return total;
  }
  function productivityFor(list,selectedRange=range(),tech=selectedTechnician()){
    const actual=list.reduce((sum,job)=>sum+actualClocked(job),0);
    const available=availabilityHoursForRange(selectedRange,tech);
    return available>0?(actual/available)*100:null;
  }
  function labourValue(job){
    if(typeof jobLabourValue==="function") return safeNumber(jobLabourValue(job));
    const rate=typeof appliedJobRate==="function"
      ? safeNumber(appliedJobRate(job))
      : safeNumber(targets.retailRate||70);
    return soldHours(job)*rate;
  }
  function interruptionRows(){
    const selectedRange=range();
    const tech=selectedTechnician();
    const rows=[];

    jobs.forEach(job=>{
      if(tech!=="All"&&job.technician!==tech) return;
      (job.interruptions||[]).forEach(item=>{
        const date=item.start||item.end||job.createdAt;
        if(!inRange(date,selectedRange)) return;
        rows.push({
          technician:job.technician||"Unassigned",
          reason:item.reason||"Other",
          category:item.category||"neutral",
          duration:safeNumber(item.duration),
          reg:job.reg||"",
          date
        });
      });
    });
    return rows;
  }
  function partsRows(){
    if(typeof allPartsRequests==="function"){
      return allPartsRequests().filter(({job,part})=>{
        if(selectedTechnician()!=="All"&&job.technician!==selectedTechnician()) return false;
        return inRange(part.requestedAt||part.orderedAt||part.receivedAt||part.fittedAt||job.createdAt,range());
      });
    }
    return [];
  }
  function returnsRows(){
    const selectedRange=range();
    const tech=selectedTechnician();
    const rows=[];

    jobs.forEach(job=>{
      if(tech!=="All"&&job.technician!==tech) return;
      const collections=[
        {items:Array.isArray(job.partsRequests)?job.partsRequests:[],type:"Part"},
        {items:Array.isArray(job.tyreRequests)?job.tyreRequests:[],type:"Tyre"}
      ];
      collections.forEach(group=>group.items.forEach(item=>{
        (Array.isArray(item.returns)?item.returns:[]).forEach(ret=>{
          const date=ret.createdAt||item.returnRequestedAt||ret.returnedAt||ret.updatedAt;
          if(!inRange(date,selectedRange)) return;
          rows.push({
            job,item,ret,type:group.type,
            date,
            description:group.type==="Part"
              ? (item.description||item.text||"Part")
              : ([item.brand,item.size].filter(Boolean).join(" ")||"Tyre"),
            supplier:ret.destination||item.supplier||item.orderedFrom||"Not recorded",
            status:ret.status||item.returnStatus||"Return Requested",
            value:safeNumber(ret.value),
            quantity:Math.max(1,safeNumber(ret.quantity)||1)
          });
        });
      }));
    });

    return rows.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  }

  function approvalJobs(){
    return filteredJobs().filter(job=>{
      return job.customerApprovalAt||job.customerDeclinedAt||
        String(job.auth||"").toLowerCase().includes("awaiting")||
        String(job.status||"").toLowerCase().includes("approval");
    });
  }
  function reportCard(title,value,label,cls=""){
    return `<div class="stat ${cls}"><strong>${value}</strong>${label||title}</div>`;
  }
  function table(headers,rows){
    if(!rows.length) return `<div class="job-card"><p>No matching records for this period.</p></div>`;
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  }
  function insight(title,text,cls="good"){
    return `<div class="coach-card ${cls}"><h3>${title}</h3><p>${text}</p></div>`;
  }
  function setOutput({title,summary="",insightHtml="",output=""}){
    if(el("workshopIntelligenceTitle")) el("workshopIntelligenceTitle").textContent=title;
    if(el("workshopIntelligencePeriodLabel")){
      el("workshopIntelligencePeriodLabel").textContent=`${range().label} | ${selectedTechnician()}`;
    }
    if(el("workshopIntelligenceSummary")) el("workshopIntelligenceSummary").innerHTML=summary;
    if(el("workshopIntelligenceInsight")) el("workshopIntelligenceInsight").innerHTML=insightHtml;
    if(el("workshopIntelligenceOutput")) el("workshopIntelligenceOutput").innerHTML=output;
    renderComparison();
    updateFavouriteButton();
  }

  function renderWorkshopPerformance(){
    const list=completedJobs();
    const sold=list.reduce((sum,job)=>sum+soldHours(job),0);
    const actual=list.reduce((sum,job)=>sum+actualClocked(job),0);
    const efficiency=efficiencyFor(list);
    const productivity=productivityFor(list);
    const value=list.reduce((sum,job)=>sum+labourValue(job),0);
    const motCount=list.filter(isMotJob).length;

    const summary=[
      reportCard("Jobs",list.length,"Jobs Completed"),
      reportCard("Sold",hours(sold),"Sold Labour"),
      reportCard("Clocked",hours(actual),"Clocked Labour"),
      reportCard("Efficiency",percent(efficiency),"Efficiency",efficiency!==null&&efficiency>=100?"good":efficiency!==null&&efficiency<85?"bad":"warn"),
      reportCard("Productivity",percent(productivity),"Productivity",productivity!==null&&productivity>=90?"good":"warn"),
      reportCard("Value",money(value),"Labour Value")
    ].join("");

    const byType=["Retail","Warranty","Internal"].map(type=>{
      const typeJobs=list.filter(job=>job.type===type);
      return `<tr><td>${type}</td><td>${typeJobs.length}</td><td>${hours(typeJobs.reduce((s,j)=>s+soldHours(j),0))}</td><td>${money(typeJobs.reduce((s,j)=>s+labourValue(j),0))}</td></tr>`;
    });

    setOutput({
      title:"Workshop Performance",
      summary,
      insightHtml:insight(
        "Workshop Intelligence",
        `${list.length} completed job(s) produced ${hours(sold)} of sold labour and ${money(value)} of labour value. ${motCount} completed job(s) included an MOT.`,
        efficiency!==null&&efficiency>=100?"good":"warn"
      ),
      output:table(["Job Type","Jobs","Sold Labour","Labour Value"],byType)
    });
  }

  function renderTechnicians(){
    const list=completedJobs();
    const techniciansToShow=selectedTechnician()==="All"?getTechs():[selectedTechnician()];
    const rows=techniciansToShow.map(technician=>{
      const techJobs=list.filter(job=>job.technician===technician);
      const sold=techJobs.reduce((s,j)=>s+soldHours(j),0);
      const actual=techJobs.reduce((s,j)=>s+actualClocked(j),0);
      const eff=actual>0?(sold/actual)*100:null;
      const mot=techJobs.filter(isMotJob).length;
      const value=techJobs.reduce((s,j)=>s+labourValue(j),0);
      return {
        technician,jobs:techJobs.length,sold,actual,eff,mot,value
      };
    }).sort((a,b)=>b.sold-a.sold);

    const output=table(
      ["Technician","Jobs","Jobs ex MOT","MOTs","Sold Labour","Clocked Labour","Efficiency","Labour Value"],
      rows.map(row=>`<tr>
        <td>${row.technician}</td>
        <td>${row.jobs}</td>
        <td>${row.jobs-row.mot}</td>
        <td>${row.mot}</td>
        <td>${hours(row.sold)}</td>
        <td>${hours(row.actual)}</td>
        <td>${percent(row.eff)}</td>
        <td>${money(row.value)}</td>
      </tr>`)
    );

    const leader=rows[0];
    setOutput({
      title:"Technician Performance",
      summary:[
        reportCard("Techs",rows.filter(r=>r.jobs>0).length,"Technicians Active"),
        reportCard("Jobs",rows.reduce((s,r)=>s+r.jobs,0),"Completed Jobs"),
        reportCard("Labour",hours(rows.reduce((s,r)=>s+r.sold,0)),"Completed Labour"),
        reportCard("Value",money(rows.reduce((s,r)=>s+r.value,0)),"Labour Value")
      ].join(""),
      insightHtml:leader&&leader.jobs
        ? insight("Performance Leader",`${leader.technician} delivered the most sold labour in this period at ${hours(leader.sold)} across ${leader.jobs} completed job(s).`,"good")
        : insight("No completed work","No technician has completed matching jobs in this period.","warn"),
      output
    });
  }


  function financeTechnicianCosts(){
    try{
      const finance=JSON.parse(localStorage.getItem("wai0991FinanceSettings")||"{}");
      const review=technicianHourlyCosts();
      return {...review,...(finance.technicianCosts||{})};
    }catch(error){
      return technicianHourlyCosts();
    }
  }

  function renderTechnicianCostPerJob(){
    const selectedRange=range();
    const costs=financeTechnicianCosts();
    const techniciansToShow=selectedTechnician()==="All"?getTechs():[selectedTechnician()];
    const rows=techniciansToShow.map(technician=>{
      const techJobs=jobsForSelectedRange(selectedRange,{completedOnly:true})
        .filter(job=>job.technician===technician&&!isMotJob(job));
      const actualHours=techJobs.reduce((sum,job)=>sum+actualClocked(job),0);
      const hourlyCost=safeNumber(costs[technician]);
      const totalCost=actualHours*hourlyCost;
      const costPerJob=techJobs.length?totalCost/techJobs.length:0;
      return {technician,techJobs,actualHours,hourlyCost,totalCost,costPerJob};
    }).sort((a,b)=>a.costPerJob-b.costPerJob);

    const activeRows=rows.filter(row=>row.techJobs.length>0);
    const totalJobs=activeRows.reduce((sum,row)=>sum+row.techJobs.length,0);
    const totalCost=activeRows.reduce((sum,row)=>sum+row.totalCost,0);
    const workshopAverage=totalJobs?totalCost/totalJobs:0;
    const best=activeRows[0];

    const summaryRows=rows.map(row=>`<tr>
      <td><strong>${escapeHtml(row.technician)}</strong></td>
      <td>${row.techJobs.length}</td>
      <td>${hours(row.actualHours)}</td>
      <td>${moneyExact(row.hourlyCost)}</td>
      <td>${moneyExact(row.totalCost)}</td>
      <td><strong>${moneyExact(row.costPerJob)}</strong></td>
    </tr>`);

    const detailRows=[];
    rows.forEach(row=>row.techJobs
      .slice()
      .sort((a,b)=>jobDate(b)-jobDate(a))
      .forEach(job=>{
        const jobHours=actualClocked(job);
        detailRows.push(`<tr>
          <td>${escapeHtml(row.technician)}</td>
          <td>${normalDate(job.completedAt||job.finishedAt||job.bookingDate||job.createdAt)}</td>
          <td>${escapeHtml(job.reg||"—")}</td>
          <td>${escapeHtml(job.jobNo||"—")}</td>
          <td>${escapeHtml(job.type||"—")}</td>
          <td>${hours(jobHours)}</td>
          <td>${moneyExact(jobHours*row.hourlyCost)}</td>
        </tr>`);
      }));

    setOutput({
      title:"Technician Cost per Job",
      summary:[
        reportCard("Jobs",totalJobs,"Completed Jobs ex MOT"),
        reportCard("Cost",moneyExact(totalCost),"Technician Cost to Business"),
        reportCard("Average",moneyExact(workshopAverage),"Workshop Cost per Job"),
        reportCard("Technicians",activeRows.length,"Technicians with Completed Jobs")
      ].join(""),
      insightHtml:best
        ? insight("Lowest Cost per Completed Job",`${best.technician} recorded the lowest labour cost per completed non-MOT job at ${moneyExact(best.costPerJob)} across ${best.techJobs.length} job(s).`,"good")
        : insight("No matching completed jobs","No completed non-MOT jobs were found for the selected period and technician filter.","warn"),
      output:`<div class="job-card"><p><strong>Calculation:</strong> technician’s actual clocked hours × individual hourly employment cost ÷ completed jobs. MOT jobs are excluded from both the job count and labour cost.</p></div>
        <h3>Technician Summary</h3>${table(["Technician","Jobs Completed ex MOT","Actual Labour Hours","Hourly Cost","Total Cost to Business","Average Cost per Job"],summaryRows)}
        <h3>Completed Job Detail</h3>${detailRows.length?table(["Technician","Completed","Registration","Job Number","Job Type","Actual Hours","Cost to Business"],detailRows):'<div class="job-card"><p>No matching job detail.</p></div>'}`
    });
  }

  function renderJobsCompleted(){
    const list=completedJobs();
    const mots=list.filter(isMotJob);
    const nonMots=list.filter(job=>!isMotJob(job));
    const byDay={};

    list.forEach(job=>{
      const date=normalDate(job.completedAt||job.finishedAt||job.bookingDate||job.createdAt);
      if(!byDay[date]) byDay[date]={total:0,mot:0,nonMot:0,hours:0};
      byDay[date].total++;
      byDay[date].hours+=soldHours(job);
      if(isMotJob(job)) byDay[date].mot++;
      else byDay[date].nonMot++;
    });

    setOutput({
      title:"Jobs Completed",
      summary:[
        reportCard("Total",list.length,"Including MOTs"),
        reportCard("Non MOT",nonMots.length,"Excluding MOTs"),
        reportCard("MOT",mots.length,"MOT Jobs"),
        reportCard("Hours",hours(list.reduce((s,j)=>s+soldHours(j),0)),"Completed Labour")
      ].join(""),
      insightHtml:insight("Job Volume",`${list.length} job(s) were completed: ${nonMots.length} excluding MOTs and ${mots.length} involving an MOT.`,"good"),
      output:table(
        ["Date","Total Jobs","Excluding MOT","MOT Jobs","Sold Labour"],
        Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,row])=>`<tr><td>${date.split("-").reverse().join("/")}</td><td>${row.total}</td><td>${row.nonMot}</td><td>${row.mot}</td><td>${hours(row.hours)}</td></tr>`)
      )
    });
  }

  function renderLabour(){
    const list=completedJobs();
    const byTech={};

    list.forEach(job=>{
      const tech=job.technician||"Unassigned";
      if(!byTech[tech]) byTech[tech]={jobs:0,sold:0,actual:0};
      byTech[tech].jobs++;
      byTech[tech].sold+=soldHours(job);
      byTech[tech].actual+=actualClocked(job);
    });

    setOutput({
      title:"Completed Labour Hours",
      summary:[
        reportCard("Sold",hours(list.reduce((s,j)=>s+soldHours(j),0)),"Completed Sold Hours"),
        reportCard("Clocked",hours(list.reduce((s,j)=>s+actualClocked(j),0)),"Completed Clocked Hours"),
        reportCard("Jobs",list.length,"Completed Jobs")
      ].join(""),
      insightHtml:insight("Fair Workload Measure","Completed labour hours are shown alongside job volume so major repairs are not undervalued.","good"),
      output:table(
        ["Technician","Jobs","Completed Sold Hours","Clocked Hours","Average Sold Hours per Job"],
        Object.entries(byTech).sort((a,b)=>b[1].sold-a[1].sold).map(([tech,row])=>`<tr><td>${tech}</td><td>${row.jobs}</td><td>${hours(row.sold)}</td><td>${hours(row.actual)}</td><td>${row.jobs?(row.sold/row.jobs).toFixed(1):"0.0"} hrs</td></tr>`)
      )
    });
  }

  function renderProductivity(){
    const list=completedJobs();
    const sold=list.reduce((s,j)=>s+soldHours(j),0);
    const actual=list.reduce((s,j)=>s+actualClocked(j),0);
    const available=availabilityHoursForRange(range(),selectedTechnician());
    const productivity=actual>0?(sold/actual)*100:null;
    const efficiency=actual>0?(sold/actual)*100:null;
    const utilisation=available>0?(actual/available)*100:null;

    setOutput({
      title:"Productivity & Efficiency",
      summary:[
        reportCard("Available",hours(available),"Available Hours"),
        reportCard("Clocked",hours(actual),"Productive Clocked Hours"),
        reportCard("Sold",hours(sold),"Sold Hours"),
        reportCard("Productivity",percent(productivity),"Clocked ÷ Available",productivity!==null&&productivity>=90?"good":"warn"),
        reportCard("Utilisation",percent(utilisation),"Clocked ÷ Available",utilisation!==null&&utilisation>=85?"good":"warn"),
        reportCard("Efficiency",percent(efficiency),"Efficiency",efficiency!==null&&efficiency>=100?"good":"warn")
      ].join(""),
      insightHtml:insight(
        "Formula Check",
        `Productivity uses actual clocked job time ÷ available technician hours. Efficiency uses sold hours ÷ actual clocked hours.`,
        "good"
      ),
      output:`<div class="job-card"><h3>Period</h3><p>${range().label}</p><p><strong>Technician filter:</strong> ${selectedTechnician()}</p></div>`
    });
  }

  function renderDowntime(){
    const rows=interruptionRows();
    const lost=rows.filter(row=>row.category==="lost");
    const byReason={};
    lost.forEach(row=>{ byReason[row.reason]=(byReason[row.reason]||0)+row.duration; });

    const biggest=Object.entries(byReason).sort((a,b)=>b[1]-a[1])[0];

    setOutput({
      title:"Downtime Intelligence",
      summary:[
        reportCard("Lost",hours(lost.reduce((s,r)=>s+r.duration,0)),"Lost Hours"),
        reportCard("Events",lost.length,"Lost-time Events"),
        reportCard("Reasons",Object.keys(byReason).length,"Downtime Reasons")
      ].join(""),
      insightHtml:biggest
        ? insight("Largest Downtime Reason",`${biggest[0]} caused ${hours(biggest[1])} of lost time in this period.`,"warn")
        : insight("No Lost Time","No lost-category interruption records were found for this period.","good"),
      output:table(
        ["Reason","Lost Hours","Share"],
        Object.entries(byReason).sort((a,b)=>b[1]-a[1]).map(([reason,value])=>{
          const total=lost.reduce((s,r)=>s+r.duration,0);
          return `<tr><td>${reason}</td><td>${hours(value)}</td><td>${total?((value/total)*100).toFixed(0):0}%</td></tr>`;
        })
      )
    });
  }

  function renderParts(){
    const rows=partsRows();
    const open=rows.filter(({part})=>{
      const status=typeof normalisePartStatus==="function"?normalisePartStatus(part.status,part):String(part.status||"");
      return !["Received","Fitted"].includes(status);
    });
    const delivered=rows.filter(({part})=>part.receivedAt||part.arrivedAt||part.deliveredAt);
    const partial=rows.filter(({part})=>part.hadPartialDelivery||String(part.status||"")==="Partial Delivery");
    const incorrect=rows.filter(({part})=>part.hadIncorrectParts||String(part.status||"")==="Incorrect Parts");
    const grouped={};

    rows.forEach(({part})=>{
      const supplier=part.supplier||part.orderedFrom||"Not recorded";
      if(!grouped[supplier]) grouped[supplier]={orders:0,delivered:0,totalHours:0,partial:0,incorrect:0};
      const row=grouped[supplier];
      row.orders++;
      if(part.orderedAt&&part.receivedAt){
        row.delivered++;
        row.totalHours+=hoursBetween(part.orderedAt,part.receivedAt);
      }
      if(part.hadPartialDelivery||String(part.status||"")==="Partial Delivery") row.partial++;
      if(part.hadIncorrectParts||String(part.status||"")==="Incorrect Parts") row.incorrect++;
    });

    setOutput({
      title:"Parts & Supplier Performance",
      summary:[
        reportCard("Orders",rows.length,"Parts Records"),
        reportCard("Open",open.length,"Outstanding"),
        reportCard("Delivered",delivered.length,"Delivered"),
        reportCard("Partial",partial.length,"Partial Deliveries"),
        reportCard("Incorrect",incorrect.length,"Incorrect Parts")
      ].join(""),
      insightHtml:open.length
        ? insight("Parts Risk",`${open.length} parts record(s) remain outstanding in the selected period.`,"warn")
        : insight("Parts Clear","No outstanding matching parts records remain.","good"),
      output:table(
        ["Supplier","Orders","Delivered","Average Delivery","Partial","Incorrect"],
        Object.entries(grouped).map(([supplier,row])=>`<tr><td>${supplier}</td><td>${row.orders}</td><td>${row.delivered}</td><td>${row.delivered?(row.totalHours/row.delivered).toFixed(1)+" hrs":"N/A"}</td><td>${row.partial}</td><td>${row.incorrect}</td></tr>`)
      )
    });
  }

  function renderReturnsReport(){
    const rows=returnsRows();
    const parts=rows.filter(row=>row.type==="Part");
    const tyres=rows.filter(row=>row.type==="Tyre");
    const creditsReceived=rows.filter(row=>row.status==="Credit Received");
    const creditOutstanding=rows.filter(row=>row.status!=="Credit Received");
    const totalValue=rows.reduce((sum,row)=>sum+row.value,0);
    const receivedValue=creditsReceived.reduce((sum,row)=>sum+row.value,0);
    const outstandingValue=creditOutstanding.reduce((sum,row)=>sum+row.value,0);
    const suppliers={};
    rows.forEach(row=>{suppliers[row.supplier]=(suppliers[row.supplier]||0)+row.quantity;});
    const topSupplier=Object.entries(suppliers).sort((a,b)=>b[1]-a[1])[0];

    setOutput({
      title:"Parts & Tyres Returns",
      summary:[
        reportCard("Returns",rows.length,"Total Returns"),
        reportCard("Parts",parts.length,"Parts Returns"),
        reportCard("Tyres",tyres.length,"Tyre Returns"),
        reportCard("Value",moneyExact(totalValue),"Return Value"),
        reportCard("Received",moneyExact(receivedValue),"Credits Received","good"),
        reportCard("Outstanding",moneyExact(outstandingValue),"Credits Outstanding",outstandingValue>0?"warn":"good")
      ].join(""),
      insightHtml:rows.length
        ? insight(
            "Returns Overview",
            `${topSupplier?escapeHtml(topSupplier[0])+" has the most returned items ("+topSupplier[1]+"). ":""}${creditOutstanding.length} return(s) still have credit outstanding.`,
            creditOutstanding.length?"warn":"good"
          )
        : insight("No Returns","No parts or tyre returns were recorded for this period.","good"),
      output:table(
        ["Return Requested","Registration","Customer","Job Number","Type","Description","Qty","Supplier","Reason","Technician","Returned Date","Credit Status","Value"],
        rows.map(row=>`<tr>
          <td>${escapeHtml(new Date(row.date).toLocaleDateString("en-GB"))}</td>
          <td>${escapeHtml(String(row.job.reg||row.job.registration||"—").toUpperCase())}</td>
          <td>${escapeHtml(row.job.customer||row.job.customerName||"—")}</td>
          <td>${escapeHtml(row.job.jobNumber||row.job.jobNo||row.job.id||"—")}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(row.description)}</td>
          <td>${row.quantity}</td>
          <td>${escapeHtml(row.supplier)}</td>
          <td>${escapeHtml(row.ret.reason||"Not recorded")}</td>
          <td>${escapeHtml(row.ret.createdBy||row.job.technician||"Unassigned")}</td>
          <td>${escapeHtml(row.ret.returnedAt?new Date(row.ret.returnedAt).toLocaleDateString("en-GB"):"—")}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${moneyExact(row.value)}</td>
        </tr>`)
      )
    });
  }

  function renderMot(){
    const list=completedJobs();
    const motJobs=list.filter(isMotJob);
    const results={Pass:0,Advisory:0,Fail:0,Other:0};

    motJobs.forEach(job=>{
      const rec=job.motRecord||{};
      // MOT Intelligence stores the live outcome inside motRecord. Legacy
      // fields are retained as fallbacks for jobs created before WAI-084.
      const value=String(
        rec.result || rec.stage || job.motResult || job.motStatus || job.mot || ""
      ).toLowerCase();

      if(value.includes("advis")) results.Advisory++;
      else if(value.includes("fail") || value.includes("awaiting authorisation") || value.includes("awaiting retest") || value.includes("repair")) results.Fail++;
      else if(value.includes("pass") || value.includes("ready for collection")) results.Pass++;
      else results.Other++;
    });

    setOutput({
      title:"MOT Performance",
      summary:[
        reportCard("MOT",motJobs.length,"MOT Jobs"),
        reportCard("Non MOT",list.length-motJobs.length,"Jobs Excluding MOT"),
        reportCard("Pass",results.Pass,"Pass"),
        reportCard("Advisory",results.Advisory,"With Advisories"),
        reportCard("Fail",results.Fail,"Fail")
      ].join(""),
      insightHtml:insight("MOT Volume",`${motJobs.length} of ${list.length} completed job(s) included an MOT in this period.`,"good"),
      output:table(
        ["Result","Count"],
        Object.entries(results).map(([name,count])=>`<tr><td>${name}</td><td>${count}</td></tr>`)
      )
    });
  }

  function renderApprovals(){
    const list=approvalJobs();
    const outstanding=typeof window.getUnifiedWorkshopQueue==="function"
      ? window.getUnifiedWorkshopQueue("authorisations").filter(job=>list.includes(job))
      : list.filter(job=>String(job.status||"").toLowerCase().includes("awaiting")&&(String(job.status||"").toLowerCase().includes("approval")||String(job.status||"").toLowerCase().includes("authorisation")));
    const approved=list.filter(job=>job.customerApprovalAt||String(job.auth||"").toLowerCase().includes("approved"));
    const declined=list.filter(job=>job.customerDeclinedAt||String(job.auth||"").toLowerCase().includes("declined"));
    const responseHours=approved
      .filter(job=>job.customerApprovalAt&&(job.approvalRequestedAt||job.createdAt))
      .map(job=>hoursBetween(job.approvalRequestedAt||job.createdAt,job.customerApprovalAt));
    const average=responseHours.length?responseHours.reduce((s,n)=>s+n,0)/responseHours.length:null;

    setOutput({
      title:"Customer Approval Performance",
      summary:[
        reportCard("Outstanding",outstanding.length,"Outstanding"),
        reportCard("Approved",approved.length,"Approved"),
        reportCard("Declined",declined.length,"Declined"),
        reportCard("Average",average===null?"N/A":average.toFixed(1)+" hrs","Average Approval Time")
      ].join(""),
      insightHtml:outstanding.length
        ? insight("Action Required",`${outstanding.length} job(s) still require customer approval.`,"warn")
        : insight("Approvals Clear","No matching customer approvals are outstanding.","good"),
      output:table(
        ["Registration","Customer","Telephone","Technician","Authorisation","Latest Contact"],
        list.map(job=>`<tr><td>${job.reg||""}</td><td>${job.customer||"Not entered"}</td><td>${job.phone||"Not entered"}</td><td>${job.technician||""}</td><td>${job.auth||job.status||""}</td><td>${job.customerContactNote||""}</td></tr>`)
      )
    });
  }

  function renderRevenue(){
    const list=completedJobs();
    const byType={};
    list.forEach(job=>{
      const type=job.type||"Other";
      if(!byType[type]) byType[type]={jobs:0,hours:0,value:0};
      byType[type].jobs++;
      byType[type].hours+=soldHours(job);
      byType[type].value+=labourValue(job);
    });
    const total=Object.values(byType).reduce((s,row)=>s+row.value,0);

    setOutput({
      title:"Revenue Watch",
      summary:[
        reportCard("Value",money(total),"Completed Labour Value"),
        reportCard("Jobs",list.length,"Completed Jobs"),
        reportCard("Average",list.length?money(total/list.length):money(0),"Average per Job")
      ].join(""),
      insightHtml:insight("Labour Value",`${money(total)} of completed labour value was recorded in the selected period.`,"good"),
      output:table(
        ["Job Type","Jobs","Sold Labour","Labour Value"],
        Object.entries(byType).map(([type,row])=>`<tr><td>${type}</td><td>${row.jobs}</td><td>${hours(row.hours)}</td><td>${money(row.value)}</td></tr>`)
      )
    });
  }

  function renderCarryover(){
    const selectedRange=range();
    const cutoff=isoLocal(selectedRange.end);
    const list=jobs.filter(job=>{
      if(selectedTechnician()!=="All"&&job.technician!==selectedTechnician()) return false;
      const booked=normalDate(job.bookingDate||job.createdAt);
      return booked&&booked<cutoff&&!completed(job);
    });

    setOutput({
      title:"Carry-over Jobs",
      summary:[
        reportCard("Jobs",list.length,"Carry-over Jobs"),
        reportCard("Hours",hours(list.reduce((s,j)=>s+soldHours(j),0)),"Allocated Hours"),
        reportCard("Parts",list.filter(job=>String(job.status||"").includes("Parts")).length,"Awaiting Parts"),
        reportCard("Approval",list.filter(job=>String(job.status||"").includes("Approval")).length,"Awaiting Approval")
      ].join(""),
      insightHtml:list.length
        ? insight("Carry-over Risk",`${list.length} open job(s) were booked before the end of the selected period.`,"warn")
        : insight("No Carry-over","No matching carry-over jobs were found.","good"),
      output:table(
        ["Registration","Booking Date","Technician","Status","Allocated Hours"],
        list.map(job=>`<tr><td>${job.reg||""}</td><td>${normalDate(job.bookingDate)}</td><td>${job.technician||""}</td><td>${job.status||""}</td><td>${hours(job.hours)}</td></tr>`)
      )
    });
  }

  function renderGarageHealth(){
    const complete=completedJobs();
    const efficiency=efficiencyFor(complete);
    const productivity=productivityFor(complete);
    const downtime=interruptionRows().filter(row=>row.category==="lost").reduce((s,r)=>s+r.duration,0);
    const openParts=partsRows().filter(({part})=>{
      const status=typeof normalisePartStatus==="function"?normalisePartStatus(part.status,part):String(part.status||"");
      return !["Received","Fitted"].includes(status);
    }).length;
    const approvals=typeof window.getUnifiedWorkshopQueue==="function"
      ? window.getUnifiedWorkshopQueue("authorisations").length
      : approvalJobs().filter(job=>String(job.status||"").toLowerCase().includes("awaiting")&&(String(job.status||"").toLowerCase().includes("approval")||String(job.status||"").toLowerCase().includes("authorisation"))).length;
    const carry=jobs.filter(job=>normalDate(job.bookingDate)<isoLocal(new Date())&&!completed(job)).length;

    let score=100;
    if(efficiency!==null&&efficiency<95) score-=15;
    if(productivity!==null&&productivity<90) score-=15;
    score-=Math.min(20,downtime*2);
    score-=Math.min(15,openParts*3);
    score-=Math.min(15,approvals*3);
    score-=Math.min(15,carry*3);
    score=Math.max(0,Math.round(score));

    const risks=[
      {name:"Downtime",value:hours(downtime),risk:downtime>2},
      {name:"Outstanding Parts",value:openParts,risk:openParts>0},
      {name:"Outstanding Approvals",value:approvals,risk:approvals>0},
      {name:"Carry-over Jobs",value:carry,risk:carry>0}
    ];

    setOutput({
      title:"Garage Health",
      summary:[
        reportCard("Health",score+"/100","Garage Health",score>=85?"good":score>=65?"warn":"bad"),
        reportCard("Efficiency",percent(efficiency),"Efficiency"),
        reportCard("Productivity",percent(productivity),"Productivity"),
        reportCard("Downtime",hours(downtime),"Lost Hours"),
        reportCard("Parts",openParts,"Outstanding Parts"),
        reportCard("Carry",carry,"Carry-over Jobs")
      ].join(""),
      insightHtml:insight(
        score>=85?"Workshop Performing Strongly":score>=65?"Workshop Needs Attention":"Urgent Management Focus",
        `The score reflects efficiency, productivity, downtime, parts, approvals and carry-over for the selected period.`,
        score>=85?"good":score>=65?"warn":"bad"
      ),
      output:table(
        ["Health Factor","Current Value","Status"],
        risks.map(row=>`<tr><td>${row.name}</td><td>${row.value}</td><td>${row.risk?"Attention Required":"Clear"}</td></tr>`)
      )
    });
  }


  /* WAI-100 Repeat Repair Intelligence */
  const REPEAT_REPAIRS_KEY="workshopAIRepeatRepairsV1";
  function manualRepeatRepairs(){
    try{return JSON.parse(localStorage.getItem(REPEAT_REPAIRS_KEY)||"[]");}catch(error){return [];}
  }
  function confirmedJobRepeatRepairs(){
    return jobs.filter(job=>job.ftf?.reviewStatus==="Confirmed Repeat Repair").map(job=>{
      const previous=jobs.find(candidate=>String(candidate.id)===String(job.ftf?.previousJobId));
      const technician=previous?.technician||job.ftf?.originalTechnician||job.technician||"Unassigned";
      return {
        id:`FTF-${job.id}`,source:"First Time Fix Centre",currentJobId:job.id,previousJobId:previous?.id||job.ftf?.previousJobId||"",
        registration:job.reg||previous?.reg||"",technician,currentTechnician:job.technician||"Unassigned",
        originalDate:normalDate(previous?.completedAt||previous?.finishedAt||previous?.bookingDate||previous?.createdAt),
        returnDate:normalDate(job.bookingDate||job.createdAt||job.ftf?.confirmedAt),
        originalJob:previous?.workRequired||previous?.complaint||previous?.jobDescription||"No description",
        complaint:job.workRequired||job.complaint||job.jobDescription||"No description",
        rootCause:job.ftf?.rootCause||"To be investigated",outcome:job.ftf?.outcome||"Under review",
        lostHours:safeNumber(job.ftf?.lostHours),cost:safeNumber(job.ftf?.cost),notes:job.ftf?.notes||"",
        investigationStatus:job.ftf?.investigationStatus||"Open",createdAt:job.ftf?.confirmedAt||job.createdAt
      };
    });
  }
  function repeatRepairs(){
    const confirmed=confirmedJobRepeatRepairs();
    const confirmedCurrentIds=new Set(confirmed.map(r=>String(r.currentJobId)));
    const manual=manualRepeatRepairs().filter(r=>!r.currentJobId||!confirmedCurrentIds.has(String(r.currentJobId)));
    return [...confirmed,...manual];
  }
  function saveRepeatRepairs(records){
    localStorage.setItem(REPEAT_REPAIRS_KEY,JSON.stringify(records));
  }
  function repeatDate(record){
    return new Date((record.returnDate||record.createdAt||"")+"T12:00:00");
  }
  function repeatRecordsForRange(selectedRange=range()){
    const tech=selectedTechnician();
    return repeatRepairs().filter(record=>{
      if(tech!=="All"&&record.technician!==tech) return false;
      return inRange(repeatDate(record),selectedRange);
    });
  }
  function repeatMetrics(selectedRange=range()){
    const records=repeatRecordsForRange(selectedRange);
    const completedCount=jobsForSelectedRange(selectedRange,{completedOnly:true}).length;
    const lostHours=records.reduce((sum,r)=>sum+safeNumber(r.lostHours),0);
    const cost=records.reduce((sum,r)=>sum+safeNumber(r.cost),0);
    const repeatRate=completedCount?records.length/completedCount*100:0;
    const firstTimeFix=completedCount?Math.max(0,100-repeatRate):100;
    return {records,completedCount,lostHours,cost,repeatRate,firstTimeFix};
  }
  function monthKey(value){
    const d=value instanceof Date?value:new Date(value);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  }
  function monthLabel(key){
    const [y,m]=key.split("-").map(Number);
    return new Date(y,m-1,1).toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  }
  function repeatMonthRows(){
    const now=new Date();
    const rows=[];
    for(let offset=11;offset>=0;offset--){
      const start=new Date(now.getFullYear(),now.getMonth()-offset,1);
      const end=new Date(now.getFullYear(),now.getMonth()-offset+1,0,23,59,59,999);
      const metrics=repeatMetrics({start,end});
      rows.push({key:monthKey(start),label:monthLabel(monthKey(start)),...metrics});
    }
    return rows;
  }
  function repeatTechnicianRows(records){
    const map={};
    records.forEach(record=>{
      const name=record.technician||"Unassigned";
      map[name] ||= {technician:name,count:0,lostHours:0,cost:0,jobs:[]};
      map[name].count++;
      map[name].lostHours+=safeNumber(record.lostHours);
      map[name].cost+=safeNumber(record.cost);
      map[name].jobs.push(record);
    });
    return Object.values(map).sort((a,b)=>b.count-a.count||b.lostHours-a.lostHours);
  }
  function repeatRootCauseRows(records){
    const map={};
    records.forEach(r=>{const key=r.rootCause||"Not classified";map[key]=(map[key]||0)+1;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function repeatDays(record){
    const start=new Date((record.originalDate||record.returnDate||"")+"T12:00:00");
    const end=new Date((record.returnDate||"")+"T12:00:00");
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())) return "—";
    return Math.max(0,Math.round((end-start)/86400000));
  }
  function repeatRepairForm(){
    const techOptions=getTechs().map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    return `<div class="repeat-entry-panel">
      <div class="repeat-entry-heading"><div><h3>Record Repeat Repair</h3><p class="muted">Record the return once. It will feed the technician, root-cause and monthly reports automatically.</p></div><button type="button" class="secondary" onclick="toggleRepeatRepairForm()">+ Add Repeat Repair</button></div>
      <form id="repeatRepairEntryForm" class="repeat-repair-form" hidden onsubmit="saveRepeatRepairEntry(event)">
        <label>Registration<input id="repeatRegistration" required placeholder="AB12 CDE" oninput="this.value=this.value.toUpperCase()"></label>
        <label>Technician<select id="repeatTechnician" required><option value="">Select technician</option>${techOptions}</select></label>
        <label>Original Repair Date<input id="repeatOriginalDate" type="date" required></label>
        <label>Return Date<input id="repeatReturnDate" type="date" required value="${isoLocal(new Date())}"></label>
        <label class="wide">Original Job / Repair<input id="repeatOriginalJob" required placeholder="Example: Front brake discs and pads"></label>
        <label class="wide">Repeat Complaint<input id="repeatComplaint" required placeholder="What did the customer report on return?"></label>
        <label>Root Cause<select id="repeatRootCause" required>
          <option value="">Select root cause</option><option>Incorrect diagnosis</option><option>Part failure</option><option>Incorrect fitting</option><option>Part not replaced</option><option>Additional fault</option><option>Customer concern only</option><option>Software issue</option><option>Quality control missed</option><option>Road test missed</option><option>Manufacturer defect</option><option>Other</option>
        </select></label>
        <label>Outcome<select id="repeatOutcome"><option>Warranty</option><option>Chargeable</option><option>Goodwill</option><option>Under review</option></select></label>
        <label>Lost Labour Hours<input id="repeatLostHours" type="number" min="0" step="0.1" value="0"></label>
        <label>Cost to Business (£)<input id="repeatCost" type="number" min="0" step="0.01" value="0"></label>
        <label class="wide">Manager Notes<textarea id="repeatManagerNotes" placeholder="Root-cause findings and corrective action"></textarea></label>
        <div class="button-row wide"><button type="submit" class="primary">Save Repeat Repair</button><button type="button" class="secondary" onclick="toggleRepeatRepairForm(false)">Cancel</button></div>
      </form>
    </div>`;
  }
  function renderRepeatRepairs(){
    const metrics=repeatMetrics();
    const records=metrics.records;
    const techRows=repeatTechnicianRows(records);
    const causes=repeatRootCauseRows(records);
    const months=repeatMonthRows();
    const current=months.at(-1);
    const previous=months.at(-2);
    const change=previous&&previous.records.length?((current.records.length-previous.records.length)/previous.records.length)*100:null;
    const topTech=techRows[0];
    const topCause=causes[0];
    const register=records.slice().sort((a,b)=>String(b.returnDate).localeCompare(String(a.returnDate)));

    const technicianTable=table(["Rank","Technician","Repeat Repairs","Lost Hours","Cost","Jobs"],techRows.map((row,index)=>`<tr>
      <td>${index+1}</td><td><strong>${escapeHtml(row.technician)}</strong></td><td>${row.count}</td><td>${hours(row.lostHours)}</td><td>${moneyExact(row.cost)}</td><td>${escapeHtml(row.jobs.map(j=>`${j.registration}: ${j.originalJob}`).join(" • "))}</td></tr>`));
    const monthlyTable=table(["Month","Repeat Repairs","First-Time Fix","Lost Hours","Cost","Change"],months.map((row,index)=>{
      const prior=months[index-1];
      const delta=prior&&prior.records.length?((row.records.length-prior.records.length)/prior.records.length)*100:null;
      return `<tr><td>${row.label}</td><td>${row.records.length}</td><td>${percent(row.firstTimeFix)}</td><td>${hours(row.lostHours)}</td><td>${moneyExact(row.cost)}</td><td>${delta===null?"—":`${delta>0?"▲":delta<0?"▼":"■"} ${Math.abs(delta).toFixed(0)}%`}</td></tr>`;
    }));
    const registerTable=register.length?table(["Return","Registration","Original Technician","Return Technician","Original Job","Complaint","Root Cause","Days","Lost Hours","Cost","Source","Action"],register.map(r=>`<tr>
      <td>${escapeHtml(r.returnDate||"")}</td><td><strong>${escapeHtml(r.registration||"")}</strong></td><td>${escapeHtml(r.technician||"")}</td><td>${escapeHtml(r.currentTechnician||r.technician||"")}</td><td>${escapeHtml(r.originalJob||"")}</td><td>${escapeHtml(r.complaint||"")}</td><td>${escapeHtml(r.rootCause||"")}</td><td>${repeatDays(r)}</td><td>${hours(r.lostHours)}</td><td>${moneyExact(r.cost)}</td><td>${escapeHtml(r.source||"Manual record")}</td><td>${String(r.id).startsWith("FTF-")?"Managed in FTF Centre":`<button class="secondary" onclick="deleteRepeatRepair('${r.id}')">Remove</button>`}</td></tr>`)):`<div class="job-card good"><p>No repeat repairs recorded for this period.</p></div>`;
    const causeTable=causes.length?table(["Root Cause","Cases","Share"],causes.map(([cause,count])=>`<tr><td>${escapeHtml(cause)}</td><td>${count}</td><td>${records.length?((count/records.length)*100).toFixed(0):0}%</td></tr>`)):`<p>No root-cause data in this period.</p>`;

    setOutput({
      title:"Repeat Repair Intelligence",
      summary:[
        reportCard("Repeats",records.length,"Repeat Repairs",records.length?"bad":"good"),
        reportCard("FTF",percent(metrics.firstTimeFix),"First-Time Fix",metrics.firstTimeFix>=97?"good":metrics.firstTimeFix>=94?"warn":"bad"),
        reportCard("Rate",metrics.repeatRate.toFixed(1)+"%","Repeat Rate"),
        reportCard("Hours",hours(metrics.lostHours),"Lost Labour"),
        reportCard("Cost",moneyExact(metrics.cost),"Cost to Business"),
        reportCard("Change",change===null?"—":`${change>0?"▲":change<0?"▼":"■"} ${Math.abs(change).toFixed(0)}%`,"vs Last Month",change>0?"bad":change<0?"good":"")
      ].join(""),
      insightHtml:insight(
        topTech?`${topTech.technician} has the most repeat repairs (${topTech.count})`:"No repeat repair trend yet",
        topTech?`The leading root cause is ${topCause?topCause[0]:"not classified"}. Review the job register and corrective actions before the next workshop meeting.`:"Record repeat repairs to start monthly quality comparison.",
        records.length?"warn":"good"
      ),
      output:`${repeatRepairForm()}<div class="repeat-report-section"><h3>Technician Comparison</h3>${technicianTable}</div><div class="repeat-report-section"><h3>12-Month Comparison</h3>${monthlyTable}</div><div class="repeat-report-section"><h3>Root Cause Analysis</h3>${causeTable}</div><div class="repeat-report-section"><h3>Repeat Repair Register</h3>${registerTable}</div>`
    });
  }

  window.toggleRepeatRepairForm=function(force){
    const form=el("repeatRepairEntryForm");
    if(!form)return;
    form.hidden=typeof force==="boolean"?!force:!form.hidden;
    if(!form.hidden) el("repeatRegistration")?.focus();
  };
  window.saveRepeatRepairEntry=function(event){
    event.preventDefault();
    const record={
      id:`RR-${Date.now()}`,registration:el("repeatRegistration").value.trim().toUpperCase(),technician:el("repeatTechnician").value,
      originalDate:el("repeatOriginalDate").value,returnDate:el("repeatReturnDate").value,originalJob:el("repeatOriginalJob").value.trim(),
      complaint:el("repeatComplaint").value.trim(),rootCause:el("repeatRootCause").value,outcome:el("repeatOutcome").value,
      lostHours:safeNumber(el("repeatLostHours").value),cost:safeNumber(el("repeatCost").value),notes:el("repeatManagerNotes").value.trim(),createdAt:new Date().toISOString()
    };
    if(!record.registration||!record.technician||!record.originalDate||!record.returnDate||!record.originalJob||!record.complaint||!record.rootCause){alert("Complete the required repeat repair fields.");return;}
    const records=repeatRepairs();records.push(record);saveRepeatRepairs(records);renderAll();
  };
  window.deleteRepeatRepair=function(id){
    if(String(id).startsWith("FTF-")){alert("This confirmed repeat is controlled by the First Time Fix Centre. Change its review status there so every report stays consistent.");return;}
    if(!confirm("Remove this repeat repair record?"))return;
    saveRepeatRepairs(manualRepeatRepairs().filter(r=>r.id!==id));renderAll();
  };


  /* WAI-101 Monthly Technician Performance Review */
  const TECH_REVIEW_COST_KEY="workshopAITechnicianHourlyCostsV1";
  const TECH_REVIEW_NOTES_KEY="workshopAITechnicianMonthlyReviewNotesV1";
  function technicianHourlyCosts(){try{return JSON.parse(localStorage.getItem(TECH_REVIEW_COST_KEY)||"{}");}catch(error){return {};}}
  function monthlyReviewNotes(){try{return JSON.parse(localStorage.getItem(TECH_REVIEW_NOTES_KEY)||"{}");}catch(error){return {};}}
  function selectedReviewTechnician(){
    const selected=selectedTechnician();
    return selected!=="All"?selected:(getTechs()[0]||"Unassigned");
  }
  function completedJobsForTech(technician,selectedRange){
    return jobsForSelectedRange(selectedRange,{completedOnly:true}).filter(job=>job.technician===technician);
  }
  function technicianMonthlyMetrics(technician,selectedRange){
    const techJobs=completedJobsForTech(technician,selectedRange);
    const nonMotJobs=techJobs.filter(job=>!isMotJob(job));
    const sold=nonMotJobs.reduce((sum,job)=>sum+soldHours(job),0);
    const actual=nonMotJobs.reduce((sum,job)=>sum+actualClocked(job),0);
    const available=availabilityHoursForRange(selectedRange,technician);
    const productivity=available>0?actual/available*100:null;
    const efficiency=actual>0?sold/actual*100:null;
    const repeats=repeatRepairs().filter(record=>record.technician===technician&&inRange(repeatDate(record),selectedRange));
    const firstTimeFix=nonMotJobs.length?Math.max(0,(nonMotJobs.length-repeats.length)/nonMotJobs.length*100):100;
    const hourlyCost=safeNumber(technicianHourlyCosts()[technician]);
    const totalLabourCost=actual*hourlyCost;
    const costPerJob=nonMotJobs.length?totalLabourCost/nonMotJobs.length:0;
    const repeatCost=repeats.reduce((sum,r)=>sum+safeNumber(r.cost),0);
    return {technician,techJobs,nonMotJobs,sold,actual,available,productivity,efficiency,repeats,firstTimeFix,hourlyCost,totalLabourCost,costPerJob,repeatCost};
  }
  function monthlyLeague(selectedRange){
    return getTechs().map(name=>technicianMonthlyMetrics(name,selectedRange)).sort((a,b)=>{
      const scoreA=(a.productivity||0)*.30+(a.efficiency||0)*.30+a.firstTimeFix*.30+Math.min(100,a.nonMotJobs.length*2)*.10;
      const scoreB=(b.productivity||0)*.30+(b.efficiency||0)*.30+b.firstTimeFix*.30+Math.min(100,b.nonMotJobs.length*2)*.10;
      a.reviewScore=scoreA;b.reviewScore=scoreB;return scoreB-scoreA;
    });
  }
  function reviewKey(technician,selectedRange){return `${technician}|${monthKey(selectedRange.start)}`;}
  function renderMonthlyTechnicianReview(){
    const selectedRange=range();
    const technician=selectedReviewTechnician();
    const current=technicianMonthlyMetrics(technician,selectedRange);
    const previousRange={start:new Date(selectedRange.start.getFullYear(),selectedRange.start.getMonth()-1,1),end:new Date(selectedRange.start.getFullYear(),selectedRange.start.getMonth(),0,23,59,59,999)};
    const previous=technicianMonthlyMetrics(technician,previousRange);
    const league=monthlyLeague(selectedRange);
    const position=Math.max(1,league.findIndex(row=>row.technician===technician)+1);
    const key=reviewKey(technician,selectedRange);
    const notes=monthlyReviewNotes()[key]||{};
    const trend=(value,prior,inverse=false)=>{
      const diff=safeNumber(value)-safeNumber(prior); if(Math.abs(diff)<0.05)return "■ No change";
      const improved=inverse?diff<0:diff>0; return `${diff>0?"▲":"▼"} ${Math.abs(diff).toFixed(1)}${improved?" improvement":""}`;
    };
    const repeatRows=current.repeats.map(r=>`<tr><td>${escapeHtml(r.registration)}</td><td>${escapeHtml(r.originalJob)}</td><td>${escapeHtml(r.returnDate)}</td><td>${escapeHtml(r.rootCause)}</td><td>${hours(r.lostHours)}</td><td>${moneyExact(r.cost)}</td></tr>`);
    const leagueRows=league.map((row,index)=>`<tr class="${row.technician===technician?'selected-review-tech':''}"><td>${index+1}</td><td>${escapeHtml(row.technician)}</td><td>${percent(row.productivity)}</td><td>${percent(row.efficiency)}</td><td>${percent(row.firstTimeFix)}</td><td>${row.nonMotJobs.length}</td><td>${moneyExact(row.costPerJob)}</td></tr>`);
    const monthName=selectedRange.start.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
    setOutput({
      title:`Monthly Technician Performance Review — ${technician}`,
      summary:[
        reportCard("Position",`${position} of ${league.length}`,"League Position",position===1?"good":""),
        reportCard("Productivity",percent(current.productivity),"Productivity",current.productivity>=93?"good":current.productivity<85?"bad":"warn"),
        reportCard("Efficiency",percent(current.efficiency),"Efficiency",current.efficiency>=100?"good":current.efficiency<85?"bad":"warn"),
        reportCard("FTF",percent(current.firstTimeFix),"First-Time Fix",current.firstTimeFix>=97?"good":current.firstTimeFix<94?"bad":"warn"),
        reportCard("Jobs",current.nonMotJobs.length,"Jobs ex MOT"),
        reportCard("Cost",moneyExact(current.costPerJob),"Labour Cost per Job")
      ].join(""),
      insightHtml:insight(`${technician} — ${monthName}`,`Overall league position ${position} of ${league.length}. ${current.repeats.length} confirmed repeat repair${current.repeats.length===1?"":"s"}; MOTs are excluded from job and cost-per-job calculations.`,current.repeats.length?"warn":"good"),
      output:`<div class="monthly-review-sheet">
        <div class="monthly-review-header"><div><h2>${escapeHtml(technician)}</h2><p>Individual Monthly Performance Review · ${monthName}</p></div><div><strong>Workshop AI</strong><br>Review date: ${new Date().toLocaleDateString("en-GB")}</div></div>
        <div class="review-actions no-print"><label>True hourly employment cost (£)<input id="monthlyReviewHourlyCost" type="number" min="0" step="0.01" value="${current.hourlyCost.toFixed(2)}"></label><button onclick="saveMonthlyReviewCost('${escapeHtml(technician)}')">Save Cost</button><button onclick="window.print()">Print Individual Review</button></div>
        <h3>Monthly KPI Scorecard</h3>${table(["Measure","This Month","Previous Month","Movement"],[
          `<tr><td>Productivity</td><td>${percent(current.productivity)}</td><td>${percent(previous.productivity)}</td><td>${trend(current.productivity,previous.productivity)}</td></tr>`,
          `<tr><td>Efficiency</td><td>${percent(current.efficiency)}</td><td>${percent(previous.efficiency)}</td><td>${trend(current.efficiency,previous.efficiency)}</td></tr>`,
          `<tr><td>First-Time Fix</td><td>${percent(current.firstTimeFix)}</td><td>${percent(previous.firstTimeFix)}</td><td>${trend(current.firstTimeFix,previous.firstTimeFix)}</td></tr>`,
          `<tr><td>Jobs completed excluding MOTs</td><td>${current.nonMotJobs.length}</td><td>${previous.nonMotJobs.length}</td><td>${trend(current.nonMotJobs.length,previous.nonMotJobs.length)}</td></tr>`,
          `<tr><td>Labour cost per job</td><td>${moneyExact(current.costPerJob)}</td><td>${moneyExact(previous.costPerJob)}</td><td>${trend(current.costPerJob,previous.costPerJob,true)}</td></tr>`,
          `<tr><td>Confirmed repeat repairs</td><td>${current.repeats.length}</td><td>${previous.repeats.length}</td><td>${trend(current.repeats.length,previous.repeats.length,true)}</td></tr>`
        ])}
        <h3>League Table Comparison</h3>${table(["Position","Technician","Productivity","Efficiency","First-Time Fix","Jobs ex MOT","Cost per Job"],leagueRows)}
        <h3>Confirmed Repeat Repair Detail</h3>${repeatRows.length?table(["Registration","Original Job","Return Date","Root Cause","Lost Hours","Cost"],repeatRows):'<div class="job-card good"><p>No confirmed repeat repairs attributed to this technician in this month.</p></div>'}
        <h3>Monthly Review Discussion</h3><div class="review-notes-grid">
          <label>Strengths<textarea id="reviewStrengths">${escapeHtml(notes.strengths||"")}</textarea></label>
          <label>Areas to improve<textarea id="reviewImprovements">${escapeHtml(notes.improvements||"")}</textarea></label>
          <label>Training / support required<textarea id="reviewTraining">${escapeHtml(notes.training||"")}</textarea></label>
          <label>Targets and actions for next month<textarea id="reviewActions">${escapeHtml(notes.actions||"")}</textarea></label>
          <label class="wide">Technician comments<textarea id="reviewTechnicianComments">${escapeHtml(notes.technicianComments||"")}</textarea></label>
        </div><div class="button-row no-print"><button onclick="saveMonthlyReviewNotes('${escapeHtml(technician)}')">Save Review Notes</button></div>
        <div class="review-signatures"><div>Technician signature<br><span></span></div><div>Service Manager signature<br><span></span></div><div>Date<br><span></span></div></div>
      </div>`
    });
  }
  window.saveMonthlyReviewCost=function(technician){const costs=technicianHourlyCosts();costs[technician]=safeNumber(el("monthlyReviewHourlyCost")?.value);localStorage.setItem(TECH_REVIEW_COST_KEY,JSON.stringify(costs));renderAll();};
  window.saveMonthlyReviewNotes=function(technician){const notes=monthlyReviewNotes(),key=reviewKey(technician,range());notes[key]={strengths:el("reviewStrengths")?.value||"",improvements:el("reviewImprovements")?.value||"",training:el("reviewTraining")?.value||"",actions:el("reviewActions")?.value||"",technicianComments:el("reviewTechnicianComments")?.value||"",savedAt:new Date().toISOString()};localStorage.setItem(TECH_REVIEW_NOTES_KEY,JSON.stringify(notes));alert("Monthly review notes saved.");};


  function renderVHCReport(){
    if(typeof window.renderVHCIntelligenceReport!=="function"){
      setOutput({title:"Vehicle Health Check Performance",output:insight("VHC module unavailable","The WAI-093 VHC module has not loaded.","bad")});
      return;
    }
    window.renderVHCIntelligenceReport({
      selectedTechnician,range,inRange,jobDate,completed,percent,reportCard,insight,table,setReport:setOutput
    });
  }

  function renderActiveReport(){
    const renderers={
      workshop:renderWorkshopPerformance,
      technicians:renderTechnicians,
      technicianCostPerJob:renderTechnicianCostPerJob,
      vhc:renderVHCReport,
      jobs:renderJobsCompleted,
      labour:renderLabour,
      productivity:renderProductivity,
      downtime:renderDowntime,
      parts:renderParts,
      returns:renderReturnsReport,
      mot:renderMot,
      approvals:renderApprovals,
      revenue:renderRevenue,
      carryover:renderCarryover,
      garageHealth:renderGarageHealth,
      repeatRepairs:renderRepeatRepairs,
      monthlyTechnicianReview:renderMonthlyTechnicianReview
    };
    (renderers[activeReport]||renderWorkshopPerformance)();
  }

  function saveFavourites(){
    localStorage.setItem(FAVOURITES_KEY,JSON.stringify(favourites));
  }
  function isFavourite(reportId){
    return favourites.includes(reportId);
  }
  function filteredReportDefinitions(){
    const search=String(el("intelligenceReportSearch")?.value||"").trim().toLowerCase();
    return REPORTS.filter(report=>{
      const categoryMatch=activeCategory==="All"||report.category===activeCategory;
      const searchMatch=!search||
        report.title.toLowerCase().includes(search)||
        report.description.toLowerCase().includes(search)||
        report.category.toLowerCase().includes(search);
      return categoryMatch&&searchMatch;
    });
  }
  function renderCategories(){
    const container=el("workshopIntelligenceCategories");
    if(!container) return;
    container.innerHTML=CATEGORIES.map(category=>`
      <button class="${activeCategory===category?"active":""}"
        onclick="selectWorkshopIntelligenceCategory('${category}')">${category}</button>
    `).join("");
  }
  function reportDefinitionCard(report){
    return `<div class="job-card ${activeReport===report.id?"good":""}">
      <div class="intelligence-card-title">
        <h3>${report.icon} ${report.title}</h3>
        <button class="intelligence-star" onclick="toggleWorkshopIntelligenceFavourite('${report.id}',event)">
          ${isFavourite(report.id)?"★":"☆"}
        </button>
      </div>
      <p class="intelligence-category-label">${report.category}</p>
      <p>${report.description}</p>
      <button onclick="selectWorkshopIntelligenceReport('${report.id}')">
        ${activeReport===report.id?"Selected":"Open Report"}
      </button>
    </div>`;
  }
  function renderReportList(){
    const container=el("workshopIntelligenceReportList");
    if(!container) return;
    const definitions=filteredReportDefinitions();
    container.innerHTML=definitions.length
      ? definitions.map(reportDefinitionCard).join("")
      : `<div class="job-card warn"><p>No reports match the current category or search.</p></div>`;
  }
  function renderFavourites(){
    const container=el("workshopIntelligenceFavourites");
    if(!container) return;
    const definitions=REPORTS.filter(report=>isFavourite(report.id));
    container.innerHTML=definitions.length
      ? definitions.map(reportDefinitionCard).join("")
      : `<div class="job-card"><p>No favourite reports saved yet. Press ☆ on a report to add it here.</p></div>`;
  }
  function updateFavouriteButton(){
    const button=el("toggleFavouriteWorkshopIntelligence");
    if(!button) return;
    button.textContent=isFavourite(activeReport)?"★ Favourite":"☆ Favourite";
    button.classList.toggle("active",isFavourite(activeReport));
  }

  function csvEscape(value){
    const text=String(value??"");
    return `"${text.replaceAll('"','""')}"`;
  }
  function currentReportRows(){
    const title=el("workshopIntelligenceTitle")?.textContent||"Workshop Intelligence";
    const rows=[
      ["Report",title],
      ["Period",range().label],
      ["Technician",selectedTechnician()],
      []
    ];

    el("workshopIntelligenceSummary")?.querySelectorAll(".stat").forEach(card=>{
      const value=card.querySelector("strong")?.textContent||"";
      const label=Array.from(card.childNodes)
        .filter(node=>node.nodeType===Node.TEXT_NODE)
        .map(node=>node.textContent.trim())
        .filter(Boolean)
        .join(" ");
      rows.push([label,value]);
    });

    const tableElement=el("workshopIntelligenceOutput")?.querySelector("table");
    if(tableElement){
      rows.push([]);
      tableElement.querySelectorAll("tr").forEach(row=>{
        rows.push(Array.from(row.children).map(cell=>cell.textContent.trim()));
      });
    }

    return rows;
  }
  function downloadCsv(){
    const rows=currentReportRows();
    const csv=rows.map(row=>row.map(csvEscape).join(",")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=`workshop-intelligence-${activeReport}-${isoLocal(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }
  function printCurrentReport(){
    document.body.classList.add("printing-workshop-intelligence");
    window.print();
    setTimeout(()=>document.body.classList.remove("printing-workshop-intelligence"),500);
  }

  function populateTechnicians(){
    const select=el("intelligenceTechnician");
    if(!select) return;
    const current=select.value||"All";
    select.innerHTML=`<option value="All">All Technicians</option>`+
      getTechs().map(tech=>`<option value="${tech}">${tech}</option>`).join("");
    select.value=getTechs().includes(current)||current==="All"?current:"All";
  }

  function initialiseDates(){
    const nowDate=new Date();
    const start=firstOfMonth(nowDate);
    if(el("intelligenceStartDate")&&!el("intelligenceStartDate").value) el("intelligenceStartDate").value=isoLocal(start);
    if(el("intelligenceEndDate")&&!el("intelligenceEndDate").value) el("intelligenceEndDate").value=isoLocal(nowDate);
  }

  function renderAll(){
    if(!el("workshopIntelligenceReportList")) return;
    populateTechnicians();
    initialiseDates();
    renderCategories();
    renderFavourites();
    renderReportList();
    const printable=el("workshopIntelligencePrintable");
    if(reportOpen){
      printable?.classList.remove("intelligence-report-hidden");
      renderActiveReport();
    }else{
      printable?.classList.add("intelligence-report-hidden");
    }
  }

  window.selectWorkshopIntelligenceReport=function(reportId){
    activeReport=REPORTS.some(report=>report.id===reportId)?reportId:"workshop";
    reportOpen=true;
    renderAll();
    el("workshopIntelligencePrintable")?.scrollIntoView({behavior:"smooth",block:"start"});
  };
  window.selectWorkshopIntelligenceCategory=function(category){
    activeCategory=CATEGORIES.includes(category)?category:"All";
    renderAll();
  };
  window.toggleWorkshopIntelligenceFavourite=function(reportId,event){
    event?.stopPropagation();
    favourites=isFavourite(reportId)
      ? favourites.filter(id=>id!==reportId)
      : [...favourites,reportId];
    saveFavourites();
    renderAll();
  };

  ["intelligencePeriod","intelligenceTechnician","intelligenceStartDate","intelligenceEndDate","intelligenceComparison"].forEach(id=>{
    el(id)?.addEventListener("change",renderAll);
  });
  el("intelligenceReportSearch")?.addEventListener("input",renderAll);
  el("refreshWorkshopIntelligence")?.addEventListener("click",()=>{
    reportOpen=false;
    renderAll();
    el("reportsInterfaceScreen")?.scrollIntoView({behavior:"smooth",block:"start"});
  });
  el("closeWorkshopIntelligenceReport")?.addEventListener("click",()=>{
    reportOpen=false;
    renderAll();
    el("workshopIntelligenceReportList")?.scrollIntoView({behavior:"smooth",block:"start"});
  });
  el("printWorkshopIntelligence")?.addEventListener("click",printCurrentReport);
  el("exportWorkshopIntelligenceExcel")?.addEventListener("click",downloadCsv);
  el("toggleFavouriteWorkshopIntelligence")?.addEventListener("click",()=>{
    window.toggleWorkshopIntelligenceFavourite(activeReport);
  });

  const previousRender=typeof render==="function"?render:null;
  if(previousRender){
    render=function(){
      previousRender();
      renderAll();
    };
  }

  renderAll();
})();
