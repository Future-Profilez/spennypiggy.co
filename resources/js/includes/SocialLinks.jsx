import { Link } from '@inertiajs/react';
import React from 'react';
export default function SocialLinks({ links }) {

    const whoyouinto = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.1701 1.875H17.9267L11.9042 8.75833L18.9892 18.125H13.4409L9.09589 12.4442L4.12422 18.125H1.36589L7.80755 10.7625L1.01172 1.875H6.69922L10.6267 7.0675L15.1684 1.875H15.1701ZM14.2026 16.475H15.7301L5.87005 3.43833H4.23089L14.2026 16.475Z" fill="#8C52FF" />
    </svg>`;

    const icons = (e) => {
        if (e == "whoyouinto") {
            return whoyouinto
        }
    }


    return (
        <div>
            <ul className='socialmedia flex justify-center mt-4 mb-3'>
                {links.map((l, i) => {
                    return <>
                        {l?.url ?
                            <li>
                                <a href={l.url} dangerouslySetInnerHTML={{ __html: icons(l.social) }} >
                                </a>
                            </li>
                            : ''}
                    </>
                })}
            </ul>
        </div>
    )
}
