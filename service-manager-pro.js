/* WAI-107.0 — visual decoration only. No workflow or stored data changes. */
(function(){
  "use strict";

  function decorateCard(card){
    if(!card || card.dataset.smDecorated === "1") return;
    const text=(card.textContent||"").toLowerCase();
    card.classList.remove(
      "sm-status-waiting","sm-status-progress","sm-status-parts",
      "sm-status-authorisation","sm-status-quality","sm-status-complete",
      "sm-priority-urgent"
    );

    if(text.includes("waiting to start")) card.classList.add("sm-status-waiting");
    else if(text.includes("awaiting parts") || text.includes("waiting for parts")) card.classList.add("sm-status-parts");
    else if(text.includes("awaiting customer approval") || text.includes("authorisation") || text.includes("approval")) card.classList.add("sm-status-authorisation");
    else if(text.includes("quality check") || text.includes("quality review")) card.classList.add("sm-status-quality");
    else if(text.includes("ready for collection") || text.includes("completed") || text.includes("closed")) card.classList.add("sm-status-complete");
    else if(text.includes("in progress") || text.includes("diagnosing") || text.includes("repairing") || text.includes("road test") || text.includes("mot testing")) card.classList.add("sm-status-progress");
    else card.classList.add("sm-status-waiting");

    if(text.includes("urgent")) card.classList.add("sm-priority-urgent");
    card.dataset.smDecorated="1";
  }

  function decorate(){
    document.querySelectorAll("#managerScreen #managerJobs .job-card, #managerScreen #futureBookingsList .job-card")
      .forEach(function(card){
        card.dataset.smDecorated="0";
        decorateCard(card);
      });
  }

  function observe(id){
    const node=document.getElementById(id);
    if(!node) return;
    new MutationObserver(decorate).observe(node,{childList:true,subtree:true,characterData:true});
  }

  function init(){
    observe("managerJobs");
    observe("futureBookingsList");
    decorate();
    document.querySelectorAll('[data-screen="managerScreen"]').forEach(function(btn){
      btn.addEventListener("click",function(){setTimeout(decorate,0);});
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
