import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Trophy, Users, Star, MapPin, Calendar, Users2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

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
  const { t } = useLanguage()
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
          <p className="text-white/70 mt-2">{t("common.loading")}</p>
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
        
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:py-20 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 md:mb-6 leading-tight">
              {t("public.welcome")}<br />
              <span className="text-accent-500">{t("public.tagline")}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed">
              {t("public.aboutUsDesc")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
              <Link 
                to="/academies" 
                className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-accent-500 text-brand-900 font-bold text-base md:text-lg shadow-lg hover:shadow-glow hover:scale-105 transition-all duration-300 text-center"
              >
                🔍 {t("public.findAcademies")}
              </Link>
              <Link 
                to="/job-opportunities" 
                className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-white/10 text-white font-bold text-base md:text-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center"
              >
                💼 {t("public.jobOpportunities")}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <InfoCard 
                icon={<Shield className="w-8 h-8" />} 
                title={t("home.verified")} 
                text={t("home.verifiedDesc")} 
                delay={0.1}
              />
              <InfoCard 
                icon={<Star className="w-8 h-8" />} 
                title={t("home.rated")} 
                text={t("home.ratedDesc")} 
                delay={0.2}
              />
              <InfoCard 
                icon={<Users className="w-8 h-8" />} 
                title={t("home.connected")} 
                text={t("home.connectedDesc")} 
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
                <div className="text-accent-400 font-semibold">{t("home.elevatingEgyptian")}</div>
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
            <h2 className="text-4xl font-bold text-white mb-4">{t("public.features")}</h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {t("public.aboutUsDesc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureHighlight
              icon={<MapPin />}
              title={t("public.findAcademies")}
              description={t("public.findAcademiesDesc")}
            />
            <FeatureHighlight
              icon={<Calendar />}
              title={t("public.jobOpportunities")}
              description={t("public.jobOpportunitiesDesc")}
            />
            <FeatureHighlight
              icon={<Users2 />}
              title={t("public.playerManagement")}
              description={t("public.playerManagementDesc")}
            />
            <FeatureHighlight
              icon={<Shield />}
              title={t("home.verifiedProfiles")}
              description={t("home.verifiedProfilesDesc")}
            />
            <FeatureHighlight
              icon={<Trophy />}
              title={t("home.performanceTracking")}
              description={t("home.performanceTrackingDesc")}
            />
            <FeatureHighlight
              icon={<Star />}
              title={t("home.communityRatings")}
              description={t("home.communityRatingsDesc")}
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
              {t("public.getStarted")}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t("public.aboutUsDesc")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <Link 
                to="/signup" 
                className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-accent-500 text-brand-900 font-bold text-base md:text-lg hover:shadow-glow hover:scale-105 transition-all duration-300 text-center"
              >
                {t("public.getStarted")}
              </Link>
              <Link 
                to="/academies" 
                className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-white/10 text-white font-bold text-base md:text-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center"
              >
                {t("public.findAcademies")}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
