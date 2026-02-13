import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, usePage } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import Nocontent from '@/includes/Nocontent';
import PriceFormat from '@/includes/PriceFormat';

export default function GifterBills({ username }) {
  const { auth, global_currency } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBills = async (p = 1, append = false, signal) => {
    setLoading(true);
    axios
      .get(`/gifter-bills/${username}?page=${p}`, { signal })
      .then((resp) => {
        const list = resp?.data?.bills || [];
        setBills(append ? [...bills, ...list] : list);
        setPage(p);
        setHasMore(!(resp?.data?.last_page === resp?.data?.current_page));
        setLoading(false);
      })
      .catch((_err) => {
        console.error('error', _err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    fetchBills(1, false, signal);
    return () => controller.abort();
  }, [username]);

  const BillItem = ({ b, i }) => {
    const totalAmount = (+b.amount) + (+b.tax || 0) + (+b.vat_tax_amount || 0);
    return (
      <div key={`bill-${i}`} className="bg-white rounded-[40px]   shadow-md p-4 mb-3 border border-2 border-pink-300">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-gulfs uppercase text-black">{b.bill?.name || 'Bill Payment'}</h3>
            <p className="text-sm text-gray-500">
              {new Date(b.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <div className="mt-2">
              <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 capitalize">
                {b.recurring_for === 'onetime' ? 'one-time' : b.recurring_for || 'recurring'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-black">
              {formatMultiPrice(totalAmount, b.currency || auth.user?.default_currency || global_currency)}
            </p>
            {b.owner?.username && (
              <Link href={`/${b.owner.username}`} className="text-pink-600 text-sm hover:underline">
                @{b.owner.username}
              </Link>
            )}
          </div>
        </div>

        {b.message && (
          <div className="mt-3 p-3 bg-gray-50 rounded-[40px] ">
            <p className="text-sm text-gray-700 italic">“{b.message}”</p>
          </div>
        )}

        {b.bill?.perma_link && (
          <div className="mt-3">
            <img src={b.bill.perma_link} alt={b.bill?.name} className="w-full h-40 object-cover rounded-[40px]  " />
          </div>
        )}

        <div className="mt-3">
          <Link href={`/${b.owner?.username || ''}`} className="text-[15px] text-pink">
            🎉 Subscribers Only Access
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl m-auto">
      {loading && bills.length === 0 ? (
        <LoadingScreen />
      ) : bills && bills.length > 0 ? (
        <>
          {bills.map((b, i) => (
            <BillItem key={`bill-${i}`} b={b} i={i} />
          ))}
          {!loading && hasMore ? (
            <button onClick={() => fetchBills(page + 1, true)} className="loadmore-text">
              Show More
            </button>
          ) : null}
          {loading ? <LoadingScreen hideimage={true} /> : null}
        </>
      ) : (
        <Nocontent text="No bill payments found" />
      )}
    </div>
  );
}