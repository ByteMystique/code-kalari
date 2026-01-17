"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, Loader2 } from "lucide-react";
import Link from "next/link";

interface GifItem {
    filename: string;
    word: string;
    url: string;
}

export default function ExplorePage() {
    const [gifs, setGifs] = useState<GifItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGifs = async () => {
            try {
                // Ensure we always get fresh data
                const res = await fetch("/api/gifs", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setGifs(data);
                }
            } catch (e) {
                console.error("Failed to fetch GIFs", e);
            } finally {
                setLoading(false);
            }
        };

        fetchGifs();
    }, []);

    const filteredGifs = gifs.filter(gif =>
        gif.word.toLowerCase().includes(search.toLowerCase())
    );

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen px-6 py-12 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-start/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-end/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit backdrop-blur-md mx-auto">
                        <Grid3X3 className="w-4 h-4 text-brand-start" />
                        <span className="text-gray-300 text-sm font-medium tracking-wide">THE DICTIONARY</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Explore the <span className="text-gradient">Unknown.</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Browse our constantly expanding library of sign language animations. Powered by the community, for the community.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-md mx-auto mt-8 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-start to-brand-end opacity-20 group-hover:opacity-40 blur-lg transition cursor-pointer" />
                        <div className="relative flex items-center bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="pl-6 text-gray-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search for a word..."
                                className="w-full bg-transparent border-none px-4 py-4 text-white focus:outline-none placeholder:text-gray-600 font-medium"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="pr-6 text-gray-500 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Grid Section */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-brand-start animate-spin" />
                        <p className="text-gray-500 animate-pulse">Loading library...</p>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"
                    >
                        {filteredGifs.length > 0 ? (
                            filteredGifs.map((gif) => (
                                <motion.div
                                    key={gif.filename}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/5 hover:border-brand-start/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(102,126,234,0.15)] aspect-square flex flex-col"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 duration-300" />

                                    <div className="flex-1 relative p-4 flex items-center justify-center bg-[#0f0f0f]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={gif.url}
                                            alt={gif.word}
                                            className="max-w-full max-h-full object-contain mix-blend-screen opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-110 duration-500"
                                        />
                                    </div>

                                    <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-20">
                                        <h3 className="text-xl font-bold text-white capitalize mb-1">{gif.word}</h3>
                                        <p className="text-xs text-brand-start font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                            Available
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="col-span-full text-center py-20 text-gray-500"
                            >
                                No signs found for "{search}". <Link href="/dashboard" className="text-brand-start underline underline-offset-4 hover:text-white transition-colors">Submit one?</Link>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
