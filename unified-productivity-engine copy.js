/* WAI-103.0 Unified Productivity Engine
   One source of truth for every Workshop AI module.
   Productivity = sold labour hours / actual job-clocked hours.
   Efficiency   = allocated/sold hours / actual job-clocked hours (job performance).
   Utilisation  = actual job-clocked hours / available hours.
*/
(function(){
  'use strict';
  const n=v=>{const x=Number(v||0);return Number.isFinite(x)&&x>0?x:0;};
  const sold=j=>n(j&&((j.hours!=null?j.hours:j.allowedHours)));
  const clocked=j=>n(j&&((j.actualHours!=null?j.actualHours:j.clockedHours)));
  function calculate(jobs, availableHours){
    const list=Array.isArray(jobs)?jobs:[];
    const soldHours=list.reduce((s,j)=>s+sold(j),0);
    const clockedHours=list.reduce((s,j)=>s+clocked(j),0);
    const available=n(availableHours);
    const productivity=clockedHours>0?(soldHours/clockedHours)*100:null;
    const efficiency=clockedHours>0?(soldHours/clockedHours)*100:null;
    const utilisation=available>0?(clockedHours/available)*100:null;
    return {soldHours,clockedHours,availableHours:available,productivity,efficiency,utilisation};
  }
  window.WorkshopAIProductivityEngine={version:'WAI-103.0',soldHours:sold,clockedHours:clocked,calculate};
  window.calculateWorkshopProductivity=calculate;
})();
