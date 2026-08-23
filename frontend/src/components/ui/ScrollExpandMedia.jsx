import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Hero plein écran : une image "capture" le scroll de la souris/du doigt et
 * grossit progressivement jusqu'à occuper tout l'écran, puis révèle le
 * contenu passé en `children`. Adapté d'un composant communautaire pensé
 * pour Next.js + TypeScript (next/image, 'use client') vers ce projet
 * Vite + React + JS : <img> à la place de next/image, pas de typage.
 *
 * Respecte prefers-reduced-motion : saute directement à l'état "déplié"
 * sans capturer le scroll (l'effet, purement décoratif, ne doit jamais
 * bloquer la navigation pour qui a demandé moins d'animations).
 *
 * `passerOutre` (bool) : le hero capture tout le scroll de la page tant
 * qu'il n'est pas entièrement déplié — si un parent a besoin d'amener
 * l'utilisateur plus bas sur la page AVANT ça (ex: sélection d'une
 * catégorie qui déclenche un scroll automatique vers une section plus
 * bas), passer `true` déplie le hero instantanément pour libérer le
 * scroll normal de la page.
 */
export default function ScrollExpandMedia({
  mediaSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend = false,
  passerOutre = false,
  children,
}) {
  const motionReduit = useReducedMotion()
  const [scrollProgress, setScrollProgress] = useState(motionReduit ? 1 : 0)
  const [showContent, setShowContent] = useState(motionReduit)
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(motionReduit)
  const [touchStartY, setTouchStartY] = useState(0)
  const [isMobileState, setIsMobileState] = useState(false)

  useEffect(() => {
    if (passerOutre && !mediaFullyExpanded) {
      setScrollProgress(1)
      setShowContent(true)
      setMediaFullyExpanded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passerOutre])

  const sectionRef = useRef(null)

  useEffect(() => {
    if (motionReduit) return // rien à capturer : déjà à l'état final

    const handleWheel = (e) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false)
        e.preventDefault()
      } else if (!mediaFullyExpanded) {
        e.preventDefault()
        const scrollDelta = e.deltaY * 0.0009
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1)
        setScrollProgress(newProgress)

        if (newProgress >= 1) {
          setMediaFullyExpanded(true)
          setShowContent(true)
        } else if (newProgress < 0.75) {
          setShowContent(false)
        }
      }
    }

    const handleTouchStart = (e) => {
      setTouchStartY(e.touches[0].clientY)
    }

    const handleTouchMove = (e) => {
      if (!touchStartY) return

      const touchY = e.touches[0].clientY
      const deltaY = touchStartY - touchY

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false)
        e.preventDefault()
      } else if (!mediaFullyExpanded) {
        e.preventDefault()
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005
        const scrollDelta = deltaY * scrollFactor
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1)
        setScrollProgress(newProgress)

        if (newProgress >= 1) {
          setMediaFullyExpanded(true)
          setShowContent(true)
        } else if (newProgress < 0.75) {
          setShowContent(false)
        }

        setTouchStartY(touchY)
      }
    }

    const handleTouchEnd = () => setTouchStartY(0)

    const handleScroll = () => {
      if (!mediaFullyExpanded) window.scrollTo(0, 0)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [scrollProgress, mediaFullyExpanded, touchStartY, motionReduit])

  useEffect(() => {
    const checkIfMobile = () => setIsMobileState(window.innerWidth < 768)
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250)
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400)
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150)

  const firstWord = title ? title.split(' ')[0] : ''
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : ''

  // Ombre portée marquée : garantit la lisibilité du texte quel que soit
  // le fond (photo claire ou sombre) sous le titre, sans dépendre d'un
  // mode de fusion (mix-blend) au rendu imprévisible selon l'image.
  const ombreTexte = '0 2px 16px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.9)'

  return (
    <div ref={sectionRef} className="transition-colors duration-700 ease-in-out overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          <motion.div
            className="absolute inset-0 z-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt=""
              aria-hidden="true"
              className="w-screen h-screen object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl overflow-hidden"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="relative w-full h-full">
                  <img src={mediaSrc} alt={title || 'Produit en vedette'} className="w-full h-full object-cover" />
                  <motion.div
                    className="absolute inset-0 bg-black/50"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                  {date && (
                    <p
                      className="text-2xl text-or-100"
                      style={{ transform: `translateX(-${textTranslateX}vw)`, textShadow: ombreTexte }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="text-or-100 font-medium text-center"
                      style={{ transform: `translateX(${textTranslateX}vw)`, textShadow: ombreTexte }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <motion.h2
                  className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white transition-none"
                  style={{ transform: `translateX(-${textTranslateX}vw)`, textShadow: ombreTexte }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white transition-none"
                  style={{ transform: `translateX(${textTranslateX}vw)`, textShadow: ombreTexte }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            {children && (
              <motion.section
                className="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              >
                {children}
              </motion.section>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
