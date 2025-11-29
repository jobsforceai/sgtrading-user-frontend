
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function ContactSection() {
  return (
    <section className="relative mx-auto w-full flex flex-col items-center justify-center max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Contact Us
        </h2>
        <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
          Have a question or want to learn more? Get in touch with us.
        </p>
      </div>
      <motion.div
        className="relative z-10 mt-12 w-full max-w-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="sr-only">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Your Email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="message" className="sr-only">Message</label>
            <textarea
              name="message"
              id="message"
              rows={4}
              placeholder="Your Message"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-7 py-3 text-xs font-semibold text-slate-950 shadow-btn-glow transition hover:bg-emerald-400"
            >
              Send Message
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
