export default function CartTransform(){
   const transform = (inputData, loggedInUserId) => {
      const outputData = [];
      const groupedData = inputData.reduce((acc, item) => {
          const userId = item.user.id;
          if (!acc[userId]) {
              acc[userId] = { 
                  user: { 
                      id: userId, 
                      name: item.user.name, 
                      username: item.user.username, 
                      uuid: item.user.uuid 
                  }, 
                  items: [] 
              };
          }
          acc[userId].items.push({
              id: item.id,
              uuid: item.uuid,
              user_id: item.user_id,
              wishname: item.wishname,
              stripe_product_id: item.stripe_product_id,
              price: item.price,
              price_id: item.price_id,
              item_url: item.item_url,
              subscription: item.subscription,
              subscription_period: item.subscription_period,
              repeat_purchase: item.repeat_purchase,
              category: item.category,
              url: item.perma_link,
          });
          return acc;
      }, {});
      for (const userId in groupedData) {
          const userCart = groupedData[userId];
          userCart.loggeInUser = loggedInUserId;
          outputData.push(userCart);
      }
      return outputData;
   };

   
   return { transform }
}