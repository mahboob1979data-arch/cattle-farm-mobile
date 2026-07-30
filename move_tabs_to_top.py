path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Replace the flock switcher row with the new combined top Navigation Row (flock switcher + segmented tab control)
old_flock_switcher = """      {/* FLOCK SWICHER BANNER */}
      <View style={styles.flockSwitcher}>
        <Layers size={18} color="#047857" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flockScroll}>
          {flocksList.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFlock(f)}
              style={[styles.flockChip, activeFlock === f && styles.activeFlockChip]}
            >
              <Text style={[styles.flockChipText, activeFlock === f && styles.activeFlockChipText]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>"""

new_flock_switcher = """      {/* COMBINED TOP NAVIGATION ROW */}
      <View style={styles.topNavRow}>
        {/* FLOCK SELECTION */}
        <View style={styles.flockPart}>
          <Layers size={16} color="#047857" style={{ marginRight: 6 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {flocksList.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFlock(f)}
                style={[styles.flockChip, activeFlock === f && styles.activeFlockChip]}
              >
                <Text style={[styles.flockChipText, activeFlock === f && styles.activeFlockChipText]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SEGMENTED TAB TABS */}
        <View style={styles.segmentControl}>
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            style={[styles.segmentBtn, activeTab === 'dashboard' && styles.activeSegmentBtn]}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'dashboard' && styles.activeSegmentBtnText]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('registry')}
            style={[styles.segmentBtn, activeTab === 'registry' && styles.activeSegmentBtn]}
          >
            <Text style={[styles.segmentBtnText, activeTab === 'registry' && styles.activeSegmentBtnText]}>
              Registry
            </Text>
          </TouchableOpacity>
        </View>
      </View>"""

code = code.replace(old_flock_switcher, new_flock_switcher)

# 2. Remove bottom tab bar block completely
old_bottom_tabbar = """      {/* BOTTOM NAVIGATION TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} style={[styles.tabItem, activeTab === 'dashboard' && styles.activeTabItem]}>
          <TrendingUp size={22} color={activeTab === 'dashboard' ? '#059669' : '#64748b'} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('registry')} style={[styles.tabItem, activeTab === 'registry' && styles.activeTabItem]}>
          <Search size={22} color={activeTab === 'registry' ? '#059669' : '#64748b'} />
          <Text style={[styles.tabLabel, activeTab === 'registry' && styles.activeTabLabel]}>Registry</Text>
        </TouchableOpacity>
      </View>"""

code = code.replace(old_bottom_tabbar, '')

# 3. Update Styles (remove flockSwitcher, flockScroll, tabBar styles; add topNavRow, flockPart, segmentControl, segmentBtn styles)
# And shift floating action row to bottom: 16 (since bottom tab bar is removed)
code = code.replace("bottom: 65,", "bottom: 16,")

old_switcher_styles = """  flockSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
  },
  flockScroll: {
    marginLeft: 10,
    flex: 1,
  },"""

new_switcher_styles = """  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
  },
  flockPart: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  segmentBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeSegmentBtn: {
    backgroundColor: '#059669',
  },
  segmentBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  activeSegmentBtnText: {
    color: '#ffffff',
  },"""

code = code.replace(old_switcher_styles, new_switcher_styles)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js successfully updated: tabs moved from bottom to top row next to Flock Switcher!")
