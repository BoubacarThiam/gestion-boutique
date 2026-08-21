/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Couleur de marque TDMGBC — calée sur le brun/marron exact du logo
        // (#6b3226 = oklch(39.1% 0.084 33) = marque-700 ci-dessous). Chroma
        // modérée à dessein : au-delà de ~0.09 la rampe dérive vers un
        // rouge/corail qui lit comme un état d'erreur, pas comme un brun élégant.
        // Contraste vérifié : marque-600 sur blanc = 7.4:1, marque-700 = 9.9:1.
        marque: {
          50: 'oklch(97.5% 0.006 35)',
          100: 'oklch(94% 0.014 34)',
          200: 'oklch(87% 0.026 34)',
          300: 'oklch(78% 0.042 33)',
          400: 'oklch(66.5% 0.060 33)',
          500: 'oklch(54.5% 0.075 33)',
          600: 'oklch(46% 0.082 33)',
          700: 'oklch(39.1% 0.0844 33.2)',
          800: 'oklch(30% 0.070 32)',
          900: 'oklch(22% 0.055 31)',
          950: 'oklch(15% 0.040 30)',
        },
        // Or/ambre du logo — calé sur #c9973a = oklch(70.7% 0.123 79.6) = or-500.
        // Accent secondaire (prix, mise en valeur, survol). Usage : fonds
        // clairs avec texte sombre (400/500 = fond, 700/800 = texte), jamais
        // du texte blanc dessus (contraste insuffisant en dessous de 800).
        or: {
          50: 'oklch(98% 0.014 82)',
          100: 'oklch(95% 0.030 81)',
          200: 'oklch(90% 0.055 80.5)',
          300: 'oklch(84% 0.085 80)',
          400: 'oklch(77.5% 0.108 79.8)',
          500: 'oklch(70.7% 0.1231 79.6)',
          600: 'oklch(62% 0.115 74)',
          700: 'oklch(52% 0.100 70)',
          800: 'oklch(42% 0.082 68)',
          900: 'oklch(33% 0.065 66)',
        },
        // Neutres légèrement teintés vers la teinte de marque (au lieu du gris
        // froid par défaut) pour une identité cohérente sur tout le site.
        gray: {
          50: 'oklch(98.5% 0.004 34)',
          100: 'oklch(96% 0.006 34)',
          200: 'oklch(92% 0.008 34)',
          300: 'oklch(85% 0.010 34)',
          400: 'oklch(70% 0.012 34)',
          500: 'oklch(56% 0.014 34)',
          600: 'oklch(46% 0.014 34)',
          700: 'oklch(38% 0.014 34)',
          800: 'oklch(27% 0.012 34)',
          900: 'oklch(19% 0.010 34)',
        },
      },
      fontFamily: {
        // Police système uniquement : pas de requête réseau vers une police
        // externe, cohérent avec l'objectif "connexion parfois faible".
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Empattement système pour les titres : ajoute du raffinement sans
        // dépendance réseau (contraste serif/sans avec le corps de texte).
        display: ['ui-serif', 'Georgia', 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        // Ombres teintées brun très subtil (plutôt que noir neutre) pour
        // rester cohérent avec la palette chaude.
        soft: '0 1px 2px 0 rgb(48 15 10 / 0.06), 0 8px 24px -8px rgb(48 15 10 / 0.14)',
        elevee: '0 4px 12px -2px rgb(48 15 10 / 0.10), 0 16px 40px -12px rgb(48 15 10 / 0.22)',
      },
    },
  },
  plugins: [],
}
