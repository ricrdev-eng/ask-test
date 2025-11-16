import puppeteer from "puppeteer";

export async function getRooms(checkin, checkout) {
  const url = `https://reservations.fasthotel.me/188/214?entrada=${checkin}&saida=${checkout}&adultos=1#acomodacoes`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  // page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto(url, { waitUntil: "networkidle2" });

  try {
    const acomodacoes = await page.waitForSelector('[data-name="acomodacoes"]', { timeout: 5000 }).catch(() => null);
    if (!acomodacoes) return []
    const tarifas = await page.waitForSelector('[data-campo="tarifas"] .row.tarifa', { timeout: 5000 }).catch(() => null);
    if (!tarifas) return []

    const rooms = await page.evaluate(() => {
      const section = document.querySelector('[data-name="acomodacoes"]');
      const roomElements = section.querySelectorAll(".borda-cor");

      const data = [];

      roomElements.forEach(room => {
        const name = room.querySelector('[data-campo="titulo"]')?.innerText.trim() || "";
        const description = room.querySelector(".descricao")?.innerText.trim() || "";
        const prices = room.querySelectorAll('[data-campo="tarifas"] .row.tarifa');
        const pricesList = []
        prices.forEach(price => {
          const title = price.querySelector('[data-campo="nome"]')?.innerText.trim() || "";
          const description = price.querySelector('[data-campo="descricao"]')?.innerText.trim() || "";
          const value = price.querySelector('[data-campo="valor"]')?.innerText.trim() || "";

          if (title || description || value) {
            pricesList.push({ title, description, value });
          }
        });
        const image = room.querySelector("img")?.src || "";

        if (name) {
          data.push({ name, description, prices: pricesList, image });
        }
      });

      return data;
    });

    await browser.close();
    return rooms;
  } catch (error) {
    console.error("Erro no crawler:", err);
    return null;
  } finally {
  await browser.close();
}
}