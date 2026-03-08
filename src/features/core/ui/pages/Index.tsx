// This fallback stays available for any legacy import of `src/pages/Index`.
// App routing redirects `/` through auth, so this page is not part of the main flow.
const IndexPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Truckmoov UI</h1>
        <p className="text-xl text-muted-foreground">Route flow is controlled by auth and feature modules.</p>
      </div>
    </div>
  );
};

export default IndexPage;
