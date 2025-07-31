// src/pages/HomePage.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import { FaCalendarCheck, FaUsers, FaBell } from 'react-icons/fa';

export default function HomePage() {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <div className="d-flex">
      {showSidebar && <Sidebar />}
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="container mt-4">
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
        </div>
      </div>
    </div>
  );
}
