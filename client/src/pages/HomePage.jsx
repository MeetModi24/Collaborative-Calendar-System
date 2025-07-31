// src/pages/HomePage.jsx
import React from 'react';
import AppLayout from '../components/AppLayout';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import { FaCalendarCheck, FaUsers, FaBell } from 'react-icons/fa';

export default function HomePage() {
  return (
    <AppLayout>
      <HeroSection />
      <div className="row">
        {[ // uniform cards
          {
            icon: <FaCalendarCheck />,
            title: 'One View for All Your Events',
            desc: 'See everything in your schedule – personal and team events.',
          },
          {
            icon: <FaUsers />,
            title: 'Team Collaboration',
            desc: 'Invite members, track RSVPs, and adjust availability.',
          },
          {
            icon: <FaBell />,
            title: 'Instant Event Alerts',
            desc: 'Get notified about invitations and changes immediately.',
          },
        ].map((item, idx) => (
          <div className="col-md-4 mb-3 d-flex" key={idx}>
            <FeatureCard icon={item.icon} title={item.title} description={item.desc} />
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
