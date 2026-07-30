path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add flex: 1 to flockScroll style to prevent horizontal expansion cutting off the right side
old_flock_scroll = """  flockScroll: {
    marginLeft: 10,
  },"""

new_flock_scroll = """  flockScroll: {
    marginLeft: 10,
    flex: 1,
  },"""

code = code.replace(old_flock_scroll, new_flock_scroll)

# 2. Update FAB button background colors to distinct premium colors (Blue, Green, Orange) for better usability
old_fab_row = """      {/* QUICK FLOATING ACTIONS */}
      <View style={styles.floatingActionRow}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#10b981' }]} onPress={() => setWeightModalVisible(true)}>
          <Scale size={20} color="#ffffff" />
          <Text style={styles.fabText}>Log Wt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#059669' }]} onPress={() => setCattleModalVisible(true)}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.fabText}>Add Cow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#34d399' }]} onPress={() => setExpenseModalVisible(true)}>
          <DollarSign size={20} color="#ffffff" />
          <Text style={styles.fabText}>Expense</Text>
        </TouchableOpacity>
      </View>"""

new_fab_row = """      {/* QUICK FLOATING ACTIONS */}
      <View style={styles.floatingActionRow}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#3b82f6' }]} onPress={() => setWeightModalVisible(true)}>
          <Scale size={20} color="#ffffff" />
          <Text style={styles.fabText}>Log Wt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#10b981' }]} onPress={() => setCattleModalVisible(true)}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.fabText}>Add Cow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <DollarSign size={20} color="#ffffff" />
          <Text style={styles.fabText}>Expense</Text>
        </TouchableOpacity>
      </View>"""

code = code.replace(old_fab_row, new_fab_row)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated successfully to fix right-side cutoff and color FABs!")
