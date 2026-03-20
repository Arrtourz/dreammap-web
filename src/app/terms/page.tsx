export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl prose prose-neutral dark:prose-invert">
        <h1>Terms of Service</h1>
        <p>Last updated: March 2026</p>

        <p>
          Dreammap lets users publish dream descriptions with a rough sleep-location. By using the service, you agree to use it lawfully and not post abusive, illegal, or harmful content.
        </p>

        <h2>Publishing rules</h2>
        <ul>
          <li>You may publish anonymously and browse public content without signing in</li>
          <li>You should not post private information about yourself or others</li>
          <li>You should not attempt to upload exact address-level location information</li>
        </ul>

        <h2>Ownership and removal</h2>
        <p>
          You retain responsibility for the content you publish. Dreammap may remove content that breaks these terms. You may delete entries from the same browser that published them through the My Dreams view.
        </p>

        <h2>Service disclaimer</h2>
        <p>
          The service is provided as-is without guarantees of uninterrupted availability or permanent storage.
        </p>
      </div>
    </div>
  );
}
