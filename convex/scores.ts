import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_score")
      .order("desc")
      .take(10);
  },
});

export const getUserHighScore = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return scores[0] ?? null;
  },
});

export const submit = mutation({
  args: {
    playerName: v.string(),
    score: v.number(),
    wave: v.number(),
    aliensDestroyed: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("scores", {
      userId,
      playerName: args.playerName,
      score: args.score,
      wave: args.wave,
      createdAt: Date.now(),
    });

    // Update global stats
    const existingStats = await ctx.db.query("gameStats").first();
    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        totalGamesPlayed: existingStats.totalGamesPlayed + 1,
        totalAliensDestroyed: existingStats.totalAliensDestroyed + args.aliensDestroyed,
        highestWave: Math.max(existingStats.highestWave, args.wave),
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("gameStats", {
        totalGamesPlayed: 1,
        totalAliensDestroyed: args.aliensDestroyed,
        highestWave: args.wave,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("gameStats").first();
  },
});
