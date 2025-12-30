import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * ONE-TIME API Route to fix failed migrations
 * 
 * This route resolves failed migrations and then runs migrate deploy.
 * 
 * SECURITY: Add authentication before using in production!
 * For now, this is a temporary fix route.
 * 
 * Usage: POST /api/admin/fix-migrations
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Add authentication check here in production!
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const results: string[] = [];

    // Step 1: Resolve the failed migration
    try {
      const resolveOutput = execSync(
        "npx prisma migrate resolve --applied 20251229075535_add_usage_model",
        {
          cwd: process.cwd(),
          encoding: "utf-8",
          env: { ...process.env },
        }
      );
      results.push("✓ Resolved failed migration");
      results.push(resolveOutput);
    } catch (resolveError: any) {
      // If migration is already resolved or doesn't exist, continue
      if (resolveError.message?.includes("already applied") || 
          resolveError.message?.includes("not found")) {
        results.push("⚠ Migration already resolved or not found, continuing...");
      } else {
        results.push(`⚠ Resolve warning: ${resolveError.message}`);
      }
    }

    // Step 2: Run migrate deploy
    try {
      const deployOutput = execSync("npx prisma migrate deploy", {
        cwd: process.cwd(),
        encoding: "utf-8",
        env: { ...process.env },
      });
      results.push("✓ Migrations deployed successfully");
      results.push(deployOutput);
    } catch (deployError: any) {
      return NextResponse.json(
        {
          error: "Migration deploy failed",
          details: deployError.message,
          results,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Migrations fixed and deployed",
      results,
    });
  } catch (error: any) {
    console.error("Fix migrations error:", error);
    return NextResponse.json(
      {
        error: "Failed to fix migrations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

