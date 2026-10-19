import { spawn } from "node:child_process";
import { withoutGitDiscoveryEnvironment } from "./git-environment";

type Options = { timeout: number; cwd?: string; input?: string; capture?: boolean };

// Hooks run on POSIX shells. Give each child its own group so a deadline also
// terminates package-manager descendants, including those that ignore SIGTERM.
export function runBounded(command: string[], options: Options): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!command[0]) { reject(new Error("Missing command")); return; }
    const child = spawn(command[0], command.slice(1), {
      cwd: options.cwd, env: withoutGitDiscoveryEnvironment(process.env), detached: true,
      stdio: ["pipe", options.capture === false ? "ignore" : "pipe", "ignore"],
    });
    let failure: Error | undefined;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const chunks: string[] = [];
    let bytes = 0;
    function killGroup() {
      if (!child.pid) return;
      try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
    }
    const timer = setTimeout(() => {
      failure = new Error("Command deadline exceeded");
      killGroup();
    }, options.timeout);
    child.on("error", (error) => { failure = error; });
    child.stdout?.on("data", (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > 1024 * 1024) {
        failure = new Error("Command output too large");
        killGroup();
      } else {
        try { chunks.push(decoder.decode(chunk, { stream: true })); }
        catch { failure = new Error("Invalid command output"); killGroup(); }
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      killGroup();
      try { chunks.push(decoder.decode()); }
      catch { failure = new Error("Invalid command output"); }
      if (failure || code !== 0) reject(failure ?? new Error("Command failed"));
      else resolve(chunks.join(""));
    });
    // A policy may exit without consuming its input. The exit status still wins.
    child.stdin?.on("error", () => {});
    child.stdin?.end(options.input ?? "");
  });
}
