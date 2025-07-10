console.log("Background script loaded!");
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  console.log("Message received:", msg);
  if (msg.type === "INDEED_JOB_DETAIL") {
    const job = msg.job;
    console.log("Job received:", job);
    try {
      const response = await fetch("http://localhost:3000/extract-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: job.description,
          title: job.title,
        }),
      });
      const data = await response.json();
      console.log("Extraction result:", data);
      sendResponse({ success: true, extraction: data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    // Indicate async response
    return true;
  }
});
