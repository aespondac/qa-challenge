/**
 * @fileoverview Funciones helper para autenticación y navegación
 */

/**
 * Función helper para realizar login
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {Object} config - Configuración de test
 */
const performLogin = async (page, config) => {
  // Buscar campos de email y password de manera más flexible
  const emailSelectors = [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[placeholder*="email" i]',
    'input[name*="usuario" i]',
    'input[name*="user" i]',
    'input[placeholder*="usuario" i]',
    'input[placeholder*="correo" i]',
    'input[name="username"]',
    'input[id="username"]'
  ];

  const passwordSelectors = [
    'input[type="password"]',
    'input[name*="password" i]',
    'input[id*="password" i]',
    'input[placeholder*="password" i]',
    'input[name*="contraseña" i]',
    'input[placeholder*="contraseña" i]'
  ];

  let emailField = null;
  let passwordField = null;

  // Buscar campo de email con mayor detalle
  for (const selector of emailSelectors) {
    try {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        if (await element.isVisible({ timeout: 2000 })) {
          emailField = element;
          console.log(`Email field found with selector: ${selector}`);
          break;
        }
      }
      if (emailField) break;
    } catch (error) {
      continue;
    }
  }

  // Buscar campo de password
  for (const selector of passwordSelectors) {
    try {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        if (await element.isVisible({ timeout: 2000 })) {
          passwordField = element;
          console.log(`Password field found with selector: ${selector}`);
          break;
        }
      }
      if (passwordField) break;
    } catch (error) {
      continue;
    }
  }

  // Si encontramos los campos, intentar login
  if (emailField && passwordField) {
    try {
      await emailField.clear();
      await emailField.fill(config.user.email);
      await passwordField.clear();
      await passwordField.fill(config.user.password);

      // Esperar que los campos se llenen
      await page.waitForTimeout(1000);

      // Buscar y hacer clic en el botón de submit
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Ingresar")',
        'button:has-text("Entrar")',
        'button:has-text("Sign in")',
        'button:has-text("Iniciar")',
        '.btn:has-text("Login")',
        '.btn:has-text("Ingresar")',
        '.btn',
        'button'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            if (await element.isVisible({ timeout: 2000 })) {
              submitButton = element;
              console.log(`Submit button found with selector: ${selector}`);
              break;
            }
          }
          if (submitButton) break;
        } catch (error) {
          continue;
        }
      }

      if (submitButton) {
        await Promise.all([
          page.waitForLoadState('networkidle', { timeout: 30000 }),
          submitButton.click()
        ]);
        
        // Esperar a que la página post-login se estabilice con timeouts reducidos
        await waitForPageStable(page, {
          timeout: 8000,
          networkIdleTimeout: 1500,
          minLoadTime: 1000
        });
      } else {
        // Intentar con Enter si no hay botón
        console.log('No submit button found, trying Enter key');
        await emailField.press('Enter');
        
        // Esperar a que la página post-login se estabilice con timeouts reducidos
        await waitForPageStable(page, {
          timeout: 8000,
          networkIdleTimeout: 1500,
          minLoadTime: 1000
        });
      }
    } catch (error) {
      console.log(`Login helper error: ${error.message}`);
    }
  } else {
    console.log(`Login fields not found - email: ${!!emailField}, password: ${!!passwordField}`);
  }
};

/**
 * Función helper para configurar el navegador y página
 * @param {import('@playwright/test').Browser} browser - Navegador de Playwright
 * @param {string} browserName - Nombre del navegador
 * @param {Object} config - Configuración de test
 * @returns {Promise<import('@playwright/test').Page>} Página configurada
 */
const setupBrowser = async (browser, browserName, config) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const navigationTimeout = browserName === 'webkit' ? config.timeouts.mobileSafariNavigation : config.timeouts.navigation;
  
  if (browserName === 'webkit') {
    page.setDefaultTimeout(config.timeouts.mobileSafari);
    page.setDefaultNavigationTimeout(config.timeouts.mobileSafariNavigation);
  }
  
  await page.goto(config.url, { 
    waitUntil: 'networkidle',
    timeout: navigationTimeout 
  });
  
  const waitTime = browserName === 'webkit' ? 8000 : 3000;
  await page.waitForTimeout(waitTime);
  
  return page;
};

/**
 * Función helper para esperar a que la página esté completamente estable
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {Object} options - Opciones de espera
 */
const waitForPageStable = async (page, options = {}) => {
  const {
    timeout = 5000,
    networkIdleTimeout = 1000,
    minLoadTime = 500
  } = options;

  const startTime = Date.now();
  
  try {
    // Verificar que la página no esté cerrada
    if (page.isClosed()) {
      console.log('Page is closed, skipping stability wait');
      return;
    }

    // Esperar a que no haya requests activos con timeout reducido
    await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 3000) });
    
    // Esperar un tiempo mínimo para que los elementos se rendericen
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minLoadTime) {
      const remainingTime = Math.min(minLoadTime - elapsedTime, 1000);
      await page.waitForTimeout(remainingTime);
    }
    
    // Esperar adicional reducido para elementos dinámicos
    await page.waitForTimeout(Math.min(networkIdleTimeout, 1000));
    
  } catch (error) {
    console.log(`Page stability wait timeout: ${error.message}`);
    // Continuar con un tiempo mínimo de espera más corto
    if (!page.isClosed()) {
      try {
        await page.waitForTimeout(500);
      } catch (finalError) {
        console.log(`Final timeout also failed: ${finalError.message}`);
      }
    }
  }
};

/**
 * Función helper para tomar screenshot con timestamp y estabilización
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {string} browserName - Nombre del navegador
 * @param {string} testName - Nombre del test
 * @param {string} step - Paso del test
 * @param {Object} options - Opciones adicionales
 */
const takeScreenshot = async (page, browserName, testName, step, options = {}) => {
  try {
    // Verificar que la página no esté cerrada
    if (page.isClosed()) {
      console.log('Page is closed, skipping screenshot');
      return;
    }

    // Esperar a que la página esté estable antes de tomar screenshot con timeouts reducidos
    await waitForPageStable(page, {
      timeout: options.stabilityTimeout || 3000,
      networkIdleTimeout: options.networkIdleTimeout || 800,
      minLoadTime: options.minLoadTime || 500
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `screenshots/${testName}-${step}-${browserName}-${timestamp}.png`;
    
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled', // Deshabilitar animaciones para screenshots más estables
      timeout: 5000 // Timeout específico para screenshot
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.log(`Screenshot failed: ${error.message}`);
    // Intentar tomar screenshot básico como fallback
    if (!page.isClosed()) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `screenshots/${testName}-${step}-${browserName}-${timestamp}-fallback.png`;
        await page.screenshot({ path: screenshotPath, timeout: 3000 });
        console.log(`Fallback screenshot saved: ${screenshotPath}`);
      } catch (fallbackError) {
        console.log(`Fallback screenshot also failed: ${fallbackError.message}`);
      }
    }
  }
};

/**
 * Función helper para navegar de manera robusta
 * @param {import('@playwright/test').Page} page - Página de Playwright
 * @param {string} url - URL a navegar
 * @param {Object} options - Opciones de navegación
 */
const navigateRobust = async (page, url, options = {}) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 45000,
        ...options
      });
      return;
    } catch (error) {
      attempt++;
      console.log(`Navigation attempt ${attempt} failed: ${error.message}`);
      if (attempt >= maxRetries) {
        throw error;
      }
      await page.waitForTimeout(2000);
    }
  }
};

module.exports = {
  performLogin,
  setupBrowser,
  takeScreenshot,
  waitForPageStable,
  navigateRobust
};
