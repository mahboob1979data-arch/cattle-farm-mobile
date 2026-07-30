import re

path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Fix 1: loading && <ActivityIndicator ... />
code = re.sub(
    r'\{loading && (<ActivityIndicator [^}]+>)\}',
    r'{loading ? \1 : null}',
    code
)

# Fix 2: cachedItemsCount > 0 && ( ... )
old_sync = """          {cachedItemsCount > 0 && (
            <TouchableOpacity onPress={syncCachedData} style={styles.syncBtn}>
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.syncBtnText}>{cachedItemsCount}</Text>
            </TouchableOpacity>
          )}"""

new_sync = """          {cachedItemsCount > 0 ? (
            <TouchableOpacity onPress={syncCachedData} style={styles.syncBtn}>
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.syncBtnText}>{cachedItemsCount}</Text>
            </TouchableOpacity>
          ) : null}"""

code = code.replace(old_sync, new_sync)

# Fix 3: weightForm.tagId && weightForm.weight && ( ... )
old_calc = """            {weightForm.tagId && weightForm.weight && (
              <View style={styles.liveCalculationBox}>
                <Text style={styles.liveCalcText}>
                  Est. Daily Gain (ADG): <Text style={styles.adgHighlight}>{getLiveADG(weightForm.tagId, weightForm.weight)} kg/day</Text>
                </Text>
              </View>
            )}"""

new_calc = """            {weightForm.tagId !== '' && weightForm.weight !== '' ? (
              <View style={styles.liveCalculationBox}>
                <Text style={styles.liveCalcText}>
                  Est. Daily Gain (ADG): <Text style={styles.adgHighlight}>{getLiveADG(weightForm.tagId, weightForm.weight)} kg/day</Text>
                </Text>
              </View>
            ) : null}"""

code = code.replace(old_calc, new_calc)

# Fix 4: c.isEidHold && ( ... ) -> in case it evaluates to falsy on some JS engines
code = code.replace(
    "c.isEidHold && (",
    "c.isEidHold ? ("
).replace(
    "c.isEidHold && (",
    "c.isEidHold ? ("
)

# Ensure matching : null for c.isEidHold
# Wait, let's look at c.isEidHold replacement:
# isEidHold is inside:
#                       {c.isEidHold && (
#                         <View style={styles.eidBadge}>
#                           <Heart size={12} color="#ffffff" fill="#ffffff" />
#                           <Text style={styles.eidBadgeText}>Eid Care</Text>
#                         </View>
#                       )}
# Let's replace this exact block:
old_eid = """                      {c.isEidHold && (
                        <View style={styles.eidBadge}>
                          <Heart size={12} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.eidBadgeText}>Eid Care</Text>
                        </View>
                      )}"""

new_eid = """                      {c.isEidHold ? (
                        <View style={styles.eidBadge}>
                          <Heart size={12} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.eidBadgeText}>Eid Care</Text>
                        </View>
                      ) : null}"""

code = code.replace(old_eid, new_eid)

# Fix 5: cattleForm.isEidHold && styles.checkboxActive
# style={[styles.checkboxContainer, cattleForm.isEidHold && styles.checkboxActive]}
# This is inside style array. Array styles handle false/null/undefined correctly in React Native, so it is safe!

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js JSX refactored successfully!")
