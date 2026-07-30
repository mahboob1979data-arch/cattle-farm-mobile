path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add Image to imports
code = code.replace(
    "  StatusBar,\n} from 'react-native';",
    "  StatusBar,\n  Image,\n} from 'react-native';"
)

# Add selectedFile state definition
state_target = "  const [cachedItemsCount, setCachedItemsCount] = useState(0);"
state_replacement = state_target + "\n  const [selectedFile, setSelectedFile] = useState(null);"
code = code.replace(state_target, state_replacement)

# Add pickImageWeb function definition
func_target = "  // Initial Fetch & Local Cache Check"
func_replacement = """  // Helper to pick image on Web browser
  const pickImageWeb = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Mobile Photo', 'Image upload is optimized for the web dashboard.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
      }
    };
    input.click();
  };

  // Initial Fetch & Local Cache Check"""

code = code.replace(func_target, func_replacement)

# Add Platform import in App.js
code = code.replace(
    "  StatusBar,\n  Image,\n} from 'react-native';",
    "  StatusBar,\n  Image,\n  Platform,\n} from 'react-native';"
)

# Add selectedFile upload logic in submitCattle
old_submit_cattle = """    if (success) {
      setCattleModalVisible(false);
      setCattleForm({ tagId: '', breed: '', gender: 'Steer', purchaseDate: new Date().toISOString().split('T')[0], purchaseWeight: '', purchasePrice: '', isEidHold: false });
    }"""

new_submit_cattle = """    if (success) {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('tagId', cattleForm.tagId);
        formData.append('flockName', activeFlock);

        try {
          await axios.post(`${API_URL}/cattle/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (e) {
          console.error('Failed to upload image', e);
        }
      }
      
      setCattleModalVisible(false);
      setSelectedFile(null);
      setCattleForm({ tagId: '', breed: '', gender: 'Steer', purchaseDate: new Date().toISOString().split('T')[0], purchaseWeight: '', purchasePrice: '', isEidHold: false });
    }"""

code = code.replace(old_submit_cattle, new_submit_cattle)

# Add Upload Photo button in Modal: ADD CATTLE
old_modal_checkbox = """              <TouchableOpacity
                onPress={() => setCattleForm({ ...cattleForm, isEidHold: !cattleForm.isEidHold })}
                style={[styles.checkboxContainer, cattleForm.isEidHold && styles.checkboxActive]}
              >
                <Heart size={16} color={cattleForm.isEidHold ? '#ffffff' : '#fb7185'} />
                <Text style={styles.checkboxLabel}> Hold & Care for Next Eid</Text>
              </TouchableOpacity>"""

new_modal_checkbox = old_modal_checkbox + """

              <TouchableOpacity
                onPress={pickImageWeb}
                style={styles.uploadPhotoBtn}
              >
                <Camera size={16} color="#ffffff" />
                <Text style={styles.uploadPhotoBtnText}>
                  {selectedFile ? `Photo: ${selectedFile.name}` : ' Upload Animal Photo'}
                </Text>
              </TouchableOpacity>"""

code = code.replace(old_modal_checkbox, new_modal_checkbox)

# Add Thumbnail image inside Cattle Card in Registry view
old_card_header = """                  <View style={styles.cattleCardHeader}>
                    <View style={styles.tagBlock}>
                      <Text style={styles.tagText}>{c.tagId}</Text>
                      <Text style={styles.breedText}>{c.breed} • {c.gender}</Text>
                    </View>"""

new_card_header = """                  <View style={styles.cattleCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {c.imagePath !== '' ? (
                        <Image
                          source={{ uri: `http://localhost:5000/images/${c.imagePath}` }}
                          style={styles.cattleThumbnail}
                        />
                      ) : (
                        <View style={[styles.cattleThumbnail, styles.cattleThumbnailEmpty]}>
                          <Camera size={18} color="#64748b" />
                        </View>
                      )}
                      <View style={styles.tagBlock}>
                        <Text style={styles.tagText}>{c.tagId}</Text>
                        <Text style={styles.breedText}>{c.breed} • {c.gender}</Text>
                      </View>
                    </View>"""

code = code.replace(old_card_header, new_card_header)

# Modify closing tags in Cattle Card (since we wrapped in a row View)
old_card_header_end = """                    <View style={styles.statusBlock}>
                      {c.isEidHold ? (
                        <View style={styles.eidBadge}>
                          <Heart size={12} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.eidBadgeText}>Eid Care</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.statusIndicator, c.status === 'Active' ? styles.activeStatus : styles.soldStatus]}>
                        {c.status}
                      </Text>
                    </View>
                  </View>"""

new_card_header_end = """                    <View style={styles.statusBlock}>
                      {c.isEidHold ? (
                        <View style={styles.eidBadge}>
                          <Heart size={12} color="#ffffff" fill="#ffffff" />
                          <Text style={styles.eidBadgeText}>Eid Care</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.statusIndicator, c.status === 'Active' ? styles.activeStatus : styles.soldStatus]}>
                        {c.status}
                      </Text>
                    </View>
                  </View>"""

# Styles additions
style_target = "  container: {\n    flex: 1,\n    backgroundColor: '#0c0c0e',\n  },"
style_replacement = style_target + """
  cattleThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  cattleThumbnailEmpty: {
    backgroundColor: '#1e1e24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d2d38',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    height: 40,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  uploadPhotoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },"""

code = code.replace(style_target, style_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js updated successfully to support image uploads and thumbnails!")
