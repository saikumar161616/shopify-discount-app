// import { useState, useEffect } from "react";
// import { useFetcher, useLoaderData } from "react-router"; // Updated import for React Router 7
// import {
//   Page,
//   Layout,
//   Card,
//   Button,
//   TextField,
//   BlockStack,
//   Text,
//   Banner,
// } from "@shopify/polaris";
// import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
// import { authenticate } from "../shopify.server";

// // 1. Loader: Read the current config from Shop Metafields
// export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);

//   const response = await admin.graphql(
//     `#graphql
//     query getSettings {
//       shop {
//         metafield(namespace: "volume_discount", key: "rules") {
//           value
//         }
//       }
//     }`
//   );

//   const data = await response.json();
//   const settings = data.data.shop.metafield?.value
//     ? JSON.parse(data.data.shop.metafield.value)
//     : {};

//   return settings;
// };

// // 2. Action: Save the config to Shop Metafields
// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   const formData = await request.formData();

//   const products = JSON.parse(formData.get("products"));
//   const percentOff = formData.get("percentOff");
//   const minQty = 2; // Fixed as per requirements

//   const value = JSON.stringify({ products, percentOff, minQty });

//   const response = await admin.graphql(
//     `#graphql
//     mutation CreateMetafieldDefinition($definition: MetafieldsSetInput!) {
//       metafieldsSet(metafields: [$definition]) {
//         metafields {
//           key
//           namespace
//           value
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }`,
//     {
//       variables: {
//         definition: {
//           namespace: "volume_discount",
//           key: "rules",
//           ownerId: (await admin.graphql(`{ shop { id } }`).then(r => r.json())).data.shop.id, // We need Shop ID
//           type: "json",
//           value,
//         },
//       },
//     }
//   );

//   return { status: "success" };
// };

// export default function Index() {
//   const loaderData = useLoaderData();
//   const fetcher = useFetcher();
//   const shopify = useAppBridge();

//   const [percent, setPercent] = useState(loaderData?.percentOff || "10");
//   const [selectedProducts, setSelectedProducts] = useState(loaderData?.products || []);

//   const selectProducts = async () => {
//     const selected = await shopify.resourcePicker({
//       type: "product",
//       action: "select", // Allow multiple selection
//       selectionIds: selectedProducts.map(id => ({ id })),
//     });

//     if (selected) {
//       setSelectedProducts(selected.map((p) => p.id));
//     }
//   };

//   const submit = () => {
//     fetcher.submit(
//       {
//         products: JSON.stringify(selectedProducts),
//         percentOff: percent,
//       },
//       { method: "POST" }
//     );
//   };

//   useEffect(() => {
//     if (fetcher.state === "idle" && fetcher.data?.status === "success") {
//       shopify.toast.show("Discount rules saved");
//     }
//   }, [fetcher.state, shopify]);

//   return (
//     <Page>
//       <TitleBar title="Volume Discount Config" />
//       <Layout>
//         <Layout.Section>
//           <Card>
//             <BlockStack gap="400">
//               <Text variant="headingMd" as="h2">
//                 Configure "Buy 2 Get X% Off"
//               </Text>

//               <BlockStack gap="200">
//                 <Text>Select Products</Text>
//                 <Button onClick={selectProducts}>
//                   {selectedProducts.length > 0
//                     ? `Selected ${selectedProducts.length} products`
//                     : "Choose Products"}
//                 </Button>
//               </BlockStack>

//               <TextField
//                 label="Discount Percentage"
//                 type="number"
//                 value={percent}
//                 onChange={setPercent}
//                 suffix="%"
//                 autoComplete="off"
//               />

//               <Button variant="primary" onClick={submit} loading={fetcher.state === "submitting"}>
//                 Save Configuration
//               </Button>
//             </BlockStack>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }


import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router"; 
import {
  Page,
  Layout,
  Card,
  Button,
  TextField,
  BlockStack,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// 1. Loader: Read the current config from Shop Metafields
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query getSettings {
      shop {
        metafield(namespace: "volume_discount", key: "rules") {
          value
        }
      }
    }`
  );

  const data = await response.json();
  const settings = data.data.shop.metafield?.value
    ? JSON.parse(data.data.shop.metafield.value)
    : {};

  return settings;
};

// 2. Action: Save the config to Shop Metafields
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const products = JSON.parse(formData.get("products"));
  const percentOff = formData.get("percentOff");
  
  // CHANGED: We now read quantity from the form instead of hardcoding '2'
  const quantity = formData.get("quantity"); 

  // CHANGED: Saved "quantity" into the JSON object
  const value = JSON.stringify({ products, percentOff, quantity });

  // Get Shop ID dynamically to ensure the ownerId is correct
  const shopResponse = await admin.graphql(`{ shop { id } }`);
  const shopId = (await shopResponse.json()).data.shop.id;

  const response = await admin.graphql(
    `#graphql
    mutation CreateMetafieldDefinition($definition: MetafieldsSetInput!) {
      metafieldsSet(metafields: [$definition]) {
        metafields {
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        definition: {
          namespace: "volume_discount",
          key: "rules",
          ownerId: shopId,
          type: "json",
          value,
        },
      },
    }
  );

  return { status: "success" };
};

export default function Index() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [percent, setPercent] = useState(loaderData?.percentOff || "10");
  // CHANGED: Added state for Quantity (defaults to 2 if not set)
  const [quantity, setQuantity] = useState(loaderData?.quantity || "2");
  const [selectedProducts, setSelectedProducts] = useState(loaderData?.products || []);

  const selectProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      action: "select", 
      selectionIds: selectedProducts.map(id => ({ id })),
    });

    if (selected) {
      setSelectedProducts(selected.map((p) => p.id));
    }
  };

  const submit = () => {
    fetcher.submit(
      {
        products: JSON.stringify(selectedProducts),
        percentOff: percent,
        quantity: quantity, // CHANGED: Sending quantity to backend
      },
      { method: "POST" }
    );
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.status === "success") {
      shopify.toast.show("Discount rules saved");
    }
  }, [fetcher.state, shopify]);

  return (
    <Page>
      <TitleBar title="Volume Discount Config" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Configure Volume Discount
              </Text>

              <BlockStack gap="200">
                <Text>Select Products</Text>
                <Button onClick={selectProducts}>
                  {selectedProducts.length > 0
                    ? `Selected ${selectedProducts.length} products`
                    : "Choose Products"}
                </Button>
              </BlockStack>

              {/* CHANGED: Added Quantity Input Field */}
              <TextField
                label="Buy Quantity (e.g. Buy 2, Buy 3)"
                type="number"
                value={quantity}
                onChange={setQuantity}
                autoComplete="off"
              />

              <TextField
                label="Discount Percentage"
                type="number"
                value={percent}
                onChange={setPercent}
                suffix="%"
                autoComplete="off"
              />

              <Button variant="primary" onClick={submit} loading={fetcher.state === "submitting"}>
                Save Configuration
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}