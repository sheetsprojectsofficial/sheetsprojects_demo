import React, { useState, useEffect } from 'react';

const IntermediatePortfolio = () => {
  const [isVisible, setIsVisible] = useState({ home: true, about: true, skills: true, projects: true, contact: true });
  const [activeProject, setActiveProject] = useState(0);
  const [portfolioData, setPortfolioData] = useState({
    personalInfo: {},
    socialLinks: {},
    skills: [],
    projects: [],
    aboutInfo: {}
  });
  const [loading, setLoading] = useState(true);

  // Fetch portfolio data from backend
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/portfolio/portfolio-data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const portfolioData = {
          personalInfo: {
            name: data.personalInfo?.name || 'Your Name',
            title: data.personalInfo?.title || 'Your Title',
            description: data.personalInfo?.description || 'Your Description',
            profileImageUrl: data.personalInfo?.profileImageUrl || '',
            heroImageUrl: data.personalInfo?.heroImageUrl || '',
            yearsExperience: data.personalInfo?.yearsExperience || '',
            projectsCompleted: data.personalInfo?.projectsCompleted || '',
            happyClients: data.personalInfo?.happyClients || '',
            technologiesCount: data.personalInfo?.technologiesCount || ''
          },
          socialLinks: {
            email: data.socialLinks?.email || '',
            phone: data.socialLinks?.phone || '',
            location: data.socialLinks?.location || '',
            linkedinUrl: data.socialLinks?.linkedinUrl || '',
            githubUrl: data.socialLinks?.githubUrl || '',
            twitterUrl: data.socialLinks?.twitterUrl || '',
            resumeUrl: data.socialLinks?.resumeUrl || ''
          },
          skills: data.skills || [],
          projects: data.projects || [],
          aboutInfo: {
            aboutParagraph1: data.aboutInfo?.aboutParagraph1 || '',
            aboutParagraph2: data.aboutInfo?.aboutParagraph2 || '',
            workspaceImageUrl: data.aboutInfo?.workspaceImageUrl || ''
          }
        };

        setPortfolioData(portfolioData);
      } catch (error) {
        // Fallback to default data
        setPortfolioData({
          personalInfo: {
            name: 'Deep Sharma',
            title: 'Full Stack Developer',
            description: 'Error loading portfolio data. Please check backend configuration.'
          },
          socialLinks: {},
          skills: [],
          projects: [],
          aboutInfo: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  // Helper function to get skill color class
  const getSkillColorClass = (colorName) => {
    const colorMap = {
      'blue': 'bg-blue-500',
      'yellow': 'bg-yellow-500',
      'green': 'bg-green-500',
      'purple': 'bg-purple-500',
      'pink': 'bg-pink-500',
      'red': 'bg-red-500',
      'indigo': 'bg-indigo-500',
      'gray': 'bg-gray-500',
      'orange': 'bg-orange-500',
      'brown': 'bg-amber-600'
    };
    return colorMap[colorName?.toLowerCase()] || 'bg-blue-500';
  };

  // Helper function to process technologies string
  const processTechnologies = (techString) => {
    if (!techString) return [];
    return techString.split(',').map(tech => tech.trim()).filter(tech => tech);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-start justify-center pt-20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className={`transition-all duration-1000 ${isVisible.home ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="mb-6">
              {portfolioData.personalInfo.profileImageUrl && (
                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
                  <img
                    src={portfolioData.personalInfo.profileImageUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              )}
              <h1 className="text-5xl md:text-7xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {portfolioData.personalInfo.name || 'Your Name'}
                </span>
              </h1>
              {portfolioData.personalInfo.title && (
                <div className="text-xl md:text-2xl text-gray-300 mb-8">
                  <span className="typewriter">{portfolioData.personalInfo.title}</span>
                </div>
              )}
              {portfolioData.personalInfo.description && (
                <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                  {portfolioData.personalInfo.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                  View My Work
                </button>
                {portfolioData.socialLinks.resumeUrl && (
                  <a
                    href={portfolioData.socialLinks.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 border-2 border-gray-600 rounded-full text-white font-semibold hover:border-purple-500 hover:text-purple-400 transition-all duration-300"
                  >
                    Download CV
                  </a>
                )}
              </div>

              {/* Social Media Links */}
              <div className="flex justify-center space-x-6">
                {portfolioData.socialLinks.linkedinUrl && (
                  <a
                    href={portfolioData.socialLinks.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}

                {portfolioData.socialLinks.githubUrl && (
                  <a
                    href={`https://github.com/${portfolioData.socialLinks.githubUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}

                {portfolioData.socialLinks.twitterUrl && (
                  <a
                    href={`https://twitter.com/${portfolioData.socialLinks.twitterUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 delay-300 ${isVisible.about ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                About Me
              </span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <div className="space-y-6">
                  {portfolioData.aboutInfo.aboutParagraph1 && (
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {portfolioData.aboutInfo.aboutParagraph1}
                    </p>
                  )}
                  {portfolioData.aboutInfo.aboutParagraph2 && (
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {portfolioData.aboutInfo.aboutParagraph2}
                    </p>
                  )}
                  {!portfolioData.aboutInfo.aboutParagraph1 && !portfolioData.aboutInfo.aboutParagraph2 && (
                    <>
                      <p className="text-lg text-gray-300 leading-relaxed">
                        With over 5 years of experience in full-stack development, I specialize in creating
                        robust web applications that deliver exceptional user experiences. My journey started
                        with a fascination for problem-solving through code, and has evolved into a passion
                        for building scalable, innovative solutions.
                      </p>
                      <p className="text-lg text-gray-300 leading-relaxed">
                        I believe in the power of clean, efficient code and thoughtful design. Whether it's
                        architecting complex backend systems or crafting intuitive frontend interfaces,
                        I approach every project with attention to detail and a commitment to excellence.
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {portfolioData.personalInfo.projectsCompleted && (
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="text-4xl font-bold text-blue-400 mb-2">{portfolioData.personalInfo.projectsCompleted}+</div>
                      <div className="text-gray-400 text-sm">Projects Completed</div>
                    </div>
                  )}
                  {portfolioData.personalInfo.yearsExperience && (
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="text-4xl font-bold text-purple-400 mb-2">{portfolioData.personalInfo.yearsExperience}+</div>
                      <div className="text-gray-400 text-sm">Years Experience</div>
                    </div>
                  )}
                  {portfolioData.personalInfo.happyClients && (
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="text-4xl font-bold text-pink-400 mb-2">{portfolioData.personalInfo.happyClients}+</div>
                      <div className="text-gray-400 text-sm">Happy Clients</div>
                    </div>
                  )}
                  {portfolioData.personalInfo.technologiesCount && (
                    <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="text-4xl font-bold text-green-400 mb-2">{portfolioData.personalInfo.technologiesCount}+</div>
                      <div className="text-gray-400 text-sm">Technologies</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative h-full min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                {portfolioData.aboutInfo.workspaceImageUrl ? (
                  <img
                    src={portfolioData.aboutInfo.workspaceImageUrl}
                    alt="Workspace"
                    className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop"
                    alt="Workspace"
                    className="relative rounded-2xl shadow-2xl w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 delay-300 ${isVisible.skills ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Skills & Expertise
              </span>
            </h2>
            
            {portfolioData.skills.length > 0 && (
              <div className="grid md:grid-cols-2 gap-8">
                {portfolioData.skills.map((skill, index) => (
                  <div key={skill.skillName || index} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-200">{skill.skillName}</span>
                      <span className="text-sm text-gray-400">{skill.skillLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${getSkillColorClass(skill.skillColor)} rounded-full transition-all duration-1000 ease-out group-hover:scale-105`}
                        style={{
                          width: isVisible.skills ? `${skill.skillLevel}%` : '0%',
                          transitionDelay: `${index * 100}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {['Frontend', 'Backend', 'Database', 'DevOps'].map((category, index) => (
                <div
                  key={category}
                  className={`p-6 rounded-xl bg-gray-800/80 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <div className="text-2xl font-bold">{category[0]}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200">{category}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 delay-300 ${isVisible.projects ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Featured Projects
              </span>
            </h2>
            
            {portfolioData.projects.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {portfolioData.projects.map((project, index) => (
                  <div
                    key={project.projectTitle || index}
                    className={`group relative overflow-hidden rounded-2xl bg-gray-800/80 border border-gray-700 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 ${
                      project.featured === 'TRUE' ? 'md:col-span-2 lg:col-span-1' : ''
                    }`}
                    onMouseEnter={() => setActiveProject(index)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {project.projectImage && (
                      <div className="relative overflow-hidden">
                        <img
                          src={project.projectImage}
                          alt={project.projectTitle}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
                        {project.projectTitle}
                      </h3>
                      {project.projectDescription && (
                        <p className="text-gray-400 mb-4 leading-relaxed">
                          {project.projectDescription}
                        </p>
                      )}

                      {project.projectTechnologies && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {processTechnologies(project.projectTechnologies).map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-full border border-gray-600"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex space-x-4">
                        {project.githubUrl && (
                          <a
                            href={`https://github.com/${project.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <span className="text-sm">GitHub</span>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"/>
                            </svg>
                          </a>
                        )}
                        {project.demoUrl && (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span className="text-sm">Live Demo</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`transition-all duration-1000 delay-300 ${isVisible.contact ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Let's Work Together
              </span>
            </h2>
            
            <div className="text-center mb-12">
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Ready to bring your ideas to life? I'm always open to discussing new opportunities 
                and exciting projects. Let's create something amazing together.
              </p>
            </div>
            
          </div>
        </div>
      </section>


      <style jsx>{`
        .typewriter {
          overflow: hidden;
          border-right: .15em solid #9333ea;
          white-space: nowrap;
          margin: 0 auto;
          letter-spacing: .15em;
          animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #9333ea; }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default IntermediatePortfolio;