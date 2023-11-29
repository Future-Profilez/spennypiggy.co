export default function CartTransform(){
   const transform  = (inputData, loggedInUserId) => {
      const outputData = [];
      const groupedData = inputData.reduce((acc, item) => {
        const userId = item.user && item.user.id || null;
        if (!acc[userId]){
          acc[userId] = { 
            user: { 
              id: userId || null, 
              name: item.user && item.user.name || null, 
              username: item.user && item.user.username || null, 
              uuid: item.user && item.user.uuid || null 
            }, 
            items: [], 
            subtotal: 0, 
            processingFee: 0 
          };
        }
    
        const itemSubtotal = parseFloat(item.price);
        acc[userId].subtotal += itemSubtotal;
        acc[userId].items.push({
          id: item.id || '',
          uuid: item.uuid || '',
          user_id: item.user_id || '',
          wishname: item.wishname || '',
          stripe_product_id: item.stripe_product_id || '',
          price: item.price || '',
          price_id: item.price_id || '',
          quantity: 1,
          item_url: item.item_url || '',
          subscription: item.subscription || '',
          subscription_period: item.subscription_period || '',
          repeat_purchase: item.repeat_purchase || '',
          category: item.category || '',
          url: item.perma_link || '',
          product:item.product || '',
          surprise_message: item.surprise_message || '',
        });
        return acc;
      }, {});
    
      // Calculate processing fee (20% of subtotal) for each user
      for (const userId in groupedData) {
        const userCart = groupedData[userId];
        userCart.processingFee = 0.2 * userCart.subtotal; // 20% processing fee
        userCart.loggeInUser = loggedInUserId;
        outputData.push(userCart);
      }
    
      return outputData;
    };
   
   return { transform }
}