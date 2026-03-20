export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl prose prose-neutral dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p>Last updated: March 2026</p>

        <p>
          Dreammap is a public dream-sharing app. We collect only the data needed to run the product:
          Google account identity for signed-in publishers, dream text, dream date, time bucket, and a rough sleep-location.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>Google-authenticated account identity for publishing and ownership</li>
          <li>Dream entries you choose to publish</li>
          <li>Coarsened location data only, never precise browser coordinates</li>
        </ul>

        <h2>How we use data</h2>
        <ul>
          <li>To authenticate users through Supabase Auth</li>
          <li>To publish, display, and share dream entries</li>
          <li>To maintain account-level delete access for your own entries</li>
        </ul>

        <h2>Third parties</h2>
        <ul>
          <li>Supabase for authentication and database hosting</li>
          <li>Mapbox for globe rendering and rough reverse geocoding</li>
        </ul>

        <h2>Your control</h2>
        <p>
          Signed-in users can delete their own published dreams from the My Dreams view. Public dream pages remain accessible until deleted.
        </p>
      </div>
    </div>
  );
}
