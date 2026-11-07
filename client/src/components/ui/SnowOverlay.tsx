import { motion } from 'framer-motion';

export function SnowOverlay() {
    return (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -50, x: Math.random() * window.innerWidth, opacity: 0 }}
                    animate={{
                        y: ["0vh", "100vh"],
                        x: [0, (i % 2 === 0 ? 50 : -50)],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 15,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "linear"
                    }}
                    className="absolute text-white/30 text-2xl"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: -50
                    }}
                >
                    ❅
                </motion.div>
            ))}
        </div>
    );
}
