import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";

export class Client extends SapphireClient {
  public constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
      loadMessageCommandListeners: true,
      defaultPrefix: process.env.PREFIX,
    });
  }

  public async start() {
    await this.login(process.env.TOKEN).catch((error) => {
      console.error("Failed to login:", error);
    });
  }
}
