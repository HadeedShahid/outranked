/**
 * Renders a JSON-LD block.
 *
 * The escaping is not optional here. Every field that reaches this component
 * — a listing's title, its description — was scraped from whatever site a
 * stranger submitted, so a title containing `</script><script>` is a plausible
 * submission rather than a hypothetical one. JSON.stringify does not escape
 * `<`, so the closing tag would end the script element and execute. Replacing
 * it with its unicode escape keeps the JSON identical to a parser while making
 * the sequence impossible to emit.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
