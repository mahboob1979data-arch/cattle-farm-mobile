path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace loading indicator conditional
code = code.replace(
    '{loading && <ActivityIndicator size="large" color="#4ade80" style={styles.loader} />}',
    '{loading ? <ActivityIndicator size="large" color="#4ade80" style={styles.loader} /> : null}'
)

# Replace sync button conditional
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

# Replace weight live calculation conditional
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

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js JSX refactored safely!")
