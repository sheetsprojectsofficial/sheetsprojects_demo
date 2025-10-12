import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';

const PurplishPortfolio = () => {
  const [portfolioData, setPortfolioData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    fetchPortfolioData();

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight * 100}`;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/portfolio/dynamic`);
      const data = await response.json();

      if (data.success) {
        setPortfolioData(data.portfolioData);

        if (data.isDefault) {
          toast.info(data.message, {
            position: "top-right",
            autoClose: 8000
          });
        }
      } else {
        handlePortfolioError(data);
      }
    } catch (err) {
      setError('Failed to load portfolio data. Please try again.');
      toast.error('Failed to connect to server. Please check if the backend is running.', {
        position: "top-right",
        autoClose: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioError = (errorData) => {
    const { errorType, message, details } = errorData;

    switch (errorType) {
      case 'NO_PORTFOLIO_SELECTED':
        setError('No portfolio selected in settings sheet');
        toast.warn(
          <div>
            <strong>No Portfolio Selected</strong>
            <p>{details}</p>
          </div>,
          {
            position: "top-center",
            autoClose: false
          }
        );
        break;

      case 'NO_PORTFOLIO_DATA':
        setError('No data found in selected portfolio');
        toast.warn(
          <div>
            <strong>Portfolio Data Missing</strong>
            <p>{details}</p>
          </div>,
          {
            position: "top-center",
            autoClose: false
          }
        );
        break;

      default:
        setError(message || 'Unknown error occurred');
        toast.error(message || 'Unknown error occurred', {
          position: "top-right",
          autoClose: 8000
        });
    }
  };

  const getData = (key, fallback = '') => {
    return portfolioData[key] || fallback;
  };

  const getSkillsData = () => {
    const skills = [];
    let i = 1;

    while (true) {
      const name = getData(`Skill ${i} Name`);
      const level = getData(`Skill ${i} Level`);

      if (name) {
        skills.push({
          name: name,
          level: parseInt(level) || 70
        });
        i++;
      } else {
        break;
      }
    }

    return skills;
  };

  const getProjectsData = () => {
    const projects = [];
    let i = 1;

    while (true) {
      const title = getData(`Project ${i} Title`);
      const description = getData(`Project ${i} Description`);
      const image = getData(`Project ${i} Image`);
      const link = getData(`Project ${i} Link`);
      const github = getData(`Project ${i} GitHub`);

      if (title) {
        projects.push({
          title,
          description: description || 'Amazing project showcasing my skills',
          image: image || `https://images.unsplash.com/photo-${1550000000000 + i}?w=600&h=400&fit=crop`,
          link: link || '#',
          github: github || ''
        });
        i++;
      } else {
        break;
      }
    }

    return projects;
  };

  const getSocialLinks = () => {
    const socials = [];
    const socialPlatforms = [
      { key: 'GitHub Link', name: 'GitHub', icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z', color: '#000000' },
      { key: 'LinkedIn Link', name: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z', color: '#0077B5' },
      { key: 'Twitter Link', name: 'Twitter', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z', color: '#1DA1F2' },
      { key: 'Instagram Link', name: 'Instagram', icon: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z', color: '#E4405F' },
      { key: 'Facebook Link', name: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', color: '#1877F2' }
    ];

    socialPlatforms.forEach(platform => {
      const url = getData(platform.key);
      if (url) {
        socials.push({
          url,
          name: platform.name,  
          icon: platform.icon,
          color: platform.color
        });
      }
    });

    return socials;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-xl font-light">Loading Portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/50 rounded-2xl p-8">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Portfolio Error</h3>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={fetchPortfolioData}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-8 rounded-xl transition-all transform hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const skills = getSkillsData();
  const projects = getProjectsData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      <section id="home" className="min-h-[calc(100vh-100px)] flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-4 inline-block">
            {getData('Profile Image') && (
              <div className="w-40 h-40 mx-auto mb-4 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg group-hover:blur-xl transition-all"></div>
                <img
                  src={getData('Profile Image')}
                  alt="Profile"
                  className="relative w-full h-full rounded-full object-cover border-4 border-white/20"
                />
              </div>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-in">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              {getData('Name', 'Your Name')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            {getData('Title', 'Full Stack Developer')}
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed">
            {getData('Tagline', 'Creating amazing digital experiences with modern technologies')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="#projects"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
            >
              View Projects
            </a>
            <a
              href={getData('Resume Link', '#')}
              className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold hover:bg-white/20 transform hover:scale-105 transition-all duration-300"
            >
              Download Resume
            </a>
          </div>

          {/* Social QR Codes Row */}
          {getSocialLinks && getSocialLinks().length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              {getSocialLinks().map((social, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white p-2 rounded-xl shadow-xl mb-2">
                    <QRCodeSVG
                      value={social.url}
                      size={80}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23${social.color.replace('#', '')}'%3E%3Cpath d='${social.icon}'/%3E%3C/svg%3E`,
                        height: 20,
                        width: 20,
                        excavate: true,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{social.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                About Me
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-75"></div>
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                {getData('About Image') ? (
                  <img
                    src={getData('About Image')}
                    alt="About"
                    className="w-full h-96 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl flex items-center justify-center">
                    <svg className="w-24 h-24 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white">
                {getData('About Title', 'Passionate Developer & Creative Thinker')}
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                {getData('About Description', 'I am a passionate developer dedicated to creating beautiful, functional, and user-centered digital experiences. With expertise in modern web technologies, I bring ideas to life through clean code and innovative solutions.')}
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                {getData('About Description 2', 'My approach combines technical excellence with creative problem-solving, ensuring every project not only meets but exceeds expectations. I thrive on challenges and continuously learn to stay at the forefront of technology.')}
              </p>

              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {getData('Years Experience', '5+')}
                  </div>
                  <div className="text-gray-400">Years Experience</div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className="text-4xl font-bold text-pink-400 mb-2">
                    {getData('Projects Count', '50+')}
                  </div>
                  <div className="text-gray-400">Projects Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className="py-24 px-6 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Skills & Expertise
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
          </div>

          {skills.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">{skill.name}</h3>
                    <span className="text-purple-400 font-bold">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Add skills to your Google Sheet to display them here</p>
            </div>
          )}
        </div>
      </section>

      <section id="projects" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Featured Projects
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
          </div>

          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-60"></div>
                  </div>

                  <div className="relative p-6">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex gap-4">
                      {project.link && project.link !== '#' && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <span>Live Demo</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <span>GitHub</span>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Add projects to your Google Sheet to display them here</p>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default PurplishPortfolio;