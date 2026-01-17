"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { MoveRight, Youtube, Ear, BookOpen, Zap, Globe, Heart, Layers, Grid3X3, User } from "lucide-react";
import { useRef } from "react";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const headerY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      },
    },
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-32 pb-20 relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Glows Removed for Cleaner Look */}

      {/* Hero Section */}
      <section className="relative px-6 pt-10 md:pt-20 z-10 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ y: headerY, opacity: headerOpacity }}
            className="flex flex-col gap-8"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-start/10 border border-brand-start/20 w-fit backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-brand-start animate-ping" />
              <span className="text-brand-start text-sm font-bold tracking-wide">V1.0 LIVE ON YOUTUBE</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.1]">
              The Web <br />
              <span className="text-gradient">Without Barriers.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl text-gray-400 max-w-lg leading-relaxed font-light">
              Experience the world's first AI-powered universal sign language overlay. Starting with YouTube, expanding to Zoom, Teams, and the entire web.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-5 pt-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3 group hover:-translate-y-1"
              >
                Start Contributing
                <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/explore"
                className="px-8 py-4 rounded-2xl glass-panel hover:bg-white/10 text-white font-semibold transition-all hover:border-white/30 flex items-center gap-2 group hover:-translate-y-1"
              >
                <Grid3X3 className="w-5 h-5" />
                Explore Dictionary
              </Link>
              <button className="px-8 py-4 rounded-2xl glass-panel hover:bg-white/10 text-white font-semibold transition-all hover:border-white/30 flex items-center gap-2">
                <Youtube className="w-5 h-5" />
                Watch Demo
              </button>
            </motion.div>

            {/* Platform Badges */}
            <motion.div variants={itemVariants} className="flex gap-4 items-center text-sm font-medium text-gray-500 pt-4">
              <span className="flex items-center gap-2 text-white"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> YouTube</span>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <span>Google Meet</span>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <span>Zoom</span>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <span>Teams</span>
              <span className="w-1 h-1 rounded-full bg-gray-700"></span>
              <span>Netflix</span>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Real Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative perspective-1000 group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-start to-brand-end blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f0f] aspect-video group-hover:transform group-hover:scale-[1.02] transition-all duration-500">
              <Image
                src="/real-demo.jpeg"
                alt="SignTube Demo"
                fill
                className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-500"
              />

              {/* Floating Overlay Card UI */}
              <div className="absolute bottom-6 right-6 p-4 glass-panel rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl max-w-[200px] animate-none">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live Captions</span>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-brand-start"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section - Who We Are */}
      <section className="px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl h-[600px] group"
          >
            <Image
              src="/feature-1.png"
              alt="Who We Are"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-10">
              <h3 className="text-3xl font-bold text-white mb-2">Community Driven</h3>
              <p className="text-gray-300">Built by contributors from around the globe.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-brand-start font-bold tracking-wider uppercase text-sm">Our Mission</h2>
            <h3 className="text-4xl md:text-5xl font-bold leading-tight">One Extension. <br /><span className="text-gradient">Every Platform.</span></h3>
            <p className="text-lg text-gray-400 leading-relaxed border-l-4 border-brand-start pl-6">
              We are StrawHats, and we believe accessibility shouldn't be limited to one website. While we are starting with YouTube, our architecture is designed to overlay on any video content on the web.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              From university lectures on Zoom to daily stand-ups on Microsoft Teams, our goal is to bring expressive, real-time sign language interpretation to every digital conversation.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <Heart className="w-8 h-8 text-red-400 mb-3" />
                <h4 className="font-bold text-lg">Universal Design</h4>
                <p className="text-sm text-gray-400">Works on education, work, and entertainment platforms.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <Globe className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="font-bold text-lg">Open Standard</h4>
                <p className="text-sm text-gray-400">Defining the standard for web sign language.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities Section - What We Can Do */}
      <section className="px-6 relative z-10 bg-white/5 py-32 -mx-6 md:-mx-0 md:rounded-[4rem]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-brand-start font-bold tracking-wider uppercase text-sm mb-4">Capabilities</h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-6">More Than Just Captions</h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Our extension leverages advanced AI to translate spoken audio into visual sign language in real-time.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: Zap,
                  color: "text-yellow-400",
                  title: "Real-Time Processing",
                  desc: "Instant audio-to-text-to-sign conversion pipeline ensuring minimal latency."
                },
                {
                  icon: Layers,
                  color: "text-purple-400",
                  title: "Context Awareness",
                  desc: "Our NLP models understand context, differentiating 'bow' (weapon) from 'bow' (gesture)."
                },
                {
                  icon: BookOpen,
                  color: "text-green-400",
                  title: "Expanding Dictionary",
                  desc: "A constantly growing database of crowdsourced GIFs and animations."
                },
                {
                  icon: User,
                  color: "text-blue-400",
                  title: "3D Avatar Fallback",
                  desc: "Seamless 3D character animation when standard GIFs are unavailable."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6 p-6 rounded-3xl hover:bg-white/5 transition-colors cursor-default border border-transparent hover:border-white/5"
                >
                  <div className={`p-4 rounded-2xl bg-white/5 h-fit ${feature.color}`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">{feature.title}</h4>
                    <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 2 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-brand-start/5 blur-2xl -z-10 rounded-full" />
              <Image
                src="/feature-2.png"
                alt="Capabilities Interface"
                width={800}
                height={600}
                className="rounded-[2rem] border-2 border-white/10 shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Future Section */}
      <section className="px-6 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-transparent leading-none">THE<br />FUTURE</h2>
            </motion.div>
            <div>
              <h3 className="text-3xl font-bold mb-6">What's Next for SignTube?</h3>
              <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                We are just getting started. Our roadmap includes full sentence synthesis and support for multiple sign languages (ASL, BSL, ISL).
              </p>
              <ul className="space-y-4">
                {[
                  "Universal Browser Support (Chrome, Firefox, Edge)",
                  "Integration with Zoom & Microsoft Teams",
                  "Mobile App for real-world translation",
                  "Enterprise API for educational institutions"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-start" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass-panel p-12 md:p-20 rounded-[3rem] text-center relative overflow-hidden border border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-start to-transparent opacity-50" />

            <h2 className="text-4xl md:text-5xl font-bold mb-6">Join the Revolution</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Whether you are a developer, a signer, or an advocate, your contribution matters. Help us build the future of accessible media.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-10 py-4 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                Contribute Now
              </Link>
              <a
                href="https://github.com/ByteMystique/code-kalari"
                target="_blank"
                rel="noreferrer"
                className="px-10 py-4 rounded-xl border border-white/20 hover:bg-white/5 font-semibold text-lg transition-all"
              >
                Github Repo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
