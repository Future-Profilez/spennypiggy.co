# Hydration Debug Steps

## Issue: Wish items not showing on initial load, appear after refresh

### Root Cause Analysis:
✅ **CONFIRMED**: `TabContent.jsx` is passing `wishitems` array directly to `Wishlistbox` component
✅ **CONFIRMED**: `Wishlistbox` expects single item via `itm` prop, not an array

### Evidence:
1. **TabContent.jsx Line 50-56**: 
   ```jsx
   <Wishlistbox
       wishitems={wishitems}  // ❌ WRONG: passing array
       IsloggedIn={IsloggedIn}
       username={username}
       selectedCategory={selectedCategory}
       wish_categories={wish_categories}
   />
   ```

2. **Dashboard.jsx Line 852-876** (CORRECT usage):
   ```jsx
   {wishitems.map((c, i) => {
       return (
           <Wishlistbox
               key={`wish-item-${i}`}
               itm={c}  // ✅ CORRECT: passing single item
               currency={global_currency}
               IsloggedIn={IsloggedIn}
               auth={auth.user}
               setuped={AuthUserStripeConnected == 1}
           />
       );
   })}
   ```

3. **Wishlistbox.jsx Line 21**: 
   ```jsx
   const { currency, itm, itemid, auth, IsloggedIn, ... } = props;
   ```
   Component expects `itm` (single item), not `wishitems` (array)

### Hydration Mismatch:
- Server renders nothing (Wishlistbox receives array, can't render individual items)
- Client-side code might have different render path that eventually works
- Refresh bypasses hydration, works correctly

### Fix Required:
Create proper `WishlistGrid` component that maps over items array.

## Next Steps:
1. ✅ Enable React Strict Mode to capture hydration warnings  
2. ✅ Create `WishlistGrid` component
3. ✅ Update `TabContent.jsx` to use proper grid component
4. ✅ Test fix with dev server