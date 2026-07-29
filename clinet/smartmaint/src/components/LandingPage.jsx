import { useNavigate } from 'react-router-dom';
import './css/LandingPage.css';
import { ClipboardList, UserCheck, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <nav>
        <div className="nav-container">
          <div className="nav-logo">SmartMaint</div>
          <div className="nav-menu">
            <a className="nav-link active" href="#">Home</a>
            <a className="nav-link" href="#">Features</a>
            <a className="nav-link" href="#">About</a>
            <a className="nav-link" href="#">Contact</a>
          </div>
          <div className="nav-buttons">
            <button className="nav-button nav-button-login" onClick={() => navigate('/login')}>Login</button>
            <button className="nav-button nav-button-register" onClick={() => navigate('/signup')}>Register</button>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="capsule-label">Property Maintenance Platform</div>
              <h1 className="hero-title">
                Smart <br />
                Maintenance, <br />
                Simplified.
              </h1>
              <p className="hero-description">
                Intelligent stewardship for the world's most distinguished portfolios. Manage requests, work orders, and assets from one refined platform.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
                <button className="btn-secondary">
                  <span className="btn-icon">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </span>
                  <span className="btn-text">Request Demo</span>
                </button>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-main">
                <img
                  alt="Modern office architecture"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo0Cgk6J-U5aDn4ezSAWtLjoAsrA3zZZqDOwJaIet0ToV3AswTd7k47YKzOV_L-m9RH3iLwhBK2B8hvbdKINEpygs73WH7XzWbF8eOzSUiVDzcKxUFGrw_evANoynZ_8myI62F-epPXLR1yx08nR80YJPFwVaVUpj2LC6ngiRMBAbCv1rzrp2jwMS7RY_ySPumXRuW-_vqTLoIDYr0TNPGVERQw_ZLKSAXwGZ7lY2DCtHsIetn9AvE6DVLFp_V7sGtNZ6PAjuF2aU"
                />
              </div>
              <div className="hero-image-residence">
                <img
                  alt="Luxury residence"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfOYrLkMUafYu4hfOwDXxlOH7_D7WJZTfWXc2Gx_xwv7EpvnYQb7FR6LBHDx3d4PTOU37sap1LkpuUUM97jwQQhlyXm9f26kALrMgWm7vpvLNdQz02PFwANzg4rKvdEbE6m2wmjUFMfu5oXF_w1Rue4Qskr2VModwmamsFuwQbLQHpyx_EF71UTWZ6Gq5Pp0Guf0cLCDlILCUD5UmhVC_kY7IRQ1CHVyGE9Xsgm8XpvSCOfJWtvVuYua3JNXhGmAuNSRsV7dzap9U"
                />
              </div>
              <div className="hero-image-profile">
                <img
                  alt="Maintenance Manager"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuALrpH-22WQ7OQqzrty-NYUThqq5RSUOMQGeVLiWce5w2eO_KS0bSvzSIrHYptUxZ07N365Rb5rHTGYgf9SIU8_GqxKVCWoQJgsT_q1X3FW_RJWviaKpLV9IREAMMPzJiLSBManXP7igHeHFF8b2tig9ENmP_uweJoeQF0o8ob-kTEgPYg1CSWD_NzgP0C3ozVUQ5qgp-L9DYufCD44BoJidVUAKo3navJA-kpwn8aOHPxyFG5ctQotAQbfQ7wn-IRCFHwLAq3y5VM"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section-services">
          <div className="container-max">
            <div className="section-header">
              <div className="section-header-left">
                <div className="capsule-label">Capabilities</div>
                <h2 className="section-title">
                  Precision <br />
                  Management
                </h2>
              </div>
              <div className="section-header-right">
                <p>
                  "Every structural detail deserves meticulous attention. Our platform ensures nothing is overlooked."
                </p>
              </div>
            </div>

            <div className="services-grid">
              <div className="service-card">
                <img
                  alt="Maintenance Requests"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeoNgxe7L4XFDRtrTneNgxYNKRNbFZgyYr90J05BVzmrNs2fihSCL0AtsU3pP-CHN6azQyqcB2oFa_rSy-HcemlPy-N9Y3mcczFBoHNo-CrYMvJHODDBtplYS57sNIgQCB3pSHO8-jmhu8UCoPRyqPLZv7nJulIvZN-g6i242w_gS45UqV9E8MOx8MBcK3cdJIT54k5KWoziEi5oufzSTJcU2g3P8SyqBYD_wnD1aHqPx0hvBVkLflwa_6YRlJjXpenUFChoKBK8E"
                />
                <div className="service-overlay"></div>
                <div className="service-content">
                  <h3>Maintenance Requests</h3>
                  <div className="service-divider"></div>
                  <p className="service-description">Seamless Tenant Portals</p>
                </div>
              </div>

              <div className="service-card service-2">
                <img
                  alt="Technician Assignment"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnUHdyK0ZMw2m3GwpTlTwM1pm2Gs2T3C_FjE69T-BVllpDSP0ubh0R6NaVzHgH0T6FGtIqkY34z9QFYN4DC1g98c8o9d7rMvAbDjF7Nglg6Tigs1snAYiGLvKOCGVeF0s40AmmpSiilcn3VRmfTzSWWFF3BqLeJi6GCxcgQupQzomZBvnr3rAAY35usU_DX_BL5wJKojY8kcgAeb0SPHzRJ7qYdPM6c7Qe6lYplgzaoc31JdU5VulW1Z-K9z5v6lxk3_wzu1cJwTc"
                />
                <div className="service-overlay"></div>
                <div className="service-content">
                  <h3>Technician Assignment</h3>
                  <div className="service-divider"></div>
                  <p className="service-description">Smart Scheduling Algorithm</p>
                </div>
              </div>

              <div className="service-card">
                <img
                  alt="Work Order Tracking"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo0Cgk6J-U5aDn4ezSAWtLjoAsrA3zZZqDOwJaIet0ToV3AswTd7k47YKzOV_L-m9RH3iLwhBK2B8hvbdKINEpygs73WH7XzWbF8eOzSUiVDzcKxUFGrw_evANoynZ_8myI62F-epPXLR1yx08nR80YJPFwVaVUpj2LC6ngiRMBAbCv1rzrp2jwMS7RY_ySPumXRuW-_vqTLoIDYr0TNPGVERQw_ZLKSAXwGZ7lY2DCtHsIetn9AvE6DVLFp_V7sGtNZ6PAjuF2aU"
                />
                <div className="service-overlay"></div>
                <div className="service-content">
                  <h3>Work Order Tracking</h3>
                  <div className="service-divider"></div>
                  <p className="service-description">Real-time Visibility</p>
                </div>
              </div>
            </div>

            <div className="services-list">
              <div className="service-item">
                <span className="service-item-label">SERVICE 04</span>
                <h4>Property Inspections</h4>
                <p>Digital checklists with photo verification for impeccable compliance and historical logging.</p>
              </div>
              <div className="service-item">
                <span className="service-item-label">SERVICE 05</span>
                <h4>Invoice Management</h4>
                <p>Automated billing and vendor payments consolidated into one unified, transparent ledger.</p>
              </div>
              <div className="service-item">
                <span className="service-item-label">SERVICE 06</span>
                <h4>Asset Analytics</h4>
                <p>Predictive maintenance insights to protect and enhance your portfolio's long-term value.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-timeline">
          <div className="timeline-header">
            <div className="capsule-label">Methodology</div>
            <h2 className="section-title mt-6">The Intelligent Flow</h2>
          </div>

          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="timeline-image">
                <div className="timeline-icon"><ClipboardList size={48} color="#0B2818" /></div>
              </div>
              <div className="timeline-content">
                <span className="timeline-number">01</span>
                <h3>Submit Request</h3>
                <p>Tenants and managers log requests via a high-fidelity interface with instant priority categorization and automated routing.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-image">
                <div className="timeline-icon"><UserCheck size={48} color="#0B2818" /></div>
              </div>
              <div className="timeline-content">
                <span className="timeline-number">02</span>
                <h3>Assign Technician</h3>
                <p>Our intelligent dispatch engine matches the most qualified artisan to the specific architectural requirements of the task.</p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-image">
                <div className="timeline-icon"><CheckCircle size={48} color="#0B2818" /></div>
              </div>
              <div className="timeline-content">
                <span className="timeline-number">03</span>
                <h3>Track Completion</h3>
                <p>Live status updates and final digital verification ensure every task meets the uncompromising SmartMaint standard of excellence.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-portfolio">
          <div className="portfolio-header">
            <div className="capsule-label">Portfolio</div>
            <h2 className="section-title">Curated Excellence</h2>
          </div>

          <div className="portfolio-grid">
            <div className="portfolio-item portfolio-item-1">
              <img
                alt="Corporate Portfolio"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo0Cgk6J-U5aDn4ezSAWtLjoAsrA3zZZqDOwJaIet0ToV3AswTd7k47YKzOV_L-m9RH3iLwhBK2B8hvbdKINEpygs73WH7XzWbF8eOzSUiVDzcKxUFGrw_evANoynZ_8myI62F-epPXLR1yx08nR80YJPFwVaVUpj2LC6ngiRMBAbCv1rzrp2jwMS7RY_ySPumXRuW-_vqTLoIDYr0TNPGVERQw_ZLKSAXwGZ7lY2DCtHsIetn9AvE6DVLFp_V7sGtNZ6PAjuF2aU"
              />
            </div>
            <div className="portfolio-item portfolio-item-2">
              <img
                alt="Residential Portfolio"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfOYrLkMUafYu4hfOwDXxlOH7_D7WJZTfWXc2Gx_xwv7EpvnYQb7FR6LBHDx3d4PTOU37sap1LkpuUUM97jwQQhlyXm9f26kALrMgWm7vpvLNdQz02PFwANzg4rKvdEbE6m2wmjUFMfu5oXF_w1Rue4Qskr2VModwmamsFuwQbLQHpyx_EF71UTWZ6Gq5Pp0Guf0cLCDlILCUD5UmhVC_kY7IRQ1CHVyGE9Xsgm8XpvSCOfJWtvVuYua3JNXhGmAuNSRsV7dzap9U"
              />
            </div>
            <div className="portfolio-item portfolio-item-3">
              <img
                alt="Lobby Details"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeoNgxe7L4XFDRtrTneNgxYNKRNbFZgyYr90J05BVzmrNs2fihSCL0AtsU3pP-CHN6azQyqcB2oFa_rSy-HcemlPy-N9Y3mcczFBoHNo-CrYMvJHODDBtplYS57sNIgQCB3pSHO8-jmhu8UCoPRyqPLZv7nJulIvZN-g6i242w_gS45UqV9E8MOx8MBcK3cdJIT54k5KWoziEi5oufzSTJcU2g3P8SyqBYD_wnD1aHqPx0hvBVkLflwa_6YRlJjXpenUFChoKBK8E"
              />
            </div>
            <div className="portfolio-item portfolio-item-4">
              <img
                alt="Manager at Work"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuALrpH-22WQ7OQqzrty-NYUThqq5RSUOMQGeVLiWce5w2eO_KS0bSvzSIrHYptUxZ07N365Rb5rHTGYgf9SIU8_GqxKVCWoQJgsT_q1X3FW_RJWviaKpLV9IREAMMPzJiLSBManXP7igHeHFF8b2tig9ENmP_uweJoeQF0o8ob-kTEgPYg1CSWD_NzgP0C3ozVUQ5qgp-L9DYufCD44BoJidVUAKo3navJA-kpwn8aOHPxyFG5ctQotAQbfQ7wn-IRCFHwLAq3y5VM"
              />
              <div className="portfolio-overlay">
                <div className="portfolio-card">
                  <h3>Trusted by Premier Estates</h3>
                  <p>"The clarity SmartMaint provides for our portfolio management is unparalleled in the industry."</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-cta">
          <div className="cta-container">
            <div className="capsule-label">Get Started</div>
            <h2 className="cta-title">
              Transform Your Property <br />
              Operations Today
            </h2>
            <p className="cta-description">
              Elevate your standards. Join the world's most sophisticated maintenance ecosystem designed for architectural longevity.
            </p>
            <div className="cta-buttons">
              <button className="btn-primary" onClick={() => navigate('/signup')}>Start Free Trial</button>
              <button className="btn-secondary">
                <span className="btn-icon">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </span>
                <span className="btn-text">Book a Demo</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h2>SmartMaint</h2>
              <p>Architectural excellence in maintenance. We provide the tools for the world's most discerning property managers.</p>
              <div className="footer-social">
                <a href="#">
                  <span className="material-symbols-outlined">share</span>
                </a>
                <a href="#">
                  <span className="material-symbols-outlined">public</span>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <span className="footer-section-label">COMPANY</span>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
                <a href="#">Partners</a>
              </div>
              <div className="footer-section">
                <span className="footer-section-label">RESOURCES</span>
                <a href="#">Documentation</a>
                <a href="#">Support Center</a>
                <a href="#">Privacy Policy</a>
              </div>
              <div className="footer-section">
                <span className="footer-section-label">OFFICE</span>
                <p>Architectural Way<br />Adiatu ogbomoso.</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 SmartMaint Platform. All Rights Reserved.</span>
            <div className="footer-links-bottom">
              <a href="#">Cookies</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
