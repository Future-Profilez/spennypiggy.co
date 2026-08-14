import { Head } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

/**
 * Email signature handover page.
 *
 * The markup comes from the server verbatim (resources/views/brand/signatures/*.html)
 * and is BOTH rendered as the preview and handed to the clipboard, so what someone
 * sees here is exactly what their mail client receives. Do not rebuild either half
 * in JSX — a second copy is one that can drift from the one that was tested.
 */

const STEPS = [
    {
        client: 'Apple Mail',
        steps: [
            ['Mail → ', <strong key="a">Settings</strong>, ' → ', <strong key="b">Signatures</strong>, '.'],
            ['Pick the account on the left, press ', <strong key="c">+</strong>, '.'],
            [
                'Untick ',
                <strong key="d">“Always match my default message font”</strong>,
                ' — left on, Mail strips the styling.',
            ],
            ['Click into the box and paste.'],
        ],
        note: 'Do not press Return after pasting. It adds a blank line above every reply.',
    },
    {
        client: 'Outlook — Mac & Web',
        steps: [
            [<strong key="a">Settings</strong>, ' → ', <strong key="b">Mail</strong>, ' → ', <strong key="c">Compose and reply</strong>, '.'],
            ['Under ', <strong key="d">Email signature</strong>, ', paste into the box.'],
            ['Set it for ', <strong key="e">new messages</strong>, ' and ', <strong key="f">replies</strong>, ', then ', <strong key="g">Save</strong>, '.'],
        ],
        note: 'Outlook squares off the rounded corners. That is expected, and the design still reads.',
    },
    {
        client: 'Outlook — Windows',
        steps: [
            [<strong key="a">File</strong>, ' → ', <strong key="b">Options</strong>, ' → ', <strong key="c">Mail</strong>, ' → ', <strong key="d">Signatures</strong>, '.'],
            [<strong key="e">New</strong>, ', name it, paste into the edit box.'],
            ['Choose it for ', <strong key="f">New messages</strong>, ' and ', <strong key="g">Replies/forwards</strong>, '.'],
        ],
        note: 'If pasting misbehaves, replace the file in %APPDATA%\\Microsoft\\Signatures and restart Outlook.',
    },
    {
        client: 'Gmail',
        steps: [
            ['Gear icon → ', <strong key="a">See all settings</strong>, ' → ', <strong key="b">General</strong>, '.'],
            ['Scroll to ', <strong key="c">Signature</strong>, ' → ', <strong key="d">Create new</strong>, ', name it, paste.'],
            ['Set ', <strong key="e">For new emails</strong>, ' and ', <strong key="f">On reply/forward</strong>, ' to it.'],
            ['Scroll to the very bottom and press ', <strong key="g">Save Changes</strong>, '.'],
        ],
        note: 'That last step is the one everybody misses — Gmail discards the signature without it.',
    },
];

const COPY_LABELS = {
    idle: 'Copy signature',
    copied: 'Copied',
    selected: 'Selected — press Cmd/Ctrl+C',
    failed: 'Select it manually',
};

function SignatureCard({ signature }) {
    const [state, setState] = useState('idle');
    const previewRef = useRef(null);
    const timer = useRef(null);

    const settle = useCallback((next) => {
        setState(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState('idle'), 2600);
    }, []);

    const copy = useCallback(async () => {
        try {
            // text/html is what makes a mail client paste the design rather than
            // the source. text/plain rides along for anywhere that only takes it.
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([signature.markup], { type: 'text/html' }),
                    'text/plain': new Blob([signature.markup], { type: 'text/plain' }),
                }),
            ]);
            settle('copied');
        } catch {
            // Safari and Firefox refuse ClipboardItem where Chrome allows it.
            // Selecting the rendered preview still gives a usable rich copy.
            try {
                const range = document.createRange();
                range.selectNodeContents(previewRef.current);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                settle('selected');
            } catch {
                settle('failed');
            }
        }
    }, [signature.markup, settle]);

    return (
        <div className="mb-6 last:mb-0">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-[13px] leading-[1.4] text-white/60">
                    <span className="text-white">{signature.owner}</span> · {signature.address}
                </p>

                <button
                    type="button"
                    onClick={copy}
                    className={`ml-auto min-h-[44px] rounded-box-sm px-5 font-gulfs text-[13px] uppercase tracking-wide transition-colors ${
                        state === 'failed'
                            ? 'bg-[#FF007F] text-black'
                            : 'bg-[#05EFB8] text-black hover:bg-white'
                    }`}
                >
                    {COPY_LABELS[state]}
                </button>
            </div>

            {/* White plate: a signature is judged against the message body it lands
                in, not against a brand page. */}
            <div className="overflow-x-auto rounded-box bg-white p-4 md:p-7">
                <div ref={previewRef} dangerouslySetInnerHTML={{ __html: signature.markup }} />
            </div>
        </div>
    );
}

