path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update imports to include ChevronLeft
old_imports = """  Heart,
  ChevronRight,
  Camera
} from 'lucide-react-native';"""

new_imports = """  Heart,
  ChevronRight,
  ChevronLeft,
  Camera
} from 'lucide-react-native';"""

code = code.replace(old_imports, new_imports)

# 2. Add uploadPhotoFromDetails function in the App component
old_delete_cattle_def = """  // Delete cattle handler
  const deleteCattle = async (tagId) => {"""

new_delete_cattle_def = """  // Upload photo directly from details page
  const uploadPhotoFromDetails = () => {
    if (Platform.OS !== 'web') {
      showAlert('Mobile Photo', 'Image upload is optimized for the web dashboard.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setLoading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('tagId', selectedCattleTag);
        formData.append('flockName', activeFlock);

        try {
          const res = await axios.post(`${API_URL}/cattle/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data.success) {
            showAlert('Success', 'Animal photo successfully uploaded!');
            fetchData();
          } else {
            showAlert('Error', res.data.error || 'Failed to upload photo.');
          }
        } catch (err) {
          showAlert('Error', 'Failed to connect to backend for image upload.');
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  // Delete cattle handler
  const deleteCattle = async (tagId) => {"""

code = code.replace(old_delete_cattle_def, new_delete_cattle_def)

# 3. Update Detail Page rendering (Sleek back button, photo upload placeholder, overlays, remove bottom delete button)
old_detail_page = """  if (selectedCattleTag) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#e6f4ea" />
        
        {/* DETAIL HEADER */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedCattleTag(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Cattle Details</Text>
          <TouchableOpacity onPress={() => deleteCattle(selectedCattleTag)} style={styles.deleteHeaderBtn}>
            <Text style={styles.deleteHeaderBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#059669" style={styles.loader} /> : null}

        {selectedCattle ? (
          <ScrollView contentContainerStyle={styles.detailScroll}>
            {/* Animal Photo banner */}
            <View style={styles.detailImageContainer}>
              {selectedCattle.imagePath !== '' ? (
                <Image
                  source={{ uri: `http://localhost:5000/images/${selectedCattle.imagePath}` }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.detailImagePlaceholder}>
                  <Camera size={48} color="#059669" />
                  <Text style={styles.detailPlaceholderText}>No Photo Linked</Text>
                </View>
              )}
            </View>"""

new_detail_page = """  if (selectedCattleTag) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#e6f4ea" />
        
        {/* DETAIL HEADER */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedCattleTag(null)} style={styles.backBtnChip}>
            <ChevronLeft size={16} color="#059669" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Cattle Details</Text>
          <TouchableOpacity onPress={() => deleteCattle(selectedCattleTag)} style={styles.deleteHeaderBtn}>
            <Text style={styles.deleteHeaderBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#059669" style={styles.loader} /> : null}

        {selectedCattle ? (
          <ScrollView contentContainerStyle={styles.detailScroll}>
            {/* Animal Photo banner */}
            <View style={styles.detailImageContainer}>
              {selectedCattle.imagePath !== '' ? (
                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    source={{ uri: `http://localhost:5000/images/${selectedCattle.imagePath}` }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity onPress={uploadPhotoFromDetails} style={styles.changePhotoBtn}>
                    <Camera size={12} color="#ffffff" />
                    <Text style={styles.changePhotoBtnText}> Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={uploadPhotoFromDetails} style={styles.detailImagePlaceholder}>
                  <Camera size={40} color="#059669" />
                  <Text style={styles.detailPlaceholderText}>No Photo Linked</Text>
                  <Text style={styles.uploadSubText}>Click here to upload photo</Text>
                </TouchableOpacity>
              )}
            </View>"""

code = code.replace(old_detail_page, new_detail_page)

# 4. Remove the bottom delete CTA button from details scroll view
old_bottom_delete = """            {/* Delete CTA button */}
            <TouchableOpacity onPress={() => deleteCattle(selectedCattleTag)} style={styles.largeDeleteBtn}>
              <Text style={styles.largeDeleteBtnText}>Delete Animal from Farm</Text>
            </TouchableOpacity>
          </ScrollView>"""

new_bottom_delete = """          </ScrollView>"""

code = code.replace(old_bottom_delete, new_bottom_delete)

# 5. Add new styles (backBtnChip, changePhotoBtn, changePhotoBtnText, uploadSubText)
old_styles_block = """  // DETAIL VIEW STYLING
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailTitle: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteHeaderBtn: {
    padding: 6,
  },
  deleteHeaderBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  detailImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  detailPlaceholderText: {
    color: '#059669',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  detailSectionTitle: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  detailVal: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logSubTitle: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyDate: {
    color: '#475569',
    fontSize: 12,
  },
  historyWt: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyAdg: {
    fontSize: 12,
    fontWeight: '600',
  },
  noHistoryText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  largeDeleteBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  largeDeleteBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },"""

new_styles_block = """  // DETAIL VIEW STYLING
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  backBtnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  backBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  detailTitle: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteHeaderBtn: {
    padding: 6,
  },
  deleteHeaderBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  detailImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    cursor: 'pointer',
  },
  detailPlaceholderText: {
    color: '#059669',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  uploadSubText: {
    color: '#059669',
    fontSize: 11,
    marginTop: 3,
    opacity: 0.8,
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    cursor: 'pointer',
  },
  changePhotoBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailSection: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  detailSectionTitle: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  detailVal: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logSubTitle: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyDate: {
    color: '#475569',
    fontSize: 12,
  },
  historyWt: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyAdg: {
    fontSize: 12,
    fontWeight: '600',
  },
  noHistoryText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },"""

code = code.replace(old_styles_block, new_styles_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js successfully adjusted: back button pill created, bottom delete option removed, photo uploads added to details!")
