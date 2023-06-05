// @ts-check
import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { setTimeout } from "timers/promises";

const EMOJI = "🔔";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Reaction],
});

client.on(Events.ClientReady, (client) =>
  console.log(`Logged in as ${client.user.tag}`)
);

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.emoji.name === EMOJI) return;

  const message = await reaction.message.fetch();
  const bells = message.reactions.cache.get(EMOJI);
  if (!bells) return;

  const by = message.guild?.members.resolve(user.id)?.displayName ?? user.tag;
  /** @type {import("discord.js").MessageCreateOptions} */
  const options = {
    content: `\
    ${reaction.users.cache.toJSON().join(" ")}
    **${by}** reacted to ${message.url} with ${reaction.emoji}`,
    allowedMentions: { repliedUser: false },
  };
  for (const user of bells.users.cache.values()) {
    await Promise.race([user.send(options), setTimeout(1000)]);
  }
});

client.login();