export default function EmailSignatures({ variants = [] }) {
    return (
        <>
            <Head title="Email signatures" />

            <div className="min-h-dvh bg-[#0B0B0C] pb-16 text-white">
                <div className="mx-auto w-full max-w-[900px] px-5 pt-12 md:px-8 md:pt-16">
                    <header className="mb-14">
                        <p className="mb-4 font-gulfs text-[12px] uppercase tracking-[0.22em] text-[#05EFB8]">
                            Spenny Piggy · Brand
                        </p>
                        <h1 className="font-gulfs text-[40px] uppercase leading-[0.95] md:text-[56px]">
                            Email
                            <br />
                            signatures
                        </h1>
                        <div className="mt-5 h-[8px] w-[120px] bg-[#FF007F]" />
                        <p className="mt-6 max-w-[62ch] text-[16px] leading-[1.6] text-white/60">
                            Pick whichever you prefer, press{' '}
                            <span className="text-white">Copy signature</span>, then paste it into your mail
                            settings. Nothing to download and nothing to edit — the images and links come
                            with it. Installing steps are at the bottom.
                        </p>
                    </header>

                    {variants.length === 0 ? (
                        <p className="rounded-box bg-white/5 p-6 text-[15px] leading-[1.6] text-white/60">
                            The signature files could not be loaded. Please let the team know.
                        </p>
                    ) : (
                        variants.map((variant) => (
                            <section
                                key={variant.key}
                                className="mb-14 border-t border-white/10 pt-8 first:border-t-0 first:pt-0"
                            >
                                <div className="mb-6">
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        <h2 className="font-gulfs text-[24px] uppercase leading-[1.05]">
                                            {variant.name}
                                        </h2>
                                        {variant.recommended && (
                                            <span className="rounded-box-sm bg-[#05EFB8] px-3 py-1 font-gulfs text-[12px] uppercase tracking-wide text-black">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="max-w-[62ch] text-[15px] leading-[1.6] text-white/60">
                                        {variant.note}
                                    </p>
                                </div>

                                {variant.signatures.map((signature) => (
                                    <SignatureCard key={signature.key} signature={signature} />
                                ))}
                            </section>
                        ))
                    )}

                    <section className="mt-16 border-t border-white/10 pt-10">
                        <h2 className="font-gulfs text-[26px] uppercase leading-[1.05]">Putting one on</h2>

                        <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-x-12">
                            {STEPS.map((block) => (
                                <div key={block.client} className="border-t-2 border-[#05EFB8] pt-4">
                                    <p className="mb-3 font-gulfs text-[12px] uppercase tracking-[0.16em] text-[#05EFB8]">
                                        {block.client}
                                    </p>
                                    <ol className="ml-4 list-decimal space-y-2 text-[15px] leading-[1.55] text-white/60 marker:text-white/60">
                                        {block.steps.map((line, index) => (
                                            <li
                                                key={index}
                                                className="[&_strong]:font-semibold [&_strong]:text-white"
                                            >
                                                {line}
                                            </li>
                                        ))}
                                    </ol>
                                    <p className="mt-3 text-[13px] leading-[1.5] text-white/60">{block.note}</p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-10 border-l-4 border-[#FF007F] pl-4 text-[15px] leading-[1.6] text-white/60">
                            Send yourself one test before using it for real, and check the logo and the three
                            social icons all appear. Mail apps sometimes block remote images the first time
                            they see a sender. Gmail also caps a signature at 10,000 characters — these are
                            about 8,200, so do not paste anything else in alongside.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
