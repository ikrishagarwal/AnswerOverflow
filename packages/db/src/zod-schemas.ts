import { z } from "zod";
import { bitfieldToDict, dictToBitfield, mergeFlags, toDict } from "./utils/bitfield";
import { ChannelType } from "discord-api-types/v10";
import {
  ChannelSettings,
  getDefaultChannelSettings,
  ServerSettings,
  UserServerSettings,
} from "@answeroverflow/prisma-types";

// TODO: Split up this file, it's become a bit bloated to prevent circular dependencies

export const ALLOWED_THREAD_TYPES = new Set([
  ChannelType.PublicThread,
  ChannelType.AnnouncementThread,
]);

export const ALLOWED_CHANNEL_TYPES = new Set([
  ChannelType.GuildForum,
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ...ALLOWED_THREAD_TYPES,
]);

export function toZObject<T extends readonly string[]>(
  ...keys: T
): z.ZodObject<Record<T[number], z.ZodOptional<z.ZodBoolean>>> {
  return z.object(toDict(() => z.boolean().optional(), ...keys));
}

export const z_unique_array = z.array(z.string()).transform((arr) => [...new Set(arr)]);

export const channel_settings_flags = [
  "indexing_enabled",
  "auto_thread_enabled",
  "mark_solution_enabled",
  "send_mark_solution_instructions_in_new_threads",
  "forum_guidelines_consent_enabled",
] as const;

export const z_channel_settings_flags = toZObject(...channel_settings_flags);

export const z_channel_settings = z.object({
  channel_id: z.string(),
  flags: z_channel_settings_flags,
  last_indexed_snowflake: z.string().nullable(),
  invite_code: z.string().nullable(),
  solution_tag_id: z.string().nullable(),
});

export const z_channel_settings_public = z_channel_settings.pick({
  channel_id: true,
  invite_code: true,
});

export const z_channel = z.object({
  id: z.string(),
  name: z.string(),
  server_id: z.string(),
  type: z.number().refine(
    (n) => ALLOWED_CHANNEL_TYPES.has(n),
    "Channel type can only be guild forum, text, or announcement" // TODO: Make a type error if possible
  ),
  parent_id: z.string().nullable(),
});

export function getDefaultChannelSettingsWithFlags(channel_id: string) {
  return addFlagsToChannelSettings(getDefaultChannelSettings({ channel_id }));
}

export const bitfieldToChannelSettingsFlags = (bitfield: number) =>
  bitfieldToDict(bitfield, channel_settings_flags);

export function addFlagsToChannelSettings<T extends ChannelSettings>(channel_settings: T) {
  return {
    ...channel_settings,
    flags: bitfieldToChannelSettingsFlags(channel_settings.bitfield),
  };
}

export const z_channel_public = z_channel.pick({
  id: true,
  name: true,
  server_id: true,
  type: true,
  parent_id: true,
});

export const z_channel_public_with_settings = z_channel_public.extend({
  settings: z_channel_settings_public.omit({ channel_id: true }),
});

export const z_discord_image = z.object({
  url: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  description: z.string().nullable(),
});

export const z_message = z.object({
  id: z.string(),
  content: z.string(),
  images: z.array(z_discord_image),
  solutions: z.array(z.string()),
  replies_to: z.string().nullable(),
  child_thread: z.string().nullable(),
  author_id: z.string(),
  channel_id: z.string(),
  server_id: z.string(),
});

export const z_message_public = z_message.pick({
  id: true,
  content: true,
  images: true,
  solutions: true,
  replies_to: true,
  child_thread: true,
  author_id: true,
  channel_id: true,
  server_id: true,
});

export const server_settings_flags = ["read_the_rules_consent_enabled"] as const;
export const z_server_settings_flags = toZObject(...server_settings_flags);

export const z_server_settings = z.object({
  server_id: z.string(),
  flags: z_server_settings_flags,
});

export const bitfieldToServerSettingsFlags = (bitfield: number) =>
  bitfieldToDict(bitfield, server_settings_flags);

export function addFlagsToServerSettings<T extends ServerSettings>(server_settings: T) {
  return {
    ...server_settings,
    flags: bitfieldToServerSettingsFlags(server_settings.bitfield),
  };
}

export function mergeServerSettingsFlags(old: number, new_flags: Record<string, boolean>) {
  return mergeFlags(
    () => bitfieldToServerSettingsFlags(old),
    new_flags,
    (flags) => dictToBitfield(flags, server_settings_flags)
  );
}

export const z_server = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  kicked_time: z.date().nullable(),
});

export const z_server_public = z_server.pick({
  id: true,
  name: true,
  icon: true,
});

export const user_server_settings_flags = [
  "can_publicly_display_messages",
  "message_indexing_disabled",
] as const;

export const bitfieldToUserServerSettingsFlags = (bitfield: number) =>
  bitfieldToDict(bitfield, user_server_settings_flags);

export function addFlagsToUserServerSettings<T extends UserServerSettings>(
  user_server_settings: T
) {
  return {
    ...user_server_settings,
    flags: bitfieldToUserServerSettingsFlags(user_server_settings.bitfield),
  };
}

export function mergeUserServerSettingsFlags(old: number, new_flags: Record<string, boolean>) {
  return mergeFlags(
    () => bitfieldToUserServerSettingsFlags(old),
    new_flags,
    (flags) => dictToBitfield(flags, user_server_settings_flags)
  );
}

export const z_user_server_settings_flags = toZObject(...user_server_settings_flags);

export const z_user_server_settings = z.object({
  user_id: z.string(),
  server_id: z.string(),
  flags: z_user_server_settings_flags,
});

export const z_discord_account = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().nullable(),
});

export const z_discord_account_public = z_discord_account.pick({
  id: true,
  name: true,
  avatar: true,
});
