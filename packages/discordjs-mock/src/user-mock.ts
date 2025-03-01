import {
  Client,
  ClientUser,
  Guild,
  GuildMember,
  PermissionResolvable,
  PermissionsBitField,
  User,
} from "discord.js";
import type { RawGuildMemberData, RawUserData } from "discord.js/typings/rawDataTypes";
import { randomSnowflake } from "@answeroverflow/discordjs-utils";
import { mockGuild, mockRole } from "./guild-mock";

export function mockUser(client: Client, data: Partial<RawUserData> = {}) {
  const raw_data: RawUserData = {
    id: randomSnowflake().toString(),
    username: "USERNAME",
    discriminator: "user#0000",
    avatar: "user avatar url",
    bot: false,
    ...data,
  };
  const user = Reflect.construct(User, [client, raw_data]) as User;
  client.users.cache.set(user.id, user);
  return user;
}

export function mockClientUser(client: Client, override: Partial<RawUserData> = {}) {
  const raw_data: RawUserData = {
    id:
      process.env.DISCORD_CLIENT_ID ??
      process.env.VITEST_DISCORD_CLIENT_ID ??
      randomSnowflake().toString(),
    username: "test",
    discriminator: "0000",
    avatar: null,
    bot: false,
    ...override,
  };
  const client_user = Reflect.construct(ClientUser, [client, raw_data]) as ClientUser;
  client.user = client_user;
  client.user.id = raw_data.id;
  return client_user;
}

export function mockGuildMember(input: {
  client: Client;
  user?: User;
  guild?: Guild;
  permissions?: PermissionResolvable;
  data?: Partial<RawGuildMemberData>;
}) {
  const { client, permissions = PermissionsBitField.Default, data = {} } = input;
  let { user, guild } = input;
  if (!user) {
    user = mockUser(client);
  }
  if (!guild) {
    guild = mockGuild(client, user); // By default make the guild owner the user
  }

  // Create a custom role that represents the permission the user has
  const role = mockRole(client, permissions, guild);

  const raw_data: RawGuildMemberData = {
    guild_id: guild.id,
    roles: [role.id],
    deaf: false,
    user: {
      id: user.id,
    },
    joined_at: "33",
    mute: false,
    ...data,
  };

  const member = Reflect.construct(GuildMember, [client, raw_data, guild]) as GuildMember;
  guild.members.cache.set(member.id, member);
  return member;
}
