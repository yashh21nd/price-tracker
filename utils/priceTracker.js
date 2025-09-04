const axios = require("axios");
const cheerio = require("cheerio");

const fetchPrice = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Example: Amazon product page selector (update based on site)
    let price = $("#priceblock_ourprice").text() || $("#priceblock_dealprice").text();

    if (!price) {
      price = $(".a-price .a-offscreen").first().text(); // fallback
    }

    if (!price) {
      throw new Error("Price not found");
    }

    // Clean up price string → number
    return parseFloat(price.replace(/[^0-9.]/g, ""));
  } catch (error) {
    console.error("❌ Price fetch error:", error.message);
    return null;
  }
};

module.exports = fetchPrice;
