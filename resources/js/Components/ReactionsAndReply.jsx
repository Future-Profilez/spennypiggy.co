import axios from 'axios';
import { useState, useMemo } from 'react';

export default function ReactionsAndReply({ 
  ev, 
  viewer, 
  creator: overrideCreator, 
  gifter: overrideGifter,
  canAct: overrideCanAct 
}) {
  const [sending, setSending] = useState(false);
  const [counts, setCounts] = useState(ev?.reactions || {});
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [replies, setReplies] = useState(ev?.replies || []);
  const [reacted, setReacted] = useState(new Set(ev?.user_reacted || []));
  const emojis = ['❤️', '👏', '🔥', '⭐'];

  const creatorUsername = overrideCreator || ev?.creator?.username || null;
  const gifterUsername = overrideGifter || ev?.gifter?.username || null;
  
  const canAct = typeof overrideCanAct !== 'undefined' 
    ? overrideCanAct 
    : (viewer && creatorUsername && gifterUsername && (viewer.username === creatorUsername || viewer.username === gifterUsername));

  const wordCount = useMemo(() => {
    return reply.trim() ? reply.trim().split(/\s+/).length : 0;
  }, [reply]);

  const charCount = reply.length;
  const isOverLimit = charCount > 250 || wordCount > 90;

  const react = async (emoji) => {
    if (!ev?.source || !ev?.source_id || !ev?.type || !creatorUsername || !gifterUsername) return;
    if (!canAct) return;
    setSending(true);
    const has = reacted.has(emoji);
    const next = { ...(counts || {}) };
    next[emoji] = Math.max(0, (next[emoji] || 0) + (has ? -1 : 1));
    setCounts(next);
    const s = new Set(reacted);
    if (has) s.delete(emoji); else s.add(emoji);
    setReacted(s);
    try {
      const resp = await axios.post(`/support-story/${creatorUsername}/${gifterUsername}/react`, {
        event_type: ev.type,
        source: ev.source,
        source_id: ev.source_id,
        emoji
      });
      setCounts((prev) => ({ ...(prev || {}), ...(resp.data?.counts || {}) }));
    } catch (e) {
      console.error('Reaction failed', e);
    } finally {
      setSending(false);
    }
  };

  const submitReply = async () => {
    if (!reply.trim() || !ev?.source || !ev?.source_id || !ev?.type || !creatorUsername || !gifterUsername) return;
    if (!canAct || isOverLimit) return;
    setSending(true);
    setError('');
    try {
      const resp = await axios.post(`/support-story/${creatorUsername}/${gifterUsername}/reply`, {
        event_type: ev.type,
        source: ev.source,
        source_id: ev.source_id,
        message: reply.trim()
      });
      setReply('');
      if (resp?.data?.reply) {
        setReplies([resp.data.reply, ...replies].slice(0, 5));
      }
    } catch (e) {
      console.error('Reply failed', e);
      if (e.response?.data?.msg) {
        setError(e.response.data.msg);
      } else {
        setError('Failed to send reply. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        {emojis.map((e) => (
          canAct ? (
            <button  
              key={e} onClick={() => react(e)}
              disabled={sending} title="React"  
              className={`px-2 py-1 rounded-[10px] border text-[26px] transition-colors ${reacted.has(e) ? 'bg-pink-100 border-[#FF007F]' : 'bg-white border-black/10 hover:bg-gray-100'}`} >
              {e} {counts?.[e] ? <span className="text-black text-xs font-black"> {counts[e]}</span> : null}
            </button>
          ) : (
            <span key={e} className="px-2 py-1 rounded-full bg-gray-100 border border-black/10 text-black text-sm font-black">
              {e} {counts?.[e] ? <span className="text-black text-xs"> {counts[e]}</span> : null}
            </span> 
          )
        ))}
      </div>

      {/* Reply Section */}
      {canAct && (
        <div className="mt-3">
          <div className="flex gap-2">
            <div className='relative w-full'>
              <textarea
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value);
                  if (error) setError('');
                }}
                placeholder={ev.type === 'thankyou' ? "Say thanks back…" : "Send a quick thank‑you…"}
                className={`flex-1 bg-gray-200  border ${isOverLimit ? 'border-red-500' : 'border-white/10'} rounded-[20px] p-4 text-black placeholder-gray-500 resize-none 
                   w-full outline-none focus:border-white/20 transition-colors border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              />
              <button
                onClick={submitReply}
                disabled={sending || !reply.trim() || isOverLimit}
                className="px-3 py-2 h-10  absolute bottom-[20px] right-[15px]
                rounded-[15px] bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white text-[11px] uppercase tracking-widest self-end transition-colors"
              > Reply </button>
            </div>
          </div>
          <div className="flex justify-start mt-1 px-2">
            <div className="text-[10px] uppercase tracking-widest text-red-500">
              {error || (isOverLimit ? (charCount > 250 ? 'Character limit exceeded' : 'Word limit exceeded') : '')}
            </div>
            <div className={`text-[10px] uppercase tracking-widest ${isOverLimit ? 'text-red-500' : 'text-gray-600'}`}>
              {charCount}/250 chars • {wordCount}/90 words
            </div>
          </div>
        </div>
      )}

      {/* Replies List */}
      {replies && replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <img 
                src={r.avatar || ''} 
                alt="" 
                className="h-6 w-6 rounded-full border border-black/10 object-cover" 
              />
              <div>
                <p className="text-black/80 text-sm">
                  <span className="text-black/60 font-black">@{r.username}</span> {r.message}
                </p>
                <p className="text-black/30 text-[10px] uppercase tracking-widest">
                  {r.created_at}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
