// src/components/HoverWrapper.jsx
import React from 'react';
import { motion } from 'framer-motion';

const palette = {
  blue: 'from-indigo-100 via-blue-100 to-cyan-100',
  purple: 'from-fuchsia-100 via-purple-100 to-indigo-100',
  green: 'from-emerald-100 via-teal-100 to-cyan-100',
  orange: 'from-amber-100 via-orange-100 to-rose-100',
};

const HoverWrapper = ({ children, className = '', variant = 'blue' }) => {
  const gradient = palette[variant] || palette.blue;
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        boxShadow: '0px 0px 25px rgba(0,0,0,0.25)',
        filter: 'brightness(1.05)',
        backgroundPosition: '200% 0%',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={`rounded-2xl bg-gradient-to-r ${gradient} bg-[length:200%_200%] transition-all duration-500 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default HoverWrapper;
