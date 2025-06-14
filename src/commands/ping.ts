import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";

export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "ping",
      description: "Replies with Pong!",
    });
  }

  public override async messageRun(message: Message) {
    const msg = await (message.channel as any).send("Pong!");
    const latency = msg.createdTimestamp - message.createdTimestamp;
    await msg.edit(`Pong! Latency: ${latency}ms`);
  }
}
