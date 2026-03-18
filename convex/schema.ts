import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  scores: defineTable({
    userId: v.id("users"),
    playerName: v.string(),
    score: v.number(),
    wave: v.number(),
    createdAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_user", ["userId"]),
  gameStats: defineTable({
    totalGamesPlayed: v.number(),
    totalAliensDestroyed: v.number(),
    highestWave: v.number(),
    lastUpdated: v.number(),
  }),
});
