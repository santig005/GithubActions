const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Aceptar cookies si aparece el banner
    const acceptBtn = page.locator('button:has-text("Aceptar"), button:has-text("Accept all"), button:has-text("Aceptar todo"), #L2AGLb');
    if (await acceptBtn.first().isVisible().catch(() => false)) {
      await acceptBtn.first().click();
      await page.waitForTimeout(1000);
    }

    // Buscar la caja de búsqueda y escribir "libro"
    const searchBox = page.locator('textarea[name="q"], input[name="q"]');
    await searchBox.first().fill('libro');
    await searchBox.first().press('Enter');

    // Esperar resultados
    await page.waitForSelector('div#search', { timeout: 10000 });

    // Obtener el primer resultado orgánico (evitar anuncios)
    const firstResult = page.locator('div#search div.g').first();
    await firstResult.waitFor({ state: 'visible', timeout: 5000 });

    const title = await firstResult.locator('h3').first().textContent().catch(() => 'N/A');
    const link = await firstResult.locator('a[href^="http"]').first().getAttribute('href').catch(() => 'N/A');
    const fullText = await firstResult.textContent().catch(() => '');
    const snippet = fullText.replace((title || ''), '').trim().substring(0, 200) || 'N/A';

    const result = {
      titulo: title?.trim() || 'No encontrado',
      url: link || 'No encontrado',
      descripcion: snippet?.trim().substring(0, 200) || ''
    };

    console.log('\n========== PRIMER RESULTADO DE BÚSQUEDA "libro" ==========');
    console.log('Título:', result.titulo);
    console.log('URL:', result.url);
    console.log('Descripción:', result.descripcion);
    console.log('================================================================\n');

    // Guardar para que el workflow pueda usarlo
    const fs = require('fs');
    fs.writeFileSync('search-result.txt', JSON.stringify(result));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
