// Fails when a language is missing keys (or has extra ones) compared with the default
// language. Plural forms (`_one`, `_other`, ...) are compared by their base key, because
// languages legitimately need different plural sets (vi: `_other` only).
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const LOCALES = join(import.meta.dirname, "..", "src", "i18n", "locales")
const DEFAULT_LANGUAGE = "vi"
const PLURAL = /_(zero|one|two|few|many|other)$/

const flatten = (value, prefix = "", out = new Set()) => {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object") flatten(child, path, out)
    else out.add(path.replace(PLURAL, ""))
  }
  return out
}

const load = (language, file) => flatten(JSON.parse(readFileSync(join(LOCALES, language, file), "utf8")))

const languages = readdirSync(LOCALES)
const namespaces = readdirSync(join(LOCALES, DEFAULT_LANGUAGE)).filter((file) => file.endsWith(".json"))
let problems = 0

for (const language of languages.filter((code) => code !== DEFAULT_LANGUAGE)) {
  for (const file of namespaces) {
    const base = load(DEFAULT_LANGUAGE, file)
    let other
    try {
      other = load(language, file)
    } catch {
      console.error(`✗ ${language}/${file}: missing file`)
      problems++
      continue
    }
    const missing = [...base].filter((key) => !other.has(key))
    const extra = [...other].filter((key) => !base.has(key))
    for (const key of missing) console.error(`✗ ${language}/${file}: missing "${key}"`)
    for (const key of extra) console.error(`✗ ${language}/${file}: extra "${key}" (not in ${DEFAULT_LANGUAGE})`)
    problems += missing.length + extra.length
  }
}

if (problems) {
  console.error(`\n${problems} i18n problem(s).`)
  process.exit(1)
}
console.log(`i18n OK: ${languages.join(", ")} × ${namespaces.length} namespaces`)
