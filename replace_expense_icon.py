path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. First locate the bottom action bar block
old_bottom_button = """        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <Image source={require('./assets/rs_sack.png')} style={{ width: 18, height: 18, marginRight: 2 }} resizeMode="contain" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>"""

new_bottom_button = """        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <Image source={require('./assets/rs_coin.png')} style={{ width: 18, height: 18, marginRight: 2 }} resizeMode="contain" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>"""

code = code.replace(old_bottom_button, new_bottom_button)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated: bottom Action Bar Expense button now uses assets/rs_coin.png!")
