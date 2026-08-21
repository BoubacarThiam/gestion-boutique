import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '../../utils/cn'

/**
 * Animation "chorégraphie de scroll" : 4 images se déplacent en diagonale
 * puis se regroupent au centre, avant que l'image "héro" (topRight) ne
 * s'étende en plein écran. Composant décoratif, section dédiée (300vh) —
 * à utiliser avec parcimonie (voir Catalogue.jsx, section Montres uniquement).
 *
 * Adapté depuis un composant shadcn/TSX externe : projet en JS (pas de
 * TypeScript ici), donc types retirés ; `cn` est une version locale
 * minimale (pas de clsx/tailwind-merge, non installés dans ce projet).
 */
export function ScrollChoreography({ className, images }) {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400, // Plus rigide pour un mouvement qui "claque" un peu plus vite
    damping: 50,    // Joue sur le rebond/à-coup du mouvement
    mass: 1.2,      // Ajoute un peu de poids au mouvement
    restDelta: 0.001,
  })

  // Positions par défaut relatives au centre
  const xLeft = '-20vw'
  const xRight = '20vw'
  const yTop = '-14vh'
  const yBottom = '14vh'

  // Phase 1 : 0 - 0.3 (déplacement en diagonale)
  // Phase 2 : 0.35 - 0.65 (regroupement au centre)
  // Phase 3 : 0.7 - 0.9 (Top Right s'étend en plein écran)

  // Top Left -> Bottom Left, puis Centre
  const tlX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, '0vw', '0vw'])
  const tlY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yBottom, yBottom, '0vh', '0vh'])

  // Bottom Right -> Top Right, puis Centre
  const brX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, '0vw', '0vw'])
  const brY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yTop, yTop, '0vh', '0vh'])

  // Bottom Left -> reste, puis Centre
  const blX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xLeft, xLeft, xLeft, '0vw', '0vw'])
  const blY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yBottom, yBottom, yBottom, '0vh', '0vh'])

  // Top Right -> reste, puis Centre, puis s'étend
  const trX = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [xRight, xRight, xRight, '0vw', '0vw'])
  const trY = useTransform(smoothProgress, [0, 0.3, 0.35, 0.65, 1], [yTop, yTop, yTop, '0vh', '0vh'])

  // Top Right (héro) : mise à l'échelle/expansion
  const heroWidth = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], ['36vw', '36vw', '100vw', '100vw'])
  const heroHeight = useTransform(smoothProgress, [0.65, 0.7, 0.9, 1], ['24vh', '24vh', '100vh', '100vh'])

  // Fondu des images en dessous du héro pendant son expansion
  const underImagesOpacity = useTransform(smoothProgress, [0.75, 0.85], [1, 0])

  const baseImageClasses =
    'absolute left-1/2 top-1/2 w-[36vw] h-[24vh] overflow-hidden -translate-x-1/2 -translate-y-1/2 bg-gray-100 shadow-2xl will-change-transform'

  return (
    <div ref={containerRef} className={cn('relative h-[300vh] w-full', className)}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">

          {/* Top Left */}
          <motion.div style={{ x: tlX, y: tlY, opacity: underImagesOpacity }} className={cn(baseImageClasses, 'z-10')}>
            <img src={images.topLeft} alt="" className="h-full w-full object-cover" />
          </motion.div>

          {/* Bottom Right */}
          <motion.div style={{ x: brX, y: brY, opacity: underImagesOpacity }} className={cn(baseImageClasses, 'z-20')}>
            <img src={images.bottomRight} alt="" className="h-full w-full object-cover" />
          </motion.div>

          {/* Bottom Left */}
          <motion.div style={{ x: blX, y: blY, opacity: underImagesOpacity }} className={cn(baseImageClasses, 'z-30')}>
            <img src={images.bottomLeft} alt="" className="h-full w-full object-cover" />
          </motion.div>

          {/* Top Right (héro - s'étend en plein écran à la fin) */}
          <motion.div
            style={{ x: trX, y: trY, width: heroWidth, height: heroHeight }}
            className={cn(baseImageClasses, 'z-40 origin-center bg-black/5')}
          >
            <img src={images.topRight} alt="" className="h-full w-full object-cover" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ScrollChoreography
