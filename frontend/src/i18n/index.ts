import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      settings: 'Settings',
      language: 'Language',
      theme: 'Theme',
      units: 'Distance Unit',
      notifications: 'Notifications',
      activityReminders: 'Activity reminders',
      activityRemindersDesc: 'Reminders before scheduled activities',
      chatNotifications: 'Chat notifications',
      chatNotificationsDesc: 'Notifications for new messages',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      km: 'Kilometers (km)',
      miles: 'Miles (mi)',
      general: 'General',
      appearance: 'Appearance',
      account: 'Account',
      privacy: 'Privacy',
      save: 'Save',
      saved: 'Saved',
      backToHome: 'Back to Home',
      backToLogin: 'Back to Login',
      // Login
      login: 'Login',
      loginTitle: 'Login',
      loginWelcome: 'Welcome back to Group Running App',
      email: 'Email',
      password: 'Password',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      keepLoggedIn: 'Keep me logged in',
      rememberEmail: 'Remember my email',
      loggingIn: 'Logging in...',
      invalidCredentials: 'Incorrect email or password',
      loginFailed: 'Login failed. Please try again later.',
      networkError: 'Unable to connect. Please check your network.',
      noAccount: "Don't have an account? Sign up",
      // Register
      register: 'Register',
      registerTitle: 'Register',
      registerWelcome: 'Join Group Running App to start your running journey',
      displayName: 'Display name',
      age: 'Age',
      passwordMinLength: 'At least 8 characters, letters and numbers',
      passwordRule: 'Password must contain letters and numbers',
      displayNameRequired: 'Display name is required',
      displayNameMin: 'Display name must be at least 2 characters',
      ageRequired: 'Age is required',
      ageRange: 'Must be 18 to 65 years old',
      termsRequired: 'You must agree to the terms of service',
      terms: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      agreeTermsPrefix: 'I agree to the ',
      agreeTermsMiddle: ' and ',
      registering: 'Registering...',
      duplicateEmail: 'This email is already registered',
      registerFailed: 'Registration failed. Please try again later.',
      registerSuccess: 'Registration successful! Please sign in.',
      haveAccount: 'Already have an account? Sign in',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      welcome: 'Welcome',
    },
  },
  'zh-TW': {
    translation: {
      settings: '設定',
      language: '語言',
      theme: '主題',
      units: '距離單位',
      notifications: '通知',
      activityReminders: '活動提醒',
      activityRemindersDesc: '活動開始前的提醒',
      chatNotifications: '聊天通知',
      chatNotificationsDesc: '新訊息的提醒',
      light: '淺色',
      dark: '深色',
      system: '跟隨系統',
      km: '公里 (km)',
      miles: '英里 (mi)',
      general: '一般',
      appearance: '外觀',
      account: '帳戶',
      privacy: '隱私',
      save: '儲存',
      saved: '已儲存',
      backToHome: '返回首頁',
      backToLogin: '返回登入',
      // Login
      login: '登入',
      loginTitle: '登入',
      loginWelcome: '歡迎回到 Group Running App',
      email: '電子郵件',
      password: '密碼',
      emailRequired: '電子郵件為必填',
      emailInvalid: '請輸入有效的電子郵件地址',
      passwordRequired: '密碼為必填',
      keepLoggedIn: '保持登入',
      rememberEmail: '記住帳號',
      loggingIn: '登入中...',
      invalidCredentials: '電子郵件或密碼不正確',
      loginFailed: '登入失敗，請稍後再試',
      networkError: '無法連接到伺服器，請檢查您的網路連線',
      noAccount: '還沒有帳戶？註冊',
      // Register
      register: '註冊',
      registerTitle: '註冊',
      registerWelcome: '加入 Group Running App 開始您的跑步之旅',
      displayName: '顯示名稱',
      age: '年齡',
      passwordMinLength: '至少 8 個字元，包含字母和數字',
      passwordRule: '密碼必須包含字母和數字',
      displayNameRequired: '顯示名稱為必填',
      displayNameMin: '顯示名稱至少需要 2 個字元',
      ageRequired: '年齡為必填',
      ageRange: '年齡必須在 18 到 65 歲之間',
      termsRequired: '您必須同意服務條款',
      terms: '服務條款',
      privacyPolicy: '隱私政策',
      agreeTermsPrefix: '我同意',
      agreeTermsMiddle: '和',
      registering: '註冊中...',
      duplicateEmail: '此電子郵件已被註冊',
      registerFailed: '註冊失敗，請稍後再試',
      registerSuccess: '註冊成功！請登入您的帳戶。',
      haveAccount: '已有帳戶？登入',
      showPassword: '顯示密碼',
      hidePassword: '隱藏密碼',
      welcome: '歡迎',
    },
  },
}

function getInitialLanguage(): 'en' | 'zh-TW' {
  const fromLang = localStorage.getItem('app-language') as 'en' | 'zh-TW' | null
  if (fromLang === 'en' || fromLang === 'zh-TW') return fromLang
  try {
    const settings = localStorage.getItem('app-settings')
    if (settings) {
      const parsed = JSON.parse(settings) as { language?: string }
      if (parsed.language === 'en' || parsed.language === 'zh-TW') return parsed.language
    }
  } catch {
    // ignore
  }
  return 'zh-TW'
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
