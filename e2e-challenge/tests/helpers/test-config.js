/**
 * @fileoverview Configuración común para tests E2E
 */

require('dotenv').config();

const TEST_CONFIG = {
  url: process.env.TEST_URL || 'https://login.hyphalab.dev/',
  user: {
    email: process.env.TEST_EMAIL || 'hyphatest',
    password: process.env.TEST_PASSWORD || 'Hypha2025.'
  },
  timeouts: {
    navigation: 45000,      // Aumentado para mejor estabilidad
    element: 20000,         // Aumentado para elementos lentos
    mobileSafari: 90000,    
    mobileSafariNavigation: 120000
  }
};

module.exports = { TEST_CONFIG };
