import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

/**
 * Démarre (ou réutilise) une instance Next pour les tests d'intégration.
 *
 * Ordre de préférence :
 *  1. TEST_BASE_URL, si fourni (réutilise une instance déjà lancée) ;
 *  2. une instance répondant déjà sur TEST_PORT ;
 *  3. `next start` si un build de production existe (`.next/BUILD_ID`) ;
 *  4. `next dev` sinon.
 *
 * En cas d'échec, les derniers logs du serveur sont renvoyés : Next sait
 * diagnostiquer lui-même les cas courants (port occupé, autre serveur dev).
 */
const READY_TIMEOUT_MS = Number(process.env.TEST_READY_TIMEOUT_MS ?? 120_000);
const DEFAULT_PORT = Number(process.env.TEST_PORT ?? 3987);

let child: ChildProcess | null = null;
let cachedUrl: string | null = null;

async function isUp(url: string, timeoutMs = 5_000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url}/api/rooms`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

function tailLogs(buffer: string): string {
  const trimmed = buffer.trim();
  return trimmed ? `\n--- logs du serveur ---\n${trimmed}` : "";
}

/**
 * Termine l'arbre de processus d'un serveur lancé par ce helper.
 *
 * L'ordre est critique : il faut tuer l'arbre TANT QUE le shell existe.
 * `child.kill()` ne termine que le shell (cmd.exe) ; les enfants
 * (npx -> cmd -> next) deviennent alors orphelins et `taskkill /PID <pid>`
 * échoue puisque le PID n'existe plus. Ces survivants conservent les pipes
 * stdout/stderr héritées, et le processus de test ne se termine jamais.
 */
function killProcessTree(proc: ChildProcess | null) {
  if (!proc) return;
  const pid = proc.pid;

  if (process.platform === "win32" && pid) {
    try {
      spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      /* ignore */
    }
  }
  try {
    proc.kill("SIGKILL");
  } catch {
    /* déjà mort */
  }
  // Filet de sécurité : libérer les handles de lecture, sinon un éventuel
  // orphelin maintiendrait l'événement loop ouvert et bloquerait `node --test`.
  proc.stdout?.destroy();
  proc.stderr?.destroy();
}

export async function startServer(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  const external = process.env.TEST_BASE_URL;
  if (external) {
    const url = external.replace(/\/$/, "");
    if (!(await isUp(url))) {
      throw new Error(
        `TEST_BASE_URL=${url} ne répond pas (GET /api/rooms). Vérifiez que le serveur est démarré et que la base est joignable.`,
      );
    }
    cachedUrl = url;
    return url;
  }

  const url = `http://127.0.0.1:${DEFAULT_PORT}`;
  if (await isUp(url)) {
    cachedUrl = url;
    return url;
  }

  const hasBuild = existsSync(resolve(process.cwd(), ".next", "BUILD_ID"));
  const command = hasBuild ? "start" : "dev";
  const verbose = Boolean(process.env.TEST_VERBOSE);

  let logs = "";
  let exited = false;

  child = spawn("npx", ["next", command, "-p", String(DEFAULT_PORT)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(DEFAULT_PORT) },
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  const capture = (chunk: Buffer, stream: NodeJS.WriteStream) => {
    const text = chunk.toString();
    logs = (logs + text).slice(-4000);
    if (verbose) stream.write(text);
  };
  child.stdout?.on("data", (c: Buffer) => capture(c, process.stdout));
  child.stderr?.on("data", (c: Buffer) => capture(c, process.stderr));
  child.on("exit", () => {
    exited = true;
  });

  // Filet de sécurité : si le processus de test se termine sans passer par
  // `stopServer()` (échec non rattrapé, interruption), le serveur est tué ici.
  const spawned = child;
  process.once("exit", () => killProcessTree(spawned));

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isUp(url)) {
      cachedUrl = url;
      return url;
    }
    if (exited) {
      stopServer();
      throw new Error(
        `\`next ${command}\` s'est arrêté avant de répondre sur ${url}.${tailLogs(logs)}\n` +
          `Piste : si un serveur de développement tourne déjà dans ce dossier, Next refuse d'en lancer un second. ` +
          `Utilisez TEST_BASE_URL pour le réutiliser, ou lancez \`npm run build\` pour tester en mode production.`,
      );
    }
    await delay(1_000);
  }

  stopServer();
  throw new Error(
    `Le serveur Next (next ${command}) n'a pas répondu sur ${url} en ${Math.round(
      READY_TIMEOUT_MS / 1000,
    )}s.${tailLogs(logs)}\n` +
      `Causes possibles : base injoignable, build manquant, port occupé.`,
  );
}

export function stopServer() {
  if (!child) return;
  killProcessTree(child);
  child = null;
  cachedUrl = null;
}
