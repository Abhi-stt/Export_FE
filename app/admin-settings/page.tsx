"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Shield, Database, Bell, Users, Zap, Globe, Lock } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  dataRetention: string;
  timezone: string;
  currency: string;
  language: string;
  apiRateLimit: number;
  sessionDuration: number;
  maxFileUploadSize: string;
  databaseConnectionPool: number;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  passwordPolicy: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await apiClient.getSystemSettings();
        if (response.success && response.data?.settings) {
          setSettings(response.data.settings);
        } else {
          // Fallback to default settings if API doesn't return settings
          console.warn('API did not return settings, using defaults');
          const defaultSettings: SystemSettings = {
            emailNotifications: true,
            smsNotifications: false,
            maintenanceMode: false,
            autoBackup: true,
            dataRetention: '1-year',
            timezone: 'IST',
            currency: 'INR',
            language: 'en',
            apiRateLimit: 1000,
            sessionDuration: 24,
            maxFileUploadSize: '50MB',
            databaseConnectionPool: 10,
            twoFactorAuth: true,
            sessionTimeout: true,
            passwordPolicy: 'strong'
          };
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        // Fallback to default settings on error
        const defaultSettings: SystemSettings = {
          emailNotifications: true,
          smsNotifications: false,
          maintenanceMode: false,
          autoBackup: true,
          dataRetention: '1-year',
          timezone: 'IST',
          currency: 'INR',
          language: 'en',
          apiRateLimit: 1000,
          sessionDuration: 24,
          maxFileUploadSize: '50MB',
          databaseConnectionPool: 10,
          twoFactorAuth: true,
          sessionTimeout: true,
          passwordPolicy: 'strong'
        };
        setSettings(defaultSettings);
        setError('Could not connect to server. Showing default settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [mounted]);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    if (settings) {
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await apiClient.updateSystemSettings(settings);
      
      if (response.success) {
        toast({
          title: "Settings Updated",
          description: "System settings have been saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaultSettings: SystemSettings = {
      emailNotifications: true,
      smsNotifications: false,
      maintenanceMode: false,
      autoBackup: true,
      dataRetention: '1-year',
      timezone: 'IST',
      currency: 'INR',
      language: 'en',
      apiRateLimit: 1000,
      sessionDuration: 24,
      maxFileUploadSize: '50MB',
      databaseConnectionPool: 10,
      twoFactorAuth: true,
      sessionTimeout: true,
      passwordPolicy: 'strong'
    };
    setSettings(defaultSettings);
  };

  // Prevent hydration issues by not rendering until mounted
  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-red-600 mt-2">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-red-600 mt-2">No settings data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">System configuration and platform settings</p>
        {error && settings && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Connection Warning
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {error} Changes may not be saved until connection is restored.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-500" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Require 2FA for all users</p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth} 
                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
              </div>
              <Switch 
                checked={settings.sessionTimeout} 
                onCheckedChange={(checked) => handleSettingChange('sessionTimeout', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password Policy</Label>
              <Select 
                value={settings.passwordPolicy} 
                onValueChange={(value) => handleSettingChange('passwordPolicy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (8 characters)</SelectItem>
                  <SelectItem value="strong">Strong (12 characters)</SelectItem>
                  <SelectItem value="very-strong">Very Strong (16 characters)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-green-500" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Send email alerts</p>
              </div>
              <Switch 
                checked={settings.emailNotifications} 
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-500">Send SMS alerts</p>
              </div>
              <Switch 
                checked={settings.smsNotifications} 
                onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notification Email</Label>
              <Input placeholder="admin@company.com" defaultValue="admin@company.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-500" />
              System Settings
            </CardTitle>
            <CardDescription>Platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable platform</p>
              </div>
              <Switch 
                checked={settings.maintenanceMode} 
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Backup</Label>
                <p className="text-sm text-gray-500">Daily database backup</p>
              </div>
              <Switch 
                checked={settings.autoBackup} 
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Retention</Label>
              <Select 
                value={settings.dataRetention} 
                onValueChange={(value) => handleSettingChange('dataRetention', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="2-years">2 Years</SelectItem>
                  <SelectItem value="5-years">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-orange-500" />
              Regional Settings
            </CardTitle>
            <CardDescription>Localization and regional preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => handleSettingChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Standard Time</SelectItem>
                  <SelectItem value="PST">Pacific Standard Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => handleSettingChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Advanced Settings
          </CardTitle>
          <CardDescription>Advanced system configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Rate Limit</Label>
              <Input 
                placeholder="1000" 
                value={settings.apiRateLimit.toString()}
                onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value) || 1000)}
              />
              <p className="text-sm text-gray-500">Requests per hour per API key</p>
            </div>
            <div className="space-y-2">
              <Label>Session Duration</Label>
              <Input 
                placeholder="24" 
                value={settings.sessionDuration.toString()}
                onChange={(e) => handleSettingChange('sessionDuration', parseInt(e.target.value) || 24)}
              />
              <p className="text-sm text-gray-500">Hours before auto-logout</p>
            </div>
            <div className="space-y-2">
              <Label>Max File Upload Size</Label>
              <Input 
                placeholder="50MB" 
                value={settings.maxFileUploadSize}
                onChange={(e) => handleSettingChange('maxFileUploadSize', e.target.value)}
              />
              <p className="text-sm text-gray-500">Maximum file size for uploads</p>
            </div>
            <div className="space-y-2">
              <Label>Database Connection Pool</Label>
              <Input 
                placeholder="10" 
                value={settings.databaseConnectionPool.toString()}
                onChange={(e) => handleSettingChange('databaseConnectionPool', parseInt(e.target.value) || 10)}
              />
              <p className="text-sm text-gray-500">Number of database connections</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleResetToDefaults}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
