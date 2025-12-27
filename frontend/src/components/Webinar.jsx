import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { toast } from 'react-toastify';
import { apiFetch } from '../utils/api';

const Webinar = () => {
  const { getSettingValue } = useSettings();
  
  // --- 1. CONFIGURATION (From Google Sheet) ---
  const isEnabled = getSettingValue('Webinar Section', false); 
  
  // Content & Styling
  const defaultTitle = getSettingValue('Webinar Title', 'Mastering the Future');
  const subtitle = getSettingValue('Webinar Subtitle', 'Join industry leaders for an exclusive session on innovation and growth.');
  
  // Theme Settings
  const primaryColor = getSettingValue('Webinar Primary Color', '#2563EB'); // Default Blue
  const secondaryColor = getSettingValue('Webinar Secondary Color', '#1E293B'); // Default Slate-800
  const backgroundColor = getSettingValue('Webinar Background Color', '#F8FAFC'); // Default Slate-50
  
  // Dynamic Image
  const heroImage = getSettingValue('Webinar Image', 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=1200&auto=format&fit=crop');

  // --- 2. STATE ---
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [webinarData, setWebinarData] = useState(null);

  // --- 3. FETCH DATA ---
  useEffect(() => {
    const fetchWebinarDetails = async () => {
      if (!isEnabled) return;
      try {
        const response = await apiFetch('/webinar/upcoming');
        const result = await response.json();
        
        if (result.success && result.data) {
          setWebinarData(result.data);
        }
        // If fetch fails or no data, webinarData remains null (handling the "No Event" state)
      } catch (error) {
        console.error('Error fetching webinar details:', error);
      }
    };
    fetchWebinarDetails();
  }, [isEnabled]);

  // --- 4. HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch('/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          webinarDate: webinarData ? `${webinarData.date} @ ${webinarData.time}` : 'Date Unknown'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Registration successful! Check your email.');
        setFormData({ name: '', email: '', phone: '' });
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (!isEnabled) return null;

  // Determine display values
  const displayTitle = webinarData?.title || defaultTitle;
  const displayDate = webinarData ? webinarData.date : 'Date TBD';
  const displayTime = webinarData ? webinarData.time : 'Time TBD';

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: backgroundColor }}>
      
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* --- LEFT SIDE: IMAGE & HERO --- */}
        <div className="lg:w-1/2 relative min-h-[400px] lg:min-h-screen">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Webinar Event" 
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for text readability */}
            <div 
              className="absolute inset-0 opacity-90"
              style={{ 
                background: `linear-gradient(to bottom right, ${secondaryColor}DD, ${primaryColor}AA)` 
              }}
            />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-16 text-white">
            <div className="inline-flex items-center space-x-2 mb-6">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="uppercase tracking-widest text-xs font-bold">Live Webinar Event</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              {displayTitle}
            </h1>
            
            <p className="text-lg lg:text-xl opacity-90 leading-relaxed mb-10 max-w-lg">
              {subtitle}
            </p>

            {/* Date/Time Badge */}
            <div className="flex flex-wrap gap-4">
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-4 flex items-center min-w-[150px]">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs uppercase opacity-75 font-semibold">Date</p>
                  <p className="font-bold text-lg">{displayDate}</p>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-4 flex items-center min-w-[150px]">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs uppercase opacity-75 font-semibold">Time</p>
                  <p className="font-bold text-lg">{displayTime}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: REGISTRATION FORM --- */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
          <div className="w-full max-w-md space-y-8">
            
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900">Secure Your Spot</h2>
              <p className="mt-2 text-gray-600">
                Register now to get access to the live session and exclusive resources.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              <div className="space-y-5">
                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="+91 90000 00000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                      style={{ '--tw-ring-color': primaryColor }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !webinarData}
                className="w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Registering...' : (webinarData ? 'Register for Free' : 'No Upcoming Event')}
              </button>
              
              <p className="text-xs text-center text-gray-400 mt-4">
                By registering, you agree to our terms and privacy policy.
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Webinar;