console.log("Content script loaded");

// 工具函数：等待职位描述面板加载完成
const waitForJobPanel = () => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const title = document.querySelector("#jobsearch-ViewjobPaneWrapper");
      //const description = document.querySelector("#jobDescriptionText");
      if (title) {
        clearInterval(interval);
        resolve(true);
      }
    }, 500);
  });
};

// 监听左侧职位卡片的点击事件
document.addEventListener("click", async (event) => {
  const card = event.target.closest(".job_seen_beacon");
  if (!card) return;

  // 等待右侧面板加载完成
  await waitForJobPanel();
  console.log("Clicked on a job card");
  // 从右侧面板抓取信息
  const title =
    document.querySelector('h2[data-testid="jobsearch-JobInfoHeader-title"]')
      ?.innerText || "";

  const container = document.querySelector("#jobDescriptionText");

  // Select all <p> and <li> tags inside
  const textElements = container?.querySelectorAll("p, li");

  const description = Array.from(textElements)
    .map((el) => el.innerText.trim())
    .filter((text) => text.length > 0)
    .join("\n");

  const jobData = {
    title,
    description: "Description: " + description,
  };
  console.log(`Sending job data: ${jobData.title}`);
  //console.log(`Sending job data: ${jobData.description}`);
  chrome.runtime.sendMessage({ type: "INDEED_JOB_DETAIL", job: jobData });
});
