path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the lowercase "head" in the KPI value
code = code.replace("{kpis.totalHerdCount} head", "{kpis.totalHerdCount} Head")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Capitalized 'head' to 'Head' in App.js!")
