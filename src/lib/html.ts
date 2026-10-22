const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

/** Converts the HTML Anki stores in fields into the Markdown the app renders. Images and audio are dropped. */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/\[sound:[^\]]*\]/g, '')
    .replace(/\[latex\]([\s\S]*?)\[\/latex\]/gi, (_m, tex: string) => `$${tex.trim()}$`)
    .replace(/\[\$\$\]([\s\S]*?)\[\/\$\$\]/g, (_m, tex: string) => `$$${tex.trim()}$$`)
    .replace(/\[\$\]([\s\S]*?)\[\/\$\]/g, (_m, tex: string) => `$${tex.trim()}$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, tex: string) => `$${tex.trim()}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, tex: string) => `$$${tex.trim()}$$`)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi, '![]($1)')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name: string) => ENTITIES[name] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
