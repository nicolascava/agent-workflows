import { basename, resolve } from "node:path";

// `dynamic` means a `$` or backtick in an argument reaches the shell outside single quotes.
export type Invocation = { program: string; args: string[]; directory?: string; unsafe: boolean; dynamic: boolean };

// This inspects shell text, never evaluates it. Quoted prose stays one word.
// Nested shells and command substitutions are inspected as commands too.
export function invocations(text: string, directory?: string, depth = 0): Invocation[] {
  if (depth > 8 || text.length > 1_000_000) throw new Error("Command is too complex");
  const result: Invocation[] = [];
  let words: string[] = [], word = "", started = false, quote = "", expands = false;
  let expanded = new Set<string>();
  let current = directory;
  const finishWord = () => { if (started) { words.push(word); if (expands) expanded.add(word); } word = ""; started = false; expands = false; };
  function finishCommand() {
    finishWord(); if (!words.length) return;
    let args = words; words = [];
    // Matching by text can only over-report, when a literal word repeats an expanded one.
    const dynamicWords = expanded; expanded = new Set();
    const isDynamic = (arg: string) => dynamicWords.has(arg);
    let routed = false;
    while (["then", "do", "else", "if", "while", "until", "!", "time", "{", "}"].includes(args[0] ?? "")) args = args.slice(1);
    while (args.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(args[0]!) || ["env", "command", "exec", "sudo", "nohup"].includes(basename(args[0]!)))) {
      if (/^GIT_.*=/.test(args[0]!)) routed = true;
      args = args.slice(1);
      while (args[0]?.startsWith("-")) { routed = true; args = args.slice(1); }
    }
    const program = basename(args[0] ?? ""); args = args.slice(1);
    let commandDirectory = current;
    if (program === "cd") { current = args.length === 1 && !isDynamic(args[0]!) && !args[0]!.includes("~") && current ? resolve(current, args[0]!) : undefined; return; }
    if (["bash", "sh", "zsh", "dash"].includes(program) && args.some(a => /^-[a-z]*c$/.test(a))) {
      const at = args.findIndex(a => /^-[a-z]*c$/.test(a));
      // The outer shell expands the script before the inner shell re-reads its quotes.
      const outer = isDynamic(args[at + 1] ?? "");
      result.push(...invocations(args[at + 1] ?? "", current, depth + 1).map(call => ({ ...call, unsafe: call.unsafe || routed || outer, dynamic: call.dynamic || outer })));
      return;
    }
    if (program === "eval") {
      const outer = args.some(isDynamic);
      result.push(...invocations(args.join(" "), current, depth + 1).map(call => ({ ...call, unsafe: call.unsafe || outer, dynamic: call.dynamic || outer })));
      return;
    }
    if (program === "git") {
      while (args[0]?.startsWith("-")) {
        const option = args.shift()!;
        if (option === "-C") { const path = args.shift(); commandDirectory = path && commandDirectory && !isDynamic(path) && !path.includes("~") ? resolve(commandDirectory, path) : undefined; }
        else if (option.startsWith("-C") && option.length > 2) commandDirectory = commandDirectory && !isDynamic(option) && !option.includes("~") ? resolve(commandDirectory, option.slice(2)) : undefined;
        else if (option === "-c" || option === "--git-dir" || option === "--work-tree" || option === "--namespace" || option === "--config-env") { routed = true; args.shift(); }
        else if (/^(?:-c|--git-dir=|--work-tree=|--namespace=|--config-env=)/.test(option)) routed = true;
        else if (!["--no-pager", "--no-optional-locks", "--literal-pathspecs"].includes(option)) routed = true;
      }
    }
    if (program === "gh") {
      // gh accepts these global flags before or between its subcommands.
      args = args.filter((arg, index, all) => {
        if (["--repo", "-R", "--hostname"].includes(all[index - 1] ?? "")) return false;
        return !["--repo", "-R", "--hostname"].includes(arg) && !/^(?:--repo=|-R.|--hostname=)/.test(arg);
      });
      while (args[0]?.startsWith("-")) {
        const option = args.shift()!;
        if (option !== "--") routed = true;
      }
    }
    const dynamic = args.some(isDynamic);
    result.push({ program, args, directory: commandDirectory, unsafe: routed || dynamic, dynamic });
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quote !== "'" && (char === "`" || (char === "$" && text[i + 1] === "("))) {
      const tick = char === "`"; let end = i + (tick ? 1 : 2), level = 1, innerQuote = "";
      for (; end < text.length; end++) {
        const c = text[end]!;
        if (c === "\\") { end++; continue; }
        if (tick) { if (c === "`") break; continue; }
        if (innerQuote) { if (c === innerQuote) innerQuote = ""; continue; }
        if (c === "'" || c === '"') { innerQuote = c; continue; }
        if (c === "(") level++;
        if (c === ")" && --level === 0) break;
      }
      if (end >= text.length) throw new Error("Unterminated substitution");
      result.push(...invocations(text.slice(i + (tick ? 1 : 2), end), current, depth + 1));
      word += "$dynamic"; started = expands = true; i = end; continue;
    }
    if (char === "\\" && quote !== "'") {
      if (text[i + 1] === "\n") { i++; continue; }
      // Inside double quotes a backslash escapes only these; otherwise it stays literal.
      if (quote === '"' && !["$", "`", '"', "\\"].includes(text[i + 1] ?? "")) { word += char; started = true; continue; }
      word += text[++i] ?? ""; started = true; continue;
    }
    if (quote) { if (char === quote) quote = ""; else { word += char; if (quote === '"' && char === "$") expands = true; } started = true; continue; }
    if (char === "'" || char === '"') { quote = char; started = true; continue; }
    if (char === "#" && !started) { while (i < text.length && text[i] !== "\n") i++; finishCommand(); continue; }
    if (/[;&|\n()]/.test(char)) { finishCommand(); continue; }
    if (/\s/.test(char)) { finishWord(); continue; }
    if (char === "$") expands = true;
    word += char; started = true;
  }
  if (quote) throw new Error("Unterminated quote"); finishCommand(); return result;
}
