import { Link } from 'react-router-dom';
import { Calendar, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../../context';

export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = {
    product: [
      { label: t('nav.events'), to: '/events' },
      { label: t('nav.create'), to: '/create-event' },
      { label: t('nav.dashboard'), to: '/dashboard' },
    ],
    company: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Blog', to: '/blog' },
    ],
    support: [
      { label: 'Help Center', to: '/help' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {t('app.name')}
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-sm">
              {t('app.description')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <a 
                href="mailto:contact@luminanexus.com" 
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@luminanexus.com
              </a>
              <a 
                href="tel:+1234567890" 
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +1 (234) 567-890
              </a>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                Addis Ababa, Ethiopia
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              {t('nav.events')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} {t('app.name')}. All rights reserved.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
