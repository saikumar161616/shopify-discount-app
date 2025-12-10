export * from './run';

// const CONFIG = {
//     products: [
//       "gid://shopify/Product/8300896616548" // replace with your real product GID
//     ],
//     minQty: 2,
//     percentOff: 10
//   };
  
//   export function run(input) {
//     const result = {
//       discountApplicationStrategy: "FIRST",
//       operations: []
//     };
  
//     if (!input.cart || !input.cart.lines) return result;
  
//     for (const line of input.cart.lines) {
//       if (!line.merchandise || !line.merchandise.product) continue;
  
//       const productId = line.merchandise.product.id;
  
//       if (CONFIG.products.includes(productId) && line.quantity >= CONFIG.minQty) {
  
//         result.operations.push({
//           target: {
//             cartLine: {
//               id: line.id
//             }
//           },
//           value: {
//             percentage: {
//               value: CONFIG.percentOff
//             }
//           }
//         });
  
//       }
//     }
  
//     return result;
//   }
  