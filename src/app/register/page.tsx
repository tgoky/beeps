"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Music2, 
  Mic2, 
  Building2, 
  Guitar, 
  Headphones, 
  Users, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Camera,
  Star
} from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

type UserRole = 'artist' | 'producer' | 'studio-owner' | 'instrument-sales' | 'lyricist' | 'other';
type Genre = 'Hip Hop' | 'Trap' | 'R&B' | 'Electronic' | 'Pop' | 'Jazz' | 'Soul' | 'Rock' | 'Classical' | 'Reggae';

const genres: Genre[] = ['Hip Hop', 'Trap', 'R&B', 'Electronic', 'Pop', 'Jazz', 'Soul', 'Rock', 'Classical', 'Reggae'];

const roleConfig = {
  artist: {
    icon: Mic2,
    title: "Artist",
    description: "Vocalist, rapper, or singer looking to create and collaborate",
    fields: ['genres', 'bio', 'socialLinks'],
    color: "from-purple-500 to-pink-500"
  },
  producer: {
    icon: Music2,
    title: "Producer",
    description: "Create beats, mix tracks, and produce music",
    fields: ['genres', 'specialties', 'equipment', 'experience'],
    color: "from-blue-500 to-cyan-500"
  },
  'studio-owner': {
    icon: Building2,
    title: "Studio Owner",
    description: "Own or manage a recording studio space",
    fields: ['studioName', 'capacity', 'equipment', 'location', 'hourlyRate'],
    color: "from-green-500 to-emerald-500"
  },
  'instrument-sales': {
    icon: Guitar,
    title: "Gear Specialist",
    description: "Sell or rent music instruments and equipment",
    fields: ['businessName', 'specialties', 'inventory', 'location'],
    color: "from-orange-500 to-red-500"
  },
  lyricist: {
    icon: Headphones,
    title: "Lyricist",
    description: "Write lyrics, hooks, and song concepts",
    fields: ['genres', 'writingStyle', 'collaborationStyle', 'portfolio'],
    color: "from-indigo-500 to-purple-500"
  },
  other: {
    icon: Users,
    title: "Other",
    description: "Music enthusiast, manager, or other role",
    fields: ['customRole', 'bio', 'interests'],
    color: "from-gray-500 to-gray-700"
  }
};

