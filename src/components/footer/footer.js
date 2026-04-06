import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import './Footer.css';

const currentYear = new Date().getFullYear();

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: <FaFacebookF /> },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: <FaInstagram /> },
  { label: 'X', href: 'https://x.com/', icon: <FaXTwitter /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: <FaLinkedinIn /> },
];

const footerLinks = [
  { label: 'Featured Events', to: '/' },
  { label: 'My Events', to: '/my-events' },
  { label: 'Host Dashboard', to: '/dashboard' },
  { label: 'Register', to: '/register' },
];

const Footer = () => {
  return (
    <footer className="site_footer">
      <div className="footer_shell">
        <div className="footer_intro">
          <span className="footer_badge">Event Management System</span>
          <h2>Plan, publish, and book memorable experiences with confidence.</h2>
          <p>
            Discover events, manage bookings, and stay connected through a polished platform
            built for guests and hosts.
          </p>
        </div>

        <div className="footer_links_block">
          <h3>Quick Links</h3>
          <nav className="footer_links" aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.to} className="footer_link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer_social_block">
          <h3>Connect With Us</h3>
          <p>Follow our channels for event drops, updates, and community highlights.</p>
          <div className="footer_socials">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                className="footer_social_link"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer_bottom_bar">
        <p>© {currentYear} EMS. All rights reserved.</p>
        <p>Crafted for scalable event experiences across every screen size.</p>
      </div>
    </footer>
  );
};

export default Footer;
