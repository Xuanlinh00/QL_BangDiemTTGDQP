import { useState, useEffect } from 'react'
import { settingsApi } from '../services/api'

interface Setting {
  _id: string
  key: string
  label: string
  value: string
  category: string
}

interface SettingsMap {
  [key: string]: string
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingsApi.list()
        const settingsArray: Setting[] = res.data.data || []
        
        // Convert array to map for easy access
        const settingsMap: SettingsMap = {}
        settingsArray.forEach(setting => {
          settingsMap[setting.key] = setting.value
        })
        
        setSettings(settingsMap)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const getSetting = (key: string, defaultValue: string = '') => {
    const value = settings[key] || defaultValue
    // Convert database marker to actual API URL
    if (value === 'database' && (key === 'logo_url' || key === 'banner_url' || key === 'home_banner_url')) {
      const imageType = key.replace('_url', '').replace('_', '-')
      return `/api/settings/${imageType}/image`
    }
    return value
  }

  return { settings, loading, getSetting }
}
