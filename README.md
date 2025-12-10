Here is the complete content for your **`README.md`** file. You can copy and paste this entire block directly into your project.

````markdown
# 🏷️ Shopify Volume Discount App

A Shopify App that enables "Buy X, Get Y% Off" promotions. It uses **Shopify Functions** for backend logic and **Metafields** for configuration storage, ensuring high performance and zero database latency during checkout.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
````

### 2\. Start Local Development

```bash
npm run dev
```

  * Press `P` to open the developer console.
  * Click the **Preview URL** to install the app on your development store.
  * *Note: No manual `.env` file is required; the Shopify CLI handles environment variables automatically.*

### 3\. Deploy to Shopify

```bash
npm run deploy
```

-----


## 🛍️ Live Demo & Credentials

You can test the live functionality of the app using the credentials below:

* **Store URL:** [https://proveway-dev-store-2.myshopify.com/](https://proveway-dev-store-2.myshopify.com/)
* **Store Password:** `proveway`

### **Test Scenario**
The following products are configured with a **"Buy 5, Get 50% Off"** rule:
1.  **The Collection Snowboard: Hydrogen**
2.  **The Collection Snowboard: Oxygen**

**How to Test:**
1.  Navigate to one of the products above.
2.  Add **4 units** to the cart → *No discount applied.*
3.  Increase quantity to **5 units** → *50% discount automatically applies.*

---

## Architecture & Configuration

### **Data Storage (Metafields)**

The app persists settings to the Shop's Metafields to share data between the Admin, Theme, and Function.

  * **Namespace:** `volume_discount`
  * **Key:** `rules`
  * **Format:** JSON
    ```json
    {
      "products": ["gid://shopify/Product/12345"],
      "quantity": "2",
      "percentOff": "10"
    }
    ```

### **Core Components**

1.  **Admin UI (`/app`)**: Built with React & Polaris. Allows merchants to select products and define discount thresholds.
2.  **Checkout Function (`/extensions/volume-discount-fn`)**: A Rust/JS-based Shopify Function that reads the Metafield and applies discounts to eligible cart lines.
3.  **Theme Block (`/extensions/volume-discount-theme`)**: A Liquid block that displays the active offer on the Product Page.

-----

## Theme Setup (Storefront)

To display the discount message on your store:

1.  Go to **Online Store \> Themes \> Customize**.
2.  Navigate to a **Product Page**.
3.  On the left sidebar, click **Add Block**.
4.  Select **"Volume Discount Msg"** (under Apps).
5.  Drag the block to your desired position (e.g., below the Price).
6.  Click **Save**.

-----

## Limitations & Next Steps

Single Rule Support (Tiers): Currently, the app applies one fixed rule (e.g., "Buy 2") to the selected products.
Next Step: Support multiple tiered thresholds within a single rule (e.g., Buy 2 get 10%, Buy 3 get 20%).

Multiple Discount Groups: The app currently supports only one global configuration. You cannot set different rules for different products simultaneously (e.g., 10% off for Socks vs. 20% off for Shirts).
Next Step: Implement a "Rule Builder" UI to allow saving multiple distinct discount configurations.

Styling: The widget uses inline styles.
Next Step: Add design controls (colors, padding) to the Theme Block settings schema.

```
```