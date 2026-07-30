path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'DollarSign' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print 2 lines before and after
        start = max(0, i-2)
        end = min(len(lines), i+3)
        for j in range(start, end):
            print(f"  {j+1}: {lines[j].rstrip()}")
