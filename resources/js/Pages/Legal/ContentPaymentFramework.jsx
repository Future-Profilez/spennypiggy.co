import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

const css = `
  .cpp { --cpp-paper:#FBFAF8;--cpp-panel:#F4F0E8;--cpp-panel-2:#EFEAE0;--cpp-ink:#1B2230;--cpp-ink-soft:#434B5C;--cpp-ink-faint:#717889;--cpp-hair:#E5E0D6;--cpp-hair-strong:#D8D2C5;--cpp-rose:#A93E59;--cpp-rose-deep:#8A2F47;--cpp-rose-tint:#F7EBEE;--cpp-gold:#9A7B30;--cpp-maxw:880px;--cpp-r:14px; }
  .cpp { color:var(--cpp-ink);font-family:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:16.5px;line-height:1.62;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;min-height:100dvh; }
  .cpp .cpp-wrap{ margin:0 auto;}
  .cpp .eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--cpp-rose);font-weight:500;margin:0 0 18px;}
  .cpp h1{font-family:"Fraunces",Georgia,serif;font-optical-sizing:auto;font-weight:500;font-size:clamp(34px,6.2vw,52px);line-height:1.04;letter-spacing:-.018em;margin:0 0 22px;color:var(--cpp-ink);}
  .cpp .lede{font-size:clamp(18px,2.4vw,21px);line-height:1.5;color:var(--cpp-ink-soft);max-width:62ch;margin:0;font-weight:400;}
  .cpp .lede strong{color:var(--cpp-ink);font-weight:600;}
  .cpp .meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px;}
  .cpp .meta .pill{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.02em;color:var(--cpp-ink-soft);background:var(--cpp-panel);border:1px solid var(--cpp-hair-strong);border-radius:100px;padding:6px 13px;}
  .cpp .meta .pill b{color:var(--cpp-ink);font-weight:600;}
  .cpp nav.toc{margin:34px 0 8px;padding:22px 24px;background:var(--cpp-panel);border:1px solid var(--cpp-hair-strong);border-radius:var(--cpp-r);}
  .cpp nav.toc h2{font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--cpp-ink-faint);margin:0 0 14px;}
  .cpp nav.toc ol{margin:0;padding:0;list-style:none;columns:2;column-gap:34px;}
  .cpp nav.toc li{break-inside:avoid;margin:0 0 9px;}
  .cpp nav.toc a{color:var(--cpp-ink-soft);text-decoration:none;font-size:14.5px;display:flex;gap:10px;align-items:baseline;padding:1px 0;}
  .cpp nav.toc a:hover,.cpp nav.toc a:focus-visible{color:var(--cpp-rose);}
  .cpp nav.toc a .n{font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--cpp-rose);font-weight:500;flex:none;width:18px;}
  @media(max-width:600px){.cpp nav.toc ol{columns:1;}}
  .cpp-main{padding:18px 0 20px;}
  .cpp section{padding:42px 0;border-bottom:1px solid var(--cpp-hair);}
  .cpp section:last-of-type{border-bottom:none;}
  .cpp .sec-head{display:flex;gap:18px;align-items:baseline;margin:0 0 18px;}
  .cpp .sec-num{font-family:"Fraunces",serif;font-weight:500;font-size:30px;color:var(--cpp-rose);line-height:1;flex:none;font-variant-numeric:tabular-nums;}
  .cpp h2.sec-title{font-family:"Fraunces",Georgia,serif;font-weight:500;font-size:clamp(23px,3.4vw,29px);letter-spacing:-.012em;line-height:1.12;margin:0;color:var(--cpp-ink);padding-top:2px;}
  .cpp section p{margin:0 0 15px;color:var(--cpp-ink-soft);}
  .cpp section p:last-child{margin-bottom:0;}
  .cpp section strong{color:var(--cpp-ink);font-weight:600;}
  .cpp .indent{padding-left:48px;}
  @media(max-width:560px){.cpp .indent{padding-left:0;}.cpp .sec-head{gap:13px;}}
  .cpp ul.clean{margin:4px 0 15px;padding:0;list-style:none;}
  .cpp ul.clean li{position:relative;padding-left:24px;margin:0 0 10px;color:var(--cpp-ink-soft);}
  .cpp ul.clean li::before{content:"";position:absolute;left:4px;top:11px;width:7px;height:7px;border-radius:2px;background:var(--cpp-rose);transform:rotate(45deg);}
  .cpp ul.clean li strong{color:var(--cpp-ink);}
  .cpp .duo{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px;}
  .cpp .card-bin{border-radius:var(--cpp-r);padding:22px 22px 20px;border:1px solid var(--cpp-hair-strong);}
  .cpp .card-bin.is{background:var(--cpp-panel);}
  .cpp .card-bin.isnot{background:var(--cpp-rose-tint);border-color:#EAD2D8;}
  .cpp .card-bin h3{font-family:"IBM Plex Mono",monospace;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px;}
  .cpp .card-bin.is h3{color:var(--cpp-gold);}
  .cpp .card-bin.isnot h3{color:var(--cpp-rose-deep);}
  .cpp .card-bin ul{margin:0;padding:0;list-style:none;}
  .cpp .card-bin li{font-size:15px;line-height:1.45;margin:0 0 11px;padding-left:22px;position:relative;color:var(--cpp-ink-soft);}
  .cpp .card-bin li:last-child{margin-bottom:0;}
  .cpp .card-bin.is li::before{content:"+";position:absolute;left:2px;top:-1px;color:var(--cpp-gold);font-weight:700;}
  .cpp .card-bin.isnot li::before{content:"×";position:absolute;left:2px;top:-1px;color:var(--cpp-rose);font-weight:700;}
  @media(max-width:600px){.cpp .duo{grid-template-columns:1fr;}}
  .cpp .principle{background:var(--cpp-ink);color:#F4F2EE;border-radius:var(--cpp-r);padding:30px 30px;margin:6px 0 6px;}
  .cpp .principle .k{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#C9627C;margin:0 0 12px;font-weight:500;}
  .cpp .principle p{margin:0;color:#EEEBE5;font-size:clamp(17px,2.3vw,19.5px);line-height:1.5;font-family:"Fraunces",serif;font-weight:400;letter-spacing:-.005em;}
  .cpp .principle p strong{color:#fff;font-weight:600;}
  .cpp .ids{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px;}
  .cpp .ids code{font-family:"IBM Plex Mono",monospace;font-size:12.5px;color:var(--cpp-ink);background:var(--cpp-panel);border:1px solid var(--cpp-hair-strong);border-radius:7px;padding:5px 9px;letter-spacing:-.01em;}
  .cpp .matrix{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px;}
  .cpp .feat{border:1px solid var(--cpp-hair-strong);border-radius:var(--cpp-r);background:#fff;padding:0;overflow:hidden;display:flex;flex-direction:column;}
  .cpp .feat-top{padding:16px 18px 14px;border-bottom:1px solid var(--cpp-hair);background:var(--cpp-panel);}
  .cpp .feat-top .name{font-weight:600;font-size:16.5px;letter-spacing:-.01em;color:var(--cpp-ink);}
  .cpp .feat-top .obj{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--cpp-rose);margin-top:5px;letter-spacing:-.01em;}
  .cpp .feat dl{margin:0;padding:14px 18px 16px;display:grid;gap:11px;}
  .cpp .feat .row{display:grid;grid-template-columns:118px 1fr;gap:12px;align-items:baseline;}
  .cpp .feat dt{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--cpp-ink-faint);font-weight:500;}
  .cpp .feat dd{margin:0;font-size:14px;line-height:1.4;color:var(--cpp-ink-soft);}
  .cpp .feat dd.buy{color:var(--cpp-ink);font-weight:500;}
  @media(max-width:640px){.cpp .matrix{grid-template-columns:1fr;}.cpp .feat .row{grid-template-columns:100px 1fr;}}
  .cpp .prohibited{background:var(--cpp-rose-tint);border:1px solid #E7CDD4;border-radius:var(--cpp-r);padding:26px 26px 22px;margin-top:6px;}
  .cpp .prohibited .hd{display:flex;align-items:center;gap:10px;margin:0 0 16px;}
  .cpp .prohibited .hd .ico{width:22px;height:22px;border-radius:6px;background:var(--cpp-rose);flex:none;position:relative;}
  .cpp .prohibited .hd .ico::before{content:"!";position:absolute;inset:0;color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;}
  .cpp .prohibited .hd h3{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--cpp-rose-deep);margin:0;font-weight:600;}
  .cpp .prohibited .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:0;}
  .cpp .prohibited .pgrid div{font-size:14.5px;color:var(--cpp-ink-soft);padding-left:20px;position:relative;line-height:1.4;}
  .cpp .prohibited .pgrid div::before{content:"×";position:absolute;left:2px;top:0;color:var(--cpp-rose);font-weight:700;}
  @media(max-width:560px){.cpp .prohibited .pgrid{grid-template-columns:1fr;}}
  .cpp .contact{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px;}
  .cpp .contact .box{border:1px solid var(--cpp-hair-strong);border-radius:var(--cpp-r);padding:18px 20px;background:var(--cpp-panel);}
  .cpp .contact .box .lab{font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--cpp-ink-faint);margin:0 0 7px;}
  .cpp .contact .box .val{font-size:15px;color:var(--cpp-ink);}
  .cpp .contact a{color:var(--cpp-rose);text-decoration:none;}
  .cpp .contact a:hover{text-decoration:underline;}
  @media(max-width:560px){.cpp .contact{grid-template-columns:1fr;}}
  .cpp a.inl{color:var(--cpp-rose);text-decoration:none;border-bottom:1px solid #E2C4CC;}
  .cpp a.inl:hover{border-color:var(--cpp-rose);}
  .cpp footer.cpp-doc{border-top:1px solid var(--cpp-hair);padding:34px 0 56px;margin-top:8px;}
  .cpp footer.cpp-doc .cpp-wrap{display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;align-items:flex-start;}
  .cpp footer.cpp-doc p{margin:0;font-size:13px;color:var(--cpp-ink-faint);line-height:1.6;max-width:60ch;}
  .cpp footer.cpp-doc .ver{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:var(--cpp-ink-faint);letter-spacing:.02em;}
`;

