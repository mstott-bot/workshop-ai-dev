/* Workshop AI WAI-101.9 — Unified Live Dashboard Engine
   One source of truth for operational queues and their invoice-backed values. */
(function(){
  'use strict';
  const text=v=>String(v??'').toLowerCase();
  const jobsList=()=>Array.isArray(window.jobs)?window.jobs:(typeof jobs!=='undefined'&&Array.isArray(jobs)?jobs:[]);
  const state=j=>text([j?.status,j?.workflowStatus,j?.techStatus,j?.mot?.stage,j?.motStage].filter(Boolean).join(' '));
  const collected=j=>state(j).includes('collected')||Boolean(j?.collectedAt);
  function isReadyForCollection(j){
    if(!j||collected(j))return false;
    const s=state(j);
    return s.includes('ready for collection')||s.includes('repair complete')||Boolean(j.readyForCollectionAt)||Boolean(j.completedAt||j.finishedAt);
  }
  function isCompleted(j){return !j||collected(j)||isReadyForCollection(j)||state(j)==='completed'||state(j).includes('closed');}
  function isRetail(j){return text(j?.type||j?.jobType||'retail').includes('retail');}
  function isAwaitingAuthorisation(j){
    if(!j||isCompleted(j)||!isRetail(j))return false;
    const s=state(j);
    return j.awaitingAuthorisation===true||j.awaitingApproval===true||(s.includes('awaiting')&&(s.includes('authorisation')||s.includes('authorization')||s.includes('approval')))||s.includes('customer response required');
  }
  function isWaitingParts(j){
    if(!j||isCompleted(j))return false;
    const s=state(j);
    const open=(j.partsRequests||[]).some(p=>!['delivered','fitted','returned','credit received','cancelled'].includes(text(p.status)));
    return s.includes('waiting for parts')||s.includes('awaiting parts')||open;
  }
  function isWaitingWarranty(j){const s=state(j);return !isCompleted(j)&&(s.includes('warranty')&&(s.includes('await')||s.includes('author')));}
  function isWaitingSublet(j){const s=state(j);return !isCompleted(j)&&(s.includes('sublet')||s.includes('subcontract'));}
  function invoiceFor(j){try{return window.WAI099FinanceBridge?.getJobFinancials?.(j.id)||{found:false,status:'No estimate',net:0,cost:0,gp:0,vat:0,total:0,categories:{}}}catch(_){return {found:false,status:'No estimate',net:0,cost:0,gp:0,vat:0,total:0,categories:{}}}}
  function isReadyToInvoice(j){const f=invoiceFor(j);return isReadyForCollection(j)&&['Estimate','Authorised','Invoice Ready','No estimate'].includes(f.status);}
  function isWorkInProgress(j){return !isCompleted(j)&&!isAwaitingAuthorisation(j);}
  function value(items){return items.reduce((a,j)=>{const f=invoiceFor(j);a.net+=Number(f.net||0);a.cost+=Number(f.cost||0);a.gp+=Number(f.gp||0);a.vat+=Number(f.vat||0);a.total+=Number(f.total||0);a.documents+=f.found?1:0;return a},{net:0,cost:0,gp:0,vat:0,total:0,documents:0});}
  function queue(name){const list=jobsList();switch(name){
    case 'authorisations':return list.filter(isAwaitingAuthorisation);
    case 'parts':return list.filter(isWaitingParts);
    case 'readyForCollection':return list.filter(isReadyForCollection);
    case 'readyToInvoice':return list.filter(isReadyToInvoice);
    case 'workInProgress':return list.filter(isWorkInProgress);
    case 'warranty':return list.filter(isWaitingWarranty);
    case 'sublet':return list.filter(isWaitingSublet);
    default:return [];
  }}
  function snapshot(){
    const workInProgress=queue('workInProgress'),authorisations=queue('authorisations'),parts=queue('parts'),readyToInvoice=queue('readyToInvoice'),readyForCollection=queue('readyForCollection'),warranty=queue('warranty'),sublet=queue('sublet');
    const held=[...new Map([...parts,...authorisations,...warranty,...sublet].map(j=>[j.id,j])).values()];
    return {generatedAt:new Date().toISOString(),workInProgress,authorisations,parts,readyToInvoice,readyForCollection,warranty,sublet,held,
      counts:{workInProgress:workInProgress.length,authorisations:authorisations.length,parts:parts.length,readyToInvoice:readyToInvoice.length,readyForCollection:readyForCollection.length,warranty:warranty.length,sublet:sublet.length,held:held.length},
      values:{workInProgress:value(workInProgress),authorisations:value(authorisations),parts:value(parts),readyToInvoice:value(readyToInvoice),readyForCollection:value(readyForCollection),warranty:value(warranty),sublet:value(sublet),held:value(held)}};
  }
  window.WorkshopUnifiedQueues={isCompleted,isAwaitingAuthorisation,isWaitingParts,isReadyForCollection,isReadyToInvoice,isWorkInProgress,getQueue:queue,getSnapshot:snapshot,getJobFinancials:invoiceFor};
  window.getUnifiedWorkshopQueue=queue;window.getUnifiedWorkshopQueueSnapshot=snapshot;window.isUnifiedAwaitingAuthorisation=isAwaitingAuthorisation;
  document.dispatchEvent(new CustomEvent('wai1019:queues-ready'));
})();
