import AddItem from './AddItem';

// Seeded starting points. Copy here is pre-filled into a creator's live product,
// so it must already pass the content rules: no third-party brand names, and
// nothing that reads as a bill, donation or "buy me a coffee".
const TEMPLATES = [
   [
      { title: '+ Start from scratch' },
      {
         title: 'Digital Products',
         pre_price: 9,
         pre_title: 'Taking Smart Notes (Ebook)',
         pre_description: 'Learn the art of note-taking with this extensive guide. Available in PDF format.',
      },
      {
         title: '1-on-1 video call',
         pre_price: 10,
         pre_title: 'Content Creation Advice',
         pre_description: 'Hop on a one-hour video call with me where I’ll help you achieve your content creation goals. I’ll also show you the tools I use, and how I grow my audience.',
      },
   ],
   [
      {
         title: 'Close friends content access',
         pre_price: 15,
         pre_title: 'Close Friends Content Access',
         pre_description: 'For a one-off payment, you get access to my close-friends content — the daily life and sneak peeks of my latest projects that I share on a more personal level than my wider audience sees.',
      },
      {
         title: 'Ticket for an event',
         pre_price: 30,
         pre_title: 'Group Yoga on June 1st',
         pre_description: 'Join the 60-minute group yoga class where we practice Vinyasa. Beginner-friendly.',
      },
   ],
   [
      {
         title: 'Digital Artwork',
         pre_price: 20,
         pre_title: 'Custom Portrait Drawing',
         pre_description: 'A personalized digital portrait based on your photo. High-resolution file delivered within 3 days.',
      },
      {
         title: 'Physical Craft',
         product_type: 'physical',
         pre_price: 45,
         pre_title: 'Handmade Ceramic Mug',
         pre_description: 'Beautiful ceramic mug, handcrafted with care. Ships worldwide.',
      },
      {
         title: 'Personalized Video',
         pre_price: 12,
         pre_title: 'Exclusive Video Greeting',
         pre_description: 'A personalized, heartfelt video greeting recorded just for you or someone you choose.',
      },
   ],
];

const TILE_CLASSES =
   'w-full font-bold text-lg shop-start-box shadow-[6px_6px_0px_#000] border-2 border-black px-4 py-4 md:px-6 md:py-8 min-h-[44px] text-center bg-white rounded-box hover:shadow-[4px_4px_0px_#000] transition-all';

const ROW_CLASSES = [
   'grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3',
   'grid grid-cols-1 md:grid-cols-2 gap-3 mb-3',
   'grid grid-cols-1 lg:grid-cols-3 gap-3',
];

export default function AddShop({ update }) {
   return (
      <>
         {TEMPLATES.map((row, rowIndex) => (
            <div key={rowIndex} className={ROW_CLASSES[rowIndex]}>
               {row.map((tpl) => (
                  <AddItem key={tpl.title} classes={TILE_CLASSES} update={update} {...tpl} />
               ))}
            </div>
         ))}
      </>
   );
}
