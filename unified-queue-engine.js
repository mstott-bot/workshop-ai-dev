/* Workshop AI WAI-096.5 — Unified Operational Queue Engine
   One source of truth for live workshop queues across Mission Control,
   Command Centre, Management Action, Performance Centre and Reports. */
(function(){
  'use strict';

  const text=value=>String(value??'').toLowerCase();
  const getJobs=()=>typeof jobs!=='undefined'&&Array.isArray(jobs)?jobs:[];

  function isCompleted(job){
    if(!job)return true;
    if(typeof completed==='function'){
      try{return completed(job);}catch(_){/* fallback below */}
    }
    const state=text(job.status||job.workflowStatus||job.techStatus);
    return Boolean(job.completedAt||job.finishedAt||state.includes('ready for collection')||state.includes('collected')||state.includes('closed')||state==='completed');
  }

  function isRetail(job){
    return text(job?.type||job?.jobType||'retail').includes('retail');
  }

  function currentState(job){
    return text([job?.status,job?.workflowStatus,job?.techStatus,job?.mot?.stage,job?.motStage].filter(Boolean).join(' '));
  }

  function isAwaitingAuthorisation(job){
    if(!job||isCompleted(job)||!isRetail(job))return false;
    const state=currentState(job);
    const explicit=job.awaitingAuthorisation===true||job.awaitingApproval===true;
    const liveState=(state.includes('awaiting')&&(state.includes('authorisation')||state.includes('authorization')||state.includes('approval')))
      ||state.includes('customer approval required');
    return explicit||liveState;
  }

  function isWaitingParts(job){
    if(!job||isCompleted(job))return false;
    const state=currentState(job);
    const openRequest=(job.partsRequests||[]).some(part=>!['delivered','fitted','returned','credit received','cancelled'].includes(text(part.status)));
    return state.includes('waiting for parts')||state.includes('awaiting parts')||openRequest;
  }

  function isReadyForCollection(job){
    if(!job)return false;
    const state=currentState(job);
    return !state.includes('collected')&&(state.includes('ready for collection')||Boolean(job.readyForCollectionAt));
  }

  function queue(name){
    const list=getJobs();
    switch(name){
      case 'authorisations': return list.filter(isAwaitingAuthorisation);
      case 'parts': return list.filter(isWaitingParts);
      case 'readyForCollection': return list.filter(isReadyForCollection);
      default: return [];
    }
  }

  function snapshot(){
    const authorisations=queue('authorisations');
    const parts=queue('parts');
    const readyForCollection=queue('readyForCollection');
    return {
      generatedAt:new Date().toISOString(),
      authorisations,
      parts,
      readyForCollection,
      counts:{
        authorisations:authorisations.length,
        parts:parts.length,
        readyForCollection:readyForCollection.length
      }
    };
  }

  window.WorkshopUnifiedQueues={
    isCompleted,
    isAwaitingAuthorisation,
    isWaitingParts,
    isReadyForCollection,
    getQueue:queue,
    getSnapshot:snapshot
  };
  window.getUnifiedWorkshopQueue=queue;
  window.getUnifiedWorkshopQueueSnapshot=snapshot;
  window.isUnifiedAwaitingAuthorisation=isAwaitingAuthorisation;
})();
