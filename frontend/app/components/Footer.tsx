import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Mail, Heart, Globe } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative z-10 border-t border-white/5 mt-20 bg-black/20 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-start to-brand-end flex items-center justify-center">
                                <Image src="/logo.png" width={20} height={20} alt="Logo" className="opacity-90" />
                            </div>
                            <span className="font-bold text-xl tracking-tight">SignTube</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Breaking language barriers with the power of community and code. Open source and free for everyone.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-start hover:text-white transition-all text-gray-400">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://github.com/ByteMystique/code-kalari" target="_blank" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-start hover:text-white transition-all text-gray-400">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-start hover:text-white transition-all text-gray-400">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-bold mb-6">Product</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/dashboard" className="hover:text-brand-start transition-colors">Contribution Dashboard</Link></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">Chrome Extension</a></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">Desktop App</a></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">Mobile App (Beta)</a></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-bold mb-6">Resources</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-brand-start transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">Community Guidelines</a></li>
                            <li><a href="#" className="hover:text-brand-start transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-bold mb-6">Stay Updated</h3>
                        <p className="text-sm text-gray-400 mb-4">Get the latest updates on our mission to make the web accessible.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-brand-start transition-colors"
                            />
                            <button className="bg-brand-start hover:bg-brand-end px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
