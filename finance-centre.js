(function(){
'use strict';
const KEY='wai0991Invoices', SETTINGS_KEY='wai0991FinanceSettings', DELETED_KEY='wai1012DeletedJobInvoices', PART_CATALOGUE_KEY='wai1021PartCatalogue', INVENTORY_KEY='garageGurusWorkshopInventoryV1';
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(n)||0);
const numberValue=v=>{const n=typeof v==='string'?Number(v.replace(/,/g,'').trim()):Number(v);return Number.isFinite(n)?n:0};
const round=n=>Math.round((numberValue(n)+Number.EPSILON)*100)/100, nowISO=()=>new Date().toISOString(), today=()=>nowISO().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const targets=()=>read('pcaTargetsV11',read('pcaTargetsV10',{}));
const techNames=()=>read('workshopAITechnicians',['Jake','Gordon','James','Jimmy','Ross','Other']);
const defaults={company:'Workshop AI Garage',address:'Business address',vatNumber:'VAT number',bankDetails:'Bank details',paymentTerms:'Payment due on collection',invoicePrefix:'INV-',nextNumber:1001,defaultVat:20,retailRate:70,warrantyRate:40,internalRate:40,motSellPrice:54.85,motDurationHours:0.5,oil5w30CostPerLitre:0,technicianCosts:{}};
let settings={...defaults,...read(SETTINGS_KEY,{})};
function companySettings(){
  const live=window.WAICompanySettings?.get?.();
  if(live&&Object.keys(live).length)return live;
  try{
    return JSON.parse(localStorage.getItem('workshopAI.companySettings.v1')||'{}')||{};
  }catch{
    return {};
  }
}
function syncCompanyIntoFinance(){const c=companySettings();if(!Object.keys(c).length)return;settings.company=c.tradingName||c.legalName||settings.company;settings.address=c.tradingAddress||c.registeredAddress||settings.address;settings.vatNumber=c.vatNumber||settings.vatNumber;settings.paymentTerms=c.paymentTerms||settings.paymentTerms;const bank=[c.bankName,c.accountName,c.sortCode,c.accountNumber].filter(Boolean).join(' · ');if(bank)settings.bankDetails=bank}
syncCompanyIntoFinance();window.addEventListener('wai-company-settings-updated',()=>{syncCompanyIntoFinance();save();renderAll()});
settings.technicianCosts={...Object.fromEntries(techNames().map(n=>[n,0])),...(settings.technicianCosts||{})};
const t=targets(); if(!read(SETTINGS_KEY,null)){settings.retailRate=Number(t.retailRate||70);settings.warrantyRate=Number(t.warrantyRate||40);settings.internalRate=Number(t.internalRate||40)}
let invoices=read(KEY,[]), deletedJobInvoices=read(DELETED_KEY,[]), partCatalogue=read(PART_CATALOGUE_KEY,[]), currentId=null;
invoices.forEach(i=>{if(i.status==='Draft')i.status='Estimate';if(i.status==='Finalised')i.status='Invoice Issued';i.jobType=i.jobType||'Retail';i.lines=(i.lines||[]).map(migrateLine)});
function save(){rebuildPartCatalogue();localStorage.setItem(KEY,JSON.stringify(invoices));localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));localStorage.setItem(DELETED_KEY,JSON.stringify(deletedJobInvoices));localStorage.setItem(PART_CATALOGUE_KEY,JSON.stringify(partCatalogue));window.dispatchEvent(new CustomEvent('wai-finance-updated',{detail:getRevenueSummary()}))}
function uid(){return 'inv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)}
function audit(action,detail=''){return{at:nowISO(),user:'Service Manager',action,detail}}
function rateFor(type){return Number(type==='Warranty'?settings.warrantyRate:type==='Internal'?settings.internalRate:settings.retailRate)||0}
function techCost(name){return Number(settings.technicianCosts?.[name]||0)}
function migrateLine(l){const type=l.type||'Parts';const defaultUnit=type==='Labour'?'hr':type==='Oil'?'litre':type==='MOT'?'test':'';return{...l,id:l.id||uid(),type,partNumber:l.partNumber||l.partNo||'',description:l.description||'',qty:Number(l.qty??1),unit:l.unit==='each'&&type==='Parts'?'':(l.unit??defaultUnit),cost:Number(l.cost||0),sell:Number(l.sell||0),discountType:l.discountType||'£',discount:Number(l.discount||0),vat:l.vat??settings.defaultVat,customerNote:l.customerNote||'',internalNote:l.internalNote||''}}
function blankLine(type='Parts',inv){const line=migrateLine({type,qty:1,unit:type==='Labour'?'hr':type==='Oil'?'litre':type==='MOT'?'test':''});if(type==='Oil')line.description='5W30 Oil';applyAutoPricing(line,inv,true);return line}
function normPartNumber(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
function partDate(inv){return String(inv?.date||inv?.createdAt||today()).slice(0,10)}
function daysAgoISO(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-days);return d.toISOString().slice(0,10)}
function partObservations(days=240){
  const from=daysAgoISO(days), rows=[];
  invoices.forEach(inv=>(inv.lines||[]).forEach(l=>{
    if(l.type!=='Parts'||!normPartNumber(l.partNumber)||partDate(inv)<from)return;
    rows.push({partNumber:normPartNumber(l.partNumber),description:l.description||'',cost:numberValue(l.cost),sell:numberValue(l.sell),date:partDate(inv),invoice:inv.number||'',registration:inv.registration||'',supplier:l.supplier||inv.supplier||'',customer:inv.customer||'',technician:inv.technician||'',source:l.sourceType||'manual'});
  }));
  workshopJobs().forEach(job=>(job.partsRequests||[]).forEach(p=>{
    const pn=normPartNumber(p.partNumber||p.partNo),date=String(p.orderedAt||p.receivedAt||p.createdAt||job.bookingDate||job.createdAt||today()).slice(0,10);
    if(!pn||date<from)return;
    rows.push({partNumber:pn,description:p.description||p.text||'',cost:numberValue(p.cost??p.costPrice),sell:numberValue(p.sell??p.sellPrice??p.customerPrice??p.price),date,invoice:'Parts order',registration:job.reg||'',supplier:p.supplier||p.supplierName||'',customer:job.customer||'',technician:job.technician||'',source:'order'});
  }));
  return rows.sort((a,b)=>a.date.localeCompare(b.date));
}
function rebuildPartCatalogue(){
  const map=new Map((partCatalogue||[]).map(x=>[normPartNumber(x.partNumber),{...x,partNumber:normPartNumber(x.partNumber)}]));
  partObservations(3650).forEach(o=>{const old=map.get(o.partNumber)||{partNumber:o.partNumber,description:'',lastCost:0,lastSell:0,lastSeen:''};if(o.date>=String(old.lastSeen||'')){old.description=o.description||old.description;old.lastCost=o.cost||old.lastCost;old.lastSell=o.sell||old.lastSell;old.lastSeen=o.date}map.set(o.partNumber,old)});
  partCatalogue=[...map.values()].filter(x=>x.partNumber).sort((a,b)=>a.partNumber.localeCompare(b.partNumber));
}
function findKnownPart(v){const pn=normPartNumber(v);return partCatalogue.find(x=>normPartNumber(x.partNumber)===pn)||null}
function previousPartCost(partNumber,currentLine){
  const pn=normPartNumber(partNumber);if(!pn)return null;
  const rows=partObservations(240).filter(x=>x.partNumber===pn&&numberValue(x.cost)>0);
  if(!rows.length)return null;
  const latest=rows[rows.length-1];
  if(currentLine&&numberValue(currentLine.cost)===latest.cost&&rows.length>1)return rows[rows.length-2];
  return latest;
}
function partCostWarning(line){
  if(line.type!=='Parts'||!normPartNumber(line.partNumber)||!numberValue(line.cost))return '';
  const prev=previousPartCost(line.partNumber,line);if(!prev||round(prev.cost)===round(line.cost))return '';
  const diff=round(numberValue(line.cost)-prev.cost),pct=prev.cost?round(diff/prev.cost*100):0;
  return `<div class="part-cost-alert ${diff>0?'increase':'decrease'}">${diff>0?'▲ Cost increase':'▼ Cost decrease'}: was ${money(prev.cost)}, now ${money(line.cost)} (${diff>0?'+':''}${pct}%)</div>`;
}
function applyKnownPart(line){const known=findKnownPart(line.partNumber);if(!known)return false;line.partNumber=known.partNumber;if(!line.description)line.description=known.description||'';if(!numberValue(line.cost))line.cost=numberValue(known.lastCost);if(!numberValue(line.sell))line.sell=numberValue(known.lastSell);return true}
function applyAutoPricing(line,inv,force=false){if(!inv)return;const c=techCost(inv.technician);if(line.type==='Labour'){if(force||!Number(line.sell))line.sell=rateFor(inv.jobType);line.cost=c;line.unit='hr'}else if(line.type==='MOT'){if(force||!Number(line.sell))line.sell=Number(settings.motSellPrice)||0;line.cost=round(c*(Number(settings.motDurationHours)||0.5));line.unit='test';line.qty=1}else if(line.type==='Oil'){line.unit='litre';if(/5\s*w\s*30/i.test(String(line.description||''))&&(force||!Number(line.cost)))line.cost=Number(settings.oil5w30CostPerLitre)||0}else if(line.type==='Parts'&&line.unit==='each'){line.unit=''}}
function newInvoice(){const inv={id:uid(),number:settings.invoicePrefix+String(settings.nextNumber++).padStart(5,'0'),status:'Estimate',jobType:'Retail',date:today(),jobNumber:'',customer:'',address:'',phone:'',email:'',registration:'',makeModel:'',mileage:'',technician:'',advisor:'',paymentTerms:settings.paymentTerms,customerNotes:'',internalNotes:'',paidAmount:0,lines:[],audit:[audit('Estimate created')],createdAt:nowISO(),updatedAt:nowISO()};inv.lines=[blankLine('Labour',inv),blankLine('Parts',inv)];invoices.unshift(inv);currentId=inv.id;save();return inv}
function calcLine(l){
  const qty=Math.max(0,numberValue(l.qty));
  const unitCost=Math.max(0,numberValue(l.cost));
  const unitSell=Math.max(0,numberValue(l.sell));
  const gross=round(qty*unitSell);
  let discount=l.discountType==='%'?gross*Math.max(0,numberValue(l.discount))/100:Math.max(0,numberValue(l.discount));
  discount=round(Math.min(discount,gross));
  const net=round(gross-discount);
  const vatRate=Math.max(0,numberValue(l.vat));
  const vat=round(net*vatRate/100);
  const lineCost=round(qty*unitCost);
  const gp=round(net-lineCost);
  return{gross,net,vat,total:round(net+vat),cost:lineCost,gp,discount,gpPct:net?round(gp/net*100):0};
}
function totals(inv){
  const result=(inv.lines||[]).reduce((a,l)=>{const c=calcLine(l);a.cost=round(a.cost+c.cost);a.net=round(a.net+c.net);a.discount=round(a.discount+c.discount);a.vat=round(a.vat+c.vat);a.total=round(a.total+c.total);a.gp=round(a.gp+c.gp);a.categories[l.type]=round((a.categories[l.type]||0)+c.net);return a},{cost:0,net:0,discount:0,vat:0,total:0,gp:0,categories:{}});
  result.gp=round(result.net-result.cost);
  result.total=round(result.net+result.vat);
  return result;
}

function addTotals(a,x){a.cost=round(a.cost+x.cost);a.net=round(a.net+x.net);a.discount=round(a.discount+x.discount);a.vat=round(a.vat+x.vat);a.total=round(a.total+x.total);a.gp=round(a.gp+x.gp);Object.entries(x.categories||{}).forEach(([k,v])=>a.categories[k]=round((a.categories[k]||0)+v));a.documents++;return a}
function emptyRevenueBucket(){return{cost:0,net:0,discount:0,vat:0,total:0,gp:0,gpPct:0,documents:0,categories:{}}}
function finishRevenueBucket(a){a.gp=round(a.net-a.cost);a.total=round(a.net+a.vat);a.gpPct=a.net?round(a.gp/a.net*100):0;return a}
function getRevenueSummary(){
  const day=today();
  const liveStatuses=['Estimate','Authorised','Invoice Ready'];
  const live=emptyRevenueBucket(), liveToday=emptyRevenueBucket(), issuedToday=emptyRevenueBucket(), creditsToday=emptyRevenueBucket();
  invoices.forEach(inv=>{
    const x=totals(inv);
    if(liveStatuses.includes(inv.status)){addTotals(live,x);if(inv.date===day)addTotals(liveToday,x)}
    const audit=Array.isArray(inv.audit)?inv.audit:[];
    const issuedTodayEvent=audit.some(a=>String(a.action||'').toLowerCase()==='invoice issued'&&String(a.at||'').slice(0,10)===day);
    const creditedTodayEvent=audit.some(a=>a.action==='Credit note created'&&String(a.at||'').slice(0,10)===day);
    if(issuedTodayEvent)addTotals(issuedToday,x);
    if(creditedTodayEvent)addTotals(creditsToday,x);
  });
  finishRevenueBucket(live);finishRevenueBucket(liveToday);finishRevenueBucket(issuedToday);finishRevenueBucket(creditsToday);
  const outlook=emptyRevenueBucket();
  [liveToday,issuedToday].forEach(x=>addTotals(outlook,x));finishRevenueBucket(outlook);
  return{
    generatedAt:nowISO(),
    live,
    liveToday,
    issuedToday,
    creditsToday,
    outlook,
    actualRevenueToday:round(issuedToday.net-creditsToday.net),
    netIssuedToday:round(issuedToday.net-creditsToday.net)
  };
}
function getMonthlyPerformanceSummary(monthKey=today().slice(0,7)){
  const month=String(monthKey||today().slice(0,7)).slice(0,7);
  let revenueIssued=0,revenueCredited=0,labourHoursIssued=0,labourHoursCredited=0,invoicesIssued=0,creditsRaised=0;

  invoices.forEach(inv=>{
    const audit=Array.isArray(inv.audit)?inv.audit:[];
    const issueEvents=audit.filter(a=>String(a.action||'').toLowerCase()==='invoice issued'&&String(a.at||'').slice(0,7)===month);
    const creditEvents=audit.filter(a=>String(a.action||'').toLowerCase()==='credit note created'&&String(a.at||'').slice(0,7)===month);
    const invTotals=totals(inv);
    const labourHours=(inv.lines||[])
      .filter(l=>String(l.type||'').toLowerCase()==='labour')
      .reduce((sum,l)=>sum+Math.max(0,numberValue(l.qty)),0);

    if(issueEvents.length){
      revenueIssued=round(revenueIssued+invTotals.net);
      labourHoursIssued=round(labourHoursIssued+labourHours);
      invoicesIssued+=1;
    }
    if(creditEvents.length){
      revenueCredited=round(revenueCredited+invTotals.net);
      labourHoursCredited=round(labourHoursCredited+labourHours);
      creditsRaised+=1;
    }
  });

  return{
    month,
    generatedAt:nowISO(),
    revenueIssued:round(revenueIssued),
    revenueCredited:round(revenueCredited),
    actualRevenue:round(revenueIssued-revenueCredited),
    labourHoursIssued:round(labourHoursIssued),
    labourHoursCredited:round(labourHoursCredited),
    labourHoursSold:round(labourHoursIssued-labourHoursCredited),
    invoicesIssued,
    creditsRaised
  };
}

function invoiceReconciles(inv){const x=totals(inv);return Math.abs(round(x.net+x.vat)-x.total)<0.01&&Math.abs(round(x.net-x.cost)-x.gp)<0.01;}
function statusClass(s){return 'status-'+String(s).toLowerCase().replace(/\s+/g,'-')}
function getCurrent(){return invoices.find(x=>x.id===currentId)}
function inventoryDb(){return read(INVENTORY_KEY,{parts:[],tyres:[],oil:[],movements:[]})}
function saveInventoryDb(db){localStorage.setItem(INVENTORY_KEY,JSON.stringify(db));window.dispatchEvent(new CustomEvent('garage-inventory-updated',{detail:db}))}
function inventoryBucket(type){return type==='tyre'?'tyres':type==='oil'?'oil':'parts'}
function inventoryAvailable(item,type){return Number(type==='oil'?item.litres:item.qty)||0}
function inventorySetAvailable(item,type,value){if(type==='oil')item.litres=round(value);else item.qty=round(value)}
function inventoryLineType(type){return type==='oil'?'Oil':'Parts'}
function commitInvoiceInventory(inv){
  const db=inventoryDb(); const pending=(inv.lines||[]).filter(l=>l.inventoryId&&!l.inventoryCommitted);
  for(const l of pending){const bucket=inventoryBucket(l.inventoryType);const item=(db[bucket]||[]).find(x=>x.id===l.inventoryId);if(!item)return {ok:false,message:`Stock item no longer exists: ${l.description||l.partNumber||'item'}`};const need=Number(l.qty)||0;const have=inventoryAvailable(item,l.inventoryType);if(need<=0)continue;if(have+1e-9<need)return {ok:false,message:`Not enough stock for ${l.description||l.partNumber||'item'}. In stock: ${have}, required: ${need}.`}}
  pending.forEach(l=>{const bucket=inventoryBucket(l.inventoryType);const item=(db[bucket]||[]).find(x=>x.id===l.inventoryId);const need=Number(l.qty)||0;inventorySetAvailable(item,l.inventoryType,inventoryAvailable(item,l.inventoryType)-need);l.inventoryCommitted=true;db.movements.unshift({id:uid(),at:nowISO(),action:'Invoice issued',invoiceId:inv.id,invoiceNumber:inv.number,inventoryId:l.inventoryId,inventoryType:l.inventoryType,description:l.description,qty:-need})});saveInventoryDb(db);return {ok:true}}
function restoreInvoiceInventory(inv,reason='Invoice reopened/credited'){
 const db=inventoryDb();let changed=false;(inv.lines||[]).filter(l=>l.inventoryId&&l.inventoryCommitted).forEach(l=>{const bucket=inventoryBucket(l.inventoryType);const item=(db[bucket]||[]).find(x=>x.id===l.inventoryId);if(!item)return;const qty=Number(l.qty)||0;inventorySetAvailable(item,l.inventoryType,inventoryAvailable(item,l.inventoryType)+qty);l.inventoryCommitted=false;db.movements.unshift({id:uid(),at:nowISO(),action:reason,invoiceId:inv.id,invoiceNumber:inv.number,inventoryId:l.inventoryId,inventoryType:l.inventoryType,description:l.description,qty:qty});changed=true});if(changed)saveInventoryDb(db)
}
function restoreInventoryLine(inv,line,reason='Stock line removed'){
  if(!line?.inventoryId||!line.inventoryCommitted)return;
  const db=inventoryDb(),bucket=inventoryBucket(line.inventoryType),item=(db[bucket]||[]).find(x=>x.id===line.inventoryId);
  if(!item)return;
  const qty=Math.max(0,Number(line.qty)||0);
  inventorySetAvailable(item,line.inventoryType,inventoryAvailable(item,line.inventoryType)+qty);
  line.inventoryCommitted=false;
  db.movements.unshift({id:uid(),at:nowISO(),action:reason,invoiceId:inv.id,invoiceNumber:inv.number,inventoryId:line.inventoryId,inventoryType:line.inventoryType,description:line.description,qty:qty});
  saveInventoryDb(db);
}
function addInventoryLineToInvoice(invoiceId,item,type,qty){
  const inv=invoices.find(i=>i.id===invoiceId);
  if(!inv)return {ok:false,message:'Invoice not found.'};
  if(inv.status!=='Estimate')return {ok:false,message:'Stock can only be added to an estimate before it is issued.'};
  qty=Number(qty)||0;
  if(qty<=0)return {ok:false,message:'Enter a quantity greater than zero.'};

  const db=inventoryDb(),bucket=inventoryBucket(type),stockItem=(db[bucket]||[]).find(x=>x.id===item.id);
  if(!stockItem)return {ok:false,message:'That stock item no longer exists.'};
  const available=inventoryAvailable(stockItem,type);
  if(available+1e-9<qty)return {ok:false,message:`Not enough stock. In stock: ${available}, required: ${qty}.`};

  const line=blankLine(inventoryLineType(type),inv);
  line.inventoryId=stockItem.id;
  line.inventoryType=type;
  line.inventoryCommitted=true;
  line.inventoryDeductedAt=nowISO();
  line.partNumber=type==='part'?(stockItem.partNumber||''):type==='tyre'?(stockItem.size||''):'';
  line.description=type==='part'?(stockItem.description||stockItem.partNumber||'Part'):type==='tyre'?([stockItem.brand,stockItem.pattern,stockItem.size].filter(Boolean).join(' ')||'Tyre'):([stockItem.brand,stockItem.grade,stockItem.spec].filter(Boolean).join(' ')||'Oil');if(type==='oil')line.oilGradeEditable=true;
  line.qty=qty;
  line.unit=type==='oil'?'litre':type==='tyre'?'tyre':'each';
  line.cost=Number(type==='oil'?stockItem.costPerLitre:stockItem.cost)||0;
  line.sell=Number(type==='oil'?stockItem.sellPerLitre:stockItem.sell)||0;

  inventorySetAvailable(stockItem,type,available-qty);
  db.movements.unshift({id:uid(),at:nowISO(),action:'Allocated to invoice estimate',invoiceId:inv.id,invoiceNumber:inv.number,inventoryId:line.inventoryId,inventoryType:type,description:line.description,qty:-qty});
  saveInventoryDb(db);

  inv.lines.push(line);
  inv.audit.push(audit('Stock item added and deducted',`${line.description} × ${qty}`));
  save();
  return {ok:true,invoiceNumber:inv.number,remaining:inventoryAvailable(stockItem,type)};
}
function init(){if(!document.getElementById('financeCentreScreen'))return;bindStatic();syncAllJobs();save();renderAll()}
function bindStatic(){document.getElementById('financeNewInvoiceBtn')?.addEventListener('click',()=>{newInvoice();showPanel('invoiceBuilder');renderAll()});document.querySelectorAll('[data-finance-panel]').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.financePanel)));document.getElementById('financeSearch')?.addEventListener('input',renderRegister);document.getElementById('financeStatusFilter')?.addEventListener('change',renderRegister);document.getElementById('financeSettingsBtn')?.addEventListener('click',()=>showPanel('financeSettings'))}
function showPanel(id){document.querySelectorAll('.finance-panel').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-finance-panel]').forEach(b=>b.classList.toggle('active',b.dataset.financePanel===id));if(id==='financeDashboard')renderDashboard();if(id==='invoiceRegister')renderRegister();if(id==='invoiceBuilder')renderBuilder();if(id==='partsDifferenceReport')renderPartsDifferenceReport();if(id==='financeSettings')renderSettings()}
function renderAll(){renderDashboard();renderRegister();renderBuilder();renderPartsDifferenceReport();renderSettings()}
function registerRow(i){const x=totals(i);return `<tr class="invoice-register-row" tabindex="0" data-open-invoice="${i.id}"><td><strong>${esc(i.number)}</strong><br><small>${esc(i.date)}</small></td><td>${esc(i.customer||'Not entered')}<br><small>${esc(i.registration)} · ${esc(i.jobType||'Retail')}</small></td><td>${esc(i.technician||'—')}</td><td>${money(x.net)}</td><td>${money(x.total)}</td><td><span class="invoice-status ${statusClass(i.status)}">${esc(i.status)}</span>${i.status==='Estimate'?`<button class="row-delete-estimate" data-delete-estimate="${i.id}">Delete</button>`:''}</td></tr>`}
function bindRows(scope){scope.querySelectorAll('[data-open-invoice]').forEach(r=>{r.onclick=e=>{if(e.target.closest('[data-delete-estimate]'))return;currentId=r.dataset.openInvoice;showPanel('invoiceBuilder')};r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();currentId=r.dataset.openInvoice;showPanel('invoiceBuilder')}}});scope.querySelectorAll('[data-delete-estimate]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteEstimate(b.dataset.deleteEstimate)})}
function renderDashboard(){const host=document.getElementById('financeKpis');if(!host)return;const day=invoices.filter(i=>i.date===today()&&i.status!=='Credited');const d=day.reduce((a,i)=>{const x=totals(i);a.sales+=x.net;a.cost+=x.cost;a.gp+=x.gp;a.vat+=x.vat;a.jobs++;if(i.status==='Paid')a.paid+=x.total;return a},{sales:0,cost:0,gp:0,vat:0,paid:0,jobs:0});const gpPct=d.sales?d.gp/d.sales*100:0;host.innerHTML=[['Sales ex VAT',money(d.sales)],['Cost of sales',money(d.cost)],['Gross profit',money(d.gp)],['Gross profit %',gpPct.toFixed(1)+'%'],['VAT',money(d.vat)],['Paid today',money(d.paid)],['Documents',d.jobs]].map(x=>`<div class="finance-kpi"><div class="label">${x[0]}</div><div class="value">${x[1]}</div></div>`).join('');let daily=document.getElementById('financeDailyProfit');if(!daily){daily=document.createElement('div');daily.id='financeDailyProfit';daily.className='finance-card daily-profit-card';host.after(daily)}daily.innerHTML=`<h3>Daily Profit Report — ${new Date().toLocaleDateString('en-GB')}</h3><div class="daily-profit-grid"><div><span>Labour sales</span><strong>${money(day.reduce((s,i)=>s+(totals(i).categories.Labour||0),0))}</strong></div><div><span>MOT sales</span><strong>${money(day.reduce((s,i)=>s+(totals(i).categories.MOT||0),0))}</strong></div><div><span>Parts & other sales</span><strong>${money(d.sales-day.reduce((s,i)=>s+(totals(i).categories.Labour||0)+(totals(i).categories.MOT||0),0))}</strong></div><div><span>Technician & item costs</span><strong>${money(d.cost)}</strong></div><div class="profit-highlight"><span>Gross profit ex VAT</span><strong>${money(d.gp)}</strong></div></div>`;const recent=document.getElementById('financeRecentInvoices');recent.innerHTML=invoices.map(registerRow).join('')||'<tr><td colspan="6" class="finance-empty">No estimates or invoices yet.</td></tr>';bindRows(recent)}
function renderRegister(){const body=document.getElementById('invoiceRegisterBody');if(!body)return;const q=(document.getElementById('financeSearch')?.value||'').toLowerCase(),st=document.getElementById('financeStatusFilter')?.value||'all';const list=invoices.filter(i=>(st==='all'||i.status===st)&&[i.number,i.customer,i.registration,i.technician,i.jobNumber,i.jobType].join(' ').toLowerCase().includes(q));body.innerHTML=list.map(registerRow).join('')||'<tr><td colspan="6" class="finance-empty">No matching estimates or invoices.</td></tr>';bindRows(body)}
const field=(label,key,val,disabled=false,type='text',cls='')=>`<label class="${cls}">${label}<input data-inv-field="${key}" type="${type}" value="${esc(val)}" ${disabled?'disabled':''}></label>`;
const select=(label,key,val,opts,disabled=false)=>`<label>${label}<select data-inv-field="${key}" ${disabled?'disabled':''}>${opts.map(o=>`<option ${o===val?'selected':''}>${o}</option>`).join('')}</select></label>`;
const area=(label,key,val,cls='')=>`<label class="${cls}">${label}<textarea data-inv-field="${key}">${esc(val)}</textarea></label>`;
function lineRow(l,n,locked){const c=calcLine(l),dis=locked?'disabled':'',auto=['Labour','MOT'].includes(l.type),partCell=l.type==='Parts'?`<div class="part-number-cell"><input data-lf="partNumber" list="knownPartNumbers" value="${esc(l.partNumber)}" placeholder="Part number" ${dis}>${partCostWarning(l)}</div>`:'<span class="muted">—</span>';return `<tr data-line="${n}"><td><select data-lf="type" ${dis}>${['Labour','Parts','Oil','Consumables','MOT','Sublet','Other'].map(o=>`<option ${o===l.type?'selected':''}>${o}</option>`).join('')}</select></td><td>${partCell}</td><td><input class="desc" data-lf="description" value="${esc(l.description)}" ${dis}></td><td><input type="number" min="0" step="0.01" data-lf="qty" value="${l.qty}" ${dis}></td><td><input data-lf="unit" value="${esc(l.unit)}" ${dis}></td><td><input type="number" min="0" step="0.01" data-lf="cost" value="${l.cost}" ${dis||auto?'disabled':''} title="${auto?'Automatically set from Finance Settings':''}"></td><td><input type="number" min="0" step="0.01" data-lf="sell" value="${l.sell}" ${dis}></td><td><div class="discount-cell"><select data-lf="discountType" ${dis}><option ${l.discountType==='£'?'selected':''}>£</option><option ${l.discountType==='%'?'selected':''}>%</option></select><input type="number" min="0" step="0.01" data-lf="discount" value="${l.discount}" ${dis}></div></td><td><select class="vat-select" data-lf="vat" ${dis}><option value="20" ${String(l.vat)==='20'?'selected':''}>20%</option><option value="5" ${String(l.vat)==='5'?'selected':''}>5%</option><option value="0" ${String(l.vat)==='0'?'selected':''}>0%</option></select></td><td class="calculated-cell line-net" data-line-net>${money(c.net)}</td><td class="calculated-cell invoice-line-profit" data-line-gp>${money(c.gp)}<br><small>${c.gpPct}%</small></td><td><button class="finance-btn danger remove-line" ${dis}>×</button></td></tr>`}
function renderBuilder(){const host=document.getElementById('invoiceBuilderHost'),inv=getCurrent();if(!host)return;if(!inv){host.innerHTML='<div class="finance-card finance-empty"><h3>No estimate selected</h3><p>Create a new estimate or open one from the register.</p></div>';return}inv.lines.forEach(l=>applyAutoPricing(l,inv));const locked=inv.status!=='Estimate',x=totals(inv);host.innerHTML=`<div class="finance-card"><div class="invoice-workflow-header"><div><span>Status</span><strong class="invoice-status ${statusClass(inv.status)}">${esc(inv.status)}</strong></div><div><span>Job type</span><strong>${esc(inv.jobType)}</strong></div><div><span>Default labour rate</span><strong>${money(rateFor(inv.jobType))}/hr</strong></div><div><span>Technician cost</span><strong>${money(techCost(inv.technician))}/hr</strong></div></div>${locked?`<div class="finance-lock">This invoice is ${esc(inv.status)} and is locked.</div>`:'<div class="finance-note">Retail, Internal or Warranty selects the default labour rate. You can still change the sell rate or apply a £ / % adjustment for this estimate. Oil defaults to 5W30 for convenience, but the grade, quantity, cost and sell price can all be edited before the invoice is issued.</div>'}<div class="invoice-form">${field('Invoice number','number',inv.number,true)}${field('Date','date',inv.date,false,'date')}${field('Job number','jobNumber',inv.jobNumber)}${select('Job type','jobType',inv.jobType,['Retail','Internal','Warranty'],locked)}${field('Customer','customer',inv.customer,false,'text','span-2')}${field('Telephone','phone',inv.phone)}${field('Email','email',inv.email)}${field('Address','address',inv.address,false,'text','span-2')}${field('Registration','registration',inv.registration)}${field('Make / model','makeModel',inv.makeModel)}${field('Mileage','mileage',inv.mileage)}${select('Technician','technician',inv.technician||'', ['',...techNames()],locked)}${field('Service advisor','advisor',inv.advisor)}${locked?field('Amount paid','paidAmount',inv.paidAmount,false,'number'):''}${area('Customer notes','customerNotes',inv.customerNotes,'span-2')}${area('Internal notes','internalNotes',inv.internalNotes,'span-2')}</div><div class="quick-invoice-bar"><strong>Quick add</strong>${['Labour','Parts','Oil','MOT','Consumables','Sublet','Other'].map(v=>`<button class="finance-btn quick" type="button" data-quick-type="${v}" ${locked?'disabled':''}>+ ${v==='Parts'?'Part':v}</button>`).join('')}<span>New line opens instantly</span></div><datalist id="knownPartNumbers">${partCatalogue.map(p=>`<option value="${esc(p.partNumber)}">${esc(p.description||'')} · last ${money(p.lastCost)}</option>`).join('')}</datalist><div class="invoice-table-wrap"><table class="invoice-table"><thead><tr><th>Type</th><th>Part number</th><th>Description</th><th>Qty</th><th>Unit</th><th>Cost ex VAT</th><th>Sell ex VAT</th><th>Discount</th><th>VAT</th><th>Net</th><th>GP</th><th></th></tr></thead><tbody>${inv.lines.map((l,n)=>lineRow(l,n,locked)).join('')}</tbody></table></div><div class="invoice-summary"><div><span>Cost ex VAT</span><strong data-summary-cost>${money(x.cost)}</strong></div><div><span>Sales ex VAT</span><strong data-summary-net>${money(x.net)}</strong></div><div><span>VAT</span><strong data-summary-vat>${money(x.vat)}</strong></div><div class="profit"><span>Gross profit</span><strong data-summary-gp>${money(x.gp)}</strong></div><div class="grand"><span>Customer total</span><strong data-summary-total>${money(x.total)}</strong></div></div><div class="invoice-footer-actions">${!locked?'<button class="finance-btn primary" id="saveInvoiceBtn">Save estimate</button><button class="finance-btn success" id="issueInvoiceBtn">Issue invoice</button><button class="finance-btn danger" id="deleteEstimateBtn">Delete estimate</button>':''}<button class="finance-btn secondary" id="printInvoiceBtn">Print</button>${locked&&!['Paid','Credited'].includes(inv.status)?'<button class="finance-btn warn" id="reopenInvoiceBtn">Reopen as estimate</button>':''}${['Invoice Issued','Part Paid','Paid'].includes(inv.status)?'<button class="finance-btn danger" id="creditInvoiceBtn">Create credit note</button>':''}${['Invoice Issued','Part Paid'].includes(inv.status)?'<button class="finance-btn success" id="markPaidBtn">Mark paid</button>':''}</div></div>`;bindBuilder(inv,locked)}
function refreshInvoiceSummary(inv){const x=totals(inv);const map={cost:x.cost,net:x.net,vat:x.vat,gp:x.gp,total:x.total};Object.entries(map).forEach(([k,v])=>{const el=document.querySelector(`[data-summary-${k}]`);if(el)el.textContent=money(v)})}
function refreshAllLineCalculations(inv){
  document.querySelectorAll('[data-line]').forEach(row=>{
    const line=inv.lines[numberValue(row.dataset.line)];if(!line)return;
    const c=calcLine(line);
    const netCell=row.querySelector('[data-line-net]');
    const gpCell=row.querySelector('[data-line-gp]');
    if(netCell)netCell.textContent=money(c.net);
    if(gpCell)gpCell.innerHTML=`${money(c.gp)}<br><small>${c.gpPct}%</small>`;
  });
  refreshInvoiceSummary(inv);
}
function bindBuilder(inv,locked){document.querySelectorAll('[data-inv-field]').forEach(el=>{el.onchange=el.oninput=()=>{if(locked)return;const k=el.dataset.invField,old=inv[k];inv[k]=el.type==='number'?Number(el.value):el.value;if(k==='jobType'||k==='technician'){inv.lines.forEach(l=>applyAutoPricing(l,inv,k==='jobType'));inv.audit.push(audit(k==='jobType'?'Job type changed':'Technician changed',`${old||'—'} → ${inv[k]||'—'}`));save();renderBuilder()}else save()}});document.querySelectorAll('[data-line]').forEach(row=>row.querySelectorAll('[data-lf]').forEach(el=>{const commit=()=>{if(locked)return;const l=inv.lines[Number(row.dataset.line)],k=el.dataset.lf;l[k]=['qty','cost','sell','discount','vat'].includes(k)?Number(el.value):el.value;if(k==='partNumber'){l.partNumber=normPartNumber(l.partNumber);const matched=applyKnownPart(l);if(matched)inv.audit.push(audit('Recognised part added',l.partNumber));}if(k==='type')applyAutoPricing(l,inv,true);save();if(k==='type'||k==='partNumber'||(k==='cost'&&l.type==='Parts'))renderBuilder();else refreshAllLineCalculations(inv)};el.oninput=commit;el.onchange=commit}));document.querySelectorAll('[data-quick-type]').forEach(b=>b.onclick=()=>{
  const type=b.dataset.quickType;
  if(type==='Parts'||type==='Oil'){
    const isStock=confirm(`Is this ${type==='Parts'?'part':'oil'} being taken from workshop stock?\n\nOK = Yes, select it from ${type==='Parts'?'Parts Stock':'Oil Stock'}\nCancel = No, add a normal invoice line`);
    if(isStock){
      sessionStorage.setItem('garageGurusInventoryTargetInvoice',inv.id);
      sessionStorage.setItem('garageGurusInventoryReturnToInvoice','1');
      if(typeof window.show==='function')window.show(type==='Parts'?'partsStockScreen':'oilStockScreen');
      setTimeout(()=>window.GarageGurusInventory?.render?.(type==='Parts'?'part':'oil'),50);
      return;
    }
  }
  const l=blankLine(type,inv);
  if(l.type==='Labour')l.description='Workshop labour';
  if(l.type==='MOT')l.description='MOT test';
  if(l.type==='Oil'){l.description='5W30 Oil';l.cost=Number(settings.oil5w30CostPerLitre)||0;l.unit='litre';l.oilGradeEditable=true}
  inv.lines.push(l);
  inv.audit.push(audit('Quick add line',l.type));
  save();renderBuilder();
  requestAnimationFrame(()=>document.querySelector('[data-line]:last-child [data-lf="description"]')?.focus());
});document.querySelectorAll('.remove-line').forEach((b,n)=>b.onclick=()=>{
  const line=inv.lines[n];
  if(line?.inventoryId&&line.inventoryCommitted)restoreInventoryLine(inv,line,'Stock invoice line removed');
  inv.lines.splice(n,1);
  save();renderBuilder();
});document.getElementById('saveInvoiceBtn')?.addEventListener('click',()=>{inv.audit.push(audit('Estimate saved'));save();renderAll()});document.getElementById('issueInvoiceBtn')?.addEventListener('click',()=>{if(!inv.customer||!inv.registration||!inv.lines.some(l=>l.description&&numberValue(l.sell)>0)){alert('Add the customer, registration and at least one priced line before issuing.');return}refreshAllLineCalculations(inv);if(!invoiceReconciles(inv)){alert('This invoice does not reconcile. Check the line values before issuing.');return}const stockCheck=commitInvoiceInventory(inv);if(!stockCheck.ok){alert(stockCheck.message);return}inv.status='Invoice Issued';inv.audit.push(audit('Invoice issued',`Total ${money(totals(inv).total)}`));save();renderAll()});document.getElementById('deleteEstimateBtn')?.addEventListener('click',()=>deleteEstimate(inv.id));document.getElementById('printInvoiceBtn')?.addEventListener('click',()=>printInvoice(inv));document.getElementById('reopenInvoiceBtn')?.addEventListener('click',()=>{const r=prompt('Reason for reopening:');if(!r)return;inv.status='Estimate';inv.audit.push(audit('Invoice reopened',`${r} · Stock allocations retained`));save();renderAll()});document.getElementById('creditInvoiceBtn')?.addEventListener('click',()=>{const r=prompt('Reason for credit note:');if(!r)return;inv.status='Credited';inv.audit.push(audit('Credit note created',`${r} · Stock not automatically returned`));save();renderAll()});document.getElementById('markPaidBtn')?.addEventListener('click',()=>{inv.paidAmount=totals(inv).total;inv.status='Paid';inv.audit.push(audit('Invoice marked paid'));save();renderAll()})}
function deleteEstimate(id){const inv=invoices.find(i=>i.id===id);if(!inv||inv.status!=='Estimate')return alert('Only estimates can be deleted.');if(!confirm(`Delete estimate ${inv.number}?`))return;restoreInvoiceInventory(inv,'Estimate deleted — stock returned');if(inv.jobId&&!deletedJobInvoices.includes(inv.jobId))deletedJobInvoices.push(inv.jobId);invoices=invoices.filter(i=>i.id!==id);if(currentId===id)currentId=null;save();showPanel('financeDashboard');renderAll()}
function printInvoice(inv){
 const x=totals(inv),sheet=document.getElementById('financePrintSheet'),c=companySettings(),
 trading=c.tradingName||settings.company||'Workshop',legal=c.legalName||trading,
 address=c.tradingAddress||c.registeredAddress||settings.address||'',
 logo=c.showLogo!==false&&c.logoData?`<img class="invoice-company-logo" src="${c.logoData}" alt="${esc(trading)} logo">`:'',
 companyLine=[c.companyNumber?`Company ${esc(c.companyNumber)}`:'',c.vatNumber?`VAT ${esc(c.vatNumber)}`:(settings.vatNumber?esc(settings.vatNumber):'')].filter(Boolean).join(' · '),
 contacts=[c.phone,c.email,c.website].filter(Boolean).map(esc).join(' · '),
 bank=c.showBankInvoice?[c.bankName,c.accountName,c.sortCode,c.accountNumber].filter(Boolean).map(esc).join(' · '):'',
 terms=c.paymentTerms||settings.paymentTerms||inv.paymentTerms||'',
 docTitle=inv.status==='Estimate'?'ESTIMATE':'INVOICE',
 statusText=esc(inv.status||docTitle),
 paid=Math.max(0,Number(inv.paidAmount||0)),
 balance=Math.max(0,round(x.total-paid));

 sheet.innerHTML=`
 <div class="pro-invoice">
   <header class="pro-invoice-header">
     <div class="invoice-company-block">
       ${logo}
       <div class="pro-company-copy">
         <h1>${esc(trading)}</h1>
         ${legal!==trading?`<div class="pro-legal-name">${esc(legal)}</div>`:''}
         ${address?`<div class="pro-company-address">${esc(address).replace(/\n/g,'<br>')}</div>`:''}
         ${contacts?`<div class="pro-company-contact">${contacts}</div>`:''}
         ${companyLine?`<div class="pro-company-reg">${companyLine}</div>`:''}
       </div>
     </div>
     <div class="pro-document-block">
       <span class="pro-document-kicker">${docTitle}</span>
       <strong class="pro-document-number">${esc(inv.number)}</strong>
       <span class="pro-document-date">${esc(inv.date)}</span>
       <span class="pro-status-chip">${statusText}</span>
     </div>
   </header>

   <section class="pro-invoice-info-grid">
     <div class="pro-info-card">
       <span class="pro-info-label">BILL TO</span>
       <strong>${esc(inv.customer||'Customer')}</strong>
       ${inv.address?`<div>${esc(inv.address).replace(/\n/g,'<br>')}</div>`:''}
       ${inv.phone?`<div>${esc(inv.phone)}</div>`:''}
       ${inv.email?`<div>${esc(inv.email)}</div>`:''}
     </div>
     <div class="pro-info-card">
       <span class="pro-info-label">VEHICLE</span>
       <strong>${esc(inv.registration||'—')}</strong>
       ${inv.makeModel?`<div>${esc(inv.makeModel)}</div>`:''}
       ${inv.mileage?`<div>Mileage: ${esc(inv.mileage)}</div>`:''}
       ${inv.jobNumber?`<div>Job: ${esc(inv.jobNumber)}</div>`:''}
     </div>
     <div class="pro-info-card pro-service-card">
       <span class="pro-info-label">SERVICE DETAILS</span>
       <div><strong>Job type:</strong> ${esc(inv.jobType||'Retail')}</div>
       ${inv.technician?`<div><strong>Technician:</strong> ${esc(inv.technician)}</div>`:''}
       ${inv.advisor?`<div><strong>Advisor:</strong> ${esc(inv.advisor)}</div>`:''}
     </div>
   </section>

   <table class="pro-invoice-table">
     <thead>
       <tr>
         <th class="pro-col-item">Item</th>
         <th>Description</th>
         <th class="pro-num">Qty</th>
         <th class="pro-num">Rate ex VAT</th>
         <th class="pro-num">VAT</th>
         <th class="pro-num">Line Total</th>
       </tr>
     </thead>
     <tbody>
       ${inv.lines.filter(l=>l.description).map(l=>{
         const z=calcLine(l);
         const item=l.type==='Parts'&&l.partNumber?`${esc(l.type)}<small>${esc(l.partNumber)}</small>`:esc(l.type||'Item');
         return `<tr>
           <td class="pro-item-type">${item}</td>
           <td>${esc(l.description)}</td>
           <td class="pro-num">${Number(l.qty||0).toLocaleString('en-GB',{maximumFractionDigits:2})}${l.unit?` ${esc(l.unit)}`:''}</td>
           <td class="pro-num">${money(l.sell)}</td>
           <td class="pro-num">${Number(l.vat)||0}%</td>
           <td class="pro-num pro-line-total">${money(z.total)}</td>
         </tr>`;
       }).join('')}
     </tbody>
   </table>

   <section class="pro-invoice-lower">
     <div class="pro-notes">
       ${inv.customerNotes?`<div class="pro-note-block"><span class="pro-info-label">CUSTOMER NOTES</span><p>${esc(inv.customerNotes).replace(/\n/g,'<br>')}</p></div>`:''}
       ${terms?`<div class="pro-note-block"><span class="pro-info-label">PAYMENT TERMS</span><p>${esc(terms)}</p></div>`:''}
       ${bank?`<div class="pro-note-block"><span class="pro-info-label">BANK DETAILS</span><p>${bank}</p></div>`:''}
     </div>

     <div class="pro-totals-card">
       <div><span>Subtotal ex VAT</span><strong>${money(x.net)}</strong></div>
       <div><span>VAT</span><strong>${money(x.vat)}</strong></div>
       <div class="pro-grand-total"><span>Total</span><strong>${money(x.total)}</strong></div>
       ${paid>0?`<div><span>Paid</span><strong>${money(paid)}</strong></div>`:''}
       ${paid>0?`<div class="pro-balance"><span>Balance Due</span><strong>${money(balance)}</strong></div>`:''}
     </div>
   </section>

   <footer class="pro-invoice-footer">
     <div>Thank you for your business.</div>
     <div>${esc(trading)} · ${esc(inv.number)}</div>
   </footer>
 </div>`;

 document.body.classList.add('finance-printing');
 const doPrint=()=>{window.print();setTimeout(()=>document.body.classList.remove('finance-printing'),500)};
 const logoImg=sheet.querySelector('.invoice-company-logo');
 if(logoImg&&!logoImg.complete){
   let done=false;
   const finish=()=>{if(done)return;done=true;setTimeout(doPrint,80)};
   logoImg.addEventListener('load',finish,{once:true});
   logoImg.addEventListener('error',finish,{once:true});
   setTimeout(finish,800);
 }else{
   setTimeout(doPrint,80);
 }
}
function renderPartsDifferenceReport(){
  const host=document.getElementById('partsDifferenceReportHost');if(!host)return;
  const rows=partObservations(240), groups={};
  rows.forEach(r=>(groups[r.partNumber]||(groups[r.partNumber]=[])).push(r));
  const summary=Object.entries(groups).map(([pn,a])=>{const paid=a.filter(x=>x.cost>0),costs=paid.map(x=>x.cost),uniq=[...new Set(costs.map(x=>round(x)))],last=paid[paid.length-1]||a[a.length-1]||{},first=paid[0]||last;return{pn,description:[...a].reverse().find(x=>x.description)?.description||'',occurrences:a.length,prices:uniq,min:costs.length?Math.min(...costs):0,max:costs.length?Math.max(...costs):0,latest:costs.length?costs[costs.length-1]:0,previous:costs.length>1?costs[costs.length-2]:(costs[0]||0),lastSeen:last.date||'',changed:uniq.length>1,history:a,firstCost:first.cost||0}}).sort((a,b)=>(b.changed-a.changed)||b.lastSeen.localeCompare(a.lastSeen));
  const changed=summary.filter(x=>x.changed), increased=summary.filter(x=>x.changed&&x.latest>x.previous), decreased=summary.filter(x=>x.changed&&x.latest<x.previous);
  const biggest=summary.reduce((best,x)=>Math.max(best,x.max-x.min),0);
  const body=summary.length?summary.map(x=>partsDifferenceRow(x)).join(''):`<tr><td colspan="10" class="finance-empty"><strong>No exact part-number history found in the last 240 days.</strong><br><small>Only identical normalised part numbers are compared. Generic descriptions such as “air filter” are never matched together.</small></td></tr>`;
  host.innerHTML=`<div class="finance-card parts-intel-shell"><div class="report-heading"><div><h3>Parts Intelligence — Exact Part Number Cost Differences</h3><p>Every row represents one exact manufacturer or supplier part number. Click View history to see each price paid during the last 240 days.</p></div></div><div class="parts-intel-summary"><div class="parts-intel-card"><span>Exact part numbers</span><strong>${summary.length}</strong></div><div class="parts-intel-card"><span>Price increases</span><strong>${increased.length}</strong></div><div class="parts-intel-card"><span>Price reductions</span><strong>${decreased.length}</strong></div><div class="parts-intel-card"><span>Largest cost range</span><strong>${money(biggest)}</strong></div></div><div class="finance-toolbar"><input id="partsDifferenceSearch" placeholder="Search exact part number or description"><select id="partsDifferenceFilter"><option value="all">All exact part numbers</option><option value="changed">Price changed</option><option value="increased">Latest price increased</option><option value="decreased">Latest price decreased</option><option value="same">No change</option></select></div><div class="invoice-table-wrap"><table class="invoice-register parts-difference-table"><thead><tr><th>Exact part number</th><th>Description</th><th>Prices paid (240 days)</th><th>Lowest</th><th>Highest</th><th>Latest</th><th>Latest movement</th><th>Purchases</th><th>Last seen</th><th></th></tr></thead><tbody id="partsDifferenceBody">${body}</tbody></table></div></div>`;
  const rerender=()=>{const q=String(document.getElementById('partsDifferenceSearch')?.value||'').toLowerCase(),f=document.getElementById('partsDifferenceFilter')?.value||'all';document.querySelectorAll('#partsDifferenceBody tr.part-summary-row').forEach(tr=>{const matches=(tr.dataset.search||'').includes(q),state=tr.dataset.state;tr.hidden=!matches||!(f==='all'||f===state||(f==='changed'&&state!=='same'));const h=document.getElementById('history-'+tr.dataset.key);if(h&&tr.hidden)h.hidden=true})};
  document.getElementById('partsDifferenceSearch')?.addEventListener('input',rerender);document.getElementById('partsDifferenceFilter')?.addEventListener('change',rerender);
  host.querySelectorAll('[data-part-history]').forEach(btn=>btn.addEventListener('click',()=>{const row=document.getElementById('history-'+btn.dataset.partHistory);if(row)row.hidden=!row.hidden}));
}
function partsDifferenceRow(x){
  const movement=round(x.latest-x.previous),state=!x.changed?'same':movement>0?'increased':movement<0?'decreased':'same',cls=state==='increased'?'increase':state==='decreased'?'decrease':'same';
  const key=x.pn.replace(/[^A-Z0-9]/gi,'_');
  const history=[...x.history].sort((a,b)=>b.date.localeCompare(a.date));
  const historyRows=history.map(h=>`<tr><td>${esc(h.date||'—')}</td><td>${esc(h.supplier||'Not recorded')}</td><td>${esc(h.registration||'—')}</td><td>${esc(h.invoice||'—')}</td><td>${money(h.cost)}</td><td>${money(h.sell)}</td></tr>`).join('');
  const pct=x.previous?round((movement/x.previous)*100):0;
  const badge=state==='same'?'No change':`${movement>0?'▲':'▼'} ${money(Math.abs(movement))} (${Math.abs(pct)}%)`;
  return `<tr class="part-summary-row" data-key="${key}" data-search="${esc((x.pn+' '+x.description).toLowerCase())}" data-state="${state}"><td><strong>${esc(x.pn)}</strong></td><td>${esc(x.description||'—')}</td><td>${x.prices.length?x.prices.map(money).join(' · '):'—'}</td><td>${money(x.min)}</td><td>${money(x.max)}</td><td>${money(x.latest)}</td><td><span class="part-diff-badge ${cls}">${badge}</span></td><td>${x.occurrences}</td><td>${esc(x.lastSeen||'—')}</td><td><button class="part-row-toggle" data-part-history="${key}">View history</button></td></tr><tr class="part-history-row" id="history-${key}" hidden><td colspan="10"><div class="part-history-panel"><h4>${esc(x.pn)} — ${esc(x.description||'Part history')}</h4><div class="part-history-grid"><div class="part-history-item"><span>Lowest paid</span><strong>${money(x.min)}</strong></div><div class="part-history-item"><span>Highest paid</span><strong>${money(x.max)}</strong></div><div class="part-history-item"><span>Latest paid</span><strong>${money(x.latest)}</strong></div><div class="part-history-item"><span>Total records</span><strong>${x.occurrences}</strong></div><div class="part-history-item"><span>Cost range</span><strong>${money(round(x.max-x.min))}</strong></div></div><table class="part-history-table"><thead><tr><th>Date</th><th>Supplier</th><th>Registration</th><th>Invoice / source</th><th>Cost ex VAT</th><th>Sell ex VAT</th></tr></thead><tbody>${historyRows}</tbody></table></div></td></tr>`;
}
function fieldS(label,key,val,cls=''){return `<label class="${cls}">${label}<input data-setting="${key}" value="${esc(val)}"></label>`}
function renderSettings(){const host=document.getElementById('financeSettingsHost');if(!host)return;host.innerHTML=`<div class="finance-card"><h3>Finance settings</h3><h4>Default selling rates — ex VAT</h4><div class="invoice-form">${fieldS('Retail labour £/hr','retailRate',settings.retailRate)}${fieldS('Internal labour £/hr','internalRate',settings.internalRate)}${fieldS('Warranty labour £/hr','warrantyRate',settings.warrantyRate)}${fieldS('MOT selling price','motSellPrice',settings.motSellPrice)}${fieldS('MOT technician cost time (hours)','motDurationHours',settings.motDurationHours)}${fieldS('5W30 oil cost £/litre','oil5w30CostPerLitre',settings.oil5w30CostPerLitre)}</div><p class="finance-note">An MOT is invoiced as one MOT line only. No separate labour line is added for an MOT-only job; the MOT line includes its own technician direct cost for gross-profit reporting.</p><p class="finance-note">The configured oil cost is applied automatically only to lines described as 5W30. Change the description to another oil grade and its cost remains editable.</p><h4>Technician true employment cost — per hour</h4><div class="technician-cost-grid">${techNames().map(n=>`<label>${esc(n)}<input type="number" step="0.01" data-tech-cost="${esc(n)}" value="${Number(settings.technicianCosts[n]||0)}"></label>`).join('')}</div><h4>Invoice numbering & VAT</h4><div class="finance-note company-settings-link-note"><strong>Company name, address, VAT number, bank details and logo are managed in Company Settings.</strong><br><button type="button" class="finance-btn secondary" id="openCompanySettingsFromFinance">Open Company Settings</button></div><div class="invoice-form">${fieldS('Invoice prefix','invoicePrefix',settings.invoicePrefix)}${fieldS('Next number','nextNumber',settings.nextNumber)}${fieldS('Default VAT %','defaultVat',settings.defaultVat)}</div><div class="invoice-footer-actions"><button class="finance-btn primary" id="saveFinanceSettings">Save settings</button></div></div>`;document.getElementById('saveFinanceSettings')?.addEventListener('click',()=>{document.querySelectorAll('[data-setting]').forEach(el=>settings[el.dataset.setting]=['nextNumber','defaultVat','retailRate','internalRate','warrantyRate','motSellPrice','motDurationHours','oil5w30CostPerLitre'].includes(el.dataset.setting)?Number(el.value):el.value);document.querySelectorAll('[data-tech-cost]').forEach(el=>settings.technicianCosts[el.dataset.techCost]=Number(el.value)||0);save();alert('Finance settings saved. New estimates use these rates; issued invoices remain unchanged.');renderSettings()})}
function workshopJobs(){return read('workshopAIJobsV27',[])}
function crmForJob(job){const db=read('wai096_crm',{}),c=(db.customers||[]).find(x=>x.id===job.customerId),v=c&&(c.vehicles||[]).find(x=>x.id===job.vehicleId);return{customer:c,vehicle:v}}
function customerName(c){return c?[c.title,c.firstName,c.surname].filter(Boolean).join(' ')||c.company||'':''}
function crmAddress(c){return c?[c.address1,c.address2,c.town,c.county,c.postcode].filter(Boolean).join(', '):''}
function sourceLine(inv,type,id){return inv.lines.find(l=>l.sourceType===type&&l.sourceId===id)}
function isMotOnlyJob(job){if(!job||!job.mot||job.mot==='None')return false;const work=String(job.workRequired||job.description||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');if(!work)return true;const stripped=work.replace(/\b(mot|test|class 4|class four|annual)\b/g,'').trim();return !stripped}
function syncJobIntoInvoice(job,inv){const {customer:c,vehicle:v}=crmForJob(job);inv.jobId=job.id;inv.jobNumber=job.jobNo||inv.jobNumber;inv.jobType=job.type||inv.jobType||'Retail';inv.crmCustomerId=c?.id||inv.crmCustomerId||job.customerId||'';inv.crmVehicleId=v?.id||inv.crmVehicleId||job.vehicleId||'';inv.customer=customerName(c)||job.customer||inv.customer;inv.address=crmAddress(c)||inv.address;inv.phone=(c&&(c.mobile||c.home||c.work))||job.phone||inv.phone;inv.email=(c&&c.email)||job.customerEmail||inv.email;inv.registration=job.reg||inv.registration;inv.makeModel=[v?.make||job.make,[v?.model,v?.variant].filter(Boolean).join(' ')||job.model].filter(Boolean).join(' ');inv.mileage=job.mileage||v?.mileage||inv.mileage;inv.technician=job.technician||inv.technician;const motOnly=isMotOnlyJob(job);let labour=sourceLine(inv,'job-labour',job.id);if(motOnly){if(labour)inv.lines=inv.lines.filter(l=>l!==labour)}else{if(!labour){labour=blankLine('Labour',inv);labour.sourceType='job-labour';labour.sourceId=job.id;inv.lines.unshift(labour)}labour.description=job.workRequired?`Labour — ${job.workRequired}`:'Workshop labour';labour.qty=Number(job.actualHours)>0?round(job.actualHours):Number(job.hours)||0;labour.sell=Number(job.labourRateSnapshot)||rateFor(inv.jobType);applyAutoPricing(labour,inv)}(job.partsRequests||[]).forEach((p,idx)=>{const pid=p.id||`${job.id}-part-${idx}`;if(['cancelled','returned','credited'].includes(String(p.status||'').toLowerCase()))return;let line=sourceLine(inv,'job-part',pid);if(!line){line=blankLine('Parts',inv);line.sourceType='job-part';line.sourceId=pid;inv.lines.push(line)}line.partNumber=normPartNumber(p.partNumber||p.partNo||line.partNumber);line.description=p.description||p.text||p.partNumber||'Part';line.qty=Number(p.qty)||1;line.cost=Number(p.cost??p.costPrice??0)||0;line.sell=Number(p.sell??p.sellPrice??p.customerPrice??p.price??0)||0});if(job.mot&&job.mot!=='None'){let mot=sourceLine(inv,'job-mot',job.id);if(!mot){mot=blankLine('MOT',inv);mot.sourceType='job-mot';mot.sourceId=job.id;inv.lines.push(mot)}mot.description=`MOT — ${job.mot}`;applyAutoPricing(mot,inv)}return inv}
function ensureInvoiceForJob(job){if(deletedJobInvoices.includes(job.id))return null;let inv=invoices.find(i=>i.jobId===job.id||(i.jobNumber&&i.jobNumber===job.jobNo));if(!inv){inv={id:uid(),number:settings.invoicePrefix+String(settings.nextNumber++).padStart(5,'0'),status:'Estimate',jobType:job.type||'Retail',date:String(job.bookingDate||job.createdAt||today()).slice(0,10),jobId:job.id,jobNumber:job.jobNo||'',customer:'',address:'',phone:'',email:'',registration:'',makeModel:'',mileage:'',technician:job.technician||'',advisor:'',paymentTerms:settings.paymentTerms,customerNotes:'',internalNotes:'',paidAmount:0,lines:[],audit:[audit('Live estimate created from workshop job')],createdAt:nowISO(),updatedAt:nowISO()};invoices.unshift(inv)}return syncJobIntoInvoice(job,inv)}
function syncAllJobs(){workshopJobs().forEach(ensureInvoiceForJob);save()}
function openJobInvoice(jobId){const job=workshopJobs().find(j=>j.id===jobId);if(!job)return;const inv=ensureInvoiceForJob(job);if(!inv)return alert("This job's estimate was deleted.");currentId=inv.id;save();if(typeof window.show==='function')window.show('financeCentreScreen');showPanel('invoiceBuilder')}
function getJobFinancials(jobId){
  const inv=invoices.find(i=>i.jobId===jobId||(workshopJobs().find(j=>j.id===jobId)?.jobNo&&i.jobNumber===workshopJobs().find(j=>j.id===jobId)?.jobNo));
  if(!inv)return {found:false,status:'No estimate',net:0,cost:0,gp:0,vat:0,total:0,categories:{},invoiceId:null};
  const x=totals(inv);
  return Object.assign({found:true,status:inv.status,invoiceId:inv.id,number:inv.number},x);
}
window.WAI099FinanceBridge={syncAllJobs,ensureInvoiceForJob,openJobInvoice,getRevenueSummary,getMonthlyPerformanceSummary,getJobFinancials,getInvoices:()=>invoices.map(i=>Object.assign({},i,{lines:(i.lines||[]).map(l=>Object.assign({},l))})),addInventoryLineToInvoice,openInvoice:(id)=>{const inv=invoices.find(i=>i.id===id);if(!inv)return;currentId=id;save();if(typeof window.show==='function')window.show('financeCentreScreen');showPanel('invoiceBuilder')},syncJob:job=>{const inv=ensureInvoiceForJob(job);save();renderAll();return inv}};
document.addEventListener('click',e=>{if(e.target?.id==='openCompanySettingsFromFinance')window.WAICompanySettings?.open?.()});
document.addEventListener('DOMContentLoaded',init);
})();
