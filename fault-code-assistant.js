(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const ENDPOINT='/api/garage-guru/fault-code';
  const codeDB={
    P0101:{title:'Mass or Volume Air Flow Circuit Range/Performance',summary:'The ECU has detected that measured airflow is outside the expected range for the current operating conditions.',causes:['Contaminated or faulty MAF sensor','Air leak after the MAF sensor','Restricted air filter or intake','Wiring/connector fault','EGR or boost issue affecting calculated airflow'],checks:['Inspect intake pipework and air filter','Check MAF connector, wiring and live data','Compare specified/expected airflow with actual readings','Check for intake leaks and related EGR/boost codes']},
    P0171:{title:'System Too Lean — Bank 1',summary:'Fuel trim has reached a lean threshold, meaning the ECU is adding more fuel than expected to maintain the target mixture.',causes:['Unmetered intake/vacuum leak','Low fuel pressure or restricted injector','MAF under-reading','Exhaust leak ahead of oxygen sensor','PCV/breather fault'],checks:['Review short- and long-term fuel trims','Smoke-test intake/vacuum system','Check fuel pressure/rail data','Inspect MAF values and oxygen sensor response']},
    P0299:{title:'Turbo/Supercharger Underboost',summary:'Actual boost pressure is lower than the ECU target for the operating conditions.',causes:['Split or leaking boost hose/intercooler','Turbo actuator/wastegate/VNT control fault','Vacuum supply or boost control solenoid fault','Turbocharger wear or restriction','MAP/boost pressure sensor error'],checks:['Compare requested vs actual boost under load','Pressure/smoke-test charge-air system','Check vacuum supply and actuator travel','Inspect turbo control valve and relevant sensor data']},
    P0300:{title:'Random/Multiple Cylinder Misfire Detected',summary:'Misfires have been detected across more than one cylinder or without a consistent single-cylinder pattern.',causes:['Ignition system fault','Fuel delivery/injector issue','Air leak or mixture problem','Low compression/timing issue','Contaminated fuel'],checks:['Check misfire counters and freeze-frame data','Inspect plugs/coils and swap-test where appropriate','Check fuel trims and fuel pressure','Carry out compression/leak-down testing if needed']},
    P0401:{title:'Exhaust Gas Recirculation Flow Insufficient',summary:'The ECU has commanded EGR flow but the measured or calculated change is lower than expected.',causes:['Carbon-blocked EGR valve or passages','Sticking or faulty EGR valve','Vacuum/electronic actuator control issue','Differential pressure/airflow sensor discrepancy','Wiring or connector fault'],checks:['Read freeze-frame and related codes','Command EGR operation with diagnostic equipment','Inspect EGR passages for carbon restriction','Compare MAF/pressure data during EGR activation']},
    P0420:{title:'Catalyst System Efficiency Below Threshold — Bank 1',summary:'The ECU has calculated that catalytic converter oxygen-storage/efficiency performance is below its calibrated threshold.',causes:['Aged or damaged catalytic converter','Upstream engine misfire or mixture fault','Exhaust leak','Faulty or slow oxygen sensor','Oil/coolant contamination of catalyst'],checks:['Resolve any misfire or fuelling codes first','Inspect exhaust for leaks','Compare upstream/downstream oxygen sensor patterns','Check catalyst temperature/performance using manufacturer procedure']},
    P2002:{title:'Diesel Particulate Filter Efficiency Below Threshold',summary:'The ECU has determined that DPF performance or soot-handling efficiency is below the expected threshold.',causes:['High DPF soot/ash loading','Failed or interrupted regenerations','Differential pressure sensor/hoses fault','Exhaust temperature sensor fault','Underlying combustion/EGR/boost issue increasing soot'],checks:['Read soot/ash loading and regeneration history','Check DPF differential pressure at idle and raised rpm','Inspect pressure hoses and temperature sensors','Correct upstream faults before considering regeneration/service action']},
    P2453:{title:'DPF Differential Pressure Sensor Range/Performance',summary:'The DPF pressure signal is implausible or outside its expected operating range.',causes:['Blocked/split pressure sensor hoses','Faulty differential pressure sensor','Wiring/connector issue','Incorrect sensor adaptation/zero point','Excessive DPF restriction'],checks:['Inspect both pressure hoses carefully','Check sensor reading key-on/engine-off','Compare pressure at idle and raised rpm','Verify wiring, supply and manufacturer adaptation procedure']},
    P2563:{title:'Turbocharger Boost Control Position Sensor Range/Performance',summary:'The reported turbo actuator position does not correspond with the commanded position or expected range.',causes:['Sticking VNT/wastegate mechanism','Electronic/vacuum actuator fault','Position sensor fault','Vacuum/control supply problem','Wiring or connector issue'],checks:['Compare commanded and actual actuator position','Run actuator basic setting/output test','Check linkage movement and vacuum supply','Inspect wiring and connectors before condemning turbocharger']}
  };

  function normaliseCode(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'');}
  function familyInfo(code){
    if(!/^[PBCU][0-9A-F]{4}$/.test(code)) return null;
    const system={P:'Powertrain',B:'Body',C:'Chassis',U:'Network/Communication'}[code[0]];
    const scope=code[1]==='0'?'generic SAE/ISO':'manufacturer-specific or enhanced';
    const area=code[0]==='P'?({'1':'fuel/air metering','2':'fuel/air injector circuit','3':'ignition/misfire','4':'auxiliary emissions','5':'vehicle speed/idle control','6':'computer/output circuits','7':'transmission','8':'transmission'}[code[2]]||'powertrain system'):'the '+system.toLowerCase()+' system';
    return {title:`${system} diagnostic trouble code`,summary:`${code} is a ${scope} ${system.toLowerCase()} code. Its exact definition can vary by vehicle, especially for manufacturer-specific codes. Treat the code as a starting point and confirm the definition against vehicle-specific service information.`,causes:[`Fault within ${area}`, 'Related sensor, actuator or wiring fault','A secondary fault causing an implausible reading'],checks:['Confirm the exact code definition for make/model/engine','Read freeze-frame data and all related DTCs','Check live data and perform basic electrical/visual checks before replacing components']};
  }
  function vehicleContext(){
    const tech=$('techFilter')?.value||'';
    const selected=(typeof jobs!=='undefined'&&Array.isArray(jobs))?jobs.find(j=>j.technician===tech && !j.completedAt):null;
    return selected?{registration:selected.reg||'',make:selected.make||'',model:selected.model||'',jobNo:selected.jobNo||'',technician:tech}: {technician:tech};
  }
  function render(data,code,source){
    $('faultCodeResult').classList.remove('hidden');
    $('faultCodeResult').innerHTML=`<div class="fca-result-head"><h3>${esc(code)} — ${esc(data.title||'Diagnostic guidance')}</h3><span class="fca-source">${esc(source)}</span></div><p class="fca-summary">${esc(data.summary||'')}</p><div class="fca-columns"><div class="fca-panel"><h4>Common causes</h4><ul>${(data.causes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="fca-panel"><h4>Suggested checks</h4><ul>${(data.checks||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="fca-panel"><h4>Vehicle context</h4><ul>${contextLines().map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div><div class="fca-note"><strong>Diagnostic guidance:</strong> A fault code does not prove a component has failed. Confirm the code, freeze-frame/live data and vehicle-specific test procedure before replacing parts. Follow appropriate safety procedures for high-voltage, fuel, braking and restraint systems.</div>`;
  }
  function contextLines(){
    const ctx=vehicleContext(); const symptom=$('faultCodeSymptoms')?.value.trim(); const entered=$('faultCodeVehicle')?.value.trim();
    const out=[]; if(entered) out.push(`Vehicle: ${entered}`); else if(ctx.registration||ctx.make||ctx.model) out.push(`Vehicle: ${[ctx.registration,ctx.make,ctx.model].filter(Boolean).join(' · ')}`); if(ctx.technician) out.push(`Technician: ${ctx.technician}`); if(symptom) out.push(`Symptoms: ${symptom}`); if(!out.length) out.push('Add vehicle and symptom details for more targeted guidance.'); return out;
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function analyse(){
    const code=normaliseCode($('faultCodeInput')?.value); if(!code){alert('Enter a fault code first.');return;}
    $('faultCodeInput').value=code; const result=$('faultCodeResult'); result.classList.remove('hidden'); result.innerHTML='<span class="fca-loading">Garage Guru is checking the fault code…</span>';
    const payload={code,vehicle:$('faultCodeVehicle')?.value.trim()||'',symptoms:$('faultCodeSymptoms')?.value.trim()||'',context:vehicleContext()};
    // OpenAI-ready: when Garage Gurus is hosted with a secure backend, this route can return structured AI diagnostic guidance.
    try{
      if(location.protocol!=='file:'){
        const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),1800);
        const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal}); clearTimeout(timer);
        if(response.ok){const ai=await response.json(); if(ai&&ai.title){render(ai,code,'Garage Guru · AI');return;}}
      }
    }catch(e){}
    const local=codeDB[code]||familyInfo(code);
    if(local){render(local,code,codeDB[code]?'Garage Guru · Diagnostic guide':'Garage Guru · Code family guide');}
    else{render({title:'Code format not recognised',summary:'Check the fault code has been entered correctly. Standard OBD-II codes normally contain one letter followed by four characters, for example P0401.',causes:['Typing or scan-tool transcription error','Non-standard manufacturer diagnostic identifier'],checks:['Recheck the code on the diagnostic tool','Enter the full code including its leading letter','For manufacturer-specific identifiers, include the vehicle details when Garage Guru AI is connected']},code,'Garage Guru');}
  }
  function clearAll(){['faultCodeInput','faultCodeVehicle','faultCodeSymptoms'].forEach(id=>{if($(id))$(id).value='';});$('faultCodeResult')?.classList.add('hidden');}
  document.addEventListener('DOMContentLoaded',()=>{
    $('faultCodeAnalyseBtn')?.addEventListener('click',analyse); $('faultCodeClearBtn')?.addEventListener('click',clearAll);
    $('faultCodeInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();analyse();}});
  });
})();
