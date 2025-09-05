// backend/cron/priceUpdater.js
const axios = require("axios");
const db = require("../config/firebase");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
// ------------------ EMAIL SETUP ------------------
const transporter = nodemailer.createTransport({
  service: "gmail", // can be Outlook, Yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📧 Send styled email
async function sendEmail(to, product, livePrice) {
  try {
    await transporter.sendMail({
      from: `"Price Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔥 Price Drop Alert: ${product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #ff4d4f;">🔥 Price Drop Alert!</h2>
          <p>The price of <b>${product.name}</b> has dropped!</p>
          <p><b>Current Price:</b> $${livePrice}</p>
          <p><b>Your Target Price:</b> $${product.targetPrice}</p>
          <a href="${product.url}" target="_blank" 
            style="display: inline-block; margin-top: 15px; padding: 12px 20px; 
                   background-color: #007bff; color: #fff; text-decoration: none; 
                   border-radius: 6px; font-weight: bold;">
            👉 View Product
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">
            You’re receiving this because you added <b>${product.name}</b> 
            to your Price Tracker watchlist.
          </p>
        </div>
      `,
    });
    console.log(`📩 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

// ------------------ PRICE CHECKER ------------------
async function checkPrices() {
  console.log("🔄 Checking product prices...");

  try {
    const productsSnapshot = await db.collection("products").get();

    // Run all checks in parallel
    const tasks = productsSnapshot.docs.map(async (doc) => {
      const product = doc.data();
      const url = product.url;

      try {
        // Fetch product page
        const { data } = await axios.get(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const $ = cheerio.load(data);

        // Extract price (example selectors for Amazon)
        let priceText =
          $("#priceblock_ourprice").text().trim() ||
          $("#priceblock_dealprice").text().trim() ||
          $("span.a-price span.a-offscreen").first().text().trim();

        const livePrice = parseFloat(priceText.replace(/[^0-9.]/g, ""));

        if (!livePrice || isNaN(livePrice)) {
          console.log(`⚠️ Could not fetch price for ${product.name}`);
          return;
        }

        // Update Firestore
        await db.collection("products").doc(doc.id).update({
          price: livePrice,
          lastUpdated: new Date(),
        });

        console.log(`✅ Updated ${product.name}: $${livePrice}`);

        // Send email alert
        if (livePrice <= product.targetPrice && product.userEmail) {
          await sendEmail(product.userEmail, product, livePrice);
        }
      } catch (scrapeErr) {
        console.error(`❌ Scraping error for ${product.name}:`, scrapeErr.message);
      }
    });

    await Promise.allSettled(tasks);

    console.log("✅ Price check finished.");
  } catch (err) {
    console.error("❌ Error checking prices:", err.message);
  }
}

module.exports = { checkPrices };
