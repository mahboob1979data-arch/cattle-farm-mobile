path = r'c:\Power BI\Farming\cattle_farm_mobile\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Define custom showAlert helper at the beginning of the App component
old_state_declarations = """  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, registry, log"""

new_state_declarations = """  // Custom Alert helper for Web compat
  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 0) {
        const okAction = buttons.find(b => b.style !== 'cancel') || buttons[0];
        const isConfirm = buttons.length > 1;
        if (isConfirm) {
          const result = window.confirm(`${title}\\n\\n${message}`);
          if (result && okAction && okAction.onPress) {
            okAction.onPress();
          }
        } else {
          window.alert(`${title}\\n\\n${message}`);
          if (okAction && okAction.onPress) {
            okAction.onPress();
          }
        }
      } else {
        window.alert(`${title}\\n\\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, registry, log"""

code = code.replace(old_state_declarations, new_state_declarations)

# 2. Replace Alert.alert with showAlert across the App component
code = code.replace('Alert.alert(', 'showAlert(')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Alert.alert successfully replaced with Web-compatible showAlert wrapper in App.js!")
