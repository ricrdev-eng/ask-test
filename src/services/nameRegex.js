export function extractName(text) {
  text = text.trim();
  const patterns = [
    /meu nome é ([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /meu nome ([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /eu sou (o|a)?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /sou (o|a)?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /me chamo ([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /chamo ([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /aqui é (o|a)?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
    /é ([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const name = match[2] || match[1];
      return cleanName(name);
    }
  }

  if (/^[A-Za-zÀ-ÿ]{2,}( [A-Za-zÀ-ÿ]{2,})?$/.test(text)) {
    return cleanName(text);
  }

  return "Viajante";
}

function cleanName(name) {
  return name
    .trim()
    .replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}