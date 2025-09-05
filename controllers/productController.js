// controllers/productController.js
const db = require("../config/firebase");
const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");

// ------------------ EMAIL SETUP ------------------
const transporter = nodemailer.createTransport({
  service: "gmail", // can change to Outlook, Yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: send email
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"Price Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`📩 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

// ------------------ AFFILIATE LINK HELPER ------------------
function makeAffiliateLink(url) {
  try {
    let affUrl = url;

    // Amazon
    if (url.includes("amazon.")) {
      const productId = url.match(/\/dp\/([A-Z0-9]+)/i)?.[1];
      if (productId) {
        affUrl = `https://www.amazon.in/dp/${productId}?tag=${process.env.AMAZON_AFFILIATE_ID}`;
      }
    }

    // Flipkart
    else if (url.includes("flipkart.")) {
      affUrl = url.replace(/([?&])affid=[^&]+/, ""); // remove old affiliate
      affUrl += (affUrl.includes("?") ? "&" : "?") + `affid=${process.env.FLIPKART_AFFILIATE_ID}`;
    }

    // Myntra
    else if (url.includes("myntra.")) {
      affUrl = url.replace(/([?&])utm_medium=[^&]+/, ""); // remove old utm
      affUrl += (affUrl.includes("?") ? "&" : "?") + `utm_source=affiliates&utm_medium=${process.env.MYNTRA_AFFILIATE_ID}`;
    }

    // Ajio
    else if (url.includes("ajio.")) {
      affUrl = url.replace(/([?&])aff_id=[^&]+/, ""); // remove old
      affUrl += (affUrl.includes("?") ? "&" : "?") + `aff_id=${process.env.AJIO_AFFILIATE_ID}`;
    }

    // Nykaa
    else if (url.includes("nykaa.")) {
      affUrl = url.replace(/([?&])utm_medium=[^&]+/, ""); // remove old utm
      affUrl += (affUrl.includes("?") ? "&" : "?") + `utm_source=affiliates&utm_medium=${process.env.NYKAA_AFFILIATE_ID}`;
    }

    // Add more sites if needed...

    return affUrl;
  } catch (err) {
    console.error("❌ Affiliate link error:", err.message);
    return url;
  }
}

// ------------------ SCRAPE FUNCTION ------------------
async function scrapePrice(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(data);

    let priceText =
      $("#priceblock_ourprice").text().trim() ||
      $("#priceblock_dealprice").text().trim() ||
      $("span.a-price-whole").first().text().trim() ||
      $("._30jeq3").first().text().trim(); // Flipkart style

    if (!priceText) return null;

    return parseFloat(priceText.replace(/[^0-9.]/g, ""));
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    return null;
  }
}

// ------------------ ADD PRODUCT ------------------
const addProduct = async (req, res) => {
  try {
    const { name, url, targetPrice } = req.body;

    if (!name || !url || !targetPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // user is set by Firebase Auth middleware
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const currentPrice = await scrapePrice(url);
    const affiliateUrl = makeAffiliateLink(url);

    const productRef = db.collection("products").doc();
    await productRef.set({
      id: productRef.id,
      name,
      url: affiliateUrl,
      targetPrice,
      userId: user.uid,
      userEmail: user.email || null,
      userPhone: user.phone_number || null,
      price: currentPrice || null,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });

    // Send email immediately if price meets target
    if (user.email && currentPrice && currentPrice <= targetPrice) {
      await sendEmail(
        user.email,
        `🔥 Price Drop Alert: ${name}`,
        `Good news! The price of "${name}" has dropped to ₹${currentPrice}, which is at or below your target of ₹${targetPrice}.\n\nBuy here (with affiliate): ${affiliateUrl}`
      );
    }

    res.json({
      message: "✅ Product added successfully",
      currentPrice: currentPrice || "Price not available",
      affiliateUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET PRODUCTS ------------------
const getProducts = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // fetch only current user's products
    const snapshot = await db
      .collection("products")
      .where("userId", "==", user.uid)
      .get();

    let products = [];

    for (let doc of snapshot.docs) {
      let product = doc.data();

      // scrape live price
      const livePrice = await scrapePrice(product.url);

      if (livePrice) {
        await db.collection("products").doc(doc.id).update({
          price: livePrice,
          lastUpdated: new Date(),
        });
        product.price = livePrice;
      }

      products.push(product);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addProduct, getProducts };
