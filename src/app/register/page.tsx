"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegister } from "@refinedev/core";
import {
  Music2, Mic2, Building2, Guitar, Headphones, Users, Mail, Lock, User, MapPin,
  ArrowRight, ArrowLeft, CheckCircle2, Camera, Inbox, RefreshCw
} from "lucide-react";
import { LocationSelector, type LocationData } from "@/components/LocationSelector";
import { supabaseBrowserClient } from "@/utils/supabase/client";

type UserRole = 'artist' | 'producer' | 'studio-owner' | 'instrument-sales' | 'lyricist' | 'other';
type Genre = 'Hip Hop' | 'Trap' | 'R&B' | 'Electronic' | 'Pop' | 'Jazz' | 'Soul' | 'Rock' | 'Classical' | 'Reggae';

const genres: Genre[] = ['Hip Hop', 'Trap', 'R&B', 'Electronic', 'Pop', 'Jazz', 'Soul', 'Rock', 'Classical', 'Reggae'];

const roleConfig = {
  artist: { icon: Mic2, title: "Artist", description: "Vocalist, rapper, or singer looking to create and collaborate", fields: ['genres', 'bio', 'socialLinks'], dbRole: 'ARTIST', canCreateStudios: false, canBookStudios: true },
  producer: { icon: Music2, title: "Producer", description: "Create beats, mix tracks, and produce music", fields: ['genres', 'specialties', 'equipment', 'experience', 'hasStudio'], dbRole: 'PRODUCER', canCreateStudios: 'conditional', canBookStudios: true },
  'studio-owner': { icon: Building2, title: "Studio Owner", description: "Own or manage a recording studio space", fields: ['bio'], dbRole: 'STUDIO_OWNER', canCreateStudios: true, canBookStudios: false },
  'instrument-sales': { icon: Guitar, title: "Gear Specialist", description: "Sell or rent music instruments and equipment", fields: ['businessName', 'specialties', 'inventory', 'location'], dbRole: 'GEAR_SALES', canCreateStudios: false, canBookStudios: true },
  lyricist: { icon: Headphones, title: "Lyricist", description: "Write lyrics, hooks, and song concepts", fields: ['genres', 'writingStyle', 'collaborationStyle', 'portfolio'], dbRole: 'LYRICIST', canCreateStudios: false, canBookStudios: true },
  other: { icon: Users, title: "Other", description: "Music enthusiast, manager, or other role", fields: ['customRole', 'bio', 'interests'], dbRole: 'OTHER', canCreateStudios: false, canBookStudios: true }
};

