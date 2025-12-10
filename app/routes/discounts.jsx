import { useState, useEffect } from "react";

export default function Discounts() {
  const [discount, setDiscount] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");

  async function saveConfig() {
    const res = await fetch("/api/discount/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discount, productId }),
    });

    const data = await res.json();
    setStatus(data.message);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Volume Discount Settings</h2>

      <label>Discount Percentage (%)</label>
      <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />

      <br /><br />

      <label>Product ID</label>
      <input type="text" value={productId} onChange={(e) => setProductId(e.target.value)} />

      <br /><br />

      <button onClick={saveConfig}>Save</button>

      <p>{status}</p>
    </div>
  );
}
