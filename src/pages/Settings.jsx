/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Moon, Globe } from 'lucide-react';
import { useAuth, useTheme, useLanguage } from '../context';
import { toast } from 'sonner';


export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currentLanguage, languages, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'language', label: 'Language', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          {t('profile.settings')}
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Profile Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.firstName}
                        className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.lastName}
                        className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white resize-none"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  <button 
                    onClick={() => toast.success('Profile updated')}
                    className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  {['Event reminders', 'New events', 'Updates', 'Marketing emails'].map((setting) => (
                    <label key={setting} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-slate-700 dark:text-slate-300">{setting}</span>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500" />
                    </label>
                  ))}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Theme
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'system', label: 'System', icon: '💻' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          theme === option.value
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium text-slate-900 dark:text-white">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Language
                  </h2>
                  <div className="space-y-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${
                          currentLanguage.code === lang.code
                            ? 'bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{lang.name}</span>
                        {currentLanguage.code === lang.code && (
                          <span className="ml-auto text-sky-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
