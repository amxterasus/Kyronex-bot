import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";
import { Position } from "../types/enums";
import type { Player } from "../types/interfaces";

export class JoinCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "join",
      description: "Joins in a scrim.",
    });
  }

  public override async messageRun(message: Message) {
    if (!message.guild || !message.member) {
      return message.reply("This command can only be used in a server.");
    }

    if (!message.member?.roles.cache.has(RoleIds.Allowed)) {
      return message.reply("You do not have permission to create a scrim.");
    }

    const args = message.content.trim().split(/ +/);
    const pos = args[1]?.toUpperCase();
    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!pos || !Object.values(Position).includes(pos as Position)) {
      return message.reply(
        `Please provide a valid position: ${Object.values(Position).join(", ")}`
      );
    }

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
      include: { players: true },
    });

    if (!scrim) {
      return message.reply("No scrim exists.");
    }

    const alreadyJoined = scrim.players.some(
      (p: Player) => p.userId === userId
    );
    if (alreadyJoined) {
      return message.reply("You are already in the scrim.");
    }
    if (scrim.players.length >= scrim.maxPlayers) {
      return message.reply("The scrim is already full.");
    }

    await prisma.scrim.update({
      where: { guildId },
      data: {
        players: {
          create: {
            userId: userId,
            position: pos,
          },
        },
      },
    });

    try {
      await message.author.send(
        `You joined the scrim at position: ${pos}.\nLink: ${scrim.link}.\n${
          scrim.players.length + 1
        }/${scrim.maxPlayers} players joined.`
      );
    } catch (error) {
      await message.reply(
        "Failed to send you a DM. Please check your DM settings."
      );
    }

    return message.reply(
      `${message.author.displayName} joined the scrim!\nPosition: ${pos}\n${
        scrim.players.length + 1
      }/${scrim.maxPlayers} players joined.`
    );
  }
}
