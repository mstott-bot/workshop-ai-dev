/* Workshop AI WAI-083A — Unified Capacity Engine */
(function(){
  "use strict";
  function number(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function snapshot(){
    if(typeof window.getCapacityMetrics==="function"){
      const c=window.getCapacityMetrics();
      const available=number(c.available), sold=number(c.sold);
      return {
        available,
        sold,
        used:available>0?(sold/available)*100:null,
        remaining:available-sold,
        techs:Array.isArray(c.techs)?c.techs:[],
        lostParts:number(c.lostParts),
        lostAuth:number(c.lostAuth),
        lostActivity:number(c.lostActivity),
        supportActivity:number(c.supportActivity)
      };
    }
    const targets=typeof window.getWorkshopTargets==="function"?window.getWorkshopTargets():(window.targets||{});
    const jobs=Array.isArray(window.jobs)?window.jobs:[];
    const today=new Date().toISOString().slice(0,10);
    const completed=j=>!!j.completedAt||/Ready|Complete|Closed|Collected/i.test(String(j.status||""));
    const active=jobs.filter(j=>!completed(j)&&(!j.bookingDate||String(j.bookingDate).slice(0,10)<=today));
    const available=number(targets.availableHours);
    const sold=active.reduce((sum,j)=>sum+number(j.hours),0);
    return {available,sold,used:available>0?(sold/available)*100:null,remaining:available-sold,techs:[],lostParts:0,lostAuth:0,lostActivity:0,supportActivity:0};
  }
  window.getUnifiedWorkshopCapacity=snapshot;
  window.WAI083A={version:"WAI-083A",capacity:snapshot};
})();