export default function ContentPaymentFramework({ auth, user }) {
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Content &amp; Payment Association Framework — Spenny Piggy">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </Head>
            <LegalLayout activePage="ContentPaymentFramework">
            <div className="cpp px-6 md:px-8 py-8 md:py-12">
                <header className="masthead" id="top">
                    <div className="cpp-wrap">
                        <p className="eyebrow">Acceptable Use &amp; Payment Policy</p>
                        <h1>Content &amp; Payment<br />Association Framework</h1>
                        <p className="lede">Spenny Piggy is a content and services marketplace. <strong>Every payment is a purchase of creator content, rewards, memberships, services or digital products</strong> — never a donation, gift or transfer of money between people.</p>
                        <div className="meta">
                            <span className="pill">Version <b>2.0</b></span>
                            <span className="pill">Effective <b>15 June 2026</b></span>
                            <span className="pill">Operated by <b>Social Vortex Limited</b></span>
                            <span className="pill">Jurisdiction <b>United Kingdom</b></span>
                            <span className="pill">Content rating <b>Strictly SFW</b></span>
                        </div>

                        <nav className="toc" aria-label="Contents">
                            <h2>On this page</h2>
                            <ol>
                                <li><a href="#s1"><span className="n">01</span> Purpose &amp; scope</a></li>
                                <li><a href="#s2"><span className="n">02</span> What Spenny Piggy is — and is not</a></li>
                                <li><a href="#s3"><span className="n">03</span> The content-first principle</a></li>
                                <li><a href="#s4"><span className="n">04</span> Acceptable content &amp; community standards</a></li>
                                <li><a href="#s5"><span className="n">05</span> Payment-to-content verification</a></li>
                                <li><a href="#s6"><span className="n">06</span> Feature association matrix</a></li>
                                <li><a href="#s7"><span className="n">07</span> Delivery &amp; fulfilment controls</a></li>
                                <li><a href="#s8"><span className="n">08</span> Creator content obligations</a></li>
                                <li><a href="#s9"><span className="n">09</span> Refunds, non-delivery &amp; disputes</a></li>
                                <li><a href="#s10"><span className="n">10</span> Platform controls &amp; monitoring</a></li>
                                <li><a href="#s11"><span className="n">11</span> Audit &amp; record-keeping</a></li>
                                <li><a href="#s12"><span className="n">12</span> Prohibited uses</a></li>
                                <li><a href="#s13"><span className="n">13</span> Compliance statement &amp; contact</a></li>
                            </ol>
                        </nav>
                    </div>
                </header>

                <main className="cpp-main cpp-wrap">

                    <section id="s1">
                        <div className="sec-head"><span className="sec-num">01</span><h2 className="sec-title">Purpose &amp; scope</h2></div>
                        <div className="indent">
                            <p>This Framework explains how Spenny Piggy links every supporter payment to a defined creator benefit — content, rewards, memberships, services, digital products, fulfilment records and creator engagement benefits — and the controls we apply to keep that link genuine.</p>
                            <p>It applies to all creators, supporters and transactions on the platform and forms part of the Spenny Piggy <a className="inl" href="/terms">Terms of Service</a>. Where this Framework conflicts with the Terms of Service, the Terms of Service prevail.</p>
                        </div>
                    </section>

                    <section id="s2">
                        <div className="sec-head"><span className="sec-num">02</span><h2 className="sec-title">What Spenny Piggy is — and is not</h2></div>
                        <div className="indent">
                            <p>Spenny Piggy gives creators tools to sell defined benefits to their supporters and gives supporters a clear understanding of what each payment buys. It is not a way to move money for its own sake.</p>
                            <div className="duo">
                                <div className="card-bin is">
                                    <h3>Spenny Piggy is</h3>
                                    <ul>
                                        <li>A marketplace for creator <strong>content, memberships, services and digital products</strong></li>
                                        <li>A platform where each payment is tied to a deliverable benefit</li>
                                        <li>A facilitator that records what was bought, delivered and fulfilled</li>
                                        <li>A strictly safe-for-work environment with human moderation</li>
                                    </ul>
                                </div>
                                <div className="card-bin isnot">
                                    <h3>Spenny Piggy is not</h3>
                                    <ul>
                                        <li>A <strong>donation</strong> or charitable fundraising platform</li>
                                        <li>A <strong>gifting</strong>, tipping-only or cash-transfer service</li>
                                        <li>A money transmitter, e-wallet or stored-value provider</li>
                                        <li>A way to send, lend, repay or pool money between people</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="s3">
                        <div className="sec-head"><span className="sec-num">03</span><h2 className="sec-title">The content-first principle</h2></div>
                        <div className="indent">
                            <div className="principle">
                                <p className="k">Core rule</p>
                                <p>Every payment processed through Spenny Piggy must be associated with a creator benefit. <strong>Payments that cannot be linked to content, rewards, memberships, services, products, tasks or creator engagement are prohibited</strong> and will be restricted, refunded or removed.</p>
                            </div>
                            <p style={{ marginTop: '22px' }}>Creators choose which monetised features to offer; supporters always see what they are purchasing before they pay; and the platform records the benefit against each transaction. No feature on Spenny Piggy allows a payment to be taken without an associated, deliverable benefit.</p>
                        </div>
                    </section>

                    <section id="s4">
                        <div className="sec-head"><span className="sec-num">04</span><h2 className="sec-title">Acceptable content &amp; community standards</h2></div>
                        <div className="indent">
                            <p>Spenny Piggy is <strong>strictly safe-for-work</strong>. All content, rewards and listings are subject to manual creator approval and ongoing human moderation. The following are not permitted on the platform, whether as the benefit purchased or as creator content of any kind:</p>
                            <ul className="clean">
                                <li><strong>Sexual or adult content</strong>, nudity intended to arouse, fetish content, or any sexually explicit material or services.</li>
                                <li><strong>Illegal goods or services</strong>, regulated items, or anything that breaches applicable UK law.</li>
                                <li><strong>Hateful, harassing or violent content</strong>, or content that targets or endangers any individual or group. Such content may not be monetised on the Platform.</li>
                                <li><strong>Content involving minors</strong> in any unsafe, exploitative or inappropriate way.</li>
                                <li>Misleading, deceptive or fraudulent listings, or benefits the creator cannot deliver.</li>
                            </ul>
                            <p>Creators who breach these standards may have listings removed, monetisation features restricted, or accounts suspended or terminated.</p>
                        </div>
                    </section>

                    <section id="s5">
                        <div className="sec-head"><span className="sec-num">05</span><h2 className="sec-title">Payment-to-content verification</h2></div>
                        <div className="indent">
                            <p>Each transaction is linked to structured platform records so the benefit purchased can be identified, delivered and audited. Records associated with a payment may include:</p>
                            <div className="ids">
                                <code>Transaction ID</code><code>Creator ID</code><code>Supporter ID</code><code>Content ID</code><code>Reward ID</code><code>Membership ID</code><code>Product ID</code><code>Task ID</code><code>Fulfilment Status</code><code>Delivery Status</code><code>Moderation Status</code>
                            </div>
                            <p style={{ marginTop: '14px' }}>These identifiers connect the payment to the specific benefit it relates to, and to the delivery and moderation status of that benefit at the time of purchase and afterwards.</p>
                        </div>
                    </section>

                    <section id="s6">
                        <div className="sec-head"><span className="sec-num">06</span><h2 className="sec-title">Feature association matrix</h2></div>
                        <div className="indent">
                            <p>This matrix shows how each monetised feature maps to the platform object it uses, what the supporter is purchasing, the benefit delivered, the delivery method, the evidence logged, and the refund controls that apply.</p>
                            <div className="matrix">
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Memberships</div><div className="obj">Membership ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">Subscription access</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Exclusive content &amp; member benefits</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Membership records, access logs, timestamps</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Restrictions &amp; refunds apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Paid Tasks</div><div className="obj">Task ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">A creator service</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Personalised content or fulfilment</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Fulfilment workflow</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Task logs, delivery records</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund if unfulfilled</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Piggy Pot</div><div className="obj">Reward ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">A goal contribution</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Reward, content or engagement benefit</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Contribution &amp; reward logs</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Piggy Bank</div><div className="obj">Membership ID / Reward ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">A contribution feature</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Memberships, certificates, recognition, content benefits</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Transaction logs, access logs</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Bills</div><div className="obj">Membership ID / Content ID / Reward ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">A contribution feature</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Content, memberships, rewards, engagement benefits</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Contribution, fulfilment &amp; content logs</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Wishlist Rewards</div><div className="obj">Reward ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">A wishlist contribution</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Reward or content benefit</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Reward logs, access logs</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Digital Products</div><div className="obj">Product ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">Downloadable content</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Digital files and products</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Download / email</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Download logs, delivery records</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                                <div className="feat">
                                    <div className="feat-top"><div className="name">Content Unlocks</div><div className="obj">Content ID</div></div>
                                    <dl>
                                        <div className="row"><dt>Buys</dt><dd className="buy">Premium access</dd></div>
                                        <div className="row"><dt>Delivers</dt><dd>Restricted creator content</dd></div>
                                        <div className="row"><dt>Method</dt><dd>Platform</dd></div>
                                        <div className="row"><dt>Evidence</dt><dd>Access logs</dd></div>
                                        <div className="row"><dt>Refunds</dt><dd>Refund controls apply</dd></div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="s7">
                        <div className="sec-head"><span className="sec-num">07</span><h2 className="sec-title">Delivery &amp; fulfilment controls</h2></div>
                        <div className="indent">
                            <p>Depending on the feature, benefits are delivered through platform access, secure downloads, membership access, email delivery, creator fulfilment workflows and digital product delivery.</p>
                            <p>Where applicable, Spenny Piggy retains download logs, access logs, email delivery records, fulfilment records and delivery timestamps so that delivery of the purchased benefit can be confirmed.</p>
                        </div>
                    </section>

                    <section id="s8">
                        <div className="sec-head"><span className="sec-num">08</span><h2 className="sec-title">Creator content obligations</h2></div>
                        <div className="indent">
                            <p>Creators must maintain the benefits they offer. A creator may be restricted from receiving payments, maintaining memberships or accessing monetisation features where they:</p>
                            <ul className="clean">
                                <li>fail to maintain active content delivery for a membership or feature;</li>
                                <li>fail to fulfil purchases within the stated or a reasonable timeframe; or</li>
                                <li>repeatedly receive complaints relating to inactivity or non-fulfilment.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="s9">
                        <div className="sec-head"><span className="sec-num">09</span><h2 className="sec-title">Refunds, non-delivery &amp; disputes</h2></div>
                        <div className="indent">
                            <p>Where a creator fails to provide the benefit associated with a transaction, Spenny Piggy may restrict monetisation features, suspend accounts, remove listings, process refunds and apply further enforcement measures.</p>
                            <p>Supporters can raise a delivery or fulfilment issue with us directly. We review the associated records — the benefit purchased, its delivery status and any creator response — and resolve eligible cases through refunds or other remedies. <strong>We encourage supporters to contact us before raising a card dispute</strong>, so issues can be resolved quickly using the platform's transaction records.</p>
                            <p>We monitor chargeback and dispute activity at both platform and creator level, investigate the underlying cause, and apply controls — including listing removal, payout restrictions and account action — to creators whose activity drives disputes or non-delivery.</p>
                        </div>
                    </section>

                    <section id="s10">
                        <div className="sec-head"><span className="sec-num">10</span><h2 className="sec-title">Platform controls &amp; monitoring</h2></div>
                        <div className="indent">
                            <p>Spenny Piggy operates layered controls across the lifecycle of a creator and a transaction:</p>
                            <ul className="clean">
                                <li><strong>Preventative</strong> — identity verification, manual creator approval and content review before monetisation, and acceptable-use enforcement.</li>
                                <li><strong>Detective</strong> — transaction monitoring, content-inactivity monitoring, repeat-offender monitoring and audit logging.</li>
                                <li><strong>Corrective</strong> — refunds, listing removal, payout restrictions, account suspension and account termination.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="s11">
                        <div className="sec-head"><span className="sec-num">11</span><h2 className="sec-title">Audit &amp; record-keeping</h2></div>
                        <div className="indent">
                            <p>To support verification, dispute handling and compliance, Spenny Piggy maintains records that may include:</p>
                            <div className="ids">
                                <code>Transaction ID</code><code>Creator ID</code><code>Supporter ID</code><code>Content ID</code><code>Reward ID</code><code>Membership ID</code><code>Product ID</code><code>Task ID</code><code>Purchase timestamps</code><code>Fulfilment records</code><code>Moderation records</code><code>Access logs</code><code>Download logs</code><code>Email delivery logs</code><code>Refund records</code>
                            </div>
                            <p style={{ marginTop: '14px' }}>Records are retained in line with our Privacy Policy and applicable legal and regulatory requirements.</p>
                        </div>
                    </section>

                    <section id="s12">
                        <div className="sec-head"><span className="sec-num">12</span><h2 className="sec-title">Prohibited uses</h2></div>
                        <div className="indent">
                            <p>The following uses of Spenny Piggy are prohibited because they are not the purchase of a creator benefit:</p>
                            <div className="prohibited">
                                <div className="hd"><span className="ico"></span><h3>Not permitted on Spenny Piggy</h3></div>
                                <div className="pgrid">
                                    <div>Standalone donations</div>
                                    <div>Personal fundraising</div>
                                    <div>Charitable fundraising</div>
                                    <div>Cash gifting</div>
                                    <div>Financial gifting</div>
                                    <div>Money transmission</div>
                                    <div>Debt repayment</div>
                                    <div>Loan repayment</div>
                                    <div>Payments without an associated creator benefit</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="s13">
                        <div className="sec-head"><span className="sec-num">13</span><h2 className="sec-title">Compliance statement &amp; contact</h2></div>
                        <div className="indent">
                            <p>Every payment processed through Spenny Piggy must be associated with a creator content, reward, membership, service, product, task or creator engagement record. Transactions that cannot be associated with an approved creator feature may be restricted, refunded or removed.</p>
                            <div className="contact">
                                <div className="box">
                                    <p className="lab">Operator</p>
                                    <p className="val">Social Vortex Limited<br />Company no. 15233693<br />55 Colmore Row, Birmingham, England, B3 2AA</p>
                                </div>
                                <div className="box">
                                    <p className="lab">Contact</p>
                                    <p className="val"><a href="mailto:support@spennypiggy.com">support@spennypiggy.com</a><br />Compliance: <a href="mailto:compliance@spennypiggy.com">compliance@spennypiggy.com</a></p>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                <footer className="cpp-doc">
                    <div className="cpp-wrap">
                        <p>Spenny Piggy is operated by Social Vortex Limited. This Framework forms part of our Terms of Service and should be read alongside our Privacy Policy and Acceptable Use Policy.</p>
                        <p className="ver">Content &amp; Payment Association Framework · v2.0 · Effective 15 June 2026</p>
                    </div>
                </footer>
            </div>
            </LegalLayout>
        </Guest>
    );
}
