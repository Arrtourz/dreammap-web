export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: March 2026</p>

        <p>
          Dreammap is a public dream-sharing app. We collect only the data needed to run the product:
          dream text, dream date, time bucket, a rough sleep-location, and an anonymous browser ownership cookie used to support deletion from the same browser.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>Dream entries you choose to publish</li>
          <li>Coarsened location data only, never precise browser coordinates</li>
          <li>An HttpOnly browser cookie that links this browser to the dreams it published</li>
        </ul>

        <h2>How we use data</h2>
        <ul>
          <li>To publish, display, and share dream entries</li>
          <li>To maintain browser-level delete access for entries published from the same browser</li>
        </ul>

        <h2>Third parties</h2>
        <ul>
          <li>Supabase for database hosting and anonymous ownership records</li>
          <li>Mapbox for globe rendering and rough reverse geocoding</li>
        </ul>

        <h2>Your control</h2>
        <p>
          You can delete dreams published from the same browser through the My Dreams view. If you clear browser storage, switch browsers, or move devices, that delete access can be lost. Public dream pages remain accessible until deleted.
        </p>
      </div>
    </div>
  );
}
