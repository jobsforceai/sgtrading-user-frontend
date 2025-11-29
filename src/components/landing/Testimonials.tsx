
'use client';

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "This platform has revolutionized my trading strategy. The AI bots are incredibly powerful and easy to use.",
    name: "John Doe",
    role: "Full-time Trader",
  },
  {
    quote: "I've tried many trading platforms, but this one stands out. The multi-exchange support is a game-changer.",
    name: "Jane Smith",
    role: "Portfolio Manager",
  },
  {
    quote: "The portfolio tracking feature is amazing. I can see all my assets in one place, which makes managing my investments so much easier.",
    name: "Peter Jones",
    role: "Crypto Enthusiast",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative mx-auto w-full flex flex-col items-center justify-center max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          What Our Users Are Saying
        </h2>
        <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
          We are trusted by thousands of traders and investors. Here's what they have to say about our platform.
        </p>
      </div>
      <div className="relative z-10 mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            className="bg-gray-800 rounded-lg p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <p className="text-sm text-slate-300">"{testimonial.quote}"</p>
            <div className="mt-4">
              <p className="text-base font-semibold text-white">{testimonial.name}</p>
              <p className="text-xs text-slate-400">{testimonial.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