export default function SignUp() {
  const router = useRouter();
  const { mutate: register, isLoading } = useRegister();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showVerification, setShowVerification] = useState(false);
  
  // ✅ Avatar File State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    role: '' as UserRole, email: '', username: '', password: '', confirmPassword: '',
    fullName: '', bio: '', location: '', locationCountry: '', locationState: '', locationCity: '',
    locationLatitude: '', locationLongitude: '', avatar: '', genres: [] as Genre[], specialties: '',
    equipment: '', experience: '', hasStudio: false, studioName: '', capacity: '', hourlyRate: '',
    businessName: '', inventory: '', writingStyle: '', collaborationStyle: '', portfolio: '',
    customRole: '', interests: '', socialLinks: { instagram: '', youtube: '', soundcloud: '', spotify: '' }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    const role = formData.role as UserRole;
    if (roleConfig[role].fields.includes('genres') && formData.genres.length === 0) newErrors.genres = 'Please select at least one genre';
    if (role === 'instrument-sales' && !formData.businessName) newErrors.businessName = 'Business name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) handleSubmit();
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    const role = formData.role as UserRole;
    const config = roleConfig[role];
    
    let uploadedAvatarUrl = formData.avatar || undefined;

    // ✅ Upload Avatar to Supabase if selected
    if (avatarFile) {
      const fileName = `public/${Date.now()}-${formData.username.replace(/[^a-zA-Z0-9]/g, '')}.jpg`;
      const { data: uploadData, error: uploadError } = await supabaseBrowserClient.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabaseBrowserClient.storage.from('avatars').getPublicUrl(fileName);
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }
    }

    const payload = {
      email: formData.email, password: formData.password, username: formData.username,
      role: config.dbRole, fullName: formData.fullName, location: formData.location,
      bio: formData.bio, avatar: uploadedAvatarUrl, genres: formData.genres,
      specialties: formData.specialties ? [formData.specialties] : [],
      equipment: formData.equipment ? [formData.equipment] : [], experience: formData.experience,
      hasStudio: formData.hasStudio, studioName: formData.studioName, capacity: formData.capacity,
      hourlyRate: formData.hourlyRate, businessName: formData.businessName, inventory: formData.inventory,
      writingStyle: formData.writingStyle, collaborationStyle: formData.collaborationStyle, portfolio: formData.portfolio,
      customRole: formData.customRole, interests: formData.interests, socialLinks: formData.socialLinks,
      canCreateStudios: config.canCreateStudios === true || (config.canCreateStudios === 'conditional' && formData.hasStudio),
      canBookStudios: config.canBookStudios, countryCode: formData.locationCountry || undefined,
    };

    register(payload, {
      onSuccess: () => setShowVerification(true),
      onError: (error: any) => setErrors({ submit: error?.message || 'Registration failed. Please try again.' })
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleGenre = (genre: Genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleResendVerification = async () => {
    if (!formData.email || resendLoading) return;
    setResendLoading(true);
    setResendMessage('');
    try {
      const { error } = await supabaseBrowserClient.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (error) {
        setResendMessage('Failed to resend: ' + error.message);
      } else {
        setResendMessage('Verification email resent! Check your inbox and spam folder.');
      }
    } catch {
      setResendMessage('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const renderVerificationScreen = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Music2 className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white">Beeps</h1>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center">
              <Inbox className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center space-y-4 mb-10">
            <h2 className="text-3xl font-light tracking-tight text-white">Check your email</h2>
            <p className="text-base font-light text-zinc-400 tracking-wide max-w-md mx-auto">
              We&apos;ve sent a verification link to
            </p>
            <p className="text-base font-medium text-white tracking-wide">{formData.email}</p>
          </div>

          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-black border border-zinc-800">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-medium text-zinc-400">1</span></div>
              <div>
                <p className="text-sm font-medium text-white tracking-wide">Open your email inbox</p>
                <p className="text-xs font-light text-zinc-500 mt-1 tracking-wide">Check your inbox and spam folder for an email from Beeps</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-black border border-zinc-800">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-medium text-zinc-400">2</span></div>
              <div>
                <p className="text-sm font-medium text-white tracking-wide">Click the verification link</p>
                <p className="text-xs font-light text-zinc-500 mt-1 tracking-wide">Click on the link in the email to verify your account</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-black border border-zinc-800">
              <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-medium text-zinc-400">3</span></div>
              <div>
                <p className="text-sm font-medium text-white tracking-wide">Start collaborating</p>
                <p className="text-xs font-light text-zinc-500 mt-1 tracking-wide">Once verified, you&apos;ll be redirected to sign in and explore the platform</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button type="button" onClick={() => window.open('https://mail.google.com', '_blank')} className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-medium rounded-lg border transition-all duration-200 bg-white border-white text-black tracking-wide hover:bg-zinc-100 active:scale-[0.98]">
              <Mail className="w-4 h-4" strokeWidth={2} />
              <span>Open Email App</span>
            </button>
            <button type="button" onClick={() => router.push('/login')} className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-medium rounded-lg border transition-all duration-200 bg-zinc-900 border-zinc-800 text-zinc-400 tracking-wide hover:bg-black hover:border-zinc-700 hover:text-white active:scale-[0.98]">
              <span>I&apos;ll verify later</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-900 text-center space-y-3">
            {resendMessage && (
              <p className={`text-xs font-light tracking-wide ${resendMessage.startsWith('Failed') || resendMessage.startsWith('Something') ? 'text-red-400' : 'text-green-400'}`}>
                {resendMessage}
              </p>
            )}
            <p className="text-xs font-light text-zinc-600 tracking-wide">
              Didn&apos;t receive the email?{' '}
              <button type="button" onClick={handleResendVerification} disabled={resendLoading} className="font-medium text-white hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${resendLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            </p>
            <p className="text-xs font-light text-zinc-700 tracking-wide">Also check your spam or junk folder.</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <button type="button" onClick={() => setShowVerification(false)} className="text-xs font-light text-zinc-600 hover:text-zinc-400 transition-colors tracking-wide">
            ← Back to registration
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
      <div className="lg:col-span-3 space-y-8">
        <div className="space-y-2"><h2 className="text-2xl font-light tracking-tight text-white">Choose your role</h2></div>
        <div className="space-y-3">
          {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.artist][]).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = formData.role === key;
            return (
              <button key={key} type="button" className={`w-full p-5 rounded-lg border text-left transition-all ${isSelected ? "border-white bg-zinc-950" : "border-zinc-800 bg-black hover:border-zinc-700 hover:bg-zinc-950"}`} onClick={() => updateField('role', key)}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-md ${isSelected ? "bg-white" : "bg-zinc-900"}`}><Icon className={`w-5 h-5 ${isSelected ? "text-black" : "text-zinc-500"}`} strokeWidth={2} /></div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium tracking-wide ${isSelected ? "text-white" : "text-zinc-400"}`}>{config.title}</h3>
                    <p className={`text-xs font-light mt-0.5 tracking-wide ${isSelected ? "text-zinc-400" : "text-zinc-600"}`}>{config.description}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2} />}
                </div>
              </button>
            );
          })}
        </div>
        {errors.role && <p className="text-xs text-red-400">{errors.role}</p>}
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-2"><h2 className="text-2xl font-light tracking-tight text-white">Account details</h2></div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className={`w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-950 border text-white rounded-lg focus:outline-none focus:border-white ${errors.email ? "border-red-500/50" : "border-zinc-800"}`} placeholder="your@email.com" />
            </div>
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="text" value={formData.username} onChange={(e) => updateField('username', e.target.value)} className={`w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-950 border text-white rounded-lg focus:outline-none focus:border-white ${errors.username ? "border-red-500/50" : "border-zinc-800"}`} placeholder="Choose a username" />
            </div>
            {errors.username && <p className="text-xs text-red-400">{errors.username}</p>}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="password" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className={`w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-950 border text-white rounded-lg focus:outline-none focus:border-white ${errors.password ? "border-red-500/50" : "border-zinc-800"}`} placeholder="Create a password" />
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className={`w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-950 border text-white rounded-lg focus:outline-none focus:border-white ${errors.confirmPassword ? "border-red-500/50" : "border-zinc-800"}`} placeholder="Confirm your password" />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const role = formData.role as UserRole;
    const config = roleConfig[role];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-2"><h2 className="text-2xl font-light tracking-tight text-white">Profile information</h2></div>

          <div className="space-y-6">
            {/* ✅ Functional Avatar Upload */}
            <div className="flex items-center gap-5 p-5 rounded-lg border border-zinc-800 bg-zinc-950 relative">
              <input 
                type="file" 
                accept="image/jpeg, image/png" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAvatarFile(e.target.files[0]);
                    setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
              />
              <div className="w-16 h-16 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-800 bg-black overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-zinc-600" strokeWidth={2} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Profile Picture</p>
                <p className="text-xs font-light text-zinc-500 mt-1">Optional. Recommended: 500x500px, JPG or PNG</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Full Name</label>
              <input type="text" value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full px-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white" placeholder="Your full name" />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Location</label>
              {(formData.role === 'studio-owner' || formData.role === 'instrument-sales') ? (
                <LocationSelector
                  onLocationChange={(loc: LocationData) => {
                    const locationStr = loc.fullAddress || `${loc.city}, ${loc.state}, ${loc.country}`;
                    setFormData(prev => ({
                      ...prev,
                      location: locationStr,
                      locationCountry: loc.country,
                      locationState: loc.state,
                      locationCity: loc.city,
                      locationLatitude: loc.latitude?.toString() || '',
                      locationLongitude: loc.longitude?.toString() || '',
                    }));
                  }}
                  showGeolocation={true}
                  compact={true}
                />
              ) : (
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" value={formData.location} onChange={(e) => updateField('location', e.target.value)} className="w-full pl-11 pr-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white" placeholder="City, State, Country" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Bio</label>
              <textarea value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} className="w-full px-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white resize-none" placeholder="Tell us about yourself..." />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-2"><h2 className="text-2xl font-light tracking-tight text-white">{config.title} details</h2></div>
          
          <div className="space-y-6">
            {config.fields.includes('hasStudio') && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400 uppercase">Do you own or manage a recording studio?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => updateField('hasStudio', true)} className={`px-4 py-3.5 text-sm font-medium rounded-lg border ${formData.hasStudio ? "bg-white text-black border-white" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"}`}>Yes, I have a studio</button>
                  <button type="button" onClick={() => updateField('hasStudio', false)} className={`px-4 py-3.5 text-sm font-medium rounded-lg border ${!formData.hasStudio ? "bg-white text-black border-white" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"}`}>No studio</button>
                </div>
              </div>
            )}

            {config.fields.includes('genres') && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400 uppercase">Music Genres</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button key={genre} type="button" onClick={() => toggleGenre(genre)} className={`px-4 py-2.5 text-xs font-medium rounded-lg border ${formData.genres.includes(genre) ? "bg-white text-black border-white" : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700"}`}>
                      {genre}
                    </button>
                  ))}
                </div>
                {errors.genres && <p className="text-xs text-red-400">{errors.genres}</p>}
              </div>
            )}

            {role === 'studio-owner' && (
              <div className="space-y-3 p-5 rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-white" /><span className="text-sm font-medium text-white">Studio listing — next step</span></div>
                <p className="text-xs font-light text-zinc-400 leading-relaxed">Once you verify your email and log in, you&apos;ll be taken straight to <strong className="text-white">List Your Studio</strong> where you can add all the details.</p>
              </div>
            )}

            {config.fields.includes('businessName') && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400 uppercase">Business Name</label>
                <input type="text" value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} className="w-full px-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white" placeholder="Your business name" />
                {errors.businessName && <p className="text-xs text-red-400">{errors.businessName}</p>}
              </div>
            )}

            {(config.fields.includes('equipment') || config.fields.includes('specialties')) && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400 uppercase">{role === 'producer' ? 'Production Equipment' : 'Studio Equipment'}</label>
                <input type="text" value={formData.equipment} onChange={(e) => updateField('equipment', e.target.value)} className="w-full px-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white" placeholder={role === 'producer' ? 'DAW, plugins, hardware...' : 'Mics, consoles, monitors...'} />
              </div>
            )}

            {config.fields.includes('socialLinks') && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-3">Social Links</label>
                <div className="space-y-3">
                  {['instagram', 'youtube', 'soundcloud', 'spotify'].map(platform => (
                    <div key={platform} className="relative">
                      <input type="text" value={formData.socialLinks[platform as keyof typeof formData.socialLinks]} onChange={(e) => updateSocialLink(platform, e.target.value)} className="w-full pl-4 pr-4 py-3.5 text-sm bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:outline-none focus:border-white" placeholder={`Your ${platform} username`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showVerification) return renderVerificationScreen();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-6xl py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center"><Music2 className="w-5 h-5 text-black" strokeWidth={2.5} /></div>
            <h1 className="text-3xl font-light tracking-tight text-white">Beeps</h1>
          </div>
          <h2 className="text-4xl font-light tracking-tight text-white">Create your account</h2>
        </div>

        <div className="flex items-center gap-6 mb-12">
          {[1, 2].map(step => (
            <div key={step} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border ${currentStep >= step ? "bg-white border-white text-black" : "bg-black border-zinc-800 text-zinc-600"}`}>
                {currentStep > step ? <CheckCircle2 className="w-5 h-5" strokeWidth={2} /> : step}
              </div>
              {step < 2 && <div className={`w-16 h-px ${currentStep > step ? "bg-white" : "bg-zinc-800"}`} />}
            </div>
          ))}
        </div>

        <div className="mb-12">{currentStep === 1 ? renderStep1() : renderStep2()}</div>

        {errors.submit && <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10"><p className="text-sm font-light text-red-400">{errors.submit}</p></div>}

        <div className="flex gap-4">
          {currentStep > 1 && (
            <button type="button" onClick={handleBack} disabled={isLoading} className="flex items-center gap-2.5 px-6 py-3.5 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded-lg hover:text-white hover:border-zinc-700">
              <ArrowLeft className="w-4 h-4" /> <span>Back</span>
            </button>
          )}
          <button type="button" onClick={handleNext} disabled={isLoading} className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-black rounded-lg flex-1 hover:bg-zinc-200">
            {isLoading ? <span>Creating Account...</span> : <span>{currentStep === 2 ? 'Create Account' : 'Continue'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}