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
  InlineError,
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


export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const products = JSON.parse(formData.get("products"));
  const percentOff = formData.get("percentOff");
  const quantity = formData.get("quantity");
  const value = JSON.stringify({ products, percentOff, quantity });

  // 1. SAVE METAFIELDS (Existing Logic)
  const shopResponse = await admin.graphql(`{ shop { id } }`);
  const shopId = (await shopResponse.json()).data.shop.id;

  const metafieldResponse = await admin.graphql(
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

  const metafieldJson = await metafieldResponse.json();
  if (metafieldJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield errors:", metafieldJson.data.metafieldsSet.userErrors);
    return { status: "error", errors: metafieldJson.data.metafieldsSet.userErrors };
  }
  
  const functionId = process.env.SHOPIFY_VOLUME_DISCOUNT_FN_ID; 

  // Query existing discounts
  const existingDiscountsResponse = await admin.graphql(
    `#graphql
    query GetDiscountNodes {
      discountNodes(first: 50, reverse: true) {
        nodes {
          id
          discount {
            ... on DiscountAutomaticApp {
              title
              appDiscountType {
                functionId
              }
            }
          }
        }
      }
    }`
  );

  const existingDiscountsData = await existingDiscountsResponse.json();
  const nodes = existingDiscountsData.data.discountNodes.nodes;

  const existingDiscount = nodes.find(node => 
    node.discount?.appDiscountType?.functionId === functionId
  );

  if (!existingDiscount) {
    console.log("Discount doesn't exist. Creating new one...");
    
    const createResponse = await admin.graphql(
      `#graphql
      mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $discount) {
          # FIXED FIELD NAME BELOW:
          automaticAppDiscount {
            discountId
            title
            status
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          discount: {
            title: "Volume Discount", 
            functionId: functionId, 
            startsAt: new Date().toISOString(),
          },
        },
      }
    );

    const createData = await createResponse.json();
    const userErrors = createData.data?.discountAutomaticAppCreate?.userErrors;
    
    if (userErrors?.length > 0) {
      console.error("Discount creation failed:", userErrors);
      return { status: "error", errors: userErrors };
    }
    console.log("Discount created successfully");
  } else {
    console.log("Discount already exists, skipping creation.");
  }

  return { status: "success" };
};

export default function Index() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [percent, setPercent] = useState(loaderData?.percentOff || "10");
  const [quantity, setQuantity] = useState(loaderData?.quantity || "2");
  const [selectedProducts, setSelectedProducts] = useState(loaderData?.products || []);

  // Validation Error States
  const [errors, setErrors] = useState({});

  // VALIDATION LOGIC: Limit Percent to 1 - 80
  const handlePercentChange = (newValue) => {
    if (newValue === "") {
      setPercent("");
      return;
    }
    const val = parseInt(newValue, 10);
    if (!isNaN(val) && val >= 1 && val <= 80) {
      setPercent(newValue);
      // Clear error if valid
      if (errors.percent) setErrors({ ...errors, percent: null });
    }
  };

  const handleQuantityChange = (newValue) => {
    setQuantity(newValue);
    if (newValue && parseInt(newValue) > 0) {
      if (errors.quantity) setErrors({ ...errors, quantity: null });
    }
  }

  const selectProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
      selectionIds: selectedProducts.map(id => ({ id })),
    });

    if (selected) {
      setSelectedProducts(selected.map((p) => p.id));
      // Clear product error if products are selected
      if (selected.length > 0) setErrors({ ...errors, products: null });
    }
  };

  const submit = () => {
    const newErrors = {};
    let isValid = true;

    // 1. Validate Products
    if (selectedProducts.length === 0) {
      newErrors.products = "Please select at least one product.";
      isValid = false;
    }

    // 2. Validate Quantity
    if (!quantity || parseInt(quantity) < 1) {
      newErrors.quantity = "Quantity is required and must be at least 1.";
      isValid = false;
    }

    // 3. Validate Percentage
    if (!percent) {
      newErrors.percent = "Discount percentage is required.";
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      shopify.toast.show("Please fix the errors before saving.");
      return;
    }

    // If valid, clear errors and submit
    setErrors({});
    fetcher.submit(
      {
        products: JSON.stringify(selectedProducts),
        percentOff: percent,
        quantity: quantity,
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

              {/* Product Selection Section */}
              <BlockStack gap="200">
                <Text>Select Products</Text>
                <Button onClick={selectProducts} tone={errors.products ? "critical" : undefined}>
                  {selectedProducts.length > 0
                    ? `Selected ${selectedProducts.length} products`
                    : "Choose Products"}
                </Button>
                {errors.products && (
                  <InlineError message={errors.products} fieldID="product-picker" />
                )}
              </BlockStack>

              {/* Quantity Field */}
              <TextField
                label="Buy Quantity (e.g. Buy 2, Buy 3)"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                autoComplete="off"
                error={errors.quantity} // Shows red error text if invalid
                min={1}
              />

              {/* Percentage Field */}
              <TextField
                label="Discount Percentage (1-80%)"
                type="number"
                value={percent}
                onChange={handlePercentChange}
                suffix="%"
                autoComplete="off"
                min={1}
                max={80}
                helpText="Enter a value between 1 and 80"
                error={errors.percent} // Shows red error text if invalid
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