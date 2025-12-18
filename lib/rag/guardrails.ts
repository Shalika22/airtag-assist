import { OutOfScopeError, SafetyRefusalError } from "@/lib/errors";
import { tokenizeForLexical } from "@/lib/utils/text";

const AIRTAG_DOMAIN_TOKENS = new Set([
  "airtag",
  "airtags",
  "find",
  "my",
  "findmy",
  "precision",
  "finding",
  "lost",
  "mode",
  "item",
  "tracker",
  "tracking",
  "apple"
]);

const UNSAFE_TOKENS = [
  "stalk",
  "stalking",
  "spy",
  "surveil",
  "surveillance",
  "track",
  "tracking",
  "follow",
  "monitor",
  "locate",
  "locating",
  "without",
  "secret",
  "secretly",
  "hide",
  "hide it",
  "plant",
  "planting"
];

export function enforceGuardrails(question: string): void {
  const q = question.toLowerCase();
  const toks = tokenizeForLexical(q);

  // Safety: refuse requests that look like covert tracking/stalking.
  const unsafeHit = UNSAFE_TOKENS.some((t) => q.includes(t));
  const consentHint = q.includes("without consent") || q.includes("without them knowing") || q.includes("secretly");
  if (unsafeHit && consentHint) {
    throw new SafetyRefusalError(
      "I can’t help with stalking, covert tracking, or monitoring someone without consent. If you’re concerned about your safety, consider contacting local authorities or a trusted support resource."
    );
  }

  // Out-of-scope: only AirTags / Find My item tracking.
  const domainHit = toks.some((t) => AIRTAG_DOMAIN_TOKENS.has(t)) || q.includes("find my") || q.includes("air tag");
  if (!domainHit) {
    throw new OutOfScopeError("I can only answer questions about Apple AirTags and Find My item tracking.");
  }
}


