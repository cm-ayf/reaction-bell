// @ts-check
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import {
  GatewayDispatchEvents,
  GatewayIntentBits,
  Client,
} from "@discordjs/core";
import { setTimeout } from "node:timers/promises";

/**
 * @param {import("@discordjs/core").APIEmoji} emoji
 * @returns {string | null}
 */
function getEmojiString(emoji) {
  return emoji.id
    ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`
    : emoji.name;
}

const EMOJI = "🔔";

const token =
  process.env.DISCORD_TOKEN ??
  (() => {
    throw new Error("DISCORD_TOKEN is not defined");
  })();

const rest = new REST({ version: "10" }).setToken(token);
const gateway = new WebSocketManager({
  token: token,
  intents: GatewayIntentBits.GuildMessageReactions,
  rest,
});
const client = new Client({ rest, gateway });

client.on(GatewayDispatchEvents.Ready, async ({ data: readyData }) => {
  console.log(`Logged in as ${readyData.user.username}`);
});

client.on(
  GatewayDispatchEvents.MessageReactionAdd,
  async ({ data: reactionAddData, api }) => {
    if (reactionAddData.emoji.name === EMOJI) return;

    const bellUsers = await api.channels.getMessageReactions(
      reactionAddData.channel_id,
      reactionAddData.message_id,
      EMOJI
    );
    if (!bellUsers.length) return;

    const by = `<@${reactionAddData.user_id}>`;
    /** @type {import("@discordjs/core").RESTPostAPIChannelMessageJSONBody} */
    const options = {
      content: `**${by}** reacted to https://discord.com/channels/${
        reactionAddData.guild_id ?? "@me"
      }/${reactionAddData.channel_id}/${
        reactionAddData.message_id
      } with ${getEmojiString(reactionAddData.emoji)}`,
      allowed_mentions: { replied_user: false },
    };
    for (const user of bellUsers) {
      await Promise.all([
        api.channels.createMessage(
          (
            await api.users.createDM(user.id)
          ).id,
          options
        ),
        setTimeout(1000),
      ]);
    }
  }
);

gateway.connect();
