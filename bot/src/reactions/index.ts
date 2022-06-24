import type * as TDiscord from "discord.js";
import reactions from "./reactions";
import { botLog, colors, getMemberLink, getMessageLink } from "./utils";

async function handleNewReaction(
  messageReaction: TDiscord.MessageReaction | TDiscord.PartialMessageReaction,
  reactingUser: TDiscord.User | TDiscord.PartialUser
) {
  if (messageReaction.partial) {
    try {
      await messageReaction.fetch();
    } catch (error: unknown) {
      console.error(
        "Something went wrong when fetching the message reaction: ",
        error
      );
      return;
    }
  }
  if (reactingUser.partial) {
    try {
      await reactingUser.fetch();
    } catch (error: unknown) {
      console.error(
        "Something went wrong when fetching the reacting user: ",
        error
      );
      return;
    }
  }
  const guild = messageReaction.message.guild;
  if (!guild) return;
  // ignore reactions from the bot...
  if (reactingUser.id === guild.client.user?.id) return;

  const emoji = messageReaction.emoji;
  if (!emoji.name) return;

  const reactionFn = reactions[emoji.name];
  if (!reactionFn) return;

  if (messageReaction.partial) {
    messageReaction = await messageReaction.fetch();
  }

  await reactionFn(messageReaction);

  const { message } = messageReaction;

  void botLog(guild, () => {
    const reactingMember = guild.members.cache.get(reactingUser.id);
    if (!reactingMember) return;

    return {
      title: "ℹ️ Someone used a bot reaction",
      color: colors.base0D,
      author: {
        name: reactingMember?.displayName ?? "Unknown",
        iconURL:
          reactingMember.user.avatarURL() ??
          reactingMember.user.defaultAvatarURL,
        url: reactingMember
          ? getMemberLink(reactingMember)
          : "https://example.com/unknown-reacting-member",
      },
      description: `${reactingMember ?? "Unknown member"} added \`${
        emoji.name
      }\` to ${message.member ?? "Unknown member"}'s message in ${
        message.channel
      }`,
      fields: [
        { name: "Reacting Member ID", value: reactingMember.id },
        { name: "Message Member ID", value: message.member?.id ?? "unknown" },
        { name: "Channel", value: message.channel.toString() },
        { name: "Bot reaction", value: emoji.name?.toString() ?? "unknown" },
        { name: "Message link", value: getMessageLink(message) },
      ],
    };
  });
}

export function setup(client: TDiscord.Client) {
  client.on("messageReactionAdd", (messageReaction, user) => {
    // eslint-disable-next-line no-void
    void handleNewReaction(messageReaction, user);
  });
}
