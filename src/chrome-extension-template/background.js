console.log("Background script loaded!");
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Message received:", msg);
  if (msg.type === "INDEED_JOB_DETAIL") {
    (async () => {
      const job = msg.job;
      console.log("Job received:", job);
      try {
        const response = await fetch(
          "https://8110xnhbpw2tw1-3000.proxy.runpod.net/extract-all",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: job.description,
              title: job.title,
            }),
          }
        );
        const data = await response.json();
        console.log("Extraction result:", data);
        sendResponse({ success: true, extraction: data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    // Indicate async response
    return true;
  }
});
