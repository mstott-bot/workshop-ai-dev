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
    {id:"workshop", title:"Workshop Performance", description:"Jobs, labour hours, efficiency, productivity and labour value."},
    {id:"technicians", title:"Technician Performance", description:"Technician scorecards with jobs, completed labour hours, efficiency and job mix."},
    {id:"jobs", title:"Jobs Completed", description:"Daily, weekly and monthly jobs including and excluding MOTs."},
    {id:"labour", title:"Completed Labour Hours", description:"Completed sold labour hours by technician and workshop."},
    {id:"productivity", title:"Productivity & Efficiency", description:"Actual clocked productive time, available capacity and sold-hours efficiency."},
    {id:"downtime", title:"Downtime Intelligence", description:"Lost hours, reasons and technician downtime patterns."},
    {id:"parts", title:"Parts & Supplier Performance", description:"Outstanding parts, delivery times, partial deliveries and incorrect parts."},
    {id:"mot", title:"MOT Performance", description:"MOT volume, results and MOT-inclusive versus non-MOT workload."},
    {id:"approvals", title:"Customer Approval Performance", description:"Outstanding approvals, completed approvals and average response times."},
    {id:"revenue", title:"Revenue Watch", description:"Completed labour value by job type and technician."},
    {id:"carryover", title:"Carry-over Jobs", description:"Open jobs from earlier dates and the hours tied up in them."},
    {id:"garageHealth", title:"Garage Health", description:"Operational health summary and the largest current risks."}
  ];

  let activeReport="workshop";

  function el(id){ return document.getElementById(id); }
  function safeNumber(value){ return Number.isFinite(Number(value)) ? Number(value) : 0; }
  function money(value){ return "£"+Math.round(safeNumber(value)).toLocaleString("en-GB"); }
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
  function productivityFor(list){
    const available=availabilityHoursForRange(range(),selectedTechnician());
    const actual=list.reduce((sum,job)=>sum+actualClocked(job),0);
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
    if(el("workshopIntelligenceSummary")) el("workshopIntelligenceSummary").innerHTML=summary;
    if(el("workshopIntelligenceInsight")) el("workshopIntelligenceInsight").innerHTML=insightHtml;
    if(el("workshopIntelligenceOutput")) el("workshopIntelligenceOutput").innerHTML=output;
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
    const productivity=available>0?(actual/available)*100:null;
    const efficiency=actual>0?(sold/actual)*100:null;

    setOutput({
      title:"Productivity & Efficiency",
      summary:[
        reportCard("Available",hours(available),"Available Hours"),
        reportCard("Clocked",hours(actual),"Productive Clocked Hours"),
        reportCard("Sold",hours(sold),"Sold Hours"),
        reportCard("Productivity",percent(productivity),"Productivity",productivity!==null&&productivity>=90?"good":"warn"),
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

  function renderMot(){
    const list=completedJobs();
    const motJobs=list.filter(isMotJob);
    const results={Pass:0,Advisory:0,Fail:0,Other:0};

    motJobs.forEach(job=>{
      const value=String(job.motResult||job.motStatus||job.mot||"").toLowerCase();
      if(value.includes("fail")) results.Fail++;
      else if(value.includes("advis")) results.Advisory++;
      else if(value.includes("pass")) results.Pass++;
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
    const outstanding=list.filter(job=>
      String(job.auth||"").toLowerCase().includes("awaiting")||
      String(job.status||"").toLowerCase().includes("approval")
    );
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
    const approvals=approvalJobs().filter(job=>String(job.auth||"").toLowerCase().includes("awaiting")).length;
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

  function renderActiveReport(){
    const renderers={
      workshop:renderWorkshopPerformance,
      technicians:renderTechnicians,
      jobs:renderJobsCompleted,
      labour:renderLabour,
      productivity:renderProductivity,
      downtime:renderDowntime,
      parts:renderParts,
      mot:renderMot,
      approvals:renderApprovals,
      revenue:renderRevenue,
      carryover:renderCarryover,
      garageHealth:renderGarageHealth
    };
    (renderers[activeReport]||renderWorkshopPerformance)();
  }

  function renderReportList(){
    const container=el("workshopIntelligenceReportList");
    if(!container) return;
    container.innerHTML=REPORTS.map(report=>`
      <div class="job-card ${activeReport===report.id?"good":""}">
        <h3>${report.title}</h3>
        <p>${report.description}</p>
        <button onclick="selectWorkshopIntelligenceReport('${report.id}')">
          ${activeReport===report.id?"Selected":"Open Report"}
        </button>
      </div>
    `).join("");
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
    renderReportList();
    renderActiveReport();
  }

  window.selectWorkshopIntelligenceReport=function(reportId){
    activeReport=REPORTS.some(report=>report.id===reportId)?reportId:"workshop";
    renderAll();
  };

  ["intelligencePeriod","intelligenceTechnician","intelligenceStartDate","intelligenceEndDate"].forEach(id=>{
    el(id)?.addEventListener("change",renderAll);
  });
  el("refreshWorkshopIntelligence")?.addEventListener("click",renderAll);

  const previousRender=typeof render==="function"?render:null;
  if(previousRender){
    render=function(){
      previousRender();
      renderAll();
    };
  }

  renderAll();
})();