export default function SignUp() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    role: '' as UserRole,
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    
    // Step 2 - Common fields
    fullName: '',
    bio: '',
    location: '',
    avatar: '',
    
    // Step 2 - Role-specific fields
    genres: [] as Genre[],
    specialties: '',
    equipment: '',
    experience: '',
    studioName: '',
    capacity: '',
    hourlyRate: '',
    businessName: '',
    inventory: '',
    writingStyle: '',
    collaborationStyle: '',
    portfolio: '',
    customRole: '',
    interests: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      soundcloud: '',
      spotify: ''
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Role-specific validations
    const role = formData.role as UserRole;
    if (roleConfig[role].fields.includes('genres') && formData.genres.length === 0) {
      newErrors.genres = 'Please select at least one genre';
    }
    if (role === 'studio-owner' && !formData.studioName) {
      newErrors.studioName = 'Studio name is required';
    }
    if (role === 'instrument-sales' && !formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    // Here you would integrate with Supabase
    console.log('Form submitted:', formData);
    
    // Simulate API call
    setTimeout(() => {
      alert('Account created! Please check your email for verification link.');
      router.push('/login');
    }, 1000);
  };

  const toggleGenre = (genre: Genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const renderStep1 = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Side - Role Selection */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Role</h2>
          <p className="text-gray-400 text-[15px]">
            Select how you'll contribute to the music community
          </p>
        </div>

        <div className="space-y-4">
          {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.artist][]).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = formData.role === key;
            return (
              <div
                key={key}
                className={`
                  p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group
                  ${isSelected
                    ? `border-white/20 bg-gradient-to-r ${config.color} bg-opacity-20`
                    : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/60"
                  }
                  hover:scale-105 active:scale-95
                `}
                onClick={() => updateField('role', key)}
              >
                {/* Gradient overlay */}
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`} />
                )}
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`
                    p-3 rounded-xl transition-all duration-300
                    ${isSelected
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-gray-400 group-hover:text-white"
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-1 transition-colors ${
                      isSelected ? "text-white" : "text-gray-200 group-hover:text-white"
                    }`}>
                      {config.title}
                    </h3>
                    <p className={`text-sm transition-colors ${
                      isSelected ? "text-gray-300" : "text-gray-500 group-hover:text-gray-400"
                    }`}>
                      {config.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {errors.role && <p className="text-red-400 text-sm mt-2">{errors.role}</p>}
      </div>

      {/* Right Side - Account Details */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Details</h2>
          <p className="text-gray-400 text-[15px]">
            Create your login credentials
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[15px] font-medium text-gray-200 mb-3">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`
                  w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                  bg-black/40 border-white/10 text-white placeholder-gray-500
                  focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                  ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                `}
                placeholder="your@email.com"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[15px] font-medium text-gray-200 mb-3">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                className={`
                  w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                  bg-black/40 border-white/10 text-white placeholder-gray-500
                  focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                  ${errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                `}
                placeholder="Choose a username"
              />
            </div>
            {errors.username && <p className="text-red-400 text-sm mt-2">{errors.username}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[15px] font-medium text-gray-200 mb-3">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`
                    w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                    bg-black/40 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                    ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                  `}
                  placeholder="Create a password"
                />
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-2">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[15px] font-medium text-gray-200 mb-3">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className={`
                    w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                    bg-black/40 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                    ${errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                  `}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-sm mt-2">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const role = formData.role as UserRole;
    const config = roleConfig[role];

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Side - Profile Basics */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Information</h2>
            <p className="text-gray-400 text-[15px]">
              Tell us about yourself
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6 p-6 rounded-xl border border-white/10 bg-black/40">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/20 bg-black/60">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-white mb-1">
                  Profile Picture
                </p>
                <p className="text-[13px] text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Recommended: 500x500px, JPG or PNG
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[15px] font-medium text-gray-200 mb-3">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={`
                  w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                  bg-black/40 border-white/10 text-white placeholder-gray-500
                  focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                  ${errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                `}
                placeholder="Your full name"
              />
              {errors.fullName && <p className="text-red-400 text-sm mt-2">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-[15px] font-medium text-gray-200 mb-3">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={`
                    w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                    bg-black/40 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                    ${errors.location ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                  `}
                  placeholder="City, State, Country"
                />
              </div>
              {errors.location && <p className="text-red-400 text-sm mt-2">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-[15px] font-medium text-gray-200 mb-3">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={4}
                className={`
                  w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200 resize-none
                  bg-black/40 border-white/10 text-white placeholder-gray-500
                  focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                `}
                placeholder="Tell us about yourself and your music journey..."
              />
            </div>
          </div>
        </div>

        {/* Right Side - Role-specific Fields */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{config.title} Details</h2>
            <p className="text-gray-400 text-[15px]">
              Specific information for your role
            </p>
          </div>

          <div className="space-y-6">
            {/* Genres */}
            {config.fields.includes('genres') && (
              <div>
                <label className="block text-[15px] font-medium text-gray-200 mb-3">
                  Music Genres
                </label>
                <div className="flex flex-wrap gap-3">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`
                        px-4 py-3 text-[14px] font-medium rounded-xl border transition-all duration-200
                        ${formData.genres.includes(genre)
                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                          : "bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white"
                        }
                        active:scale-95
                      `}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {errors.genres && <p className="text-red-400 text-sm mt-2">{errors.genres}</p>}
              </div>
            )}

            {/* Studio Owner Fields */}
            {config.fields.includes('studioName') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[15px] font-medium text-gray-200 mb-3">
                    Studio Name
                  </label>
                  <input
                    type="text"
                    value={formData.studioName}
                    onChange={(e) => updateField('studioName', e.target.value)}
                    className={`
                      w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                      bg-black/40 border-white/10 text-white placeholder-gray-500
                      focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                      ${errors.studioName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                    `}
                    placeholder="Your studio name"
                  />
                  {errors.studioName && <p className="text-red-400 text-sm mt-2">{errors.studioName}</p>}
                </div>

                <div>
                  <label className="block text-[15px] font-medium text-gray-200 mb-3">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => updateField('capacity', e.target.value)}
                    className={`
                      w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                      bg-black/40 border-white/10 text-white placeholder-gray-500
                      focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                    `}
                    placeholder="e.g., 5 people"
                  />
                </div>
              </div>
            )}

            {/* Business Fields */}
            {config.fields.includes('businessName') && (
              <div>
                <label className="block text-[15px] font-medium text-gray-200 mb-3">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                  className={`
                    w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                    bg-black/40 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                    ${errors.businessName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
                  `}
                  placeholder="Your business name"
                />
                {errors.businessName && <p className="text-red-400 text-sm mt-2">{errors.businessName}</p>}
              </div>
            )}

            {/* Equipment/Specialties */}
            {(config.fields.includes('equipment') || config.fields.includes('specialties')) && (
              <div>
                <label className="block text-[15px] font-medium text-gray-200 mb-3">
                  {role === 'producer' ? 'Production Equipment' : 'Studio Equipment'}
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => updateField('equipment', e.target.value)}
                  className={`
                    w-full px-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                    bg-black/40 border-white/10 text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                  `}
                  placeholder={role === 'producer' ? 'DAW, plugins, hardware...' : 'Mics, consoles, monitors...'}
                />
              </div>
            )}

            {/* Social Links */}
            {config.fields.includes('socialLinks') && (
              <div className="space-y-4">
                <label className="block text-[15px] font-medium text-gray-200">
                  Social Links
                </label>
                {['instagram', 'youtube', 'soundcloud', 'spotify'].map(platform => (
                  <div key={platform} className="relative">
                    <div className={`
                      absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded
                      ${platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
                      ${platform === 'youtube' ? 'bg-red-500' : ''}
                      ${platform === 'soundcloud' ? 'bg-orange-500' : ''}
                      ${platform === 'spotify' ? 'bg-green-500' : ''}
                    `} />
                    <input
                      type="text"
                      value={formData.socialLinks[platform as keyof typeof formData.socialLinks]}
                      onChange={(e) => updateSocialLink(platform, e.target.value)}
                      className={`
                        w-full pl-12 pr-4 py-4 text-[15px] rounded-xl border transition-all duration-200
                        bg-black/40 border-white/10 text-white placeholder-gray-500
                        focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                      `}
                      placeholder={`Your ${platform} username or link`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join Beeps
            </h1>
          </div>
          <p className="text-xl text-gray-400">
            Create your account and start your music journey
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-8">
            {[1, 2].map(step => (
              <div key={step} className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300
                  ${currentStep >= step
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg shadow-purple-500/25"
                    : "bg-black border-white/20 text-gray-500"
                  }
                `}>
                  {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
                </div>
                {step < 2 && (
                  <div className={`
                    w-24 h-1 rounded-full transition-all duration-300
                    ${currentStep > step
                      ? "bg-gradient-to-r from-purple-500 to-pink-500"
                      : "bg-white/20"
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className={`
          rounded-3xl border transition-all duration-500
          bg-gradient-to-br from-black via-purple-950/10 to-pink-950/10
          border-white/10 shadow-2xl shadow-purple-500/10
        `}>
          <div className="p-8 lg:p-12">
            {/* Form Content */}
            <div className="mb-12">
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-6 max-w-2xl mx-auto">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className={`
                    flex items-center gap-3 px-8 py-4 text-[15px] font-semibold rounded-2xl border transition-all duration-300 flex-1
                    bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20
                    hover:shadow-lg hover:scale-105 active:scale-95
                  `}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className={`
                  flex items-center gap-3 px-8 py-4 text-[15px] font-semibold rounded-2xl border transition-all duration-300 flex-1
                  bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white
                  hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105 active:scale-95
                `}
              >
                {currentStep === 2 ? 'Create Account' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-8 pt-8 border-t border-white/10">
              <p className="text-[15px] text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}