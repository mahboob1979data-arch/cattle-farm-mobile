path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace QUICK FLOATING ACTIONS layout with FIXED BOTTOM ACTION BAR layout
old_fab_layout = """      {/* QUICK FLOATING ACTIONS */}
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

new_fab_layout = """      {/* FIXED BOTTOM ACTION BAR (BOTTOM LAYER) */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#3b82f6' }]} onPress={() => setWeightModalVisible(true)}>
          <Scale size={18} color="#ffffff" />
          <Text style={styles.barActionText}>Log Wt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#10b981' }]} onPress={() => setCattleModalVisible(true)}>
          <Plus size={18} color="#ffffff" />
          <Text style={styles.barActionText}>Add Cow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.barActionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setExpenseModalVisible(true)}>
          <DollarSign size={18} color="#ffffff" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>
      </View>"""

code = code.replace(old_fab_layout, new_fab_layout)

# 2. Update scrollContent padding to scroll cleanly above the action bar
code = code.replace("""  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },""", """  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },""")

# 3. Replace floatingActionRow and fab styles with bottomActionBar and barActionBtn styles
old_fab_styles = """  floatingActionRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },"""

new_fab_styles = """  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  barActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
    height: 40,
    borderRadius: 8,
  },
  barActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },"""

code = code.replace(old_fab_styles, new_fab_styles)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated: floating action buttons integrated into solid bottom action bar layer!")
