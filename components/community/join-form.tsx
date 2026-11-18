import { ClipboardList, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSetuCjRbgIeiRmfkQ7dG61OcnnqUja6G8K7NbvEygYZt6GEWQ/viewform"

/**
 * Team application (internships and volunteering). Joining the community itself
 * happens through the WhatsApp group, not this form.
 *
 * The form requires a Google sign-in, which cannot work inside an iframe:
 * browsers block or partition Google's cookies in a third-party context, so the
 * embed shows "Can't access your Google Account" even with cookies allowed.
 * Opening it on docs.google.com (first-party) lets sign-in work for everyone.
 */
export function JoinForm() {
  return (
    <div className="flex flex-col items-center gap-4 pt-2">
      <ClipboardList className="text-ambixous-neon" size={32} aria-hidden="true" />
      <p className="max-w-md text-slate-gray">
        The application takes about two minutes and opens in Google Forms. You may be asked to sign in to your
        Google account.
      </p>
      <Button
        asChild
        size="lg"
        className="h-auto min-h-11 w-full whitespace-normal border-2 border-ambixous-neon bg-transparent py-3 font-semibold text-ambixous-neon hover:bg-ambixous-neon hover:text-electric-ink focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-electric-ink sm:w-auto"
      >
        <a href={FORM_URL} target="_blank" rel="noopener noreferrer">
          Open the team application
          <ExternalLink size={16} aria-hidden="true" />
          <span className="sr-only">(opens Google Forms in a new tab)</span>
        </a>
      </Button>
    </div>
  )
}
