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

})();