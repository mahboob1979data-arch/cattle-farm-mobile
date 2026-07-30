import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  Scale,
  Layers,
  Heart,
  ChevronRight,
  ChevronLeft,
  Camera,
  ShoppingBag,
  Activity
} from 'lucide-react-native';

// API Configuration
const BASE_URL = 'https://cattle-farm-backend-bice.vercel.app';
const API_URL = `${BASE_URL}/api`;

// Add a request interceptor to force the localtunnel bypass header on every request
axios.interceptors.request.use(
  (config) => {
    config.headers['bypass-tunnel-reminder'] = 'true';
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function App() {
  // Custom Alert helper for Web compat
  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 0) {
        const okAction = buttons.find(b => b.style !== 'cancel') || buttons[0];
        const isConfirm = buttons.length > 1;
        if (isConfirm) {
          const result = window.confirm(`${title}\n\n${message}`);
          if (result && okAction && okAction.onPress) {
            okAction.onPress();
          }
        } else {
          window.alert(`${title}\n\n${message}`);
          if (okAction && okAction.onPress) {
            okAction.onPress();
          }
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      showAlert(title, message, buttons);
    }
  };

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, registry, log
  const [activeFlock, setActiveFlock] = useState('1st Flock');
  const [flocksList, setFlocksList] = useState(['1st Flock', '2nd Flock']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEidOnly, setShowEidOnly] = useState(false);
  const [selectedCattleTag, setSelectedCattleTag] = useState(null);

  // Data States
  const [kpis, setKpis] = useState({
    totalPurchaseCost: 0,
    totalFeedCost: 0,
    totalOtherExpenses: 0,
    totalRevenue: 0,
    netProfitLoss: 0,
    totalHerdCount: 0,
    activeCattle: 0,
    soldCattle: 0,
    totalWeightGain: 0,
    totalActiveWeight: 0
  });
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cachedItemsCount, setCachedItemsCount] = useState(0);

  // Modal States
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [cattleModalVisible, setCattleModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [fullscreenImageVisible, setFullscreenImageVisible] = useState(false);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');

  // Form Inputs
  const [weightForm, setWeightForm] = useState({ tagId: '', weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [cattleForm, setCattleForm] = useState({ tagId: '', breed: '', gender: 'Steer', purchaseDate: new Date().toISOString().split('T')[0], purchaseWeight: '', purchasePrice: '', isEidHold: false });
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'Feed', category: 'Transport', feedType: 'Cattle Feed Wanda (Concentrate)', quantityFed: '', unitCost: '', amount: '', tagId: '', description: '', notes: '' });
  const [sellForm, setSellForm] = useState({ tagId: '', saleDate: new Date().toISOString().split('T')[0], saleWeight: '', salePrice: '' });

  // Initial Fetch & Local Cache Check
  useEffect(() => {
    fetchData();
    checkOfflineCache();
  }, [activeFlock]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Test backend connection
      const flocksRes = await axios.get(`${API_URL}/flocks`, { timeout: 15000 });
      setIsOnline(true);
      if (flocksRes.data.success) {
        setFlocksList(flocksRes.data.flocks);
        await AsyncStorage.setItem('flocksList', JSON.stringify(flocksRes.data.flocks));
      }

      const dashRes = await axios.get(`${API_URL}/dashboard?flock=${activeFlock}`);
      if (dashRes.data.success) {
        setKpis(dashRes.data.metrics);
        await AsyncStorage.setItem(`kpis_${activeFlock}`, JSON.stringify(dashRes.data.metrics));
      }

      const cattleRes = await axios.get(`${API_URL}/cattle?flock=${activeFlock}`);
      if (cattleRes.data.success) {
        setCattle(cattleRes.data.cattle);
        await AsyncStorage.setItem(`cattle_${activeFlock}`, JSON.stringify(cattleRes.data.cattle));
      }
    } catch (error) {
      console.log('API connection failed, loading offline fallback.', error);
      setIsOnline(false);
      loadOfflineData();
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = async () => {
    try {
      const offlineKpis = await AsyncStorage.getItem(`kpis_${activeFlock}`);
      const offlineCattle = await AsyncStorage.getItem(`cattle_${activeFlock}`);
      const offlineFlocks = await AsyncStorage.getItem('flocksList');
      if (offlineKpis) setKpis(JSON.parse(offlineKpis));
      if (offlineCattle) setCattle(JSON.parse(offlineCattle));
      if (offlineFlocks) setFlocksList(JSON.parse(offlineFlocks));
    } catch (e) {
      console.error('Error loading cached data', e);
    }
  };

  const checkOfflineCache = async () => {
    try {
      const queue = await AsyncStorage.getItem('sync_queue');
      const parsed = queue ? JSON.parse(queue) : [];
      setCachedItemsCount(parsed.length);
    } catch (e) {
      console.error(e);
    }
  };

  // Queue data locally if offline, else POST immediately
  const handlePostRequest = async (endpoint, data, successMsg) => {
    if (!isOnline) {
      try {
        const queue = await AsyncStorage.getItem('sync_queue');
        const parsed = queue ? JSON.parse(queue) : [];
        parsed.push({ endpoint, data, timestamp: Date.now() });
        await AsyncStorage.setItem('sync_queue', JSON.stringify(parsed));
        setCachedItemsCount(parsed.length);
        showAlert('Offline Mode', 'Record saved locally. It will sync automatically when online.');
        return true;
      } catch (e) {
        showAlert('Error', 'Failed to save offline log.');
        return false;
      }
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/${endpoint}`, data);
      if (res.data.success) {
        showAlert('Success', successMsg);
        fetchData();
        return true;
      } else {
        showAlert('Error', res.data.error || 'Request failed.');
        return false;
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.success === false) {
        showAlert('Error', e.response.data.error || 'Request failed.');
        return false;
      }
      showAlert('Error', 'Network request failed. Saved locally.');
      setIsOnline(false);
      // Fallback save to offline queue
      try {
        const queue = await AsyncStorage.getItem('sync_queue');
        const parsed = queue ? JSON.parse(queue) : [];
        parsed.push({ endpoint, data, timestamp: Date.now() });
        await AsyncStorage.setItem('sync_queue', JSON.stringify(parsed));
        setCachedItemsCount(parsed.length);
      } catch (cacheErr) {
        console.error('Failed to save offline log', cacheErr);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const syncCachedData = async () => {
    try {
      const queue = await AsyncStorage.getItem('sync_queue');
      const parsed = queue ? JSON.parse(queue) : [];
      if (parsed.length === 0) {
        showAlert('Synced', 'No offline logs to sync.');
        return;
      }

      setLoading(true);
      let successCount = 0;
      for (const item of parsed) {
        try {
          const res = await axios.post(`${API_URL}/${item.endpoint}`, item.data);
          if (res.data.success) successCount++;
        } catch (err) {
          console.error('Failed to sync item:', item, err);
        }
      }

      const remaining = parsed.slice(successCount);
      await AsyncStorage.setItem('sync_queue', JSON.stringify(remaining));
      setCachedItemsCount(remaining.length);
      
      showAlert('Sync Finished', `Successfully synced ${successCount} records.`);
      fetchData();
    } catch (e) {
      showAlert('Sync Error', 'An error occurred during synchronization.');
    } finally {
      setLoading(false);
    }
  };

  // Upload photo directly from details page
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
  const deleteCattle = async (tagId) => {
    showAlert(
      'Delete Cattle Record',
      `Are you sure you want to permanently delete animal ${tagId}? This will clear its registry information and weight history from Excel.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await axios.delete(`${API_URL}/cattle/${tagId}`);
              if (res.data.success) {
                showAlert('Deleted', `Animal ${tagId} successfully deleted.`);
                setSelectedCattleTag(null);
                fetchData();
              } else {
                showAlert('Error', res.data.error || 'Failed to delete animal.');
              }
            } catch (err) {
              showAlert('Error', 'Network request failed. Unable to delete animal.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Submit handlers
  const submitWeight = async () => {
    if (loading) return;
    if (!weightForm.tagId || !weightForm.weight) {
      showAlert('Error', 'Please enter Tag ID and Weight.');
      return;
    }
    const success = await handlePostRequest('weight/log', {
      weighDate: weightForm.date,
      tagId: weightForm.tagId,
      currentWeight: weightForm.weight,
      notes: weightForm.notes
    }, `Weight logged for ${weightForm.tagId}`);

    if (success) {
      setWeightModalVisible(false);
      setWeightForm({ tagId: '', weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
    }
  };

  const submitCattle = async () => {
    if (loading) return;
    if (!cattleForm.tagId || !cattleForm.purchaseWeight || !cattleForm.purchasePrice) {
      showAlert('Error', 'Please fill all required fields.');
      return;
    }
    const success = await handlePostRequest('cattle/register', {
      tagId: cattleForm.tagId,
      breed: cattleForm.breed,
      gender: cattleForm.gender,
      purchaseDate: cattleForm.purchaseDate,
      purchaseWeight: cattleForm.purchaseWeight,
      purchasePrice: cattleForm.purchasePrice,
      isEidHold: cattleForm.isEidHold
    }, `Registered animal ${cattleForm.tagId}`);

    if (success) {
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
    }
  };

  const submitSell = async () => {
    if (loading) return;
    if (!sellForm.tagId || !sellForm.salePrice) {
      showAlert('Error', 'Please fill Tag ID and Sale Price.');
      return;
    }
    const success = await handlePostRequest('cattle/sell', {
      tagId: sellForm.tagId,
      saleDate: sellForm.saleDate,
      saleWeight: sellForm.saleWeight,
      salePrice: sellForm.salePrice
    }, `Animal ${sellForm.tagId} marked as Sold`);

    if (success) {
      setSellModalVisible(false);
      fetchData();
      setSelectedCattleTag(null);
    }
  };

  const toggleEidHold = async (tagId, newVal) => {
    if (loading) return;
    const success = await handlePostRequest('cattle/toggle-eid', {
      tagId,
      isEidHold: newVal
    }, `Updated Eid Hold status for ${tagId}`);
  };

  const submitExpense = async () => {
    if (loading) return;
    if (expenseForm.type === 'Feed') {
      if (!expenseForm.quantityFed || !expenseForm.unitCost) {
        showAlert('Error', 'Please fill Quantity and Unit Cost.');
        return;
      }
      const success = await handlePostRequest('feed/log', {
        date: expenseForm.date,
        feedType: expenseForm.feedType,
        quantityFed: expenseForm.quantityFed,
        unitCost: expenseForm.unitCost,
        notes: expenseForm.notes
      }, 'Feed logged successfully');
      if (success) expenseModalVisible(false);
    } else {
      if (!expenseForm.amount) {
        showAlert('Error', 'Please enter Amount.');
        return;
      }
      const success = await handlePostRequest('expenses/log', {
        date: expenseForm.date,
        category: expenseForm.category,
        tagId: expenseForm.tagId,
        description: expenseForm.description,
        amount: expenseForm.amount
      }, 'Expense logged successfully');
      if (success) expenseModalVisible(false);
    }
  };

  // Helper ADG Calculator for live input
  const getLiveADG = (tagId, newWt) => {
    if (!tagId || !newWt) return '0.00';
    const animal = cattle.find(c => c.tagId === tagId);
    if (!animal) return '0.00';
    
    const prevWt = animal.currentWeight || animal.purchaseWeight;
    const diff = Number(newWt) - prevWt;
    const days = 7; // Default interval or days fed
    return (diff / days).toFixed(2);
  };

  // Helper to pick image on Web browser
  const [selectedFile, setSelectedFile] = useState(null);
  const pickImageWeb = () => {
    if (Platform.OS !== 'web') {
      showAlert('Mobile Photo', 'Image upload is optimized for the web dashboard.');
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

  // RENDER: CATTLE COMPLETE DETAIL PAGE (SUB-VIEW)
  const selectedCattle = cattle.find(c => c.tagId === selectedCattleTag);

  if (selectedCattleTag) {
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={fetchData} style={{ padding: 8, marginRight: 8 }} activeOpacity={0.7}>
              <RefreshCw size={16} color="#059669" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCattle(selectedCattleTag)} style={styles.deleteHeaderBtn}>
              <Text style={styles.deleteHeaderBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? <ActivityIndicator size="large" color="#059669" style={styles.loader} /> : null}

        {selectedCattle ? (
          <ScrollView contentContainerStyle={styles.detailScroll}>
            {/* Animal Photo banner */}
            <View style={styles.detailImageContainer}>
              {selectedCattle.imagePath !== '' ? (
                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <TouchableOpacity activeOpacity={0.95} onPress={() => setFullscreenImageVisible(true)} style={{ width: '100%', height: '100%' }}>
                    <Image
                      source={{
                        uri: `${BASE_URL}/images/${selectedCattle.imagePath}`,
                        headers: { 'Bypass-Tunnel-Reminder': 'true' }
                      }}
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  {selectedCattle.status === 'Sold' && (
                    <View style={styles.detailSoldOverlay}>
                      <Text style={styles.detailSoldText}>SOLD</Text>
                    </View>
                  )}
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
            </View>

            {/* General Info block */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>General Registry Details</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Tag ID</Text>
                  <Text style={styles.detailVal}>{selectedCattle.tagId}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailVal, { color: selectedCattle.status === 'Active' ? '#059669' : '#0284c7' }]}>
                    {selectedCattle.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Breed</Text>
                  <Text style={styles.detailVal}>{selectedCattle.breed}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailVal}>{selectedCattle.gender}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purchase Date</Text>
                  <Text style={styles.detailVal}>{selectedCattle.purchaseDate}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purchase Price</Text>
                  <Text style={styles.detailVal}>Rs. {selectedCattle.purchasePrice ? selectedCattle.purchasePrice.toLocaleString() : '0'}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleEidHold(selectedCattle.tagId, !selectedCattle.isEidHold)}
                style={[
                  styles.checkboxContainer,
                  selectedCattle.isEidHold ? styles.checkboxActive : null,
                  { marginTop: 12 }
                ]}
              >
                <Heart
                  size={16}
                  color={selectedCattle.isEidHold ? "#ffffff" : "#059669"}
                  fill={selectedCattle.isEidHold ? "#ffffff" : "transparent"}
                />
                <Text style={[styles.checkboxLabel, selectedCattle.isEidHold ? { color: '#ffffff' } : null]}>
                  {selectedCattle.isEidHold ? ' Saved & Caring for Next Eid' : ' Hold for Next Eid'}
                </Text>
              </TouchableOpacity>

              {selectedCattle.status === 'Active' ? (
                <TouchableOpacity
                  onPress={() => {
                    setSellForm({
                      tagId: selectedCattle.tagId,
                      saleDate: new Date().toISOString().split('T')[0],
                      saleWeight: selectedCattle.currentWeight ? selectedCattle.currentWeight.toString() : '',
                      salePrice: ''
                    });
                    setSellModalVisible(true);
                  }}
                  style={styles.sellBtn}
                >
                  <Text style={styles.sellBtnText}>💰 Mark as Sold</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.soldDetailBox}>
                  <Text style={styles.soldDetailTitle}>Sold Summary</Text>
                  <View style={styles.soldDetailRow}>
                    <View style={styles.soldDetailCol}>
                      <Text style={styles.soldDetailLabel}>Sale Date</Text>
                      <Text style={styles.soldDetailVal}>{selectedCattle.saleDate}</Text>
                    </View>
                    <View style={styles.soldDetailCol}>
                      <Text style={styles.soldDetailLabel}>Sale Weight</Text>
                      <Text style={styles.soldDetailVal}>{selectedCattle.saleWeight} kg</Text>
                    </View>
                    <View style={styles.soldDetailCol}>
                      <Text style={styles.soldDetailLabel}>Sale Price</Text>
                      <Text style={styles.soldDetailVal}>Rs. {selectedCattle.salePrice ? selectedCattle.salePrice.toLocaleString() : '0'}</Text>
                    </View>
                  </View>
                  <View style={[styles.soldDetailRow, { borderTopWidth: 1, borderColor: '#cbd5e1', paddingTop: 8, marginTop: 8 }]}>
                    <View style={styles.soldDetailCol}>
                      <Text style={styles.soldDetailLabel}>Net Profit/Loss</Text>
                      <Text style={[styles.soldDetailVal, { fontSize: 15, color: (selectedCattle.salePrice - ((selectedCattle.purchasePrice || 0) + (selectedCattle.allocatedFeedCost || 0) + (selectedCattle.medicalCost || 0))) >= 0 ? '#059669' : '#dc2626' }]}>
                        Rs. {(selectedCattle.salePrice - ((selectedCattle.purchasePrice || 0) + (selectedCattle.allocatedFeedCost || 0) + (selectedCattle.medicalCost || 0))).toLocaleString(undefined, {maximumFractionDigits:0})}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Growth & Weight history */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Weight & Average Daily Gain (ADG)</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purchase Weight</Text>
                  <Text style={styles.detailVal}>{selectedCattle.purchaseWeight} kg</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Latest Weight</Text>
                  <Text style={styles.detailVal}>{selectedCattle.currentWeight} kg</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Live Gain</Text>
                  <Text style={[styles.detailVal, { color: selectedCattle.currentWeight >= selectedCattle.purchaseWeight ? '#059669' : '#dc2626' }]}>
                    {selectedCattle.currentWeight - selectedCattle.purchaseWeight} kg
                  </Text>
                </View>
              </View>

              {/* Weight Log timeline list */}
              <Text style={styles.logSubTitle}>Weigh-in History Timeline</Text>
              {selectedCattle.weightHistory && selectedCattle.weightHistory.length > 0 ? (
                selectedCattle.weightHistory.map((item, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyWt}>{item.weight} kg</Text>
                    <Text style={[styles.historyAdg, { color: item.adg >= 0 ? '#059669' : '#dc2626' }]}>
                      {item.adg} ADG (kg/d)
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No weigh-in logs found. Click 'Log Wt' below to add one.</Text>
              )}
            </View>

            {/* Financial Overhead breakdown */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Expense & Cost Summary</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Allocated Feed Cost</Text>
                  <Text style={styles.detailVal}>Rs. {selectedCattle.allocatedFeedCost ? selectedCattle.allocatedFeedCost.toLocaleString(undefined, {maximumFractionDigits:0}) : '0'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Direct / Veterinary Cost</Text>
                  <Text style={styles.detailVal}>Rs. {selectedCattle.medicalCost ? selectedCattle.medicalCost.toLocaleString() : '0'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 10, marginTop: 10 }]}>
                <View style={styles.detailCol}>
                  <Text style={[styles.detailLabel, { fontWeight: 'bold' }]}>Total Cost Base</Text>
                  <Text style={[styles.detailVal, { fontSize: 16, color: '#065f46' }]}>
                    Rs. {((selectedCattle.purchasePrice || 0) + (selectedCattle.allocatedFeedCost || 0) + (selectedCattle.medicalCost || 0)).toLocaleString(undefined, {maximumFractionDigits:0})}
                  </Text>
                </View>
              </View>
            </View>

          </ScrollView>
        ) : (
          <View style={styles.centered}>
            <Text style={{ color: '#0f172a' }}>Cattle details could not be loaded.</Text>
          </View>
        )}

        {/* MODAL: FULLSCREEN IMAGE VIEWER */}
        <Modal visible={fullscreenImageVisible} transparent animationType="fade" onRequestClose={() => setFullscreenImageVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.fullscreenOverlay} onPress={() => setFullscreenImageVisible(false)}>
            <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setFullscreenImageVisible(false)}>
              <Text style={styles.fullscreenCloseText}>✕ Close</Text>
            </TouchableOpacity>
            {selectedCattle && selectedCattle.imagePath ? (
              <Image
                source={{
                  uri: `${BASE_URL}/images/${selectedCattle.imagePath}`,
                  headers: { 'Bypass-Tunnel-Reminder': 'true' }
                }}
                style={styles.fullscreenImage}
                resizeMode="cover"
              />
            ) : null}
          </TouchableOpacity>
        </Modal>

        {/* MODAL: MARK AS SOLD */}
        <Modal visible={sellModalVisible} animationType="slide" transparent>
          <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={() => setSellModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Mark Animal as Sold</Text>
              
              <Text style={styles.inputLabel}>Tag ID</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: '#e2e8f0' }]}
                value={sellForm.tagId}
                editable={false}
              />

              <Text style={styles.inputLabel}>Sale Price (Rs.) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 150000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={sellForm.salePrice}
                onChangeText={text => setSellForm({ ...sellForm, salePrice: text })}
              />

              <Text style={styles.inputLabel}>Sale Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 280"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={sellForm.saleWeight}
                onChangeText={text => setSellForm({ ...sellForm, saleWeight: text })}
              />

              <Text style={styles.inputLabel}>Sale Date</Text>
              <TextInput
                style={styles.textInput}
                value={sellForm.saleDate}
                onChangeText={text => setSellForm({ ...sellForm, saleDate: text })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setSellModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitSell} style={[styles.saveBtn, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.saveBtnText}>Record Sale</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e6f4ea" />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>MM CATTLE FARM</Text>
          <Text style={styles.subLogoText}>Feedlot & Eid Fattening</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={fetchData} activeOpacity={0.7} style={[styles.statusBadge, { backgroundColor: isOnline ? '#d1fae5' : '#fee2e2' }]}>
            <Text style={[styles.statusText, { color: isOnline ? '#065f46' : '#991b1b' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={fetchData} 
            style={{ padding: 6, backgroundColor: '#f0fdf4', borderRadius: 20, borderWidth: 1, borderColor: '#d1fae5', marginLeft: 6 }} 
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color="#047857" />
          </TouchableOpacity>
          {cachedItemsCount > 0 ? (
            <TouchableOpacity onPress={syncCachedData} style={[styles.syncBtn, { marginLeft: 6 }]}>
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.syncBtnText}>{cachedItemsCount}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* COMBINED TOP NAVIGATION ROW */}
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
      </View>

      {loading ? <ActivityIndicator size="large" color="#10b981" style={styles.loader} /> : null}

      {/* MAIN CONTENT VIEW */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <View>
            {/* KPI GRID */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Scale size={24} color="#059669" />
                <Text style={styles.kpiLabel}>Herd Count</Text>
                <Text style={styles.kpiValue}>{kpis.totalHerdCount} Head</Text>
                <Text style={styles.kpiSub}>{kpis.activeCattle} Active / {kpis.soldCattle} Sold</Text>
              </View>

              <View style={styles.kpiCard}>
                <Scale size={24} color="#0284c7" />
                <Text style={styles.kpiLabel}>Total Active Weight</Text>
                <Text style={styles.kpiValue}>{kpis.totalActiveWeight ? kpis.totalActiveWeight.toLocaleString() : 0} kg</Text>
                <Text style={styles.kpiSub}>Active herd weight</Text>
              </View>

              <View style={styles.kpiCard}>
                <Activity size={24} color="#0891b2" />
                <Text style={styles.kpiLabel}>Average Weight</Text>
                <Text style={styles.kpiValue}>{kpis.activeCattle > 0 ? Math.round(kpis.totalActiveWeight / kpis.activeCattle) : 0} kg</Text>
                <Text style={styles.kpiSub}>Avg size per active head</Text>
              </View>

              <View style={styles.kpiCard}>
                <TrendingUp size={24} color="#059669" />
                <Text style={styles.kpiLabel}>Total Weight Gain</Text>
                <Text style={[styles.kpiValue, { color: kpis.totalWeightGain >= 0 ? '#059669' : '#dc2626' }]}>
                  {kpis.totalWeightGain} kg
                </Text>
                <Text style={styles.kpiSub}>Across active batch</Text>
              </View>

              <View style={styles.kpiCard}>
                <Image source={require('./assets/rs_sack.png')} style={{ width: 28, height: 28, marginBottom: 4 }} resizeMode="contain" />
                <Text style={styles.kpiLabel}>Total Expenses</Text>
                <Text style={styles.kpiValue}>Rs. {(kpis.totalFeedCost + kpis.totalOtherExpenses).toLocaleString()}</Text>
                <Text style={styles.kpiSub}>Feed + Ops (Corrected)</Text>
              </View>

              <View style={styles.kpiCard}>
                <ShoppingBag size={24} color="#7c3aed" />
                <Text style={styles.kpiLabel}>Total Sold</Text>
                <Text style={styles.kpiValue}>{kpis.soldCattle} Head</Text>
                <Text style={styles.kpiSub}>Cattle sold to date</Text>
              </View>

              <View style={styles.kpiCard}>
                <DollarSign size={24} color="#059669" />
                <Text style={styles.kpiLabel}>Total Revenue</Text>
                <Text style={styles.kpiValue}>Rs. {kpis.totalRevenue ? kpis.totalRevenue.toLocaleString() : '0'}</Text>
                <Text style={styles.kpiSub}>From sold registry</Text>
              </View>

              <View style={styles.kpiCard}>
                <Briefcase size={24} color="#059669" />
                <Text style={styles.kpiLabel}>Net Position</Text>
                <Text style={[styles.kpiValue, { color: kpis.netProfitLoss >= 0 ? '#059669' : '#dc2626' }]}>
                  Rs. {kpis.netProfitLoss.toLocaleString()}
                </Text>
                <Text style={styles.kpiSub}>Revenue - Total costs</Text>
              </View>
            </View>

            {/* EXPENSE BREAKDOWN BAR */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
              <View style={styles.barContainer}>
                <View style={[styles.barSegment, { flex: kpis.totalPurchaseCost || 1, backgroundColor: '#059669' }]} />
                <View style={[styles.barSegment, { flex: kpis.totalFeedCost || 1, backgroundColor: '#10b981' }]} />
                <View style={[styles.barSegment, { flex: kpis.totalOtherExpenses || 1, backgroundColor: '#34d399' }]} />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#059669' }]} /><Text style={styles.legendText}>Cattle Purchase (Rs. {kpis.totalPurchaseCost.toLocaleString()})</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#10b981' }]} /><Text style={styles.legendText}>Feed Consumption (Rs. {kpis.totalFeedCost.toLocaleString()})</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#34d399' }]} /><Text style={styles.legendText}>Operational Costs (Rs. {kpis.totalOtherExpenses.toLocaleString()})</Text></View>
              </View>
            </View>

            {/* EID countdown */}
            <View style={[styles.sectionCard, styles.eidAlert]}>
              <Heart size={20} color="#059669" />
              <View style={styles.eidAlertText}>
                <Text style={styles.eidAlertTitle}>Next Eid-ul-Adha Holding Batch</Text>
                <Text style={styles.eidAlertDesc}>Premium animals selected for long-term growth are tracked here for special feeding and health protocols.</Text>
              </View>
            </View>
          </View>
        )}

        {/* REGISTRY TAB */}
        {activeTab === 'registry' && (
          <View>
            {/* SEARCH AND FILTERS */}
            <View style={styles.filterContainer}>
              <View style={styles.searchBar}>
                <Search size={18} color="#047857" />
                <TextInput
                  placeholder="Search Tag ID..."
                  placeholderTextColor="#64748b"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <View style={styles.filterButtonRow}>
                <TouchableOpacity
                  onPress={() => setStatusFilter('Active')}
                  style={[styles.filterChip, statusFilter === 'Active' && styles.activeFilterChip, { marginRight: 6 }]}
                >
                  <Text style={[styles.filterChipText, statusFilter === 'Active' && styles.activeFilterChipText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStatusFilter('Sold')}
                  style={[styles.filterChip, statusFilter === 'Sold' && styles.activeFilterChip, { marginRight: 6 }]}
                >
                  <Text style={[styles.filterChipText, statusFilter === 'Sold' && styles.activeFilterChipText]}>Sold</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setStatusFilter('EidHold')}
                  style={[styles.filterChip, statusFilter === 'EidHold' && styles.activeFilterChip]}
                >
                  <Heart size={12} color={statusFilter === 'EidHold' ? '#ffffff' : '#059669'} fill={statusFilter === 'EidHold' ? '#ffffff' : 'transparent'} />
                  <Text style={[styles.filterChipText, statusFilter === 'EidHold' && styles.activeFilterChipText]}> Eid Hold</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CATTLE LIST */}
            {cattle
              .filter(c => {
                if (statusFilter === 'Active') return c.status === 'Active';
                if (statusFilter === 'Sold') return c.status === 'Sold';
                if (statusFilter === 'EidHold') return c.status === 'Active' && c.isEidHold;
                return true;
              })
              .filter(c => {
                const tagStr = c.tagId ? c.tagId.toString().toLowerCase() : '';
                return tagStr.includes(searchQuery.toLowerCase());
              })
              .map(c => (
                <View key={c.tagId} style={styles.cattleCard}>
                  <View style={styles.cattleCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ position: 'relative', marginRight: 10 }}>
                        {c.imagePath !== '' ? (
                          <Image
                            source={{
                              uri: `${BASE_URL}/images/${c.imagePath}`,
                              headers: { 'Bypass-Tunnel-Reminder': 'true' }
                            }}
                            style={[styles.cattleThumbnail, { marginRight: 0 }]}
                          />
                        ) : (
                          <View style={[styles.cattleThumbnail, styles.cattleThumbnailEmpty, { marginRight: 0 }]}>
                            <Camera size={18} color="#047857" />
                          </View>
                        )}
                        {c.status === 'Sold' && (
                          <View style={styles.thumbnailSoldOverlay}>
                            <Text style={styles.thumbnailSoldText}>SOLD</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.tagBlock}>
                        <Text style={styles.tagText}>{c.tagId}</Text>
                        <Text style={styles.breedText}>{c.breed} • {c.gender}</Text>
                      </View>
                    </View>
                    <View style={styles.statusBlock}>
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
                  </View>

                  <View style={styles.cattleInfoRow}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Purchase Wt</Text>
                      <Text style={styles.infoVal}>{c.purchaseWeight} kg</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Current Wt</Text>
                      <Text style={styles.infoVal}>{c.currentWeight} kg</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Live Gain</Text>
                      <Text style={[styles.infoVal, { color: c.currentWeight >= c.purchaseWeight ? '#059669' : '#dc2626' }]}>
                        {c.currentWeight - c.purchaseWeight} kg
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedCattleTag(c.tagId)} style={styles.cardFooter}>
                    <Text style={styles.costText}>Cost: Rs. {c.purchasePrice ? c.purchasePrice.toLocaleString() : '0'}</Text>
                    <ChevronRight size={18} color="#047857" />
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

      </ScrollView>

      {/* FIXED BOTTOM ACTION BAR (BOTTOM LAYER) */}
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
          <Image source={require('./assets/rs_notes.png')} style={{ width: 24, height: 16, marginRight: 3 }} resizeMode="contain" />
          <Text style={styles.barActionText}>Expense</Text>
        </TouchableOpacity>
      </View>



      {/* MODAL: WEIGHT LOGGING */}
      <Modal visible={weightModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Weigh-In</Text>
            
            <Text style={styles.inputLabel}>Tag ID *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. TAG-101"
              placeholderTextColor="#94a3b8"
              value={weightForm.tagId}
              onChangeText={text => setWeightForm({ ...weightForm, tagId: text })}
            />

            <Text style={styles.inputLabel}>Current Weight (kg) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 250"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={weightForm.weight}
              onChangeText={text => setWeightForm({ ...weightForm, weight: text })}
            />

            {weightForm.tagId !== '' && weightForm.weight !== '' ? (
              <View style={styles.liveCalculationBox}>
                <Text style={styles.liveCalcText}>
                  Est. Daily Gain (ADG): <Text style={styles.adgHighlight}>{getLiveADG(weightForm.tagId, weightForm.weight)} kg/day</Text>
                </Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={weightForm.date}
              onChangeText={text => setWeightForm({ ...weightForm, date: text })}
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Fattening mix progress..."
              placeholderTextColor="#94a3b8"
              value={weightForm.notes}
              onChangeText={text => setWeightForm({ ...weightForm, notes: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setWeightModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitWeight} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD CATTLE */}
      <Modal visible={cattleModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Register New Cattle</Text>
              
              <Text style={styles.inputLabel}>Tag ID *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. TAG-138"
                placeholderTextColor="#94a3b8"
                value={cattleForm.tagId}
                onChangeText={text => setCattleForm({ ...cattleForm, tagId: text })}
              />

              <Text style={styles.inputLabel}>Breed *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Sahiwal, Cholistani, Dhanni..."
                placeholderTextColor="#94a3b8"
                value={cattleForm.breed}
                onChangeText={text => setCattleForm({ ...cattleForm, breed: text })}
              />

              <Text style={styles.inputLabel}>Purchase Weight (kg) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="210"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={cattleForm.purchaseWeight}
                onChangeText={text => setCattleForm({ ...cattleForm, purchaseWeight: text })}
              />

              <Text style={styles.inputLabel}>Purchase Price (Rs.) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="145000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={cattleForm.purchasePrice}
                onChangeText={text => setCattleForm({ ...cattleForm, purchasePrice: text })}
              />

              <TouchableOpacity
                onPress={() => setCattleForm({ ...cattleForm, isEidHold: !cattleForm.isEidHold })}
                style={[styles.checkboxContainer, cattleForm.isEidHold && styles.checkboxActive]}
              >
                <Heart size={16} color={cattleForm.isEidHold ? '#ffffff' : '#059669'} />
                <Text style={styles.checkboxLabel}> Hold & Care for Next Eid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImageWeb}
                style={styles.uploadPhotoBtn}
              >
                <Camera size={16} color="#ffffff" />
                <Text style={styles.uploadPhotoBtnText}>
                  {selectedFile ? `Photo: ${selectedFile.name}` : ' Upload Animal Photo'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setCattleModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitCattle} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: EXPENSE LOGGER */}
      <Modal visible={expenseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Log Expense / Feed</Text>

              {/* Selector Feed vs Ops */}
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  onPress={() => setExpenseForm({ ...expenseForm, type: 'Feed' })}
                  style={[styles.typeSelectorBtn, expenseForm.type === 'Feed' && styles.typeSelectorActive]}
                >
                  <Text style={styles.typeSelectorText}>Feed Consumption</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setExpenseForm({ ...expenseForm, type: 'Expense' })}
                  style={[styles.typeSelectorBtn, expenseForm.type === 'Expense' && styles.typeSelectorActive]}
                >
                  <Text style={styles.typeSelectorText}>Operating Expense</Text>
                </TouchableOpacity>
              </View>

              {expenseForm.type === 'Feed' ? (
                <View>
                  <Text style={styles.inputLabel}>Feed Type *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={expenseForm.feedType}
                    onChangeText={text => setExpenseForm({ ...expenseForm, feedType: text })}
                  />

                  <Text style={styles.inputLabel}>Quantity Fed (kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={expenseForm.quantityFed}
                    onChangeText={text => setExpenseForm({ ...expenseForm, quantityFed: text })}
                  />

                  <Text style={styles.inputLabel}>Unit Cost (Rs./kg) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 85"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={expenseForm.unitCost}
                    onChangeText={text => setExpenseForm({ ...expenseForm, unitCost: text })}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Transport, Veterinary, Labor..."
                    placeholderTextColor="#94a3b8"
                    value={expenseForm.category}
                    onChangeText={text => setExpenseForm({ ...expenseForm, category: text })}
                  />

                  <Text style={styles.inputLabel}>Amount (Rs.) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25000"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={expenseForm.amount}
                    onChangeText={text => setExpenseForm({ ...expenseForm, amount: text })}
                  />

                  <Text style={styles.inputLabel}>Target Tag ID (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. TAG-101"
                    placeholderTextColor="#94a3b8"
                    value={expenseForm.tagId}
                    onChangeText={text => setExpenseForm({ ...expenseForm, tagId: text })}
                  />

                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Veterinary doctor checkup..."
                    placeholderTextColor="#94a3b8"
                    value={expenseForm.description}
                    onChangeText={text => setExpenseForm({ ...expenseForm, description: text })}
                  />
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setExpenseModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitExpense} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Log Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Premium light-green mint background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#ffffff',
  },
  logoText: {
    color: '#065f46', // Slate dark green
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subLogoText: {
    color: '#047857',
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  topNavRow: {
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
  },
  flockChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  activeFlockChip: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  flockChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFlockChipText: {
    color: '#ffffff',
  },
  loader: {
    marginVertical: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  kpiLabel: {
    color: '#475569',
    fontSize: 12,
    marginTop: 6,
  },
  kpiValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  barContainer: {
    height: 10,
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#475569',
    fontSize: 11,
  },
  eidAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  eidAlertText: {
    marginLeft: 10,
    flex: 1,
  },
  eidAlertTitle: {
    color: '#047857',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eidAlertDesc: {
    color: '#065f46',
    fontSize: 11,
    marginTop: 2,
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    marginLeft: 8,
    fontSize: 14,
  },
  filterButtonRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterChip: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  cattleCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cattleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tagBlock: {},
  tagText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  breedText: {
    color: '#475569',
    fontSize: 12,
  },
  statusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  eidBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusIndicator: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  activeStatus: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  soldStatus: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  cattleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoCol: {},
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  infoVal: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 8,
  },
  costText: {
    color: '#475569',
    fontSize: 12,
  },
  bottomActionBar: {
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
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#bbf7d0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: {
    backgroundColor: '#f0fdf4',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#059669',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)', // Soft overlay
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalTitle: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  liveCalculationBox: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  liveCalcText: {
    color: '#065f46',
    fontSize: 12,
  },
  adgHighlight: {
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  checkboxActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
  },
  typeSelectorBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  typeSelectorActive: {
    backgroundColor: '#059669',
  },
  typeSelectorText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cattleThumbnail: {
    width: 45,
    height: 45,
    borderRadius: 8,
    marginRight: 10,
  },
  cattleThumbnailEmpty: {
    width: 45,
    height: 45,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
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
  },

  // DETAIL VIEW STYLING
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
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  fullscreenCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    cursor: 'pointer',
  },
  sellBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  soldDetailBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  soldDetailTitle: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  soldDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soldDetailCol: {
    flex: 1,
  },
  soldDetailLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  soldDetailVal: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  thumbnailSoldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  thumbnailSoldText: {
    color: '#dc2626',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  detailSoldOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 5,
  },
  detailSoldText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
