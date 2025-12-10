import shopify from "../shopify.server";

export async function action({ request }) {
  const { discount, productId } = await request.json();

  const client = new shopify.api.clients.Rest({ session: await shopify.session.getCurrentSession() });

  // Save metafield
  await client.post({
    path: "metafields",
    data: {
      metafield: {
        namespace: "volume",
        key: "config",
        value: JSON.stringify({ discount: Number(discount), productId }),
        type: "json",
      },
    },
    type: "application/json",
  });

  return Response.json({ message: "Saved Successfully" });
}
