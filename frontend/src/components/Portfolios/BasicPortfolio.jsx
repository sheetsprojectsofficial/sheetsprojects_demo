import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { apiFetch } from '../../utils/api';

const BasicPortfolio = () => {
  const [portfolioData, setPortfolioData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  useEffect(() => {
    fetchPortfolioData();
    
    // Load the portfolio JavaScript after component mounts
    const loadPortfolioJS = () => {
      const script = document.createElement('script');
      script.src = '/portfolio-main.js';
      script.async = true;
      document.body.appendChild(script);
      
      // Also load ScrollReveal if not already loaded
      if (!window.ScrollReveal) {
        const scrollRevealScript = document.createElement('script');
        scrollRevealScript.src = 'https://unpkg.com/scrollreveal';
        scrollRevealScript.async = true;
        document.head.appendChild(scrollRevealScript);
      }
    };
    
    loadPortfolioJS();
    
    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[src="/portfolio-main.js"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFetch('/portfolio/dynamic');
      const data = await response.json();
      
      if (data.success) {
        setPortfolioData(data.portfolioData);
        setSelectedPortfolio(data.selectedPortfolio);
        
        // Show info message if using default data
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
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              Please select a portfolio in the settings sheet dropdown
            </p>
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
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              The selected portfolio settings sheet is empty
            </p>
          </div>, 
          {
            position: "top-center",
            autoClose: false
          }
        );
        break;
        
      case 'PERMISSION_ERROR':
        setError('Permission denied accessing portfolio data');
        toast.error(
          <div>
            <strong>Permission Error</strong>
            <p>{details}</p>
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              The portfolio settings sheet needs to be shared with the service account
            </p>
          </div>, 
          {
            position: "top-center",
            autoClose: false
          }
        );
        break;
        
      case 'INVALID_URL':
        setError('Invalid portfolio settings sheet URL');
        toast.error(
          <div>
            <strong>Invalid URL</strong>
            <p>{details}</p>
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
              The settings sheet URL in the dropdown is not valid
            </p>
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

  // Helper function to get data with fallback
  const getData = (key, fallback = '') => {
    return portfolioData[key] || fallback;
  };

  // Helper function to get work data dynamically
  const getWorkData = () => {
    const workItems = [];
    let i = 1;
    
    // Keep looking for work items until we find no more
    while (true) {
      const imageUrl = getData(`Work ${i} Image Url`);
      const title = getData(`Work ${i} Title`);
      const description = getData(`Work ${i} Description`);
      const liveLink = getData(`Work ${i} Live Link`);
      
      // If we have at least a title or image, add this work item
      if (imageUrl || title) {
        workItems.push({
          image: imageUrl || `/portfolio-img/work${((i - 1) % 6) + 1}.jpg`,
          title: title || `Project ${i}`,
          description: description || 'A showcase of my work and skills.',
          link: liveLink || '#'
        });
        i++;
      } else {
        // No more work items found
        break;
      }
    }
    
    return workItems;
  };

  // Helper function to get skills data dynamically
  const getSkillsData = () => {
    const skills = [];
    
    // Get all keys from portfolioData and find skills
    Object.keys(portfolioData).forEach(key => {
      const value = portfolioData[key];
      
      // Check if this is a skill (has a numeric value and is not a URL or other data)
      if (value && !isNaN(value) && value > 0 && value <= 100) {
        // Skip if it's clearly not a skill (like row numbers, IDs, etc.)
        if (!key.toLowerCase().includes('url') && 
            !key.toLowerCase().includes('link') && 
            !key.toLowerCase().includes('image') &&
            !key.toLowerCase().includes('description') &&
            !key.toLowerCase().includes('title') &&
            !key.toLowerCase().includes('name') &&
            !key.toLowerCase().includes('email') &&
            !key.toLowerCase().includes('phone') &&
            !key.toLowerCase().includes('location') &&
            !key.toLowerCase().includes('about') &&
            !key.toLowerCase().includes('work') &&
            !key.toLowerCase().includes('footer') &&
            !key.toLowerCase().includes('copyright') &&
            !key.toLowerCase().includes('skill') && // Skip the "Skill" header row
            key.trim() !== '') {
          
          skills.push({
            name: key,
            percentage: parseInt(value)
          });
        }
      }
    });
    
    // Sort skills by percentage (highest first)
    skills.sort((a, b) => b.percentage - a.percentage);
    
    return skills;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Portfolio Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchPortfolioData}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      {/* Include Portfolio CSS and Boxicons CSS */}
      <link rel="stylesheet" href="/portfolio-styles.css" />
      <link href='https://cdn.jsdelivr.net/npm/boxicons@2.0.5/css/boxicons.min.css' rel='stylesheet' />
      
      {/* Enhanced Work Section Styles */}
      <style>{`
        .work__card {
          background: #fff;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
          margin-bottom: 2rem;
        }
        
        .work__card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .work__image-container {
          position: relative;
          overflow: hidden;
          height: 180px;
        }
        
        .work__image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .work__card:hover .work__image {
          transform: scale(1.1);
        }
        
        .work__overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(74, 144, 226, 0.9), rgba(80, 227, 194, 0.9));
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .work__card:hover .work__overlay {
          opacity: 1;
        }
        
        .work__overlay-content {
          text-align: center;
          color: white;
          padding: 1rem;
        }
        
        .work__overlay .work__title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }
        
        .work__overlay .work__description {
          font-size: 0.9rem;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .work__link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .work__link:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        .work__info {
          padding: 1rem;
        }
        
        .work__project-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--second-color);
          margin-bottom: 0.5rem;
        }
        
        .work__project-description {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        
        .work__tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .work__tech-tag {
          background: linear-gradient(135deg, #4a90e2, #50e3c2);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .work__subtitle {
          text-align: center;
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .work__container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        @media (max-width: 1200px) {
          .work__container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 900px) {
          .work__container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .work__container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .work__image-container {
            height: 200px;
          }
          
          .work__info {
            padding: 1rem;
          }
        }
        
        
        /* Sleek Skills Section Styles */
        .skills__subtitle {
          text-align: center;
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 3rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .skills__grid-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin: 2rem 2rem 0 2rem;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .skills__card {
          background: transparent;
          border-radius: 8px;
          padding: 1.5rem 0;
          transition: all 0.3s ease;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .skills__card:hover {
          border-bottom-color: #4a90e2;
        }
        
        .skills__card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .skills__name {
          font-size: 1rem;
          font-weight: 500;
          color: var(--second-color);
          margin: 0;
        }
        
        .skills__percentage {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a90e2;
        }
        
        .skills__progress-container {
          margin-top: 0.5rem;
        }
        
        .skills__progress-bar {
          width: 100%;
          height: 4px;
          background: #f5f5f5;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .skills__progress-fill {
          height: 100%;
          background: #4a90e2;
          border-radius: 2px;
          transition: width 1.5s ease-out;
        }
        
        @media (max-width: 768px) {
          .skills__grid-container {
            grid-template-columns: 1fr;
            gap: 0.5rem;
            margin: 2rem 1rem 0 1rem;
          }
          
          .skills__card {
            padding: 1rem 0;
          }
          
          .skills__name {
            font-size: 0.95rem;
          }
          
          .skills__percentage {
            font-size: 0.85rem;
          }
        }
      `}</style>
      
      <main className="l-main">
        {/*===== HOME =====*/}
        <section className="home bd-grid" id="home">
          <div className="home__data">
            <h1 className="home__title">
              Hi,<br/>
              I'am <span className="home__title-color">{getData('Name', 'Your Name')}</span><br/> 
              {getData('Title', 'Web Designer')}
            </h1>
          </div>

          <div className="home__social">
            {getData('Linkedin Link') && (
              <a href={getData('Linkedin Link')} className="home__social-icon" target="_blank" rel="noopener noreferrer">
                <i className='bx bxl-linkedin'></i>
              </a>
            )}
            {getData('Twitter Link') && (
              <a href={getData('Twitter Link')} className="home__social-icon" target="_blank" rel="noopener noreferrer">
                <i className='bx bxl-twitter'></i>
              </a>
            )}
            {getData('GitHub Link') && (
              <a href={getData('GitHub Link')} className="home__social-icon" target="_blank" rel="noopener noreferrer">
                <i className='bx bxl-github'></i>
              </a>
            )}
          </div>

          <div className="home__img">
            <svg className="home__blob" viewBox="0 0 479 467" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
              <mask id="mask0" maskType="alpha">
                <path d="M9.19024 145.964C34.0253 76.5814 114.865 54.7299 184.111 29.4823C245.804 6.98884 311.86 -14.9503 370.735 14.143C431.207 44.026 467.948 107.508 477.191 174.311C485.897 237.229 454.931 294.377 416.506 344.954C373.74 401.245 326.068 462.801 255.442 466.189C179.416 469.835 111.552 422.137 65.1576 361.805C17.4835 299.81 -17.1617 219.583 9.19024 145.964Z"/>
              </mask>
              {/* <g mask="url(#mask0)"> */}
                <path d="M9.19024 145.964C34.0253 76.5814 114.865 54.7299 184.111 29.4823C245.804 6.98884 311.86 -14.9503 370.735 14.143C431.207 44.026 467.948 107.508 477.191 174.311C485.897 237.229 454.931 294.377 416.506 344.954C373.74 401.245 326.068 462.801 255.442 466.189C179.416 469.835 111.552 422.137 65.1576 361.805C17.4835 299.81 -17.1617 219.583 9.19024 145.964Z"/>
                <foreignObject x="80" y="60" width="320" height="347">
                  <img 
                    src={getData('Hero Image Url', '/portfolio-img/perfil.png')}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '90%',
                      objectFit: 'cover',
                      borderRadius: '10px'
                    }}
                  />
                </foreignObject>
              {/* </g> */}
            </svg>
          </div>
        </section>

        {/*===== ABOUT =====*/}
        <section className="about section" id="about">
          <h2 className="section-title">About</h2>
          <div className="about__container bd-grid">
            <div className="about__img">
              <img src={getData('About Image Url', '/portfolio-img/about.jpg')} alt="About" />
            </div>
            <div>
              <h2 className="about__subtitle">I'am {getData('Name', 'Your Name')}</h2>
              <p className="about__text">
                {getData('About You', 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptate cum expedita quo culpa tempora, assumenda, quis fugiat ut voluptates soluta, aut earum nemo recusandae cumque perferendis! Recusandae alias accusamus atque.')}
              </p>           
            </div>                                   
          </div>
        </section>

        {/*===== SKILLS =====*/}
        {getSkillsData().length > 0 && (
          <section className="skills section" id="skills">
            <h2 className="section-title">Skills</h2>
            <p className="skills__subtitle">Here are my technical skills and expertise areas</p>
            
            <div className="skills__grid-container">
              {/* Dynamic Skills from Google Sheet */}
              {getSkillsData().map((skill, index) => (
                <div key={index} className="skills__card">
                  <div className="skills__card-header">
                    <h3 className="skills__name">{skill.name}</h3>
                    <span className="skills__percentage">{skill.percentage}%</span>
                  </div>
                  <div className="skills__progress-container">
                    <div className="skills__progress-bar">
                      <div 
                        className="skills__progress-fill"
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/*===== WORK =====*/}
        {getWorkData().length > 0 && (
          <section className="work section" id="work">
            <h2 className="section-title">My Projects</h2>
            <p className="work__subtitle">Here are some of my recent projects and work</p>
            <div className="work__container bd-grid">
              {getWorkData().map((work, index) => (
                <div key={index} className="work__card">
                  <div className="work__image-container">
                    <img 
                      src={work.image} 
                      alt={work.title}
                      className="work__image"
                      onError={(e) => {
                        e.target.src = `/portfolio-img/work${(index % 6) + 1}.jpg`;
                        e.target.onerror = null;
                      }}
                    />
                    <div className="work__overlay">
                      <div className="work__overlay-content">
                        <h3 className="work__title">{work.title}</h3>
                        <p className="work__description">{work.description}</p>
                        <div className="work__actions">
                          <a 
                            href={work.link} 
                            className="work__link"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <i className='bx bx-link-external'></i>
                            View Project
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="work__info">
                    <h4 className="work__project-title">{work.title}</h4>
                    <p className="work__project-description">{work.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// Helper function to get skill icons
const getSkillIcon = (skillName) => {
  const skill = skillName.toLowerCase();
  if (skill.includes('html')) return 'bxl-html5';
  if (skill.includes('css')) return 'bxl-css3';
  if (skill.includes('javascript') || skill.includes('js')) return 'bxl-javascript';
  if (skill.includes('react')) return 'bxl-react';
  if (skill.includes('node')) return 'bxl-nodejs';
  if (skill.includes('python')) return 'bxl-python';
  if (skill.includes('java')) return 'bxl-java';
  if (skill.includes('php')) return 'bxl-php';
  if (skill.includes('sql') || skill.includes('database')) return 'bx-data';
  if (skill.includes('git')) return 'bxl-git';
  if (skill.includes('figma') || skill.includes('design')) return 'bxs-paint';
  if (skill.includes('ux') || skill.includes('ui')) return 'bxs-paint';
  return 'bx-code-alt'; // Default icon
};

export default BasicPortfolio;
