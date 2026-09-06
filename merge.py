import json
import os
import re

# Paths
json_path = r"c:\Users\Amaury\Downloads\lotto\winning_history.json"
md_path = r"C:\Users\Amaury\.gemini\antigravity\brain\f7eff51a-a96b-468e-84c4-fb3d081c89ab\lotto_di_dia_info.md"

# Raw text pasted by the user
raw_data = """
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
"""

# Map months for standard YYYY-MM-DD
month_map = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
    "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
}

def parse_date(date_str):
    # E.g. "Dec 7, 2025" -> "2025-12-07"
    parts = re.split(r'[\s,]+', date_str.strip())
    if len(parts) >= 3:
        m = month_map.get(parts[0][:3])
        d = parts[1].zfill(2)
        y = parts[2]
        return f"{y}-{m}-{d}"
    return date_str

# 1. Parse raw text into structured items
new_items = []
for line in raw_data.strip().split("\n"):
    if not line.strip():
        continue
    parts = line.split("\t")
    if len(parts) != 3:
        parts = [p.strip() for p in re.split(r'\s{2,}', line.strip()) if p.strip()]
    if len(parts) == 3:
        date_raw, draw_raw, nums_raw = parts
        date = parse_date(date_raw)
        draw = int(draw_raw.strip())
        numbers = [int(n) for n in nums_raw.strip().split("-")]
        new_items.append({
            "date": date,
            "draw": draw,
            "numbers": numbers
        })

# 2. Load existing JSON
if os.path.exists(json_path):
    with open(json_path, "r", encoding="utf-8") as f:
        existing_data = json.load(f)
else:
    existing_data = []

# Merge and deduplicate by draw number
merged_map = {item["draw"]: item for item in existing_data}
for item in new_items:
    merged_map[item["draw"]] = item

# Sort reverse chronologically (largest draw number first)
sorted_data = sorted(merged_map.values(), key=lambda x: x["draw"], reverse=True)

# Save updated JSON
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(sorted_data, f, indent=2)

print(f"Total draws in JSON: {len(sorted_data)}")

# 3. Update Markdown Guide
# Let's read the current markdown and update the table in section 7
with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# We need to find the start of the winning number history section and replace everything after it
section_title = "## 7. Winning Number History"
start_idx = md_content.find(section_title)
if start_idx == -1:
    print("Warning: Section 7 not found in Markdown. Appending it.")
    md_content += f"\n\n{section_title}\n"
    start_idx = md_content.find(section_title)

# Header part of MD (up to section 7)
header_md = md_content[:start_idx]

# Format history table
min_date = sorted_data[-1]["date"]
max_date = sorted_data[0]["date"]
import datetime
def format_date_str(date_str):
    try:
        dt = datetime.datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%b %d, %Y")
    except:
        return date_str

history_section = f"## 7. Winning Number History ({format_date_str(min_date)} - {format_date_str(max_date)})\n\n"
history_section += "| Date | Draw # | Winning Numbers |\n"
history_section += "| :--- | :---: | :---: |\n"
for item in sorted_data:
    nums_str = " - ".join(str(n).zfill(2) for n in item["numbers"])
    history_section += f"| {format_date_str(item['date'])} | {item['draw']} | {nums_str} |\n"

# Write updated Markdown
with open(md_path, "w", encoding="utf-8") as f:
    f.write(header_md + history_section)

print("Markdown updated successfully.")
