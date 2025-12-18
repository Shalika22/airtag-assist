import { OutOfScopeError, SafetyRefusalError } from "@/lib/errors";
import { tokenizeForLexical } from "@/lib/utils/text";

const SMALL_TALK_PATTERNS: Array<{ re: RegExp; kind: "greeting" | "thanks" | "who" | "help" }> = [
  { re: /^(hi|hello|hey|yo|sup)\b/i, kind: "greeting" },
  { re: /\b(good\s*(morning|afternoon|evening)|howdy)\b/i, kind: "greeting" },
  { re: /\b(thanks|thank you|thx|ty)\b/i, kind: "thanks" },
  { re: /\b(who are you|what are you|what is this|what can you do)\b/i, kind: "who" },
  { re: /^(help|\?)\s*$/i, kind: "help" }
];

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

  // Allow basic small talk / meta questions without forcing AirTag tokens.
  if (classifySmallTalk(question)) return;

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
    throw new OutOfScopeError(
      "I can help with Apple AirTags and Find My item tracking. If you meant something else, try rephrasing your question to mention AirTag or Find My."
    );
  }
}

export function classifySmallTalk(
  question: string
): null | { kind: "greeting" | "thanks" | "who" | "help" } {
  const s = question.trim();
  if (!s) return null;
  for (const p of SMALL_TALK_PATTERNS) {
    if (p.re.test(s)) return { kind: p.kind };
  }
  return null;
}

export function buildSmallTalkReply(kind: "greeting" | "thanks" | "who" | "help"): string {
  switch (kind) {
    case "greeting":
      return [
        "Hi!",
        "Ask me anything about Apple AirTags and Find My item tracking.",
        "",
        "For example:",
        "- How do I set up an AirTag?",
        "- How does Precision Finding work?",
        "- How do I replace the battery?",
        "- What does Lost Mode do?"
      ].join("\n");
    case "thanks":
      return "You’re welcome! If you have any AirTag or Find My questions, I’m happy to help.";
    case "who":
      return "I’m AirTag Assistant — I answer questions about Apple AirTags and Find My item tracking, and I’ll cite the sources from the knowledge base when I answer.";
    case "help":
      return [
        "I can help with Apple AirTags and Find My item tracking.",
        "",
        "Try asking things like:",
        "- Setup and pairing",
        "- Precision Finding compatibility",
        "- Battery replacement",
        "- Lost Mode",
        "- Privacy and anti-stalking features"
      ].join("\n");
  }
}


