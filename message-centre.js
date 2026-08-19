(function(){
  const KEY="workshopAIMessagesV11529";
  const LEGACY_KEY="workshopAIMessagesV11528";
  const IDENTITY_KEY="workshopAIMessageIdentityV11528";
  let messages=[];
  let currentOther="";
  const $m=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function load(){try{const raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||"[]";messages=JSON.parse(raw);if(!Array.isArray(messages))messages=[];if(!localStorage.getItem(KEY)&&messages.length)localStorage.setItem(KEY,JSON.stringify(messages));}catch(e){messages=[];}}
  function save(){localStorage.setItem(KEY,JSON.stringify(messages));}
  function techs(){try{if(typeof getTechs==="function")return getTechs();}catch(e){};try{return JSON.parse(localStorage.getItem("workshopAITechnicians")||"[]");}catch(e){return[];}}
  function identities(){return ["Service Team",...techs().filter(Boolean).filter(x=>x!=="Service Team")];}
  function identity(){return $m("messageIdentity")?.value||localStorage.getItem(IDENTITY_KEY)||"Service Team";}
  function peopleFor(me){return me==="Service Team"?techs().filter(Boolean):["Service Team"];}
  function fmtTime(iso){const d=new Date(iso);return d.toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});}
  function relevant(m,me,other){return (m.from===me&&m.to===other)||(m.from===other&&m.to===me);}
  function unreadFor(me,other){return messages.filter(m=>m.to===me&&m.from===other&&!m.readAt).length;}
  function totalUnread(me){return messages.filter(m=>m.to===me&&!m.readAt).length;}
  function lastBetween(me,other){return messages.filter(m=>relevant(m,me,other)).sort((a,b)=>String(b.sentAt).localeCompare(String(a.sentAt)))[0];}
  function renderIdentity(){const el=$m("messageIdentity");if(!el)return;const saved=localStorage.getItem(IDENTITY_KEY)||"Service Team";el.innerHTML=identities().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");el.value=identities().includes(saved)?saved:"Service Team";}
  function renderRecipients(){const me=identity(),el=$m("messageRecipient");if(!el)return;const options=peopleFor(me);el.innerHTML=options.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");if(currentOther&&options.includes(currentOther))el.value=currentOther;else currentOther=el.value||options[0]||"";}
  function jobList(){
    try{if(typeof jobs!=="undefined"&&Array.isArray(jobs))return jobs;}catch(e){}
    if(Array.isArray(window.jobs))return window.jobs;
    try{return JSON.parse(localStorage.getItem("workshopAIJobsV27")||"[]");}catch(e){return [];}
  }
  function localToday(){
    const d=new Date(),off=d.getTimezoneOffset();
    return new Date(d.getTime()-off*60000).toISOString().slice(0,10);
  }
  function jobDay(j){
    try{if(typeof technicianDayKey==="function")return technicianDayKey(j);}catch(e){}
    return String(j.bookingDate||j.date||j.createdAt||"").slice(0,10);
  }
  function jobOptions(){
    const me=identity(),recipient=$m("messageRecipient")?.value||currentOther||"";
    let list=jobList().slice();
    const tech=me==="Service Team"&&recipient!=="Service Team"?recipient:(me!=="Service Team"?me:"");
    const today=localToday();
    if(tech)list=list.filter(j=>j.technician===tech);
    // Link-to-job is deliberately limited to this technician's jobs allocated for today.
    list=list.filter(j=>jobDay(j)===today);
    list=list.filter(j=>!String(j.status||"").includes("Collected")&&!String(j.status||"").includes("Closed"));
    list.sort((a,b)=>{
      const ac=!!a.completedAt,bc=!!b.completedAt;if(ac!==bc)return ac?1:-1;
      return String(a.reg||"").localeCompare(String(b.reg||""));
    });
    return list.map(j=>`<option value="${esc(j.id)}">${esc(j.reg||"No reg")} · ${esc(j.customer||"No customer")} · ${esc(j.workRequired||j.status||"")}</option>`).join("");
  }
  function renderJobs(){const el=$m("messageJobLink");if(!el)return;const keep=el.value;el.innerHTML='<option value="">No job linked</option>'+jobOptions();if([...el.options].some(o=>o.value===keep))el.value=keep;}
  function renderStats(){const me=identity();const incoming=messages.filter(m=>m.to===me).length,outgoing=messages.filter(m=>m.from===me).length,unread=totalUnread(me);if($m("messageCentreStats"))$m("messageCentreStats").innerHTML=`<div class="message-stat"><span>Unread</span><strong>${unread}</strong></div><div class="message-stat"><span>Received</span><strong>${incoming}</strong></div><div class="message-stat"><span>Sent</span><strong>${outgoing}</strong></div>`;const badge=$m("messageUnreadBadge");if(badge){badge.textContent=unread;badge.classList.toggle("hidden",!unread);}}
  function renderConversations(){const me=identity(),el=$m("messageConversationList");if(!el)return;const people=peopleFor(me).map(name=>({name,last:lastBetween(me,name),unread:unreadFor(me,name)}));people.sort((a,b)=>String(b.last?.sentAt||"").localeCompare(String(a.last?.sentAt||""))||a.name.localeCompare(b.name));el.innerHTML=people.length?people.map(p=>`<button class="message-conversation ${currentOther===p.name?'active':''}" type="button" data-message-person="${esc(p.name)}"><span class="message-avatar">${p.name==="Service Team"?"ST":esc(p.name.slice(0,2).toUpperCase())}</span><span class="message-conversation-copy"><span class="message-conversation-top"><strong>${esc(p.name)}</strong>${p.unread?`<span class="message-mini-badge">${p.unread}</span>`:""}</span><p>${p.last?esc(p.last.text):"No messages yet"}</p></span></button>`).join(""):'<div class="message-no-conversations">No technicians are currently configured.</div>';el.querySelectorAll("[data-message-person]").forEach(btn=>btn.addEventListener("click",()=>openConversation(btn.dataset.messagePerson)));
  }
  function markRead(me,other){let changed=false;messages.forEach(m=>{if(m.to===me&&m.from===other&&!m.readAt){m.readAt=new Date().toISOString();changed=true;}});if(changed)save();}
  function openConversation(other){const me=identity();currentOther=other;markRead(me,other);renderRecipients();const rec=$m("messageRecipient");if(rec)rec.value=other;renderConversations();renderThread();renderStats();}
  function renderThread(){const panel=$m("messageThreadPanel"),empty=$m("messageEmptyState");if(!panel||!empty)return;if(!currentOther){panel.classList.add("hidden");empty.classList.remove("hidden");return;}panel.classList.remove("hidden");empty.classList.add("hidden");$m("messageThreadTitle").textContent=currentOther;const me=identity();const thread=messages.filter(m=>relevant(m,me,currentOther)).sort((a,b)=>String(a.sentAt).localeCompare(String(b.sentAt)));const el=$m("messageThread");el.innerHTML=thread.length?thread.map(m=>{const j=jobList().find(x=>x.id===m.jobId);return `<div class="message-bubble ${m.from===me?'mine':'theirs'}">${j?`<span class="message-job-chip">🚗 ${esc(j.reg)} · ${esc(j.jobNo||'Job')}</span>`:""}<p>${esc(m.text)}</p><div class="message-meta"><span>${esc(m.from)}</span><span>•</span><span>${fmtTime(m.sentAt)}</span>${m.from===me?`<span>•</span><span>${m.readAt?'✓✓ Read':'✓ Sent'}</span>`:""}</div></div>`}).join(""):'<div class="message-no-conversations">No messages in this conversation yet.</div>';el.scrollTop=el.scrollHeight;}
  function send(){const me=identity(),to=$m("messageRecipient")?.value,text=$m("messageText")?.value.trim(),jobId=$m("messageJobLink")?.value||"";if(!to){alert("Please choose who to send the message to.");return;}if(!text){alert("Please type a message.");return;}messages.push({id:String(Date.now())+Math.random().toString(16).slice(2),from:me,to,text,jobId,sentAt:new Date().toISOString(),readAt:null});save();currentOther=to;$m("messageText").value="";renderAll();openConversation(to);}
  function newMessage(){renderRecipients();currentOther=$m("messageRecipient")?.value||"";renderThread();setTimeout(()=>$m("messageText")?.focus(),0);}
  function renderAll(){renderIdentity();renderRecipients();renderJobs();renderConversations();renderThread();renderStats();}
  function init(){load();renderIdentity();renderRecipients();renderJobs();renderStats();$m("messageIdentity")?.addEventListener("change",()=>{localStorage.setItem(IDENTITY_KEY,identity());currentOther="";renderAll();});$m("messageRecipient")?.addEventListener("change",()=>{currentOther=$m("messageRecipient").value;renderJobs();openConversation(currentOther);});$m("sendWorkshopMessage")?.addEventListener("click",send);$m("newMessageBtn")?.addEventListener("click",newMessage);$m("clearMessageJobLink")?.addEventListener("click",()=>{$m("messageJobLink").value="";});$m("messageText")?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")send();});document.querySelectorAll("[data-message-quick]").forEach(b=>b.addEventListener("click",()=>{$m("messageText").value=b.dataset.messageQuick;$m("messageText").focus();}));document.querySelector('[data-screen="messageCentreScreen"]')?.addEventListener("click",()=>setTimeout(renderAll,0));document.addEventListener("visibilitychange",()=>{if(!document.hidden){load();renderAll();}});window.addEventListener("storage",e=>{if(e.key===KEY){load();renderAll();}});window.renderWorkshopMessageCentre=renderAll;
    window.WorkshopMessages={
      reload(){load();},
      unreadForTechnician(name){load();return messages.filter(m=>m.to===name&&m.from==="Service Team"&&!m.readAt).length;},
      unreadForJob(name,jobId){load();return messages.filter(m=>m.to===name&&m.from==="Service Team"&&!m.readAt&&String(m.jobId||"")===String(jobId||"")).length;},
      latestUnreadForJob(name,jobId){load();return messages.filter(m=>m.to===name&&m.from==="Service Team"&&!m.readAt&&String(m.jobId||"")===String(jobId||"")).sort((a,b)=>String(b.sentAt).localeCompare(String(a.sentAt)))[0]||null;},
      openForTechnician(name,jobId){
        const id=$m("messageIdentity");
        if(id&&identities().includes(name)){id.value=name;localStorage.setItem(IDENTITY_KEY,name);}
        currentOther="Service Team";
        const tab=document.querySelector('[data-screen="messageCentreScreen"]');if(tab)tab.click();
        setTimeout(()=>{renderAll();openConversation("Service Team");if(jobId&&$m("messageJobLink"))$m("messageJobLink").value=jobId;},0);
      }
    };
    window.openWorkshopMessage=function(other,jobId,asIdentity){
      const id=$m("messageIdentity");
      if(asIdentity&&id&&identities().includes(asIdentity)){id.value=asIdentity;localStorage.setItem(IDENTITY_KEY,asIdentity);}
      const tab=document.querySelector('[data-screen="messageCentreScreen"]');if(tab)tab.click();
      setTimeout(()=>{renderAll();if(other)openConversation(other);renderJobs();if(jobId&&$m("messageJobLink"))$m("messageJobLink").value=jobId;},0);
    };}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
