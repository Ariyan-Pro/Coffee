import { Container, Button } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="section-space-sm flex min-h-[70vh] items-center bg-paper pt-28">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="t-label text-bronze">404</p>
          <h1 className="t-display-l balance mt-4">That cup went cold.</h1>
          <p className="t-body-l pretty mt-6 text-ink-2">
            The page you are looking for does not exist or has been moved. The coffee, however,
            is still fresh.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/">Back to the homepage</Button>
            <Button href="/coffee" variant="secondary">
              Browse the coffees
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
