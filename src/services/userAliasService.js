// 📁 NEW FILE 1: src/services/userAliasService.js
// ==========================================
import fs from "fs-extra";
import path from "path";

export class UserAliasService {
  constructor() {
    this.storageFile = path.join(process.cwd(), "storage", "user-aliases.json");
    this.userAliases = new Map(); // userId -> aliases[]
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      const storageDir = path.dirname(this.storageFile);
      await fs.ensureDir(storageDir);

      if (await fs.pathExists(this.storageFile)) {
        await this.loadFromFile();
        console.log(`📁 Loaded user aliases from storage`);
      } else {
        await this.saveToFile();
        console.log("📁 Created new user aliases storage file");
      }
    } catch (error) {
      console.error("❌ Error initializing storage:", error.message);
    }
  }

  async loadFromFile() {
    try {
      const data = await fs.readJson(this.storageFile);
      this.userAliases.clear();

      if (data.userAliases) {
        Object.entries(data.userAliases).forEach(([userId, aliases]) => {
          this.userAliases.set(
            userId,
            aliases.map((alias) => ({
              ...alias,
              createdAt: new Date(alias.createdAt),
              lastAccessed: new Date(alias.lastAccessed),
            }))
          );
        });
      }
    } catch (error) {
      console.error("❌ Error loading aliases:", error.message);
    }
  }

  async saveToFile() {
    try {
      const data = {
        userAliases: Object.fromEntries(this.userAliases.entries()),
        lastSaved: new Date().toISOString(),
      };
      await fs.writeJson(this.storageFile, data, { spaces: 2 });
    } catch (error) {
      console.error("❌ Error saving aliases:", error.message);
    }
  }

  async addUserAlias(userId, aliasName, basePath) {
    try {
      console.log(`👤 Adding alias for user: ${userId}`);
      console.log(`📂 Alias name: ${aliasName}`);
      console.log(`📁 Raw path: ${basePath}`);

      // 🎯 NO PATH MANIPULATION - Use exactly what user provides
      const rawPath = basePath;

      if (!this.userAliases.has(userId)) {
        this.userAliases.set(userId, []);
      }

      const aliases = this.userAliases.get(userId);

      // Check if alias already exists
      if (aliases.find((a) => a.aliasName === aliasName)) {
        throw new Error(
          `Alias "${aliasName}" already exists for user ${userId}`
        );
      }

      // 🔥 IMPORTANT: Don't check if path exists - let user handle it
      // User responsibility to provide correct path
      console.log(`💭 Path validation: SKIPPED (user responsibility)`);

      const newAlias = {
        aliasName,
        basePath: rawPath, // ✅ Store exactly what user provided
        originalPath: rawPath, // ✅ Same as basePath (no processing)
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        pathStatus: "not_validated", // ✅ Indicate we didn't validate
      };

      aliases.push(newAlias);
      await this.saveToFile();

      console.log(
        `✅ Added alias "${aliasName}" with raw path (not validated)`
      );
      return newAlias;
    } catch (error) {
      console.error(`❌ Error adding alias:`, error.message);
      throw error;
    }
  }

  getUserAliases(userId) {
    return this.userAliases.get(userId) || [];
  }

  getUserAlias(userId, aliasName) {
    const aliases = this.userAliases.get(userId) || [];
    return aliases.find((a) => a.aliasName === aliasName);
  }

  async updateAliasAccess(userId, aliasName) {
    try {
      const aliases = this.userAliases.get(userId) || [];
      const alias = aliases.find((a) => a.aliasName === aliasName);

      if (alias) {
        alias.lastAccessed = new Date();
        alias.accessCount++;
        await this.saveToFile();
        console.log(
          `📊 Updated access count for ${aliasName}: ${alias.accessCount}`
        );
      }
    } catch (error) {
      console.error("❌ Error updating alias access:", error.message);
    }
  }

  async deleteAlias(userId, aliasName) {
    try {
      const aliases = this.userAliases.get(userId) || [];
      const index = aliases.findIndex((a) => a.aliasName === aliasName);

      if (index > -1) {
        aliases.splice(index, 1);
        await this.saveToFile();
        console.log(`🗑️ Deleted alias: ${aliasName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error deleting alias:", error.message);
      return false;
    }
  }

  getAllUsers() {
    return Array.from(this.userAliases.keys());
  }

  // Get total stats
  getTotalStats() {
    const stats = {
      totalUsers: this.userAliases.size,
      totalAliases: 0,
      aliasesByUser: {},
    };

    for (const [userId, aliases] of this.userAliases.entries()) {
      stats.totalAliases += aliases.length;
      stats.aliasesByUser[userId] = aliases.length;
    }

    return stats;
  }
}
