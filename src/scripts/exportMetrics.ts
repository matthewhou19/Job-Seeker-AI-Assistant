import { config } from "dotenv";
config(); // Load environment variables from .env file

import { ChainPerformanceMonitor } from "../monitor/ChainPerformanceMonitor";

async function exportMetrics() {
  console.log("📊 Exporting chain performance metrics...");

  const monitor = ChainPerformanceMonitor.getInstance();

  // Print current metrics to console
  monitor.printSummary();

  // Export to CSV (append by default, don't clear)
  const csvPath = monitor.exportToCSV(undefined, true, false);

  // Also export as JSON if needed
  const jsonData = monitor.getMetricsAsJSON();
  console.log("\n📋 JSON Summary:");
  console.log(JSON.stringify(jsonData, null, 2));

  console.log(`\n✅ Metrics exported successfully!`);
  console.log(`📄 CSV file: ${csvPath}`);
  console.log(
    `💡 Use monitor.exportToCSV(filename, append, clearAfterExport) for more control`
  );
}

// Execute the function
exportMetrics().catch(console.error);
