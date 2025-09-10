import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Trophy, Users, Star, MapPin, Calendar, Users2 } from 'lucide-react'
import { motion } from 'framer-motion'

const InfoCard = ({ icon, title, text, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-lg hover:bg-white/10 transition-all duration-300"
  >
    <div className="text-3xl mb-4 text-accent-500">{icon}</div>
    <div className="font-bold text-lg mb-2">{title}</div>
    <div className="text-white/80 text-sm">{text}</div>
  </motion.div>
);

const FeatureHighlight = ({ icon, title, description }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
    <div className="text-2xl text-accent-500 mt-1">{icon}</div>
    <div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-white/70 text-sm mt-1">{description}</p>
    </div>
  </div>
);

export default function Home(){
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-accent-500 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-white">DWARLY / دورلي</h2>
          <p className="text-white/70 mt-2">Loading your football journey...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-brand-800/60 to-brand-900/80 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(178,255,58,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(178,255,58,0.1),transparent_35%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Discover Egypt's Premier<br />
              <span className="text-accent-500">Football Academies</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              دورلي — منصة الذكية التي تربط بين أكاديميات كرة القدم واللاعبين المحترفين في مصر. 
              اكتشف، تواصل، وارتقِ بمستواك.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Link 
                to="/academies" 
                className="px-8 py-4 rounded-2xl bg-accent-500 text-brand-900 font-bold text-lg shadow-lg hover:shadow-glow hover:scale-105 transition-all duration-300"
              >
                🔍 Explore Academies
              </Link>
              <Link 
                to="/matches" 
                className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                💼 Find Jobs
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <InfoCard 
                icon={<Shield className="w-8 h-8" />} 
                title="Verified" 
                text="AI-powered verification system" 
                delay={0.1}
              />
              <InfoCard 
                icon={<Star className="w-8 h-8" />} 
                title="Rated" 
                text="Community-driven ratings" 
                delay={0.2}
              />
              <InfoCard 
                icon={<Users className="w-8 h-8" />} 
                title="Connected" 
                text="Seamless matchmaking" 
                delay={0.3}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-700/30 to-accent-500/20" />
              <img 
                src="/assets/Outside App Logo.jpg" 
                onError={(e)=>{e.currentTarget.style.display='none'}} 
                alt="DWARLY Platform" 
                className="w-full h-96 object-cover opacity-90"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-900 to-transparent p-8">
                <div className="text-3xl font-black text-white mb-2">DWARLY / دورلي</div>
                <div className="text-accent-400 font-semibold">Elevating Egyptian Football Talent</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-brand-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose DWARLY?</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Revolutionizing how football academies and players connect in Egypt
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureHighlight
              icon={<MapPin />}
              title="Comprehensive Directory"
              description="Access to all major football academies across Egypt with detailed information and locations"
            />
            <FeatureHighlight
              icon={<Calendar />}
              title="Job Opportunities"
              description="Find coaching positions at top football academies across Egypt"
            />
            <FeatureHighlight
              icon={<Users2 />}
              title="Player Management"
              description="Streamlined player registration and academy membership management"
            />
            <FeatureHighlight
              icon={<Shield />}
              title="Verified Profiles"
              description="All academies are verified and rated by our community"
            />
            <FeatureHighlight
              icon={<Trophy />}
              title="Performance Tracking"
              description="Monitor academy performance and player development"
            />
            <FeatureHighlight
              icon={<Star />}
              title="Community Ratings"
              description="Real reviews and ratings from players and parents"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-brand-700 to-brand-800">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Elevate Your Football Journey?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of players and academies already using DWARLY to connect, compete, and grow.
            </p>
            <div className="flex justify-center gap-6">
              <Link 
                to="/signup" 
                className="px-8 py-4 rounded-2xl bg-accent-500 text-brand-900 font-bold text-lg hover:shadow-glow hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Link>
              <Link 
                to="/academies" 
                className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                Browse Academies
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
