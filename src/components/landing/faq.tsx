
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What is this platform?",
    answer: "This platform is an all-in-one crypto trading platform with a range of pro trading tools designed for traders of every skill level.",
  },
  {
    question: "How do I get started?",
    answer: "You can get started by signing up for a free account. Once you've signed up, you can explore the platform and start trading.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, we offer a free trial for all new users. You can try out the platform and all its features for a limited time.",
  },
  {
    question: "What exchanges are supported?",
    answer: "We support a wide range of top-tier exchanges. You can trade on all your favorite exchanges from one interface.",
  },
];

export function FaqSection() {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section id="faq" className="relative mx-auto w-full flex flex-col items-center justify-center max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
      <div className="relative z-10 flex flex-col items-center text-center">
        <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="max-w-2xl text-xs text-slate-400 sm:text-sm">
          Here are some of the most common questions we get from our users.
        </p>
      </div>
      <div className="relative z-10 mt-12 w-full max-w-2xl">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-700">
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="w-full flex justify-between items-center py-4 text-left text-lg font-medium text-white"
            >
              <span>{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${open === index ? 'rotate-180' : ''}`}
              />
            </button>
            <motion.div
              initial={false}
              animate={{ height: open === index ? 'auto' : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pb-4 text-sm text-slate-400">{faq.answer}</div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
