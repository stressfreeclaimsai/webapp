import { PrismaClient } from "@prisma/client";
import { WorkOS } from "@workos-inc/node";
import { STAFF_ROLES } from "../lib/production-domain";
import { ensureDatabaseUrl } from "./env";

/**
 * Invite a staff member (decision B25):
 *   npm run staff:invite -- --email jane@example.com --name "Jane Doe" [--role admin]
 *
 * 1. Creates (or reuses) the StaffUser record with a pending subject. Roles
 *    are ours: `standard` by default, `admin` only when stated (B24).
 * 2. Sends the WorkOS AuthKit invitation. Sign-ups are closed in the WorkOS
 *    dashboard, so this invitation is the only way an account can be created.
 *
 * Non-destructive. Targets whatever DATABASE_URL is set — the host is printed
 * so the operator can see whether this is the local or the production
 * database. Secrets are never printed.
 */

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // WORKOS_API_KEY may be supplied directly in the environment instead.
  }
  const databaseUrl = ensureDatabaseUrl();

  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = arg("role")?.trim().toLowerCase() ?? "standard";
  if (!email || !email.includes("@") || !name) {
    throw new Error('Usage: --email <address> --name "<display name>" [--role standard|admin]');
  }
  if (!(STAFF_ROLES as readonly string[]).includes(role)) {
    throw new Error(`--role must be one of: ${STAFF_ROLES.join(", ")}`);
  }
  const apiKey = process.env.WORKOS_API_KEY?.trim();
  if (!apiKey) throw new Error("WORKOS_API_KEY is not set.");

  console.log(`→ Database host: ${new URL(databaseUrl).hostname}`);

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing && !existing.externalSubject.startsWith("pending:")) {
      console.log(`✓ ${email} is already bound to a provider identity (role: ${existing.role}).`);
    } else if (existing) {
      console.log(`✓ ${email} already has a pending staff record (role: ${existing.role}).`);
    } else {
      const created = await prisma.staffUser.create({
        data: { email, displayName: name, role, externalSubject: `pending:${email}` },
      });
      console.log(`✓ Created staff record ${created.id} (role: ${role}, pending first sign-in).`);
    }

    const workos = new WorkOS(apiKey);
    const invitation = await workos.userManagement.sendInvitation({ email, expiresInDays: 7 });
    console.log(
      `✓ WorkOS invitation ${invitation.id} sent to ${email}; expires ${invitation.expiresAt}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("✖", error instanceof Error ? error.message : error);
  process.exit(1);
});
