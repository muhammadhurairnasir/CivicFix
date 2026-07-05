'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import {
  User, Shield, Bell, AlertTriangle, Eye, EyeOff,
  CheckCircle, LogOut, FileText, ThumbsUp
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import AvatarUpload from '@/components/profile/AvatarUpload';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name:  z.string().min(2, 'At least 2 characters').max(50),
  phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  ward:  z.string().max(100).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

// ─── Toast helper ─────────────────────────────────────────────────────────────
function toast(msg: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = [
    'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-medium',
    'transition-all duration-300',
    type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
  ].join(' ');
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ─── Password Strength ────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];
  return { score: s, label: labels[s] ?? '', color: colors[s] ?? '' };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user: authUser, isLoading: authLoading, logout } = useAuth();

  const [tab, setTab]                   = useState('personal');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword]   = useState('');
  const [localAvatar, setLocalAvatar]     = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !authUser) router.replace('/login');
  }, [authUser, authLoading, router]);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['my-profile'],
    queryFn: () => axios.get('/api/users/me').then(r => r.data.data),
    enabled: !!authUser,
  });

  const { data: prefs } = useQuery<any>({
    queryKey: ['notification-prefs'],
    queryFn: () => axios.get('/api/users/me/notification-preferences').then(r => r.data.data),
    enabled: !!authUser,
  });

  // ─── Profile form ─────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '', ward: '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ name: profile.name, phone: profile.phone ?? '', ward: profile.ward ?? '' });
      if (!localAvatar) setLocalAvatar(profile.avatar);
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => axios.put('/api/users/me', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast('Profile updated successfully');
      profileForm.reset(profileForm.getValues());
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Failed to update', 'error'),
  });

  // ─── Password form ────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const newPw = passwordForm.watch('newPassword') ?? '';
  const strength = getStrength(newPw);

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) => axios.post('/api/users/me/change-password', data),
    onSuccess: async () => {
      toast('Password changed. Logging you out…');
      await new Promise(r => setTimeout(r, 1500));
      await logout();
      router.replace('/login');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Failed to change password', 'error'),
  });

  // ─── Notification prefs ───────────────────────────────────────────────────
  const prefsMutation = useMutation({
    mutationFn: (data: any) => axios.put('/api/users/me/notification-preferences', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
    onError: () => toast('Failed to save preferences', 'error'),
  });

  const handlePrefToggle = useCallback((channel: 'email' | 'push', key: string, value: boolean) => {
    prefsMutation.mutate({ [channel]: { [key]: value } });
  }, []);

  // ─── Sign out all devices ─────────────────────────────────────────────────
  const signOutAllMutation = useMutation({
    mutationFn: () => axios.delete('/api/auth/sessions/all'),
    onSuccess: async () => {
      toast('Signed out of all devices');
      await new Promise(r => setTimeout(r, 1000));
      await logout();
      router.replace('/login');
    },
    onError: () => toast('Failed to sign out', 'error'),
  });

  // ─── Deactivate account ───────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: () => axios.post('/api/users/me/deactivate', { password: deactivatePassword }),
    onSuccess: async () => {
      toast('Account deactivated');
      await logout();
      router.replace('/');
    },
    onError: (err: any) => toast(err.response?.data?.error ?? 'Failed to deactivate', 'error'),
  });

  // ─── Push permission ──────────────────────────────────────────────────────
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = async () => {
    const result = await Notification.requestPermission();
    setPushPermission(result);
  };

  if (authLoading || !authUser) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ─── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center space-y-4 sticky top-6">
            
            {isLoading ? (
              <Skeleton className="h-28 w-28 rounded-full" />
            ) : (
              <AvatarUpload
                currentAvatar={localAvatar}
                name={profile?.name ?? authUser.name}
                size={112}
                onUploadSuccess={(url) => {
                  setLocalAvatar(url);
                  qc.invalidateQueries({ queryKey: ['my-profile'] });
                }}
              />
            )}

            {isLoading ? (
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{profile?.name}</h2>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 capitalize">
                  {profile?.role?.replace('_', ' ')}
                </span>
                {profile?.ward && (
                  <p className="text-sm text-slate-500">📍 {profile.ward}</p>
                )}
                <p className="text-xs text-slate-400">
                  Member since {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : '—'}
                </p>
              </>
            )}

            {/* Stats */}
            <div className="w-full pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <StatPill icon={<FileText className="w-4 h-4 mx-auto text-brand-500" />} label="Reports" value={profile?.stats?.totalReports ?? '—'} loading={isLoading} />
              <StatPill icon={<CheckCircle className="w-4 h-4 mx-auto text-emerald-500" />} label="Resolved" value={profile?.stats?.resolvedReports ?? '—'} loading={isLoading} />
              <StatPill icon={<ThumbsUp className="w-4 h-4 mx-auto text-orange-500" />} label="Upvotes" value={profile?.stats?.upvotesGiven ?? '—'} loading={isLoading} />
            </div>
          </div>
        </aside>

        {/* ─── Right Main Content ────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="personal"      data-state={tab === 'personal'      ? 'active' : 'inactive'} layoutId="profile-tab"><User className="w-4 h-4" />Personal Info</TabsTrigger>
              <TabsTrigger value="security"      data-state={tab === 'security'      ? 'active' : 'inactive'} layoutId="profile-tab"><Shield className="w-4 h-4" />Security</TabsTrigger>
              <TabsTrigger value="notifications" data-state={tab === 'notifications' ? 'active' : 'inactive'} layoutId="profile-tab"><Bell className="w-4 h-4" />Notifications</TabsTrigger>
              <TabsTrigger value="danger"        data-state={tab === 'danger'        ? 'active' : 'inactive'} layoutId="profile-tab"><AlertTriangle className="w-4 h-4" />Danger Zone</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Personal Info ─────────────────────────────────── */}
            <TabsContent value="personal">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Information</h3>
                <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-5 max-w-lg">
                  <Field label="Full Name" error={profileForm.formState.errors.name?.message}>
                    <input
                      {...profileForm.register('name')}
                      className="field-input"
                      placeholder="Your full name"
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      value={profile?.email ?? ''}
                      disabled
                      className="field-input opacity-60 cursor-not-allowed bg-slate-50"
                    />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                  </Field>
                  <Field label="Phone Number" error={profileForm.formState.errors.phone?.message}>
                    <input
                      {...profileForm.register('phone')}
                      className="field-input"
                      placeholder="+92 300 1234567"
                    />
                  </Field>
                  <Field label="Ward / Area" error={profileForm.formState.errors.ward?.message}>
                    <input
                      {...profileForm.register('ward')}
                      className="field-input"
                      placeholder="e.g. Ward 5, Lahore"
                    />
                  </Field>
                  <Button
                    type="submit"
                    disabled={!profileForm.formState.isDirty || profileMutation.isPending}
                    loading={profileMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* ── Tab 2: Security ──────────────────────────────────────── */}
            <TabsContent value="security">
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">Change Password</h3>
                  <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-5 max-w-lg">
                    <Field label="Current Password" error={passwordForm.formState.errors.currentPassword?.message}>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          {...passwordForm.register('currentPassword')}
                          className="field-input pr-10"
                          placeholder="Enter current password"
                        />
                        <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>

                    <Field label="New Password" error={passwordForm.formState.errors.newPassword?.message}>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          {...passwordForm.register('newPassword')}
                          className="field-input pr-10"
                          placeholder="At least 8 characters"
                        />
                        <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Strength indicator */}
                      {newPw && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${strength.score >= 4 ? 'text-emerald-600' : 'text-slate-500'}`}>{strength.label}</p>
                        </div>
                      )}
                    </Field>

                    <Field label="Confirm New Password" error={passwordForm.formState.errors.confirmPassword?.message}>
                      <input
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                        className="field-input"
                        placeholder="Repeat new password"
                      />
                    </Field>

                    <Button type="submit" loading={passwordMutation.isPending} disabled={passwordMutation.isPending}>
                      Update Password
                    </Button>
                  </form>
                </div>

                {/* Sessions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Active Sessions</h3>
                  {profile?.lastLogin && (
                    <p className="text-sm text-slate-500 mb-4">
                      Last login: {formatDistanceToNow(new Date(profile.lastLogin), { addSuffix: true })}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mb-4">Signing out of all devices will invalidate all active sessions. You'll be redirected to login.</p>
                  <Button
                    variant="danger"
                    onClick={() => signOutAllMutation.mutate()}
                    loading={signOutAllMutation.isPending}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    Sign Out of All Devices
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Notifications ──────────────────────────────────── */}
            <TabsContent value="notifications">
              <div className="space-y-6">
                <NotifSection
                  title="Email Notifications"
                  subtitle="Receive updates via email"
                  channel="email"
                  prefs={prefs?.email}
                  onToggle={handlePrefToggle}
                />
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Push Notifications</h3>
                      <p className="text-sm text-slate-500">Receive alerts directly in your browser</p>
                    </div>
                    <div className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      pushPermission === 'granted'  ? 'bg-emerald-100 text-emerald-700' :
                      pushPermission === 'denied'   ? 'bg-red-100 text-red-700' :
                                                      'bg-slate-100 text-slate-600'
                    }`}>
                      {pushPermission === 'granted' ? 'Enabled' : pushPermission === 'denied' ? 'Blocked' : 'Not requested'}
                    </div>
                  </div>
                  {pushPermission !== 'granted' && (
                    <Button size="sm" onClick={requestPushPermission} className="mb-6">
                      Enable Push Notifications
                    </Button>
                  )}
                  <div className="space-y-4">
                    <Switch checked={prefs?.push?.statusUpdates ?? true} onCheckedChange={v => handlePrefToggle('push', 'statusUpdates', v)} label="Status Updates" description="When your report status changes" disabled={pushPermission !== 'granted'} />
                    <Switch checked={prefs?.push?.comments ?? false}       onCheckedChange={v => handlePrefToggle('push', 'comments', v)}       label="New Comments"   description="When someone comments on your report" disabled={pushPermission !== 'granted'} />
                    <Switch checked={prefs?.push?.slaAlerts ?? true}       onCheckedChange={v => handlePrefToggle('push', 'slaAlerts', v)}       label="SLA Alerts"     description="Critical deadline warnings" disabled={pushPermission !== 'granted'} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 4: Danger Zone ───────────────────────────────────── */}
            <TabsContent value="danger">
              <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6 md:p-8">
                <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-slate-600 mb-6">These actions are irreversible. Please proceed with caution.</p>

                <div className="border border-red-200 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-900">Deactivate Account</h4>
                  <p className="text-sm text-slate-500 mt-1 mb-4">
                    Your reports will remain visible, but your account will be deactivated. You won't be able to log in until an admin reactivates your account.
                  </p>
                  <Button variant="danger" onClick={() => setShowDeactivateModal(true)}>
                    Deactivate My Account
                  </Button>
                </div>
              </div>

              {/* Deactivation Confirm Modal */}
              {showDeactivateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Confirm Account Deactivation</h4>
                    <p className="text-sm text-slate-500 mb-5">Enter your password to confirm. This action cannot be undone without contacting support.</p>
                    <input
                      type="password"
                      value={deactivatePassword}
                      onChange={e => setDeactivatePassword(e.target.value)}
                      className="field-input mb-4"
                      placeholder="Enter your password"
                    />
                    <div className="flex gap-3 justify-end">
                      <Button variant="secondary" onClick={() => { setShowDeactivateModal(false); setDeactivatePassword(''); }}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        loading={deactivateMutation.isPending}
                        disabled={!deactivatePassword || deactivateMutation.isPending}
                        onClick={() => deactivateMutation.mutate()}
                      >
                        Yes, Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <style jsx global>{`
        .field-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #0f172a;
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .field-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function StatPill({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: any; loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {icon}
      {loading ? <Skeleton className="h-4 w-6" /> : <span className="text-sm font-bold text-slate-900">{value}</span>}
      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function NotifSection({ title, subtitle, channel, prefs, onToggle }: {
  title: string; subtitle: string; channel: 'email' | 'push';
  prefs: any; onToggle: (ch: 'email' | 'push', key: string, val: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-5">{subtitle}</p>
      <div className="space-y-4">
        <Switch checked={prefs?.statusUpdates ?? true}  onCheckedChange={v => onToggle(channel, 'statusUpdates', v)} label="Status Updates"  description="When your report status changes" />
        <Switch checked={prefs?.comments ?? true}        onCheckedChange={v => onToggle(channel, 'comments', v)}       label="New Comments"    description="When someone comments on your report" />
        <Switch checked={prefs?.slaAlerts ?? true}       onCheckedChange={v => onToggle(channel, 'slaAlerts', v)}      label="SLA Alerts"      description="Critical deadline notifications" />
      </div>
    </div>
  );
}
