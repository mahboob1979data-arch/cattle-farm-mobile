path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the bottom action button Image source from rs_coin.png to rs_notes.png
old_coin_button = """        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <Image source={require('./assets/rs_coin.png')} style={{ width: 18, height: 18, marginRight: 2 }} resizeMode="contain" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>"""

new_coin_button = """        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <Image source={require('./assets/rs_notes.png')} style={{ width: 24, height: 16, marginRight: 3 }} resizeMode="contain" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>"""

code = code.replace(old_coin_button, new_coin_button)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated: bottom Action Bar Expense button now uses transparent assets/rs_notes.png!")
