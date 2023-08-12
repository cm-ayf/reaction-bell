// @ts-check
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import {
  GatewayDispatchEvents,
  GatewayIntentBits,
  Client,
} from "@discordjs/core";
import { setTimeout } from "timers/promises";

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
  console.log(
    `Logged in as ${
      readyData.user?.discriminator === "0"
        ? readyData.user?.username
        : `${readyData.user?.username}#${readyData.user?.discriminator}`
    }`
  );
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

    const by =
      reactionAddData.member?.nick ??
      reactionAddData.member?.user?.global_name ??
      reactionAddData.member?.user?.username;
    /** @type {import("@discordjs/core").RESTPostAPIChannelMessageJSONBody} */
    const options = {
      content: `**${by}** reacted to https://discord.com/channels/${
        reactionAddData.guild_id ?? "@me"
      }/${reactionAddData.channel_id}/${reactionAddData.message_id} with ${
        reactionAddData.emoji.id
          ? `<${reactionAddData.emoji.animated ? "a" : ""}:${
              reactionAddData.emoji.name
            }:${reactionAddData.emoji.id}>`
          : reactionAddData.emoji.name
      }`,
      allowed_mentions: { replied_user: false },
    };
    for (const user of bellUsers) {
      await Promise.race([
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
