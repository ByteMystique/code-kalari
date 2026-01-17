"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileUp, CheckCircle, AlertCircle, Clock } from "lucide-react";
import confetti from "canvas-confetti";

interface Contribution {
    word: string;
    user: string;
    timestamp: string;
}

export default function Dashboard() {
    const [word, setWord] = useState("");
    const [userName, setUserName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [contributions, setContributions] = useState<Contribution[]>([]);

    // Fetch contributions on mount
    const fetchContributions = async () => {
        try {
            const res = await fetch("/api/contributions");
            if (res.ok) {
                const data = await res.json();
                setContributions(data);
            }
        } catch (e) {
            console.error("Failed to fetch contributions", e);
        }
    };

    useEffect(() => {
        fetchContributions();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !word) {
            setMessage("Please select a file and enter a word.");
            setStatus("error");
            return;
        }

        setStatus("uploading");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("word", word.toLowerCase());
        formData.append("user", userName || "Contributor");

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            setStatus("success");
            setMessage(`Successfully uploaded sign for "${word}"`);

            // Trigger Confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#667eea', '#764ba2', '#ffffff']
            });

            setWord("");
            setUserName("");
            setFile(null);

            // Update the list immediately
            if (data.contribution) {
                setContributions(prev => [data.contribution, ...prev]);
            } else {
                fetchContributions();
            }

        } catch (err) {
            console.error(err);
            setStatus("error");
            setMessage("Failed to upload. Please try again.");
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen px-6 py-12 md:py-20 max-w-7xl mx-auto relative">
            {/* Background Glows */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-start/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-end/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="flex flex-col md:flex-row gap-12 relative z-10">
                {/* Left: Upload Form */}
                <div className="flex-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group"
                    >
                        {/* Hover Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-start to-brand-end opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                        <div className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-brand-start/20 text-brand-start shadow-inner shadow-brand-start/30">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Contribute a Sign</h1>
                                    <p className="text-gray-400 text-sm">Help us grow the dictionary for everyone.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Word / Phrase</label>
                                        <input
                                            type="text"
                                            value={word}
                                            onChange={(e) => setWord(e.target.value)}
                                            placeholder="e.g., hello"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-start/50 transition-all placeholder:text-gray-600 focus:bg-white/5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Anonymous"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-start/50 transition-all placeholder:text-gray-600 focus:bg-white/5"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 -mt-4">The word will be automatically converted to lowercase.</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">GIF File</label>
                                    <div className="relative group/file cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".gif"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-black/20 group-hover/file:bg-white/5 group-hover/file:border-brand-start/50 transition-all duration-300">
                                            {file ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle className="w-8 h-8 text-green-400 animate-bounce" />
                                                    <span className="font-medium text-green-400">{file.name}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-brand-start/10 flex items-center justify-center mb-3 group-hover/file:scale-110 transition-transform duration-300">
                                                        <FileUp className="w-6 h-6 text-brand-start" />
                                                    </div>
                                                    <span className="text-gray-400 font-medium">Click to upload GIF</span>
                                                    <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {status === "error" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            {message}
                                        </motion.div>
                                    )}

                                    {status === "success" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg text-sm border border-green-400/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {message}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    disabled={status === "uploading"}
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-start to-brand-end text-white font-bold hover:shadow-[0_0_20px_rgba(102,126,234,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
                                >
                                    {status === "uploading" ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading...
                                        </span>
                                    ) : "Submit Contribution"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>

                {/* Right: Real-time Contributions */}
                <div className="w-full md:w-1/3">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-1 rounded-3xl h-full flex flex-col"
                    >
                        <div className="p-7 pb-0">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-brand-start" />
                                Recent Activity
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto px-7 pb-7 custom-scrollbar max-h-[600px] space-y-3">
                            <AnimatePresence initial={false}>
                                {contributions.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-center text-gray-500 py-10"
                                    >
                                        No contributions yet. Be the first!
                                    </motion.div>
                                ) : (
                                    contributions.map((item, i) => (
                                        <motion.div
                                            key={item.timestamp + i} // Unique key
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-start to-brand-end flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-brand-start/20">
                                                    {item.word.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white capitalize">{item.word}</div>
                                                    <div className="text-xs text-gray-500">{item.user}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-brand-start font-medium bg-brand-start/10 px-2 py-1 rounded-full">{formatTime(item.timestamp)}</span>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="p-4 mx-4 mb-4 bg-gradient-to-r from-brand-start/10 to-brand-end/10 rounded-2xl border border-brand-start/20 backdrop-blur-md">
                            <h3 className="font-bold text-brand-start mb-1 text-sm">Did you know?</h3>
                            <p className="text-xs text-gray-400">
                                Every upload is instantly verified and added to our open-source dataset.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
