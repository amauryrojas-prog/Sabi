const fs = require('fs');
const path = require('path');

const jsonPath = "c:\\Users\\Amaury\\Downloads\\lotto\\winning_history.json";
const mdPath = "C:\\Users\\Amaury\\.gemini\\antigravity\\brain\\f7eff51a-a96b-468e-84c4-fb3d081c89ab\\lotto_di_dia_info.md";

const rawData = `
Jan 13, 2026	7066	02-10-19-23-25
Jan 12, 2026	7065	07-18-20-22-27
Jan 11, 2026	7064	02-06-12-14-28
Jan 10, 2026	7063	02-05-08-25-26
Jan 9, 2026	7062	02-16-22-24-29
Jan 8, 2026	7061	11-13-14-15-16
Jan 7, 2026	7060	09-12-17-20-29
Jan 6, 2026	7059	01-04-18-27-28
Jan 5, 2026	7058	03-04-11-23-25
Jan 4, 2026	7057	04-05-11-12-27
Jan 3, 2026	7056	04-06-08-26-30
Jan 2, 2026	7055	03-05-07-19-21
Dec 31, 2025	7054	19-21-27-28-29
Dec 30, 2025	7053	03-05-11-17-26
Dec 29, 2025	7052	08-16-19-26-30
Dec 28, 2025	7051	03-11-13-15-17
Dec 27, 2025	7050	04-05-12-16-18
Dec 24, 2025	7049	09-11-14-20-22
Dec 23, 2025	7048	15-17-24-25-29
Dec 22, 2025	7047	05-08-14-16-27
Dec 21, 2025	7046	03-05-11-14-19
Dec 20, 2025	7045	08-09-11-17-28
Dec 19, 2025	7044	08-09-20-21-29
Dec 18, 2025	7043	04-10-12-21-24
Dec 17, 2025	7042	04-08-16-22-27
Dec 16, 2025	7041	03-10-14-21-24
Dec 15, 2025	7040	03-08-19-21-25
Dec 14, 2025	7039	03-06-07-27-28
Dec 13, 2025	7038	11-12-25-26-28
Dec 12, 2025	7037	01-18-20-21-22
Dec 11, 2025	7036	01-03-11-19-24
Dec 10, 2025	7035	08-11-16-21-27
Dec 9, 2025	7034	10-16-17-21-22
Dec 8, 2025	7033	08-11-12-14-17
Dec 7, 2025	7032	03-06-08-19-27
`;

const monthMap = {
  "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
  "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
  "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
};

function parseDate(dateStr) {
  const parts = dateStr.trim().split(/[\s,]+/);
  if (parts.length >= 3) {
    const m = monthMap[parts[0].substring(0, 3)];
    const d = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

// 1. Parse raw text into structured items
const newItems = [];
const lines = rawData.trim().split("\n");
for (const line of lines) {
  if (!line.trim()) continue;
  let parts = line.split("\t");
  if (parts.length !== 3) {
    parts = line.trim().split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
  }
  if (parts.length === 3) {
    const [dateRaw, drawRaw, numsRaw] = parts;
    const date = parseDate(dateRaw);
    const draw = parseInt(drawRaw.trim(), 10);
    const numbers = numsRaw.trim().split("-").map(n => parseInt(n, 10));
    newItems.push({ date, draw, numbers });
  }
}

// 2. Load existing JSON
let existingData = [];
if (fs.existsSync(jsonPath)) {
  existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// Merge and deduplicate by draw number
const mergedMap = {};
for (const item of existingData) {
  mergedMap[item.draw] = item;
}
for (const item of newItems) {
  mergedMap[item.draw] = item;
}

// Sort reverse chronologically (largest draw number first)
const sortedData = Object.values(mergedMap).sort((a, b) => b.draw - a.draw);

// Save updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(sortedData, null, 2), 'utf8');
console.log(`Total draws in JSON: ${sortedData.length}`);

// 3. Update Markdown Guide
let mdContent = fs.readFileSync(mdPath, 'utf8');
const sectionTitle = "## 7. Winning Number History";
let startIdx = mdContent.indexOf(sectionTitle);
if (startIdx === -1) {
  console.log("Warning: Section 7 not found in Markdown. Appending it.");
  mdContent += `\n\n${sectionTitle}\n`;
  startIdx = mdContent.indexOf(sectionTitle);
}

// Header part of MD (up to section 7)
const headerMd = mdContent.substring(0, startIdx);

// Format history table
const minDate = sortedData[sortedData.length - 1].date;
const maxDate = sortedData[0].date;

function formatDateStr(dateStr) {
  try {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

let historySection = `## 7. Winning Number History (${formatDateStr(minDate)} - ${formatDateStr(maxDate)})\n\n`;
historySection += "| Date | Draw # | Winning Numbers |\n";
historySection += "| :--- | :---: | :---: |\n";
for (const item of sortedData) {
  const numsStr = item.numbers.map(n => String(n).padStart(2, '0')).join(" - ");
  historySection += `| ${formatDateStr(item.date)} | ${item.draw} | ${numsStr} |\n`;
}

// Write updated Markdown
fs.writeFileSync(mdPath, headerMd + historySection, 'utf8');
console.log("Markdown updated successfully.");
