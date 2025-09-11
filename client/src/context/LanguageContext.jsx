import { createContext, useContext, useState, useEffect } from "react"

const LanguageContext = createContext()

// Translation keys and their values
const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.academies": "Academies", 
    "nav.matches": "Matches",
    "nav.jobs": "Job Opportunities",
    "nav.login": "Login",
    "nav.signup": "Sign Up",
    "nav.logout": "Logout",
    
    // Auth
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.phone": "Phone",
    "auth.loginButton": "Login",
    "auth.signupButton": "Sign Up",
    "auth.logoutButton": "Logout",
    "auth.invalidCredentials": "Invalid credentials",
    "auth.emailExists": "Email already exists",
    "auth.loginFailed": "Login failed",
    "auth.registrationFailed": "Registration failed",
    
    // Admin
    "admin.dashboard": "Dashboard",
    "admin.users": "Users",
    "admin.academies": "Academies",
    "admin.matches": "Matches",
    "admin.requests": "Player Requests",
    "admin.createAcademy": "Create Academy Account",
    "admin.panel": "Admin Panel",
    "admin.usersManagement": "Users Management",
    "admin.administrators": "Administrators",
    "admin.academyAccounts": "Academy Accounts",
    "admin.regularUsers": "Users",
    "admin.addUser": "Add User",
    "admin.delete": "Delete",
    "admin.noAdmins": "No administrators found",
    "admin.noAcademies": "No academy accounts found",
    "admin.noUsers": "No regular users found",
    
    // Academy
    "academy.dashboard": "Dashboard",
    "academy.players": "Players",
    "academy.matches": "Matches",
    "academy.requests": "Requests",
    "academy.analysis": "Analysis",
    "academy.jobs": "Jobs",
    "academy.panel": "Academy Panel",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.yes": "Yes",
    "common.no": "No",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.clear": "Clear",
    "common.submit": "Submit",
    "common.close": "Close",
    "common.open": "Open",
    "common.view": "View",
    "common.details": "Details",
    "common.status": "Status",
    "common.date": "Date",
    "common.time": "Time",
    "common.location": "Location",
    "common.description": "Description",
    "common.name": "Name",
    "common.email": "Email",
    "common.phone": "Phone",
    "common.role": "Role",
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.pending": "Pending",
    "common.approved": "Approved",
    "common.rejected": "Rejected",
    "common.failed": "Failed",
    "common.success": "Success",
    "common.warning": "Warning",
    "common.info": "Info",
    "common.notFound": "Not Found",
    "common.accessDenied": "Access Denied",
    "common.unauthorized": "Unauthorized",
    "common.forbidden": "Forbidden",
    "common.serverError": "Server Error",
    "common.networkError": "Network Error",
    "common.tryAgain": "Try Again",
    "common.refresh": "Refresh",
    "common.somethingWentWrong": "Something went wrong",
    "common.pleaseRefresh": "Please refresh the page. If the issue persists, try again later.",
    
    // Language
    "lang.english": "English",
    "lang.arabic": "العربية",
    "lang.switchTo": "Switch to",
  },
  ar: {
    // Navigation
    "nav.home": "الرئيسية",
    "nav.academies": "الأكاديميات",
    "nav.matches": "المباريات",
    "nav.jobs": "فرص العمل",
    "nav.login": "تسجيل الدخول",
    "nav.signup": "إنشاء حساب",
    "nav.logout": "تسجيل الخروج",
    
    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.name": "الاسم",
    "auth.phone": "رقم الهاتف",
    "auth.loginButton": "دخول",
    "auth.signupButton": "إنشاء حساب",
    "auth.logoutButton": "خروج",
    "auth.invalidCredentials": "بيانات الدخول غير صحيحة",
    "auth.emailExists": "البريد الإلكتروني موجود بالفعل",
    "auth.loginFailed": "فشل تسجيل الدخول",
    "auth.registrationFailed": "فشل إنشاء الحساب",
    
    // Admin
    "admin.dashboard": "لوحة التحكم",
    "admin.users": "المستخدمون",
    "admin.academies": "الأكاديميات",
    "admin.matches": "المباريات",
    "admin.requests": "طلبات اللاعبين",
    "admin.createAcademy": "إنشاء حساب أكاديمية",
    "admin.panel": "لوحة الإدارة",
    "admin.usersManagement": "إدارة المستخدمين",
    "admin.administrators": "المديرون",
    "admin.academyAccounts": "حسابات الأكاديميات",
    "admin.regularUsers": "المستخدمون",
    "admin.addUser": "إضافة مستخدم",
    "admin.delete": "حذف",
    "admin.noAdmins": "لا يوجد مديرون",
    "admin.noAcademies": "لا توجد حسابات أكاديميات",
    "admin.noUsers": "لا يوجد مستخدمون عاديون",
    
    // Academy
    "academy.dashboard": "لوحة التحكم",
    "academy.players": "اللاعبون",
    "academy.matches": "المباريات",
    "academy.requests": "الطلبات",
    "academy.analysis": "التحليل",
    "academy.jobs": "الوظائف",
    "academy.panel": "لوحة الأكاديمية",
    
    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "خطأ",
    "common.retry": "إعادة المحاولة",
    "common.cancel": "إلغاء",
    "common.save": "حفظ",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.confirm": "تأكيد",
    "common.yes": "نعم",
    "common.no": "لا",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.previous": "السابق",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.clear": "مسح",
    "common.submit": "إرسال",
    "common.close": "إغلاق",
    "common.open": "فتح",
    "common.view": "عرض",
    "common.details": "التفاصيل",
    "common.status": "الحالة",
    "common.date": "التاريخ",
    "common.time": "الوقت",
    "common.location": "الموقع",
    "common.description": "الوصف",
    "common.name": "الاسم",
    "common.email": "البريد الإلكتروني",
    "common.phone": "رقم الهاتف",
    "common.role": "الدور",
    "common.active": "نشط",
    "common.inactive": "غير نشط",
    "common.pending": "في الانتظار",
    "common.approved": "موافق عليه",
    "common.rejected": "مرفوض",
    "common.failed": "فشل",
    "common.success": "نجح",
    "common.warning": "تحذير",
    "common.info": "معلومات",
    "common.notFound": "غير موجود",
    "common.accessDenied": "الوصول مرفوض",
    "common.unauthorized": "غير مخول",
    "common.forbidden": "محظور",
    "common.serverError": "خطأ في الخادم",
    "common.networkError": "خطأ في الشبكة",
    "common.tryAgain": "حاول مرة أخرى",
    "common.refresh": "تحديث",
    "common.somethingWentWrong": "حدث خطأ ما",
    "common.pleaseRefresh": "يرجى تحديث الصفحة. إذا استمرت المشكلة، حاول مرة أخرى لاحقاً.",
    
    // Language
    "lang.english": "English",
    "lang.arabic": "العربية",
    "lang.switchTo": "التبديل إلى",
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get from localStorage or default to English
    return localStorage.getItem('dwarly-language') || 'en'
  })

  useEffect(() => {
    // Save to localStorage when language changes
    localStorage.setItem('dwarly-language', language)
    
    // Update document direction and lang attribute
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  const switchLanguage = (newLang) => {
    setLanguage(newLang)
  }

  return (
    <LanguageContext.Provider value={{ language, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
