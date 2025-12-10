// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

export function run(input) {
  // 1. Read the Settings
  const metaValue = input.shop.metafield?.value;
  
  // LOGIC CHECK: If no settings, we can't apply a discount
  if (!metaValue) {
    console.error("No Metafield found!"); 
    return {
      discounts: [],
      discountApplicationStrategy: DiscountApplicationStrategy.First,
    };
  }

  const config = JSON.parse(metaValue);
  const targetProductIds = config.products || [];
  const requiredQty = parseInt(config.quantity || "2");
  const percentOff = parseFloat(config.percentOff || "10");

  // 2. Find eligible items
  const targets = input.cart.lines
    .filter((line) => {
      // Must be a product variant
      if (line.merchandise.__typename !== "ProductVariant") return false;
      
      const productGid = line.merchandise.product.id;
      
      // Does this line match the selected product?
      const isTarget = targetProductIds.includes(productGid);
      
      // Is the quantity high enough?
      const isQtyMet = line.quantity >= requiredQty;

      return isTarget && isQtyMet;
    })
    .map((line) => ({
      cartLine: { id: line.id }
    }));

  // 3. If no items qualify, return empty
  if (!targets.length) {
    return {
      discounts: [],
      discountApplicationStrategy: DiscountApplicationStrategy.First,
    };
  }

  // 4. Apply the Discount!
  return {
    discounts: [
      {
        targets: targets,
        value: {
          percentage: {
            value: percentOff.toString(),
          },
        },
        message: `Volume Deal (${percentOff}% Off)`,
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}




