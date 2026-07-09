(function () {

    function todayISO() {
        return new Date().toISOString().slice(0,10);
    }

    function yesterdayISO() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0,10);
    }

    function isCompleted(job){
        const s = (job.status || "").toLowerCase();
        return s.includes("complete") ||
               s.includes("completed") ||
               s.includes("collected") ||
               s.includes("ready for collection");
    }

    function dailyCleanup(){

        if(!window.jobs) return;

        const today = todayISO();
        const yesterday = yesterdayISO();

        let changed = false;

        window.jobs.forEach(job => {

            if(!job.bookingDate) return;

            const jobDate = String(job.bookingDate).slice(0,10);

            if(jobDate === yesterday && isCompleted(job)){

                job.archive = true;
                changed = true;

            }

        });

        if(changed){

            localStorage.setItem(
                "workshopAIJobsV27",
                JSON.stringify(window.jobs)
            );

            console.log("WAI-064 Daily Cleanup completed");

        }

    }

    window.addEventListener("load",function(){

        setTimeout(dailyCleanup,1500);

    });
    (function () {
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function isFinished(job) {
    const s = (job.status || "").toLowerCase();
    return (
      s.includes("complete") ||
      s.includes("ready for collection") ||
      s.includes("collected") ||
      s.includes("closed")
    );
  }

  function isLiveJob(job) {
    const today = todayISO();
    const jobDate = String(job.bookingDate || "").slice(0, 10);

    if (!jobDate) return true;

    if (jobDate === today) return true;

    if (jobDate < today && !isFinished(job)) return true;

    return false;
  }

  window.isLiveJob = isLiveJob;

  const oldRenderManager = window.renderManager;
  if (typeof oldRenderManager === "function") {
    window.renderManager = function () {
      const box = document.getElementById("managerJobs");
      if (!box || !window.jobs) return oldRenderManager();

      const liveJobs = window.jobs.filter(isLiveJob);

      box.innerHTML = liveJobs.length
        ? liveJobs.map(j => card(j, true, true)).join("")
        : "No live jobs for today.";
    };
  }

  const oldAllEvents = window.allEvents;
  if (typeof oldAllEvents === "function") {
    window.allEvents = function () {
      let events = [];
      const today = todayISO();

      window.jobs.filter(isLiveJob).forEach(j => {
        ensureTimeline(j).forEach(t => {
          const eventDate = String(t.time || "").slice(0, 10);
          if (eventDate === today || String(j.bookingDate || "").slice(0, 10) < today) {
            events.push({
              ...t,
              reg: j.reg,
              jobNo: j.jobNo,
              tech: j.technician
            });
          }
        });
      });

      return events
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 25);
   
});

