path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the KPI Card DollarSign icon with the new Image component
code = code.replace(
    '<DollarSign size={24} color="#059669" />',
    "<Image source={require('./assets/rs_sack.png')} style={{ width: 28, height: 28, marginBottom: 4 }} resizeMode=\"contain\" />"
)

# Replace the Bottom Action Bar DollarSign icon with the new Image component
code = code.replace(
    '<DollarSign size={18} color="#ffffff" />',
    "<Image source={require('./assets/rs_sack.png')} style={{ width: 18, height: 18, marginRight: 2 }} resizeMode=\"contain\" />"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated: DollarSign icons replaced with the custom Rs money sack image!")
