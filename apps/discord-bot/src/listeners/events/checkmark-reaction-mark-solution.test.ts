import { Client, Events } from "discord.js";
import {
  emitEvent,
  mockGuild,
  mockGuildMember,
  mockMessage,
  mockMessageReaction,
  mockPublicThread,
  mockTextChannel,
} from "@answeroverflow/discordjs-mock";
import { setupAnswerOverflowBot } from "~discord-bot/test/sapphire-mock";
import { toAOChannel, toAOServer } from "~discord-bot/utils/conversions";
import { createChannelSettings, upsertChannel, upsertServer } from "@answeroverflow/db";

let client: Client;
beforeEach(async () => {
  client = await setupAnswerOverflowBot();
});

async function setupSolvedMessageScenario(guild_id?: string) {
  const guild = mockGuild(client, undefined, {
    id: guild_id,
  });
  const default_author = mockGuildMember({ client, guild });
  const text_channel = mockTextChannel(client, guild);
  const text_channel_thread = mockPublicThread({
    client,
    parent_channel: text_channel,
  });
  mockMessage({
    client,
    channel: text_channel,
    author: default_author.user,
    override: {
      id: text_channel_thread.id,
    },
  });
  const solution_message = mockMessage({
    client,
    channel: text_channel_thread,
  });
  await upsertServer(toAOServer(guild));
  await upsertChannel(toAOChannel(text_channel));
  await createChannelSettings({
    channel_id: text_channel.id,
    flags: {
      mark_solution_enabled: true,
    },
  });
  return {
    text_channel,
    default_author,
    text_channel_thread,
    guild,
    solution_message,
  };
}

describe("Checkmark Reaction Mark Solution", () => {
  it("should not mark a message as a solution if the emoji is not a checkmark", async () => {
    const { default_author, solution_message, text_channel_thread } =
      await setupSolvedMessageScenario("102860784329052160");
    const message_reaction = mockMessageReaction({
      message: solution_message,
      reacter: default_author.user,
      override: {
        emoji: {
          name: "🐈",
          id: null,
        },
      },
    });
    jest.spyOn(text_channel_thread, "send");
    await emitEvent(client, Events.MessageReactionAdd, message_reaction, default_author.user);
    expect(text_channel_thread.send).not.toHaveBeenCalled();
  });
  it("should not mark a message as a solution if the reaction is from the bot", async () => {
    const { default_author, solution_message, text_channel_thread } =
      await setupSolvedMessageScenario("102860784329052160");
    const message_reaction = mockMessageReaction({
      message: solution_message,
      reacter: default_author.user,
      override: {
        emoji: {
          name: "✅",
          id: null,
        },
        me: true,
      },
    });
    jest.spyOn(text_channel_thread, "send");
    await emitEvent(client, Events.MessageReactionAdd, message_reaction, client.user!);
    expect(text_channel_thread.send).not.toHaveBeenCalled();
  });
  it("should not mark a message as a solution if the guild is not allowed", async () => {
    const { default_author, solution_message, text_channel_thread } =
      await setupSolvedMessageScenario();
    const message_reaction = mockMessageReaction({
      message: solution_message,
      reacter: default_author.user,
      override: {
        emoji: {
          name: "✅",
          id: null,
        },
      },
    });
    jest.spyOn(text_channel_thread, "send");
    await emitEvent(client, Events.MessageReactionAdd, message_reaction, default_author.user);
    expect(text_channel_thread.send).not.toHaveBeenCalled();
  });
  it("should mark a message as a solution if the emoji is a checkmark, the reaction is not from the bot, and the guild is allowed", async () => {
    const { default_author, solution_message, text_channel_thread } =
      await setupSolvedMessageScenario("102860784329052160");
    const message_reaction = mockMessageReaction({
      message: solution_message,
      reacter: default_author.user,
      override: {
        emoji: {
          name: "✅",
          id: null,
        },
      },
    });
    jest.spyOn(text_channel_thread, "send");
    await emitEvent(client, Events.MessageReactionAdd, message_reaction, default_author.user);
    expect(text_channel_thread.send).toHaveBeenCalled();
  });
});
