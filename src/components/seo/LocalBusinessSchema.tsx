/**
 * LocalBusiness Schema for Yahaya Travel & Trade Co Ltd
 * Helps Google understand the business location and services
 */

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Yahaya Travel and Trade Co Ltd",
    "alternateName": "Yahaya Travel & Trade",
    "description": "Professional travel agency and procurement company in Yola, Adamawa State, Nigeria",
    "url": "https://www.yahayatravelandtradecoltd.com",
    "telephone": "+234-806-343-6192",
    "email": "yahayageneralcontracts@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "B.M Yelwa Plaza, Opp. Bachure Junction",
      "addressLocality": "Jimeta",
      "addressRegion": "Adamawa State",
      "addressCountry": "NG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 9.2801,
      "longitude": 12.4534
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Yola"
      },
      {
        "@type": "City",
        "name": "Jimeta"
      },
      {
        "@type": "State",
        "name": "Adamawa State"
      },
      {
        "@type": "Country",
        "name": "Nigeria"
      }
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday"],
        "opens": "09:00",
        "closes": "16:00"
      }
    ],
    "priceRange": "$$",
    "sameAs": [
      "https://www.yahayatravelandtradecoltd.com"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
