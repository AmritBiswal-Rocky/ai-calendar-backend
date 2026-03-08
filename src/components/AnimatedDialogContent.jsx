import { motion } from 'framer-motion';
import { DialogContent } from '@/components/ui/dialog';

export function AnimatedDialogContent({ children, ...props }) {
  return (
    <DialogContent asChild {...props}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        {children}
      </motion.div>
    </DialogContent>
  );
}
