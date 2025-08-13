import { Head } from '@inertiajs/react'

const SitelinksSearchBox = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://spennypiggy.co/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://spennypiggy.co/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Head>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Head>
  );
};

export default SitelinksSearchBox;